import { APIGatewayProxyResultV2, APIGatewayProxyHandlerV2WithLambdaAuthorizer } from 'aws-lambda';
import * as utils from '/opt/utils';
import { getItemsSchema, validateAPISchema } from '/opt/schema-definitions';
import { CustomAuth, GetItemsParams } from '/opt/types';
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import _ from 'lodash';

export const handler: APIGatewayProxyHandlerV2WithLambdaAuthorizer<CustomAuth> = async (event) => {
  return new Promise<APIGatewayProxyResultV2>((resolve) => {
    (async () => {
      try {
        // Print Event
        utils.logInfo(event, 'Event');

        let userId = event.requestContext.authorizer.lambda.userId;

        // Fetch Params from event
        const params: GetItemsParams = event.queryStringParameters ? event.queryStringParameters : {};
        if (params.limit) params.limit = Number(params.limit);

        // Validate Payload
        const validationResult = await validateAPISchema(getItemsSchema, params);

        if (validationResult.isValid) {
          //  Get DDB DocClient
          const ddbDocClient = await utils.getDDBDocItem();

          // Query command input with attributes to get
          const queryCommandInput: QueryCommandInput = {
            TableName: process.env.DDB_TABLE,
            ExclusiveStartKey: params.nextToken ? JSON.parse(Buffer.from(params.nextToken, 'base64').toString('ascii')) : undefined,
            ProjectionExpression: params.returnAttributes ? params.returnAttributes : undefined,
            Limit: params.limit ? params.limit : undefined,
            ExpressionAttributeValues: {},
          };

          // Add Query Expression
          if (userId) {
            queryCommandInput.KeyConditionExpression = 'user_id = :user_id';
            queryCommandInput.ExpressionAttributeValues = {
              ...queryCommandInput.ExpressionAttributeValues,
              ':user_id': userId
            };
          }

          // Execute Query
          const queryCommandOutput = await ddbDocClient.send(new QueryCommand(queryCommandInput));

          // Return Response
          return resolve(
            await utils.apiSuccessResponse(
              queryCommandOutput.Items ? _.orderBy(queryCommandOutput.Items, 'name', 'asc') : []
            )
          );
        } else {
          // Return validation errors
          return resolve(await utils.apiErrorResponse(400, validationResult.errors?.join(',')));
        }
      } catch (error: any) {
        utils.logError(error);
        resolve(await utils.apiErrorResponse(500, error.message || error));
      }
    })();
  });
};
