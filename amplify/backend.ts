import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { apiFunction } from './functions/apiFunction/resource';
import { auth } from './auth/resource';

// Helper functions to get environment variables with fallbacks
const getEnvVar = (name: string, fallback: string): string => {
  return process.env[name] || fallback;
};

const parseArrayFromEnv = (name: string, fallback: string[]): string[] => {
  const value = process.env[name];
  if (!value) return fallback;
  return value.split(',').map(item => item.trim());
};

const getBooleanEnvVar = (name: string, fallback: boolean): boolean => {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

// Default values as fallbacks (using dummy values)
const defaults = {
  vpc: {
    id: 'vpc-xxxxxxxx',
    availabilityZones: ['us-west-2a', 'us-west-2b'],
  },
  subnets: {
    private: ['subnet-xxxxxxxxxxxxxxxx', 'subnet-yyyyyyyyyyyyyyyy'],
  },
  securityGroups: {
    lambda: 'sg-xxxxxxxx',
    allowAllOutbound: true,
  },
};

// Define the backend with our resources
const backend = defineBackend({
  apiFunction,
  auth,
});

// Configure VPC for the Lambda function
const apiFunctionStack = backend.createStack('api-function-vpc-stack');

// Get the Lambda function resource
const lambdaFunction = backend.apiFunction.resources.lambda;

// Get infrastructure configuration from environment variables
const vpcId = getEnvVar('VPC_ID', defaults.vpc.id);
const availabilityZones = parseArrayFromEnv('VPC_AVAILABILITY_ZONES', defaults.vpc.availabilityZones);
const subnetIds = parseArrayFromEnv('SUBNET_IDS', defaults.subnets.private);
const securityGroupId = getEnvVar('SECURITY_GROUP_ID', defaults.securityGroups.lambda);
const allowAllOutbound = getBooleanEnvVar('SECURITY_GROUP_ALLOW_OUTBOUND', defaults.securityGroups.allowAllOutbound);

// Log the values to confirm they're loaded correctly
console.log('VPC Configuration:');
console.log('VPC ID:', vpcId);
console.log('Availability Zones:', availabilityZones);
console.log('Subnet IDs:', subnetIds);
console.log('Security Group ID:', securityGroupId);
console.log('Allow All Outbound:', allowAllOutbound);

// Import existing VPC by ID using fromVpcAttributes instead of fromLookup
// This avoids the need for account/region lookup during sandbox testing
const vpc = ec2.Vpc.fromVpcAttributes(apiFunctionStack, 'ExistingVPC', {
  vpcId: vpcId,
  availabilityZones: availabilityZones,
  privateSubnetIds: subnetIds,
});

// Import existing subnets
const subnet1 = ec2.Subnet.fromSubnetId(
  apiFunctionStack, 
  'ExistingSubnet1', 
  subnetIds[0]
);
const subnet2 = ec2.Subnet.fromSubnetId(
  apiFunctionStack, 
  'ExistingSubnet2', 
  subnetIds[1]
);

// Import existing security group
const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(
  apiFunctionStack, 
  'ExistingSecurityGroup', 
  securityGroupId, 
  {
    allowAllOutbound: allowAllOutbound,
  }
);

// Add VPC permissions to the Lambda function's role
lambdaFunction.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'ec2:CreateNetworkInterface',
      'ec2:DescribeNetworkInterfaces',
      'ec2:DeleteNetworkInterface',
      'ec2:AssignPrivateIpAddresses',
      'ec2:UnassignPrivateIpAddresses'
    ],
    resources: ['*']
  })
);

// Configure the Lambda function to use the existing VPC
// We need to cast the Lambda function to the correct type to access VPC properties
const cfnFunction = lambdaFunction.node.defaultChild as lambda.CfnFunction;
cfnFunction.addPropertyOverride('VpcConfig', {
  SecurityGroupIds: [securityGroup.securityGroupId],
  SubnetIds: [subnet1.subnetId, subnet2.subnetId],
});

// Create a new API stack
const apiStack = backend.createStack('api-stack');

// Create a new REST API
const myRestApi = new RestApi(apiStack, 'RestApi', {
  restApiName: 'myRestApi',
  deploy: true,
  deployOptions: {
    stageName: 'dev',
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust in production
    allowMethods: Cors.ALL_METHODS, // Specify only the methods you need in production
    allowHeaders: Cors.DEFAULT_HEADERS, // Specify only the headers you need in production
  },
});

// Create a new Lambda integration
const lambdaIntegration = new LambdaIntegration(
  backend.apiFunction.resources.lambda
);

// Create a new resource path with IAM authorization
const helloPath = myRestApi.root.addResource('hello', {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.NONE, // Public endpoint, no auth required
  },
});

// Add GET method to the resource path
helloPath.addMethod('GET', lambdaIntegration);

// Create a new Cognito User Pools authorizer
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// Create a new resource path with Cognito authorization
const securedPath = myRestApi.root.addResource('secured');
securedPath.addMethod('GET', lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// Create a new IAM policy to allow Invoke access to the API
const apiRestPolicy = new Policy(apiStack, 'RestApiPolicy', {
  statements: [
    new PolicyStatement({
      actions: ['execute-api:Invoke'],
      resources: [
        `${myRestApi.arnForExecuteApi('*', '/hello', 'dev')}`,
        `${myRestApi.arnForExecuteApi('*', '/secured', 'dev')}`,
      ],
    }),
  ],
});

// Attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);

// No need to attach policies to IAM roles since we're using a public endpoint

// Add outputs to the configuration file
backend.addOutput({
  custom: {
    API: {
      [myRestApi.restApiName]: {
        endpoint: myRestApi.url,
        region: Stack.of(myRestApi).region,
        apiName: myRestApi.restApiName,
      },
    },
  },
});
