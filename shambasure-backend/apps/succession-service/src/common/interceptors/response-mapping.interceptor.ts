import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
  path: string;
  message?: string;
  pagination?: PaginationMeta;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  path: string;
}

// ✅ FIXED: Define proper interfaces for response types
interface PaginatedResponse {
  items: unknown[];
  message?: string;
  meta?: PaginationMeta;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface MessageResponse {
  message: string;
  data?: unknown;
}

// ✅ FIXED: Type guard functions for safe type checking
function isPaginatedResponse(data: unknown): data is PaginatedResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as PaginatedResponse).items)
  );
}

function isMessageResponse(data: unknown): data is MessageResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof (data as MessageResponse).message === 'string'
  );
}

@Injectable()
export class ResponseMappingInterceptor<T = unknown>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<SuccessResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;
    const timestamp = new Date().toISOString();

    return next
      .handle()
      .pipe(map((data: T) => this.transformResponse(data, path, timestamp) as SuccessResponse<T>));
  }

  private transformResponse(
    data: unknown,
    path: string,
    timestamp: string,
  ): SuccessResponse<unknown> {
    // ✅ FIXED: Use type guards instead of unsafe type assertions
    if (isPaginatedResponse(data)) {
      return {
        success: true,
        data: data.items,
        timestamp,
        path,
        ...(data.message && { message: data.message }),
        ...(data.meta && { pagination: data.meta }),
      };
    }

    // ✅ FIXED: Safe message response handling
    if (isMessageResponse(data)) {
      return {
        success: true,
        data: data.data !== undefined ? data.data : null,
        timestamp,
        path,
        message: data.message,
      };
    }

    // ✅ FIXED: Handle empty responses gracefully
    if (data === undefined || data === null) {
      return {
        success: true,
        data: null,
        timestamp,
        path,
      };
    }

    // Standard success response
    return {
      success: true,
      data,
      timestamp,
      path,
    };
  }
}
