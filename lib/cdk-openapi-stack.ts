import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as openapix from '@alma-cdk/openapix';
import * as path from 'path';

export class CdkOpenapiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const greetFn = new NodejsFunction(this, "greet", {
      entry: path.join(__dirname, '../lambda/hello-function.ts'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
    });

    new openapix.Api(this, 'HelloApi', {
      source: path.join(__dirname, '../openapi/openapi.yaml'),
      paths: {
        '/': {
          get: new openapix.LambdaIntegration(this, greetFn),
        },
      },
    })
  }
}
