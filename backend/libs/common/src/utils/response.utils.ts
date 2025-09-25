import { ApiResponse, ErrorResponse, PaginatedResponse } from '../interfaces/responses';
import { PaginationMeta } from '../interfaces/responses';

export function createSuccessResponse<T>(
  data: T,
  message: string = 'Success',
  path?: string,
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date(),
    path,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
  message: string = 'Success',
  path?: string,
): PaginatedResponse<T> {
  return {
    success: true,
    message,
    data,
    meta,
    timestamp: new Date(),
    path,
  };
}

export function createErrorResponse(
  message: string,
  errorCode: number,
  path?: string,
  details?: any,
): ErrorResponse {
  return {
    success: false,
    message,
    errorCode,
    timestamp: new Date(),
    path,
    details,
  };
}

export function formatValidationErrors(errors: any[]): any[] {
  return errors.map(error => ({
    field: error.property,
    message: Object.values(error.constraints || {}).join(', '),
    value: error.value,
  }));
}