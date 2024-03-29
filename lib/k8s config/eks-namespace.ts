import * as cdk8s from 'cdk8s';
import * as constructs from 'constructs';
import * as kplus from 'cdk8s-plus-24';

export class EksNamespace extends cdk8s.Chart {
    constructor(scope: constructs.Construct, id: string, namespace: string) {
        super(scope, id, {});

        new kplus.k8s.KubeNamespace(this, `namespace`, {
            metadata: {
                name: namespace
            }
        });
    }
}