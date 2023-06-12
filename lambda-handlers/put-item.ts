import { APIGatewayProxyHandlerV2WithLambdaAuthorizer } from 'aws-lambda';
import * as utils from '/opt/utils';
import { updateItemSchema, validateAPISchema } from '/opt/schema-definitions';
import { UpdateItemBody, Item, CustomAuth } from '/opt/types';

export const handler: APIGatewayProxyHandlerV2WithLambdaAuthorizer<CustomAuth> = async (event) => {
  try {
    // Print Event
    utils.logInfo(event, 'Event');

    let userId = event.requestContext.authorizer.lambda.userId;
    const body: UpdateItemBody = event.body ? JSON.parse(event.body) : {};
    const ActualDateInSeconds = Math.floor(Date.now() / 1000);
    const DaysInSecondsOffset = 240 * 60 * 60;

    // Validate Payload
    const validationResult = await validateAPISchema(updateItemSchema, body);

    if (!validationResult.isValid) {
      return await utils.apiErrorResponse(400, validationResult.errors?.join(','));
    }

    const updatedItem: Item = {
      name: body.name,
      quantity: body.quantity,
      user_id: userId,
      deleted: body.deleted,
      ttl: body.deleted ? ActualDateInSeconds + DaysInSecondsOffset : undefined
    };

    if (process.env.DDB_TABLE) {
      await utils.ddbWrite(process.env.DDB_TABLE, updatedItem);
    }

    return await utils.apiSuccessResponse({ message: 'Put item successfully' });
  } catch (error: any) {
    utils.logError(error);
    return await utils.apiErrorResponse(500, error.message || error);
  }
};