import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        code = (exceptionResponse as any).code || code;
        details = (exceptionResponse as any).details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;

      // Handle specific error types
      if (exception.name === 'PrismaClientKnownRequestError') {
        code = 'DATABASE_ERROR';
        status = HttpStatus.BAD_REQUEST;
      } else if (exception.name === 'JsonWebTokenError') {
        code = 'AUTHENTICATION_ERROR';
        status = HttpStatus.UNAUTHORIZED;
      }
    }

    const errorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
        ...(process.env.NODE_ENV !== 'production' && {
          stack: exception instanceof Error ? exception.stack : undefined,
          type: exception instanceof Error ? exception.name : typeof exception,
        }),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(process.env.NODE_ENV !== 'production' && {
        debug: {
          method: request.method,
          headers: this.sanitizeHeaders(request.headers),
          body: this.sanitizeBody(request.body),
        },
      }),
    };

    // Log error for monitoring
    this.logError(exception, request);

    response.status(status).json(errorResponse);
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.creditCard;
    return sanitized;
  }

  private logError(exception: unknown, request: Request): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      userId: (request as any).user?.id,
      error:
        exception instanceof Error
          ? {
              name: exception.name,
              message: exception.message,
              stack: exception.stack,
            }
          : String(exception),
    };

    console.error('GLOBAL_ERROR:', errorLog);

    // In production, send to error monitoring service
    // Example: Sentry.captureException(exception);
  }
}
