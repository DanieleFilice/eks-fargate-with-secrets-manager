import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2 , aws_eks as eks} from 'aws-cdk-lib';

export interface VPCStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export interface EKSStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  clusterAdminRoleArn?: string;
  clusterName?: string;
}

export interface KubernetesConfigStackProps extends cdk.StackProps{
  cluster: eks.ICluster;
  oidcId?: string;
}
