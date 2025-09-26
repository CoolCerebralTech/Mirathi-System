import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoggerService } from '@shamba/observability';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      map(data => {
        const duration = Date.now() - startTime;

        // Skip transformation for specific routes (like health checks)
        if (this.shouldSkipTransform(request)) {
          return data as any;
        }

        // If response is already formatted, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        const response: Response<T> = {
          success: true,
          message: 'Success',
          data: data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        // Log successful response
        this.logger.debug(`Response transformed for ${request.method} ${request.url}`, 'ResponseTransformInterceptor', {
          duration,
          statusCode: 200,
          correlationId: request.headers['x-correlation-id'],
        });

        return response;
      }),
    );
  }

  private shouldSkipTransform(request: any): boolean {
    const skipPaths = [
      '/health',
      '/metrics',
      '/api/docs',
    ];

    return skipPaths.some(path => request.url.startsWith(path));
  }
}