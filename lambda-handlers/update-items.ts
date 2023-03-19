import { APIGatewayProxyResultV2, APIGatewayProxyHandlerV2WithLambdaAuthorizer } from 'aws-lambda';
import * as utils from '/opt/utils';
import { updateItemSchema, validateAPISchema } from '/opt/schema-definitions';
import { UpdateItemBody, Item, CustomAuth } from '/opt/types';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

export const handler: APIGatewayProxyHandlerV2WithLambdaAuthorizer<CustomAuth> = async (event) => {
  return new Promise<APIGatewayProxyResultV2>(async (resolve) => {
    try {
      // Print Event
      utils.logInfo(event, 'Event');

      let userId = event.requestContext.authorizer.lambda.userId;
      const body: UpdateItemBody = event.body ? JSON.parse(event.body) : {};

      // Validate Payload
      const validationResult = await validateAPISchema(updateItemSchema, body);

      if (validationResult.isValid) {
        //  Get DDB DocClient
        const ddbDocClient = await utils.getDDBDocClient();

        // Check if item is present in DDB
        const getUserOutput = await ddbDocClient.send(
          new GetCommand({
            TableName: process.env.DDB_TABLE,
            Key: {
              'user_id': userId,
              'name': body.name,
            }
          })
        );

        // Update Item to DDB
        if (getUserOutput.Item) {
          // Update attributes of User
          const updatedItem = getUserOutput.Item as Item;

          if (userId) updatedItem.user_id = userId;
          if (body.name) updatedItem.name = body.name;
          if (body.quantity) updatedItem.quantity = body.quantity;
          if (body.deleted !== undefined) updatedItem.deleted = body.deleted;
          if (process.env.DDB_TABLE) await utils.ddbWrite(process.env.DDB_TABLE, updatedItem);

          return resolve(await utils.apiSuccessResponse({ message: 'Item updated successfully' }));
        } else {
          return resolve(await utils.apiErrorResponse(400, `Item with name ${body.name} not found`));
        }
      } else {
        // Return validation errors
        return resolve(await utils.apiErrorResponse(400, validationResult.errors?.join(',')));
      }
    } catch (error: any) {
      utils.logError(error);
      resolve(await utils.apiErrorResponse(500, error.message || error));
    }
  });
};
