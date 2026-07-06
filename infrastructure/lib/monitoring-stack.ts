import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

interface MonitoringStackProps extends cdk.StackProps {
  apiGatewayName?: string;
  lambdaFunctionName?: string;
  dbIdentifier?: string;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: MonitoringStackProps) {
    super(scope, id, props);

    // Normally, the references to the exact resource names/ARNs would be passed via props 
    // from the ApplicationStack, but we create generic metric templates here to be connected.

    const apiGatewayName = props?.apiGatewayName || 'Library Service';
    const lambdaFunctionName = props?.lambdaFunctionName || 'LibraryApiHandler';

    // 1. API Gateway 5XX Errors Alarm
    const apiErrorsMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '5XXError',
      dimensionsMap: { ApiName: apiGatewayName },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
    });

    new cloudwatch.Alarm(this, 'ApiGateway5XXAlarm', {
      metric: apiErrorsMetric,
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'Triggers if API Gateway has 5 or more 5XX errors in 1 minute.',
    });

    // 2. Lambda Duration Alarm
    const lambdaDurationMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Duration',
      dimensionsMap: { FunctionName: lambdaFunctionName },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      metric: lambdaDurationMetric,
      threshold: 5000, // 5 seconds average
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'Triggers if average Lambda duration exceeds 5 seconds for 3 consecutive minutes.',
    });

    // 3. RDS CPU Utilization Alarm
    if (props?.dbIdentifier) {
      const dbCpuMetric = new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: { DBInstanceIdentifier: props.dbIdentifier },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      });

      new cloudwatch.Alarm(this, 'RdsCpuAlarm', {
        metric: dbCpuMetric,
        threshold: 80, // 80% CPU
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: 'Triggers if RDS CPU utilization exceeds 80% for 10 minutes.',
      });
    }
  }
}
