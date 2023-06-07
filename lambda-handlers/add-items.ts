import { APIGatewayProxyResultV2, APIGatewayProxyHandlerV2WithLambdaAuthorizer } from 'aws-lambda';
import * as utils from '/opt/utils';
import { addItemSchema, validateAPISchema } from '/opt/schema-definitions';
import { AddItemBody, CustomAuth, Item } from '/opt/types';

export const handler: APIGatewayProxyHandlerV2WithLambdaAuthorizer<CustomAuth> =
  async (event) => {
    return new Promise<APIGatewayProxyResultV2>((resolve) => {
      (async () => {
        try {
          // Print Event
          utils.logInfo(event, 'Event');

          let userId = event.requestContext.authorizer.lambda.userId;
          const body: AddItemBody = event.body ? JSON.parse(event.body) : {};
          const ConditionExpression = 'attribute_not_exists(#user_id) AND attribute_not_exists(#name)';

          // Validate Payload
          const validationResult = await validateAPISchema(addItemSchema, body);

          if (validationResult.isValid) {
            // Build User DDB Item
            const item: Item = {
              name: body.name,
              quantity: Number(body.quantity),
              user_id: userId,
              deleted: body.deleted
            };

            if (process.env.DDB_TABLE) await utils.ddbWrite(process.env.DDB_TABLE, item, ConditionExpression);

            resolve(await utils.apiSuccessResponse({ message: 'Item added successfully' }));
          } else {
            resolve(await utils.apiErrorResponse(400, validationResult.errors?.join(',')));
          }
        } catch (error: any) {
          utils.logError(error);
          resolve(await utils.apiErrorResponse(500, error.message || error));
        }
      })();
    });
  };
