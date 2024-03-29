import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { VpcStack } from "./vpc-stack";
import { EKSStack } from "./eks-stack";
import { VPCConfigStack } from "./vpc-config-stack";
import { K8sConfigSecretStack } from "./k8s config/k8s-config-secret-stack";
import { HelmEsStack } from "./k8s config/helm-es-stack";

export class AppStage extends Stage {
    constructor(scope: Construct, id:string, props: StageProps){
        super(scope,id,props);
        const vpcStack = new VpcStack(scope, id+"-vpc", props);
        new VPCConfigStack(scope,id+"-vpc-config", {
            ...props,
            vpc:vpcStack.vpc});
            
        const eKSStack = new EKSStack(scope, id+ "-eks", {
            ...props,
            vpc:vpcStack.vpc,
        });
        new K8sConfigSecretStack(scope, id+"-k8s-config-secret",{
            ...props,
            cluster: eKSStack.cluster,
        });
        new HelmEsStack(scope, id+"-helm-es",{
            ...props,
            cluster: eKSStack.cluster,
        });

    }
}