import { APIGatewayProxyResultV2, APIGatewayProxyHandlerV2WithLambdaAuthorizer } from 'aws-lambda';
import * as utils from '/opt/utils';
import { updateItemSchema, validateAPISchema } from '/opt/schema-definitions';
import { UpdateItemBody, Item, CustomAuth } from '/opt/types';

export const handler: APIGatewayProxyHandlerV2WithLambdaAuthorizer<CustomAuth> = async (event) => {
  return new Promise<APIGatewayProxyResultV2>((resolve) => {
    (async () => {
      try {
        // Print Event
        utils.logInfo(event, 'Event');

        let userId = event.requestContext.authorizer.lambda.userId;
        const body: UpdateItemBody = event.body ? JSON.parse(event.body) : {};
        const ConditionExpression = 'attribute_exists(#user_id) AND attribute_exists(#name)';

        // Validate Payload
        const validationResult = await validateAPISchema(updateItemSchema, body);

        if (validationResult.isValid) {
          const updatedItem: Item = {
            name: body.name,
            quantity: body.quantity,
            user_id: userId,
            deleted: body.deleted
          };

          if (process.env.DDB_TABLE) await utils.ddbWrite(process.env.DDB_TABLE, updatedItem, ConditionExpression);

          return resolve(await utils.apiSuccessResponse({ message: 'Item updated successfully' }));
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
