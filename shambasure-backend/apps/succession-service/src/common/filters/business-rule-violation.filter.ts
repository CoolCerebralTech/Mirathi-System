import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * A custom exception to be thrown when an action violates a core business rule.
 *
 * --- IMPROVEMENT 1: Using Generics for Type Safety ---
 * The 'T' generic allows the developer throwing the exception to provide a
 * strongly-typed context object, eliminating the 'any' type.
 *
 * @example
 * // In a service:
 * throw new BusinessRuleViolationException<{ willId: string; currentStatus: WillStatus }>(
 *   'Cannot add a witness to an active will.',
 *   'WILL_IS_ACTIVE',
 *   { willId: will.id, currentStatus: will.status }
 * );
 */
export class BusinessRuleViolationException<T = Record<string, unknown>> extends Error {
  constructor(
    message: string,
    public readonly rule: string, // A machine-readable code for the violated rule
    public readonly context?: T,
  ) {
    super(message);
    this.name = 'BusinessRuleViolationException';
  }
}

/**
 * A NestJS Exception Filter that catches `BusinessRuleViolationException`
 * and transforms it into a standardized, client-friendly HTTP 409 Conflict response.
 */
@Catch(BusinessRuleViolationException)
export class BusinessRuleViolationFilter implements ExceptionFilter {
  private readonly logger = new Logger(BusinessRuleViolationFilter.name);

  catch(exception: BusinessRuleViolationException<unknown>, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // --- IMPROVEMENT 2: HttpStatus.CONFLICT (409) ---
    // This status code is more specific for requests that are valid
    // but cannot be completed due to the application's current state or rules.
    const status = HttpStatus.CONFLICT;

    this.logger.warn(
      `Business Rule Violation: ${exception.rule} - ${exception.message}`,
      exception.context,
    );

    // --- IMPROVEMENT 3: Richer, Structured Error Response ---
    // The error response is structured for easy parsing by front-end clients.
    const errorResponse = {
      success: false,
      error: {
        code: 'BUSINESS_RULE_VIOLATION',
        message: exception.message,
        details: {
          rule: exception.rule, // e.g., 'WILL_IS_ACTIVE'
          context: exception.context, // e.g., { willId: '...', currentStatus: 'ACTIVE' }
        },
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
