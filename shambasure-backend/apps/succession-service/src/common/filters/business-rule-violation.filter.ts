import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

export class BusinessRuleViolationException extends Error {
  constructor(
    message: string,
    public rule: string,
    public context?: any,
  ) {
    super(message);
    this.name = 'BusinessRuleViolationException';
  }
}

@Catch(BusinessRuleViolationException)
export class BusinessRuleViolationFilter implements ExceptionFilter {
  catch(exception: BusinessRuleViolationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = {
      success: false,
      error: {
        code: 'BUSINESS_RULE_VIOLATION',
        message: exception.message,
        details: {
          rule: exception.rule,
          context: exception.context,
          type: 'DOMAIN_VALIDATION',
        },
        suggestion: 'Please review your request to ensure it complies with business rules',
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json(errorResponse);
  }
}
