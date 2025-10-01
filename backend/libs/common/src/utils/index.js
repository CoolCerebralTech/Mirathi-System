"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Charset = void 0;
exports.generateRandomString = generateRandomString;
exports.sanitizeObject = sanitizeObject;
/**
 * An enum defining character sets for random string generation.
 */
var Charset;
(function (Charset) {
    Charset["NUMERIC"] = "0123456789";
    Charset["ALPHA_LOWER"] = "abcdefghijklmnopqrstuvwxyz";
    Charset["ALPHA_UPPER"] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    Charset["ALPHA"] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    Charset["ALPHA_NUMERIC"] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
})(Charset || (exports.Charset = Charset = {}));
/**
 * Generates a random string of a given length from a specified character set.
 *
 * @param length The desired length of the string.
 * @param charset The set of characters to choose from. Defaults to numeric.
 * @returns A random string.
 */
function generateRandomString(length, charset = Charset.NUMERIC) {
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
function sanitizeObject(obj, allowedFields) {
    const sanitized = {};
    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(obj, field)) {
            sanitized[field] = obj[field];
        }
    }
    return sanitized;
}
//# sourceMappingURL=index.js.map