import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorResponse } from '@shamba/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    // --- Determine HTTP Status and Message ---
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal server error occurred.';
    let details: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        message = (response as any).message || exception.message;
        details = (response as any).details || (response as any).error;
      }
    }

    // This is where we log the REAL error, especially for 500s
    if (status >= 500) {
      this.logger.error(`[${request.method} ${request.url}] - ${status}`, {
        stack: exception instanceof Error ? exception.stack : String(exception),
        exception,
      });
    } else {
      this.logger.warn(`[${request.method} ${request.url}] - ${status} - ${message}`);
    }

    // --- Create a Consistent Error Response Body ---
    const responseBody: ErrorResponse = {
      statusCode: status,
      message,
      errorCode: (exception as any).errorCode || status, // Use custom error code if available
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      details,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }
}