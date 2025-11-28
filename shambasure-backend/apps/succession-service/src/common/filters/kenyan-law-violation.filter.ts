import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { KenyanLawViolationException } from '../exceptions/kenyan-law-violation.exception';

/**
 * A NestJS Exception Filter that catches `KenyanLawViolationException`
 * and transforms it into a standardized, client-friendly HTTP 400 Bad Request response.
 */
@Injectable() // Ensures the filter is a managed provider
@Catch(KenyanLawViolationException)
export class KenyanLawViolationFilter implements ExceptionFilter {
  private readonly logger = new Logger(KenyanLawViolationFilter.name);

  // --- IMPROVEMENT: Architecturally consistent constructor ---
  constructor() {}

  catch(exception: KenyanLawViolationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // --- IMPROVEMENT: HttpStatus.BAD_REQUEST (400) ---
    // This status code is a strong signal that the client's request
    // is invalid as-is and must be corrected before being re-sent.
    const status = HttpStatus.BAD_REQUEST;

    this.logger.warn(
      `Kenyan Law Violation [Section ${exception.lawSection}]: ${exception.message}`,
      { violations: exception.violations },
    );

    const errorResponse = {
      success: false,
      error: {
        code: 'LEGAL_COMPLIANCE_VIOLATION',
        message: exception.requirement, // The main, human-readable message
        details: {
          rule: exception.rule, // e.g., 'WILL_FORMALITIES'
          lawSection: exception.lawSection, // e.g., '11'
          violations: exception.violations, // e.g., ['Provided only 1 witness...']
          reference: `Law of Succession Act (Cap. 160), Section ${exception.lawSection}`,
        },
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
