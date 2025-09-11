import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as dotenv from "dotenv";

dotenv.config();

export class ScheduleAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //DynamoDBテーブル作成
    const userTable = new dynamodb.Table(this, "UserTable", {
      tableName: "User",
      partitionKey: {name: "id", type: dynamodb.AttributeType.STRING},
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
    });

    const schedulesTable = new dynamodb.Table(this, "SchedulesTable", {
      tableName: "Schedules",
      partitionKey: {name: "id", type: dynamodb.AttributeType.STRING},
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
    });

    schedulesTable.addGlobalSecondaryIndex({
      indexName: "YearMonthIndex",
      partitionKey: { name: "yearmonth", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const honoLambda = new NodejsFunction(this, "lambda", {
      entry: "lambda/index.ts",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: {
        ENV: process.env.ENV ? process.env.ENV : "",
        BASIC_USERNAME: process.env.BASIC_USERNAME
          ? process.env.BASIC_USERNAME
          : "",
        BASIC_PASSWORD: process.env.BASIC_PASSWORD
          ? process.env.BASIC_PASSWORD
          : "",
      },
    })

    userTable.grantReadWriteData(honoLambda);
    schedulesTable.grantReadWriteData(honoLambda);

    const apiGw = new apigw.LambdaRestApi(this, "honoApi", {
      handler: honoLambda,
    });

    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: apiGw.url,
      description: "API Gateway endpoint URL"
    });
  }
}
