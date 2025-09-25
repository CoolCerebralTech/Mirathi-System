import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ValidationErrorResponse, ValidationError as CustomValidationError } from '../interfaces/responses';

export async function validateDto<T extends object>(
  dtoClass: new () => T,
  plain: any,
): Promise<ValidationErrorResponse | null> {
  const dto = plainToInstance(dtoClass, plain);
  const errors = await validate(dto);

  if (errors.length === 0) {
    return null;
  }

  const validationErrors: CustomValidationError[] = errors.flatMap(error => 
    mapValidationError(error)
  );

  return {
    success: false,
    message: 'Validation failed',
    errorCode: 1000, // VALIDATION_ERROR
    timestamp: new Date(),
    details: validationErrors,
  };
}

function mapValidationError(error: ValidationError): CustomValidationError[] {
  const errors: CustomValidationError[] = [];

  if (error.constraints) {
    for (const [constraint, message] of Object.entries(error.constraints)) {
      errors.push({
        field: error.property,
        message,
        value: error.value,
      });
    }
  }

  if (error.children && error.children.length > 0) {
    for (const childError of error.children) {
      errors.push(...mapValidationError(childError).map(child => ({
        ...child,
        field: `${error.property}.${child.field}`,
      })));
    }
  }

  return errors;
}

export function sanitizeObject<T extends object>(obj: T, allowedFields: (keyof T)[]): Partial<T> {
  const sanitized: Partial<T> = {};
  
  for (const field of allowedFields) {
    if (obj[field] !== undefined) {
      sanitized[field] = obj[field];
    }
  }
  
  return sanitized;
}

export function generateRandomCode(length: number = 6): string {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}