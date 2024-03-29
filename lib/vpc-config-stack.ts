import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2, aws_rds as rds } from 'aws-cdk-lib';
import { VPCStackProps } from './export-resources';

export class VPCConfigStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: VPCStackProps) {
      super(scope, id, props);
  
      const vpc = props.vpc;

      const privateSubnetIds = vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds;

      new cdk.custom_resources.AwsCustomResource(this, `ec2-private-subnet-tags`, {
          onCreate: {
              service: 'EC2',
              action: 'createTags',
              parameters: {
                  Resources: [...privateSubnetIds],
                  Tags: [{ Key: 'kubernetes.io/role/internal-elb', Value: "1" }]
              },
              physicalResourceId: cdk.custom_resources.PhysicalResourceId.of(`ec2-private-subnet-tags`)
          },
          onDelete: {
              service: 'EC2',
              action: 'deleteTags',
              parameters: {
                  Resources: [...privateSubnetIds],
                  Tags: [{ Key: 'kubernetes.io/role/internal-elb', Value: "1" }]
              },
              physicalResourceId: cdk.custom_resources.PhysicalResourceId.of(`ec2-private-subnet-tags`)
          },
          policy: cdk.custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
              resources: cdk.custom_resources.AwsCustomResourcePolicy.ANY_RESOURCE
          }),
          installLatestAwsSdk: true
      });

      const publicSubnetIds = vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }).subnetIds;
      new cdk.custom_resources.AwsCustomResource(this, `ec2-public-subnet-tags`, {
          onCreate: {
              service: 'EC2',
              action: 'createTags',
              parameters: {
                  Resources: [...publicSubnetIds],
                  Tags: [{ Key: 'kubernetes.io/role/elb', Value: "1" }]
              },
              physicalResourceId: cdk.custom_resources.PhysicalResourceId.of(`ec2-public-subnet-tags`)
          },
          onDelete: {
              service: 'EC2',
              action: 'deleteTags',
              parameters: {
                  Resources: [...publicSubnetIds],
                  Tags: [{ Key: 'kubernetes.io/role/elb', Value: "1" }]
              },
              physicalResourceId: cdk.custom_resources.PhysicalResourceId.of(`ec2-public-subnet-tags`)
          },
          policy: cdk.custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
              resources: cdk.custom_resources.AwsCustomResourcePolicy.ANY_RESOURCE
          }),
          installLatestAwsSdk: true
      });
     
    }
  }
