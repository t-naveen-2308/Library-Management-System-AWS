import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctions_tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as path from 'path';

interface ApplicationStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  databaseSecurityGroup: ec2.SecurityGroup;
  lambdaSecurityGroup: ec2.SecurityGroup;
}

export class ApplicationStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly dbProxy: rds.DatabaseProxy;
  public readonly databaseSecret: secretsmanager.Secret;
  public readonly userPool: cognito.UserPool;
  public readonly apiHandler: lambda.Function;

  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);

    // 1. Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'LibraryUserPool', {
      userPoolName: 'LibraryUserPool',
      selfSignUpEnabled: true,
      signInAliases: { email: true, username: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'LibraryUserPoolClient', {
      userPool: this.userPool,
      generateSecret: false,
    });

    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });

    // 2. Database Secret
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
      },
    // Allow Lambda to access Database Security Group
    props.databaseSecurityGroup.addIngressRule(
      props.lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from Lambda'
    );

    // 3. RDS PostgreSQL Instance
    this.database = new rds.DatabaseInstance(this, 'LibraryDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.databaseSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      multiAz: false,
      allocatedStorage: 20,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev purposes only
      databaseName: 'librarydb',
    });

    // 4. RDS Proxy
    this.dbProxy = new rds.DatabaseProxy(this, 'LibraryDbProxy', {
      proxyTarget: rds.ProxyTarget.fromInstance(this.database),
      secrets: [this.databaseSecret],
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [props.databaseSecurityGroup],
      requireTLS: true,
    });

    new cdk.CfnOutput(this, 'DbProxyEndpoint', { value: this.dbProxy.endpoint });

    // 5. Lambda Function (Fat Lambda for Spring Boot)
    this.apiHandler = new lambda.Function(this, 'LibraryApiHandler', {
      runtime: lambda.Runtime.JAVA_21,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      handler: 'com.library.handlers.ApiHandler::handleRequest',
      // We will point to the target directory where Maven builds the JAR
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/target/backend-0.0.1-SNAPSHOT.jar')),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [props.lambdaSecurityGroup],
      environment: {
        SPRING_DATASOURCE_URL: `jdbc:postgresql://${this.dbProxy.endpoint}:5432/librarydb`,
        SPRING_DATASOURCE_USERNAME: 'postgres',
        // The password should ideally be fetched dynamically at runtime via secrets manager in Spring, 
        // but for simplicity in CDK setup, we pass the secret ARN so Spring can resolve it.
        DB_SECRET_ARN: this.databaseSecret.secretArn,
      },
    });

    // Grant Lambda permissions to read the secret
    this.databaseSecret.grantRead(this.apiHandler);

    // 6. API Gateway with CORS and Cognito Authorizer
    const api = new apigateway.RestApi(this, 'LibraryApi', {
      restApiName: 'Library Service',
      description: 'API Gateway for Library Management System',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'LibraryAuthorizer', {
      cognitoUserPools: [this.userPool],
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(this.apiHandler);

    // Public auth routes (Login/Register handled via Cognito natively or custom proxy)
    // For this app, we will route /api/* to the Lambda.
    const apiResource = api.root.addResource('api');
    
    // We add a proxy resource that uses the authorizer for all other endpoints
    const proxyResource = apiResource.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: false, // We'll define ANY manually to attach the authorizer
    });

    proxyResource.addMethod('ANY', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });

    // 7. DynamoDB Table for tracking long-running tasks
    const taskTable = new dynamodb.Table(this, 'LibraryTaskTable', {
      partitionKey: { name: 'taskId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    taskTable.grantReadWriteData(this.apiHandler);
    this.apiHandler.addEnvironment('TASK_TABLE_NAME', taskTable.tableName);

    // 8. Dead Letter Queue for Async failures
    const asyncDlq = new sqs.Queue(this, 'AsyncDlq');

    // 9. Step Functions for background tasks
    const invokeLambdaTask = new stepfunctions_tasks.LambdaInvoke(this, 'InvokeApiHandlerForTask', {
      lambdaFunction: this.apiHandler, // reusing the same fat lambda for async handlers by passing a specific payload
      payload: stepfunctions.TaskInput.fromObject({
        isBackgroundTask: true,
        taskType: stepfunctions.JsonPath.stringAt('$.taskType'),
        payload: stepfunctions.JsonPath.objectAt('$.payload'),
      }),
    });

    const stateMachine = new stepfunctions.StateMachine(this, 'LibraryBackgroundTasks', {
      definitionBody: stepfunctions.DefinitionBody.fromChainable(invokeLambdaTask),
    });

    // 10. EventBridge Schedule for Daily Reminders
    const dailyRule = new events.Rule(this, 'DailyReminderRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '18' }), // 6 PM UTC
    });

    dailyRule.addTarget(new targets.SfnStateMachine(stateMachine, {
      input: events.RuleTargetInput.fromObject({
        taskType: 'DAILY_REMINDERS',
        payload: {}
      }),
      deadLetterQueue: asyncDlq, // Send failed executions to DLQ
    }));

  }
}
