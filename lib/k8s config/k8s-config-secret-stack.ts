import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EKSStackProps, KubernetesConfigStackProps, VPCStackProps } from '../export-resources';
import * as iam from 'aws-cdk-lib/aws-iam';
import { HelmChart, HelmChartOptions, ICluster, KubernetesManifest, ServiceAccount } from 'aws-cdk-lib/aws-eks';


export class K8sConfigSecretStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: KubernetesConfigStackProps) {

        super(scope, id, props);

        const cluster = props.cluster;

        const federatedPrincipal = cluster.openIdConnectProvider.openIdConnectProviderArn;
        const accountId = this.account;


        const conditions = new cdk.CfnJson(this, 'ConditionJson', {

            value: {
                [`${cluster.openIdConnectProvider.openIdConnectProviderIssuer}:aud`]: 'sts.amazonaws.com',
                [`${cluster.openIdConnectProvider.openIdConnectProviderIssuer}:sub`]: `system:serviceaccount:default:secrets-sa`,
            }
        });

        const trustRelationshipRole = new iam.Role(this, 'trust-relationship-oidc-k8s-role', {
            roleName: 'trust-relationship-oidc-k8s-role',
            assumedBy:
                new iam.FederatedPrincipal(federatedPrincipal, {
                    StringEquals: conditions,
                }, 'sts:AssumeRoleWithWebIdentity')
            ,
            inlinePolicies: {
                'secrets-access-policy': new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: [
                                "secretsmanager:GetSecretValue",
                                "secretsmanager:DescribeSecret",
                            ],
                            resources: [`arn:aws:secretsmanager:eu-west-1:${accountId}:secret:MySecret-XfcVZX`]
                        })
                    ]
                })
            }
        });
        const serviceAccount = new ServiceAccount(this,'ServiceAccount',{
            name: 'secrets-sa',
            cluster,
            namespace: 'default',
            annotations:{
                'eks.amazonaws.com/role-arn' : trustRelationshipRole.roleArn,
            }
        });
        const secretStoreManifest = {
            apiVersion: 'external-secrets.io/v1beta1',
            kind: 'SecretStore',
            metadata: {
                name: 'aws-secret-store',
            },
            spec: {
                provider: {
                    aws: {
                        service: 'SecretsManager',
                        region: 'eu-west-1',
                        auth: {
                            jwt: {
                                serviceAccountRef: {
                                    name: 'secrets-sa'
                                }
                            }
                        }
                    }
                }
            }
        };

        const externalSecretManifest = {
            apiVersion: 'external-secrets.io/v1beta1',
            kind: 'ExternalSecret',
            metadata: {
                name: 'aws-external-secret-my-secret',
            },
            spec: {
                refreshInterval: '1h',
                secretStoreRef: {
                    name: 'aws-secret-store',
                    kind: 'SecretStore'
                },
                target: {
                    name: 'my-secret',
                    creationPolicy: 'Owner'
                },
                data: [{
                    secretKey: 'username',
                    remoteRef: {
                        key: 'arn:aws:secretsmanager:eu-west-1:775836885122:secret:MySecret-XfcVZX',
                        property: 'username'
                    }
                },
                {
                    secretKey: 'password',
                    remoteRef: {
                        key: 'arn:aws:secretsmanager:eu-west-1:775836885122:secret:MySecret-XfcVZX',
                        property: 'password'
                    }
                }

                ]
            }
        };


        this.addManifest(cluster, false, `manifest-secret-store-${id}`, secretStoreManifest);
        this.addManifest(cluster, false, `manifest-external-secret-${id}`, externalSecretManifest);

          new cdk.CfnOutput(this, 'ServiceAccountRole', { value: serviceAccount.role.roleArn });


    }

    public addManifest(cluster: ICluster, prune: boolean, id: string, ...manifest: Record<string, any>[]): KubernetesManifest {
        return new KubernetesManifest(this, `manifest-${id}`, { cluster, manifest, prune });
    }
}


