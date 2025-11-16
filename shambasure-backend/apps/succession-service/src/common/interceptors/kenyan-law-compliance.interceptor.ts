import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { SUCCESSION_COMPLIANCE_METADATA } from '../decorators/succession-compliance.decorator';

// --- IMPROVEMENT: Import our expert utilities ---
import { LegalFormalityChecker } from '../utils/legal-formality-checker';
import { KenyanSuccessionCalculator } from '../utils/kenyan-succession-calculator';
import { KenyanLawViolationException } from '../exceptions/kenyan-law-violation.exception';

// This defines the options that our @SuccessionCompliance decorator will accept.
export interface ComplianceOptions {
  check: 'WILL_FORMALITIES' | 'PROBATE_APPLICATION' | 'DEPENDANT_PROVISION';
}

/**
 * An interceptor that performs post-flight legal compliance checks on data
 * returned from a controller. It acts as a "conductor", delegating the actual
 * validation logic to our specialized expert utilities.
 *
 * It is activated by the `@SuccessionCompliance()` decorator.
 */
@Injectable()
export class KenyanLawComplianceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(KenyanLawComplianceInterceptor.name);

  // --- IMPROVEMENT: Injecting our expert utilities ---
  // The interceptor now has access to our centralized, testable logic.
  constructor(
    private readonly reflector: Reflector,
    private readonly formalityChecker: LegalFormalityChecker,
    private readonly successionCalculator: KenyanSuccessionCalculator,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const complianceOptions = this.reflector.get<ComplianceOptions | undefined>(
      SUCCESSION_COMPLIANCE_METADATA,
      context.getHandler(),
    );

    // If no decorator is present, do nothing.
    if (!complianceOptions) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((data: unknown) => {
        // --- REFACTORED: Delegate to a clean, focused method ---
        this.runComplianceCheck(data, complianceOptions.check);
      }),
    );
  }

  /**
   * The "Conductor" method. It takes the data and the check type,
   * and routes the data to the appropriate expert utility for validation.
   */
  private runComplianceCheck(data: unknown, checkType: ComplianceOptions['check']): void {
    this.logger.log(`Running post-flight compliance check: ${checkType}`);

    try {
      switch (checkType) {
        case 'WILL_FORMALITIES':
          // Assuming the `data` is a Will object that matches the checker's input
          // In a real app, we'd add type guards to ensure `data` is a valid Will object
          const willResult = this.formalityChecker.validateWillFormalities(data as any);
          if (!willResult.isValid) {
            // Throw a proper exception that our filter can catch
            throw new KenyanLawViolationException(
              'Will formalities are not met.',
              willResult.lawSections[0] || '11',
              'WILL_FORMALITIES',
              willResult.errors,
            );
          }
          break;

        case 'PROBATE_APPLICATION':
          const probateResult = this.formalityChecker.validateProbateFormalities(data as any);
          if (!probateResult.isValid) {
            throw new KenyanLawViolationException(
              'Probate application formalities are not met.',
              probateResult.lawSections[0] || '51',
              'PROBATE_FORMALITIES',
              probateResult.errors,
            );
          }
          break;

        case 'DEPENDANT_PROVISION':
          // This would be a more complex check involving the calculator
          // and the full set of assets, will, and family tree.
          // This is a placeholder for that more advanced logic.
          // const analysis = this.successionCalculator.analyzeDependantProvision(...);
          // if (analysis.shortfall > 0) { ... }
          break;
      }
    } catch (error) {
      // If the validation check itself throws an error, re-throw it to be caught by our filters.
      this.logger.error(`Compliance check failed for ${checkType}`, error.stack);
      throw error;
    }
  }
}
