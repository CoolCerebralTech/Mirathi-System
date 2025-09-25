import { HttpStatus, ErrorCode } from '../../enums';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: Date;
  path?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errorCode: ErrorCode;
  timestamp: Date;
  path?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationErrorResponse extends ErrorResponse {
  details: ValidationError[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}