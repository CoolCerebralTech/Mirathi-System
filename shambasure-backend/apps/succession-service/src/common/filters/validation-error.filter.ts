import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(BadRequestException)
export class ValidationErrorFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const exceptionResponse = exception.getResponse();

    let validationErrors: any[] = [];

    if (typeof exceptionResponse === 'object' && (exceptionResponse as any).message) {
      validationErrors = this.formatValidationErrors((exceptionResponse as any).message);
    }

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: {
          errors: validationErrors,
          totalErrors: validationErrors.length,
        },
        suggestion: 'Please check your input and try again',
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }

  private formatValidationErrors(messages: string[] | string): any[] {
    if (Array.isArray(messages)) {
      return messages.map((message) => ({
        field: this.extractFieldFromMessage(message),
        message: message,
        type: 'VALIDATION',
      }));
    }

    return [
      {
        field: 'unknown',
        message: messages,
        type: 'VALIDATION',
      },
    ];
  }

  private extractFieldFromMessage(message: string): string {
    const fieldMatch = message.match(/(\w+) (?:is|should|must)/);
    return fieldMatch ? fieldMatch[1] : 'unknown';
  }
}
