import { StackProps } from 'aws-cdk-lib';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { HttpMethod } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { APIGatewayAuthorizerResultContext } from 'aws-lambda';

export type CDKContext = {
  appName: string;
  region: string;
  environment: string;
  branchName: string;
  accountNumber: string;
};

export type LambdaDefinition = {
  name: string;
  memoryMB?: number;
  timeoutMins?: number;
  environment?: {
    [key: string]: string;
  };
  api?: {
    path: string;
    methods: HttpMethod[];
  };
};

export type APIPayloadValidationResult = {
  isValid: boolean;
  errors?: (string | undefined)[];
};

export type Item = {
  name: string;
  quantity: number;
  deleted: boolean;
  user_id: string;
};

// User API Type Definitions
export type GetItemsParams = {
  returnAttributes?: string;
  nextToken?: string;
  limit?: number;
  email?: string;
};
export type AddItemBody = {
  name: string;
  quantity: number;
  deleted: boolean;
  user_id?: string;
};
export type UpdateItemBody = {
  name?: string;
  quantity?: number;
  deleted?: boolean;
  user_id?: string;
};
export type DeleteUserParams = {
  email?: string;
};

export type APIAuthorizerEvent = {
  headers: {
    authorization: string;
  };
  requestContext: {
    http: {
      method: string;
      path: string;
    };
  };
};
export type APIAuthValidationResult = {
  isAuthorized: boolean;
  context?: ContextAuth;
};

export interface ContextAuth {
  userId: string;
}

export type CustomAuth = APIGatewayAuthorizerResultContext & ContextAuth;


export interface LambdaStackProps extends StackProps {
  userPool: UserPool;
  ddbTable: Table;
}

export interface APIStackProps extends StackProps {
  lambdaFunctions: {
    [key: string]: NodejsFunction;
  };
}
