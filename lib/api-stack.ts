// CDK
import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';
import { HttpApi, CorsHttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { getLambdaDefinitions } from './lambda-config';

// Types
import { CDKContext, APIStackProps } from '../lambda-layer/types';
import { BasePathMapping } from 'aws-cdk-lib/aws-apigateway';

export class APIStack extends Stack {
  constructor(scope: Construct, id: string, props: APIStackProps, context: CDKContext) {
    super(scope, id, props);

    // Define API Authorizer
    const apiAuthorizer = new HttpLambdaAuthorizer('apiAuthorizer', props.lambdaFunctions['api-authorizer'], {
      authorizerName: `${context.appName}-http-api-authorizer-${context.environment}`,
      responseTypes: [HttpLambdaResponseType.SIMPLE],
    });

    // Define HTTP API
    const httpApi = new HttpApi(this, 'httpApi', {
      apiName: `${context.appName}-api-${context.environment}`,
      description: `HTTP API Demo - ${context.environment}`,
      corsPreflight: {
        allowHeaders: ['Authorization', 'Content-Type'],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.OPTIONS, CorsHttpMethod.PATCH],
        allowOrigins: ['*'],
      },
      defaultAuthorizer: apiAuthorizer,
    });

    // Get Lambda definitions
    const lambdaDefinitions = getLambdaDefinitions(context);

    // Loop through lambda definitions and create api routes if any
    for (const lambdaDefinition of lambdaDefinitions) {
      if (lambdaDefinition.api) {
        httpApi.addRoutes({
          path: lambdaDefinition.api.path,
          methods: lambdaDefinition.api.methods,
          integration: new HttpLambdaIntegration(`${lambdaDefinition.name}-integration`, props.lambdaFunctions[lambdaDefinition.name]),
        });
      }
    }
  }
}
