// CDK
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as ddb from 'aws-cdk-lib/aws-dynamodb';

// Types
import { CDKContext } from '../lambda-layer/types';

export class DynamoDBStack extends Stack {
  public readonly ddbTable: ddb.Table;
  constructor(scope: Construct, id: string, props: StackProps, context: CDKContext) {
    super(scope, id, props);

    // DynamoDB Table
    const ddbTable = new ddb.Table(this, 'ddbTable', {
      tableName: `${context.appName}-${context.environment}`,
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'user_id', type: ddb.AttributeType.STRING },
      sortKey:{name: 'name', type: ddb.AttributeType.STRING}
    });
    this.ddbTable = ddbTable;
  }
}
