import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '@shamba/observability';

@Catch()
export class GatewayExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.message;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'InternalServerError';
      
      // Log unexpected errors
      this.logger.error('Unexpected error in gateway', 'GatewayExceptionFilter', {
        url: request.url,
        method: request.method,
        error: exception instanceof Error ? exception.stack : String(exception),
      });
    }

    // Don't expose internal errors in production
    if (status === HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
      message = 'Internal server error';
    }

    const errorResponse = {
      success: false,
      message,
      error,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId: request.headers['x-correlation-id'],
    };

    this.logger.error(`Gateway error: ${status} ${message}`, 'GatewayExceptionFilter', {
      url: request.url,
      method: request.method,
      statusCode: status,
      correlationId: request.headers['x-correlation-id'],
      userId: (request as any).user?.userId,
    });

    response.status(status).json(errorResponse);
  }
}