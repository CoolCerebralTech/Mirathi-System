import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';

type BadRequestMessage = string | string[] | { [key: string]: string[] };

interface BadRequestExceptionResponse {
  message?: BadRequestMessage;
  error?: string;
  statusCode?: number;
}

interface ValidationError {
  field: string;
  message: string;
  type: string;
}

interface ErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details: {
      errors: ValidationError[];
      totalErrors: number;
    };
    suggestion: string;
  };
  timestamp: string;
  path: string;
}

@Catch(BadRequestException)
export class ValidationErrorFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const exceptionResponse = exception.getResponse();

    const validationErrors = this.extractValidationErrors(exceptionResponse);

    const errorResponse: ErrorResponse = {
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

  private extractValidationErrors(exceptionResponse: unknown): ValidationError[] {
    if (!this.isBadRequestResponse(exceptionResponse) || !exceptionResponse.message) {
      return [];
    }

    return this.formatValidationErrors(exceptionResponse.message);
  }

  private isBadRequestResponse(response: unknown): response is BadRequestExceptionResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      ('message' in response || 'error' in response)
    );
  }

  private formatValidationErrors(messages: BadRequestMessage): ValidationError[] {
    // Handle array of strings (class-validator default)
    if (Array.isArray(messages)) {
      return messages.map((message) => ({
        field: this.extractFieldFromMessage(message),
        message: message,
        type: 'VALIDATION',
      }));
    }

    // Handle object with field-specific errors
    if (typeof messages === 'object' && messages !== null) {
      const errors: ValidationError[] = [];
      for (const [field, fieldMessages] of Object.entries(messages)) {
        if (Array.isArray(fieldMessages)) {
          fieldMessages.forEach((message) => {
            errors.push({
              field,
              message,
              type: 'VALIDATION',
            });
          });
        }
      }
      return errors;
    }

    // Handle single string message
    if (typeof messages === 'string') {
      return [
        {
          field: this.extractFieldFromMessage(messages),
          message: messages,
          type: 'VALIDATION',
        },
      ];
    }

    return [];
  }

  private extractFieldFromMessage(message: string): string {
    // Try to extract field name from common validation message patterns
    const patterns = [
      /(\w+) (?:is|should|must)/, // "email must be..."
      /property (\w+) should/, // "property email should..."
      /(\w+) (?:field|property)/, // "email field is required"
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return 'unknown';
  }
}
