import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  KENYAN_LAW_CHECK_KEY,
  KenyanLawCheckType,
} from '../decorators/kenyan-law-validation.decorator';
import { LegalFormalityChecker } from '../utils/legal-formality-checker';
import { KenyanLawViolationException } from '../exceptions/kenyan-law-violation.exception';

/**
 * A guard that performs specific Kenyan legal compliance checks on incoming request data.
 * It reads metadata set by decorators like `@RequiresWillFormalities` to determine
 * which validation logic to execute, delegating the actual work to our expert utilities.
 */
@Injectable()
export class KenyanLawValidationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    // --- PERFECT INTEGRATION: Injects our expert utility ---
    private readonly formalityChecker: LegalFormalityChecker,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const checkType = this.reflector.get<KenyanLawCheckType>(
      KENYAN_LAW_CHECK_KEY,
      context.getHandler(),
    );

    // If the decorator is not applied, the guard does nothing.
    if (!checkType) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const body = request.body;

    let result: { isValid: boolean; errors: string[]; lawSections: string[] };

    // The guard acts as a "conductor", calling the correct expert.
    switch (checkType) {
      case 'WILL_FORMALITIES':
        result = this.formalityChecker.validateWillFormalities(body);
        break;

      // Add other cases here as we build them out
      // case 'PROBATE_APPLICATION':
      //   result = this.formalityChecker.validateProbateFormalities(body);
      //   break;

      default:
        // If the check type is unknown, we allow the request but log a warning.
        console.warn(`Unknown KenyanLawCheckType: ${checkType}`);
        return true;
    }

    if (!result.isValid) {
      // --- PERFECT INTEGRATION: Throws our custom exception ---
      // This will be caught by our KenyanLawViolationFilter for a perfect API response.
      throw new KenyanLawViolationException(
        result.errors[0] || 'The request violates Kenyan legal requirements.',
        result.lawSections[0] || 'Unknown',
        checkType,
        result.errors,
      );
    }

    return true;
  }
}
