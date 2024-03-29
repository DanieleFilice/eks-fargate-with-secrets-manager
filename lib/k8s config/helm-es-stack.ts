import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EKSStackProps, KubernetesConfigStackProps, VPCStackProps } from '../export-resources';
import * as iam from 'aws-cdk-lib/aws-iam';
import { HelmChart, HelmChartOptions, ICluster, KubernetesManifest } from 'aws-cdk-lib/aws-eks';


export class HelmEsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: KubernetesConfigStackProps) {
 

        super(scope, id, props);

        const cluster = props.cluster;


        this.addHelmChart(cluster, `external-secrets`, {
            repository: "https://charts.external-secrets.io/",
            chart: 'external-secrets',
            namespace: 'external-secrets',
            createNamespace: false,
            values: {
                installCRDs: true,
                webhook: { port: 9443 },
            },
        });

       
    }

    public addManifest(cluster: ICluster, prune: boolean, id: string, ...manifest: Record<string, any>[]): KubernetesManifest {
        return new KubernetesManifest(this, `manifest-${id}`, { cluster, manifest, prune });
    }

    public addHelmChart(cluster: ICluster, id: string, options: HelmChartOptions): HelmChart {
        return new HelmChart(this, `${id}`, { cluster, ...options });
    }
}


