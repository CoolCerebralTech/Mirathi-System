import { ErrorCode } from '../../enums';
/**
 * A single validation error detail, used within a ValidationErrorResponse.
 */
export interface ValidationError {
    /** The name of the field that failed validation. */
    field: string;
    /** A descriptive message explaining the validation failure. */
    message: string;
}
/**
 * The standard shape for all error responses from the API.
 */
export interface ErrorResponse {
    /** The HTTP status code. */
    statusCode: number;
    /** A short, human-readable message for the error. */
    message: string;
    /** A consistent, internal error code for programmatic handling. */
    errorCode: ErrorCode;
    /** The ISO 8601 timestamp when the error occurred. */
    timestamp: string;
    /** The request path that triggered the error. */
    path: string;
    /** An array of detailed validation errors, if applicable. */
    details?: ValidationError[];
}
//# sourceMappingURL=index.d.ts.map