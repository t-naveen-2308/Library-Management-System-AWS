import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface NetworkStackProps extends cdk.StackProps {}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: NetworkStackProps) {
    super(scope, id, props);

    // VPC
    this.vpc = new ec2.Vpc(this, 'LibraryVpc', {
      maxAzs: 2,
      natGateways: 1, // Needed if Lambdas in private with egress need internet (e.g. SES)
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateEgress',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // For Lambdas & Proxy
        },
        {
          cidrMask: 24,
          name: 'PrivateIsolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // For RDS
        }
      ]
    });

    // Lambda Security Group
    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSg', {
      vpc: this.vpc,
      description: 'Security group for backend Lambdas',
      allowAllOutbound: true,
    });

    // Database Security Group
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSg', {
      vpc: this.vpc,
      description: 'Security group for RDS Proxy and RDS Database',
      allowAllOutbound: true,
    });
  }
}
