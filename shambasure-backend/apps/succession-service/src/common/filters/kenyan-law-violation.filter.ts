import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { KenyanLawViolationException } from '../exceptions/kenyan-law-violation.exception';

@Catch(KenyanLawViolationException)
export class KenyanLawViolationFilter implements ExceptionFilter {
  catch(exception: KenyanLawViolationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = {
      success: false,
      error: {
        code: 'KENYAN_LAW_VIOLATION',
        message: 'Operation violates Kenyan succession law',
        details: {
          lawSection: exception.lawSection,
          requirement: exception.requirement,
          violations: exception.violations,
          reference: `Law of Succession Act Cap. 160, Section ${exception.lawSection}`,
        },
        suggestion: 'Please review your input to ensure compliance with Kenyan succession law',
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json(errorResponse);
  }
}
