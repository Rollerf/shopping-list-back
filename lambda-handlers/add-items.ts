import { APIGatewayProxyResultV2, APIGatewayProxyHandlerV2WithLambdaAuthorizer } from 'aws-lambda';
import * as utils from '/opt/utils';
import { addItemSchema, validateAPISchema } from '/opt/schema-definitions';
import { AddItemBody, CustomAuth, Item } from '/opt/types';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

export const handler: APIGatewayProxyHandlerV2WithLambdaAuthorizer<CustomAuth> = async (event) => {
  return new Promise<APIGatewayProxyResultV2>(async (resolve) => {
    try {
      // Print Event
      utils.logInfo(event, 'Event');

      let userId = event.requestContext.authorizer.lambda.userId;
      const body: AddItemBody = event.body ? JSON.parse(event.body) : {};

      // Validate Payload
      const validationResult = await validateAPISchema(addItemSchema, body);

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
        if (getUserOutput.Item)
          return resolve(await utils.apiSuccessResponse(`Item with name ${body.name} already exists`));

        // Build User DDB Item
        const item: Item = {
          name: body.name,
          quantity: Number(body.quantity),
          user_id: userId,
          deleted: body.deleted
        };

        // Write Item to DDB
        if (process.env.DDB_TABLE) await utils.ddbWrite(process.env.DDB_TABLE, item);

        // Return success message
        return resolve(await utils.apiSuccessResponse({ message: 'Item added successfully' }));
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
