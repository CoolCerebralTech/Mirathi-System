import { ErrorCode } from '../../enums';

// ============================================================================
// ARCHITECTURAL NOTE: API Response Philosophy
// ============================================================================
// Our API follows a simple, robust pattern:
//
// 1. On SUCCESS (2xx status codes): Return the relevant Response DTO directly.
//    (e.g., `UserResponseDto`, `PaginatedUserResponse`). We DO NOT wrap successful
//    responses in a generic `{ success: true, data: ... }` object. The HTTP
//    status code is sufficient to indicate success.
//
// 2. On FAILURE (4xx, 5xx status codes): All errors are caught by a global
//    exception filter, which formats the response into the standard
//    `ErrorResponse` shape defined below.
//
// This approach simplifies client-side logic and aligns with RESTful best practices.
//
// The `Pagination` interfaces have been REMOVED from this file as they are now
// correctly and robustly defined in `@shamba/common/dtos/pagination.dto.ts`.
// That file is the single source of truth for paginated response shapes.
// ============================================================================

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