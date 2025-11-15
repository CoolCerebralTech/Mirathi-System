import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
  path: string;
  message?: string;
  pagination?: unknown;
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

interface PaginatedResponse {
  items: unknown[];
  message?: string;
  meta?: unknown;
}

interface MessageResponse {
  message: string;
  data?: unknown;
}

@Injectable()
export class ResponseMappingInterceptor<T = unknown>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<SuccessResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;
    const timestamp = new Date().toISOString();

    return next.handle().pipe(map((data: T) => this.transformResponse(data, path, timestamp)));
  }

  private transformResponse(
    data: unknown,
    path: string,
    timestamp: string,
  ): SuccessResponse<unknown> {
    // Handle paginated responses
    const paginatedData = data as PaginatedResponse;
    if (paginatedData && typeof paginatedData === 'object' && 'items' in paginatedData) {
      return {
        success: true,
        data: paginatedData.items,
        timestamp,
        path,
        ...(paginatedData.message && { message: paginatedData.message }),
        ...(paginatedData.meta && { pagination: paginatedData.meta }),
      };
    }

    // Handle success responses with message
    const messageData = data as MessageResponse;
    if (messageData && typeof messageData === 'object' && 'message' in messageData) {
      return {
        success: true,
        data: messageData.data || messageData,
        timestamp,
        path,
        message: messageData.message,
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
