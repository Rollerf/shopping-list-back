import { APIPayloadValidationResult } from '/opt/types';
import Ajv from 'ajv';

// Validate API Schema
export const validateAPISchema = async (schema: any, data: any) => {
  return new Promise<APIPayloadValidationResult>(async (resolve) => {
    try {
      const ajv = new Ajv({ allErrors: true });
      const validate = ajv.compile(schema);
      const isValid = validate(data);

      if (isValid) {
        resolve({ isValid: true });
      } else {
        resolve({
          isValid: false,
          errors: validate.errors?.map((e) => e.message),
        });
      }
    } catch (error) {
      console.log(error);
      resolve({ isValid: false, errors: ['Error occurred while validating API payload'] });
    }
  });
};

// Common Get Schema
const commonGetParams = {
  returnAttributes: { type: 'string', minLength: 1 },
  nextToken: { type: 'string' },
  limit: { type: 'number', minimum: 1 },
};

// Get Items Schema
export const getItemsSchema = {
  type: 'object',
  properties: {
    ...commonGetParams,
    name: { type: 'string', minLength: 1 },
  },
  required: [],
  additionalProperties: false,
};

// Add Item Schema
export const addItemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    quantity: { type: 'number', minLength: 1 },
    deleted: { type: 'boolean', minLength: 1 },
    user_id: { type: 'string', minLength: 1 },
  },
  required: ['name', 'quantity', 'deleted'],
  additionalProperties: false,
};

// Update Item Schema
export const updateItemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    quantity: { type: 'number', minLength: 1 },
    deleted: { type: 'boolean', minLength: 1 },
    user_id: { type: 'string', minLength: 1 },
  },
  required: ['name'],
  additionalProperties: false,
};
