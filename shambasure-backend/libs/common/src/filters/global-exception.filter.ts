import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApiProperty } from '@nestjs/swagger';
import { Request } from 'express';

import { ConfigService } from '@shamba/config';

// Define ErrorResponse class for Swagger documentation and type safety
class ErrorResponse {
  @ApiProperty({ description: 'HTTP status code', example: 500 })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Internal server error',
  })
  message: string;

  @ApiProperty({ description: 'Custom error code', example: 'ERR_INTERNAL' })
  errorCode: string | number;

  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2025-10-08T14:52:00.000Z',
  })
  timestamp: string;

  @ApiProperty({ description: 'Request path', example: '/api/users' })
  path: string;

  @ApiProperty({
    description: 'Additional error details',
    type: Object,
    nullable: true,
  })
  details?: Record<string, unknown>;
}

interface CustomError extends Error {
  errorCode?: string | number;
  details?: Record<string, unknown>;
}

interface HttpExceptionResponse {
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly configService: ConfigService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { user?: { id?: string } }>();
    const headers = request.headers;
    const correlationId = (headers['x-correlation-id'] as string | undefined) ?? 'unknown';

    // Determine HTTP status, message, and details
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal server error occurred.';
    let errorCode: string | number = status;
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse() as HttpExceptionResponse | string;
      if (typeof response === 'string') {
        message = response;
      } else {
        message = response.message || response.error || exception.message;
        details = response.details;
      }
      errorCode = (exception as CustomError).errorCode ?? status;
    } else if (exception instanceof Error) {
      const customError = exception as CustomError;
      message = customError.message || message;
      errorCode = customError.errorCode ?? status;
      details = customError.details;
    }

    // Structured logging
    const logContext = {
      correlationId,
      method: request.method,
      url: request.url,
      status,
      message,
      userId: request.user?.id ?? 'anonymous',
      stack: exception instanceof Error ? exception.stack : String(exception),
      details,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`[${request.method} ${request.url}] - ${status}`, logContext);
    } else {
      this.logger.warn(`[${request.method} ${request.url}] - ${status}`, logContext);
    }

    // Sanitize details for production
    if (this.configService.isProduction && status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      details = undefined; // Avoid leaking sensitive info
    }

    // Create response body
    const responseBody: ErrorResponse = {
      statusCode: status,
      message,
      errorCode,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request) as string, // Type assertion
      details,
    };

    // Add correlation ID to response headers
    httpAdapter.setHeader(ctx.getResponse(), 'X-Correlation-ID', correlationId);

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }
}
