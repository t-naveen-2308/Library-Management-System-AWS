# Infrastructure - Library Management System

This package contains the AWS CDK (TypeScript) code that defines the entire AWS environment.

## Architecture
The infrastructure is split into logical stacks:
- `NetworkStack`: VPC, Security Groups
- `ApplicationStack`: RDS, RDS Proxy, Cognito, API Gateway, Lambdas, Step Functions, DynamoDB, Secrets Manager
- `FrontendStack`: S3 + CloudFront
- `MonitoringStack`: CloudWatch Alarms & Dashboards

## Local Development
1. Ensure Node.js 18+ and the AWS CLI are installed.
2. Run `npm install` to install CDK dependencies.
3. Use `npx cdk synth` to synthesize the CloudFormation templates.
4. Use `npx cdk deploy --all` to deploy all stacks.
