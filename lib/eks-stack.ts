import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk8s from 'cdk8s';
import { aws_ec2 as ec2, aws_eks as eks } from 'aws-cdk-lib';
import { VPCStackProps } from './export-resources';
import { EksNamespace } from './k8s config/eks-namespace';


export class EKSStack extends cdk.Stack {
    private _arnRole: string;
    private _clusterName: string;
    private _cluster: eks.ICluster;

    public get arnRole() {
        return this._arnRole
    }
    public get clusterName() {
        return this._clusterName
    }
    public get cluster(){
        return this._cluster
    }
    constructor(scope: Construct, id: string, props: VPCStackProps) {
        super(scope, id, props);

        const vpc = props.vpc;

        const masterRole = new iam.Role(this, 'eks-cluster-master-role', {
            roleName: `eks-master`,
            assumedBy: new iam.AccountRootPrincipal()
        });

        const role = new iam.Role(this, 'eks-cluster-role', {
            roleName: `eks-cluster`,
            assumedBy: new iam.ServicePrincipal("eks.amazonaws.com"),

            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryPowerUser"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSClusterPolicy"),
            ]
        });

        const securityGroups = new ec2.SecurityGroup(this, `sg`, {
            vpc
        });

        const computeSubnets = vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS });
        computeSubnets.subnets.forEach(subnet =>
            securityGroups.addIngressRule(ec2.Peer.ipv4(subnet.ipv4CidrBlock), ec2.Port.tcp(443)));


        const cluster = this._cluster = new eks.FargateCluster(this, 'my-cluster', {
            version: eks.KubernetesVersion.V1_29,
            vpc,
            mastersRole: masterRole,
            clusterName: 'cluster-name',
            outputClusterName: true,
            role,
            endpointAccess: cdk.aws_eks.EndpointAccess.PUBLIC_AND_PRIVATE,
            securityGroup: securityGroups,
        });


        cluster.awsAuth.addRoleMapping(masterRole, {
            groups: ['system:masters'],
            username: 'cluster-admin'
        })


        this._clusterName = cluster.clusterName;
        this._arnRole = masterRole.roleArn;

        const podRole = new iam.Role(this, "pod-role", {
            roleName: "pod-role",
            assumedBy: new iam.ServicePrincipal("eks-fargate-pods.amazonaws.com"),
            inlinePolicies:{
                'secrets-access': new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: [
                                "secretsmanager:GetSecretValue",
                                "kms:Decrypt"
                            ],
                            resources: [ `*` ]
                        })
                    ]
                }),
            },
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryPowerUser"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSClusterPolicy"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSFargatePodExecutionRolePolicy"),
            ],
        });

        const appFargateProfile = new eks.FargateProfile(this, 'app-fargate-profile', {
            cluster,
            fargateProfileName: 'app-fargate-profile',
            selectors: [{ namespace: 'namespace', labels: {} }],
            vpc,
            subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
        }
        )
        const fargateProfileExternalSecrets = new eks.FargateProfile(this, 'externalsecrets', {
            cluster,
            fargateProfileName: 'externalsecrets',
            selectors: [{ namespace: 'external-secrets', labels: {} }],
            vpc,
            subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
        });  
        const cdk8sApp = new cdk8s.App();

        cluster.addCdk8sChart('external-secrets-chart-namespace',new EksNamespace(cdk8sApp, `external-secrets-chart-namespace`, 'external-secrets'))

    }

}
