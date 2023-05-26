import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as openapix from "@alma-cdk/openapix";
import * as path from "path";
import * as apig from "aws-cdk-lib/aws-apigateway";
// import * as ssm from "aws-cdk-lib/aws-ssm";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53targets from "aws-cdk-lib/aws-route53-targets";

import * as dotenv from "dotenv";
dotenv.config();

export class CdkOpenapiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const domainName = process.env.DOMAIN_NAME || "";
    const ApigCustomDomainName = process.env.RECORD_NAME || "";
    const ApigCertificateArn = process.env.CERT_ARN || "";

    const greetFn = new NodejsFunction(this, "greet", {
      entry: path.join(__dirname, "../lambda/hello-function.ts"),
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
    });

    const searchFn = new NodejsFunction(this, "search", {
      entry: path.join(__dirname, "../lambda/search.ts"),
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
      environment: {
        ELASTIC_HOST: process.env.ELASTIC_HOST || "",
        ELASTIC_USERNAME: process.env.ELASTIC_USERNAME || "",
        ELASTIC_PASSWORD: process.env.ELASTIC_PASSWORD || "",
        ELASTIC_INDEX_NAME: process.env.ELASTIC_INDEX_NAME || "",
      },
    });

    const detailFn = new NodejsFunction(this, "detail", {
      entry: path.join(__dirname, "../lambda/detail.ts"),
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
    });

    const api = new openapix.Api(this, "HelloApi", {
      source: path.join(__dirname, "../openapi/openapi.yaml"),
      paths: {
        "/": {
          get: new openapix.LambdaIntegration(this, greetFn),
        },
        "/search": {
          get: new openapix.LambdaIntegration(this, searchFn),
        },
        "/items/{id}": {
          get: new openapix.LambdaIntegration(this, detailFn),
        },
      },
    });

    // カスタムドメインの設定
    const domainNameForApiGateway = new apig.DomainName(this, "CustomDomain", {
      // fromCertificateArnで証明書を取得します
      certificate: Certificate.fromCertificateArn(
        this,
        "Certificate",
        ApigCertificateArn //.stringValue
      ),
      // パラメータストアに登録したドメイン名を設定します
      domainName: ApigCustomDomainName, // .stringValue,
      // REGINALタイプでカスタムドメインを設定します
      endpointType: apig.EndpointType.REGIONAL,
    });

    // ベースパスマッピングの設定
    // https://www.example.com/v1/がベースパスとなります。
    domainNameForApiGateway.addBasePathMapping(api, {
      basePath: "v1",
    });

    // ホストゾーンIDを取得
    const hostedZoneId = route53.HostedZone.fromLookup(this, "HostedZoneId", {
      domainName,
    });

    // Route53レコード設定
    new route53.ARecord(this, "Route53RecordSet", {
      // ドメイン指定
      recordName: ApigCustomDomainName,
      // ホストゾーンID指定
      zone: hostedZoneId,
      // エイリアスターゲット設定
      target: route53.RecordTarget.fromAlias(
        new route53targets.ApiGatewayv2DomainProperties(
          domainNameForApiGateway.domainNameAliasDomainName,
          domainNameForApiGateway.domainNameAliasHostedZoneId
        )
      ),
    });
  }
}
