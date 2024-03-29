import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class VpcStack extends cdk.Stack {
  private _vpc: ec2.IVpc;

  public get vpc(){
    return this._vpc;
  }
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

     this._vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      subnetConfiguration: [
         {
           cidrMask: 24,
           name: 'ingress',
           subnetType: ec2.SubnetType.PUBLIC,
         },
         {
           cidrMask: 24,
           name: 'application',
           subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
         },
         {
           cidrMask: 28,
           name: 'rds',
           subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
         }
      ]
    });
  }
}
