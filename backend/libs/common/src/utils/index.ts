// ============================================================================
// ARCHITECTURAL NOTE: The Role of the Utils File
// ============================================================================
// This file contains truly generic, reusable helper functions that are
// framework-agnostic and can be used across any service.
//
// All previous utility functions related to creating API responses (e.g.,
// `createSuccessResponse`) and manually validating DTOs (e.g., `validateDto`)
// have been INTENTIONALLY DELETED.
//
// - API Responses: Are handled by returning DTOs directly on success and
//   throwing NestJS exceptions on failure, which are caught by a global filter.
// - DTO Validation: Is handled automatically by the global `ValidationPipe`.
//
// This ensures we leverage the NestJS framework correctly and avoid reinventing
// core functionalities.
// ============================================================================

/**
 * An enum defining character sets for random string generation.
 */
export enum Charset {
  NUMERIC = '0123456789',
  ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz',
  ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ALPHA = ALPHA_LOWER + ALPHA_UPPER,
  ALPHA_NUMERIC = ALPHA + NUMERIC,
}

/**
 * Generates a random string of a given length from a specified character set.
 *
 * @param length The desired length of the string.
 * @param charset The set of characters to choose from. Defaults to numeric.
 * @returns A random string.
 */
export function generateRandomString(
  length: number,
  charset = Charset.NUMERIC,
): string {
  let result = '';
  const charsetLength = charset.length;
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charsetLength));
  }
  return result;
}

/**
 * Creates a new object containing only the specified fields from the source object.
 * This is useful for sanitizing data before sending it in a response or saving it.
 *
 * @param obj The source object.
 * @param allowedFields An array of keys to include in the new object.
 * @returns A new object with only the allowed fields.
 */
export function sanitizeObject<T extends object>(
  obj: T,
  allowedFields: (keyof T)[],
): Partial<T> {
  const sanitized: Partial<T> = {};
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(obj, field)) {
      sanitized[field] = obj[field];
    }
  }
  return sanitized;
}