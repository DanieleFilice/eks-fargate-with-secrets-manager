# eks-fargate-with-secrets-manager

Documents: 
https://docs.aws.amazon.com/it_it/cdk/v2/guide/getting_started.html
https://aws.amazon.com/it/blogs/containers/leverage-aws-secrets-stores-from-eks-fargate-with-external-secrets-operator/
https://docs.aws.amazon.com/it_it/eks/latest/userguide/associate-service-account-role.html
https://github.com/aws-samples/cdk-eks-fargate
https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_eks.HelmChart.html

Cdk's stacks will deploy an infrastructure that will create a VPC with 3 subnet,public , private for data level and private with egress for application level, We focus on the subnet with egress and create an EKS cluster with Fargate
that's comunicate with AWS Secrets Manager with to be sure to permite the application pods that you create to use AWS Secret Manager to read and write
secrets without exposing them with all advantages of AWS Secret manager like encryption and automatic rotation.

WARNING: this project contains only the main stacks, you need to init a new cdk project with Typescript and install dependencies to use correctly the stacks.
