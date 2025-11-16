/**
 * API Contract Type Definitions
 * High-integrity, real-world DTOs for entire Succession System API
 */

/* ============================================================================
   GENERIC API RESPONSE TYPES
============================================================================ */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
  timestamp: string;
  path: string;
  version?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
  target?: string;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  meta: Required<ApiMeta>;
}

/* ============================================================================
   PAGINATION / FILTERS / SEARCH
============================================================================ */

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: unknown;
}

export interface SearchParams extends PaginationParams {
  q?: string;
  filters?: FilterParams;
}
