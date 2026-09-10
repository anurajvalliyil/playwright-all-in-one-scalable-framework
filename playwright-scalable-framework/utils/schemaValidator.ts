import Ajv from 'ajv';
import { logger } from './logger';

const ajv = new Ajv();

export class SchemaValidator {
  static validate(schema: any, data: any): void {
    logger.info('Validating API response against JSON schema');
    // Unwrap if using ES module default import
    const actualSchema = schema.default || schema;
    
    const validateObj = ajv.compile(actualSchema);
    const valid = validateObj(data);
    
    if (!valid) {
      logger.error(`Schema validation failed: ${JSON.stringify(validateObj.errors)}`);
      throw new Error(`Schema Validation Error: ${ajv.errorsText(validateObj.errors)}`);
    }
    logger.info('Schema validation passed successfully');
  }
}
