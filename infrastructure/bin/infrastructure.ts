#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { ApplicationStack } from '../lib/application-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

const networkStack = new NetworkStack(app, 'LibraryNetworkStack', {
  // env: { account: '123456789012', region: 'us-east-1' },
});

const applicationStack = new ApplicationStack(app, 'LibraryApplicationStack', {
  vpc: networkStack.vpc,
  databaseSecurityGroup: networkStack.databaseSecurityGroup,
  lambdaSecurityGroup: networkStack.lambdaSecurityGroup,
});
applicationStack.addDependency(networkStack);

const frontendStack = new FrontendStack(app, 'LibraryFrontendStack', {});

const monitoringStack = new MonitoringStack(app, 'LibraryMonitoringStack', {});
