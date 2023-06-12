import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyResultV2 } from 'aws-lambda';

//TODO: Este fichero utils no debe existir. Debe ser separado en varios.
//Quitar los anys de los logs y poner los tipos correctos.
// Logger Functions
export const logInfo = (message: string | any, title: string | undefined = undefined): void => {
  if (typeof message === 'string') {
    title ? console.info(`${title}: ${message}`) : console.info(message);
  } else {
    title ? console.info(`${title}:`, JSON.stringify(message, null, 2)) : console.info(JSON.stringify(message, null, 2));
  }
};
export const logError = (message: string | any, title: string | undefined = undefined): void => {
  if (typeof message === 'string') {
    title ? console.error(`${title}: ${message}`) : console.error(message);
  } else {
    title ? console.error(`${title}:`, JSON.stringify(message, null, 2)) : console.error(JSON.stringify(message, null, 2));
  }
};
export const logWarn = (message: string | any, title: string | undefined = undefined): void => {
  if (typeof message === 'string') {
    title ? console.warn(`${title}: ${message}`) : console.warn(message);
  } else {
    title ? console.warn(`${title}:`, JSON.stringify(message, null, 2)) : console.warn(JSON.stringify(message, null, 2));
  }
};
export const logDebug = (message: string | any, title: string | undefined = undefined): void => {
  if (process.env.LOG_LEVEL === 'debug') {
    if (typeof message === 'string') {
      title ? console.debug(`${title}: ${message}`) : console.debug(message);
    } else {
      title ? console.debug(`${title}:`, JSON.stringify(message, null, 2)) : console.debug(JSON.stringify(message, null, 2));
    }
  }
};

export const apiSuccessResponse = (body: any) => {
  return Promise.resolve({
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
    },
    body: typeof body === 'string' ? JSON.stringify({ message: body }) : JSON.stringify(body),
  });
};

// Get API Error response
export const apiErrorResponse = (statusCode: number, error: string = 'Something went wrong. Please contact administrator') => {
  return Promise.resolve({
    statusCode: statusCode,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ error }),
  });
};

export const getDDBDocItem = (): Promise<DynamoDBDocumentClient> => {
  return new Promise((resolve) => {
    const ddbClient = new DynamoDBClient({ region: 'eu-west-3' });
    const marshallOptions = {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
      wrapNumbers: false,
    };
    const translateConfig = { marshallOptions, unmarshallOptions };
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);
    resolve(ddbDocClient);
  });
};

export const ddbWrite = async (table: string, item: any): Promise<void> => {
  try {
    console.debug('Writing item to DDB');
    const ddbDocClient = await getDDBDocItem();
    console.debug('Got DDB Doc Client');
    try {
      await ddbDocClient.send(
        new PutCommand({
          TableName: table,
          Item: item
        })
      );
      console.debug('DDB Write complete');
    } catch (error) {
      console.error('Error writing to DDB', error);
      throw error;
    }
  } catch (error) {
    console.error('Error getting DDB Doc Client', error);
    throw error;
  }
};