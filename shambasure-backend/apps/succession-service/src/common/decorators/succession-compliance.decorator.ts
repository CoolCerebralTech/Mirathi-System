import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { KenyanLawComplianceInterceptor } from '../interceptors/kenyan-law-compliance.interceptor';

/**
 * The metadata key used to store the type of post-flight compliance check to perform.
 */
export const SUCCESSION_COMPLIANCE_METADATA = 'successionComplianceCheck';

/**
 * Defines the types of post-flight checks the KenyanLawComplianceInterceptor can perform.
 * This should align with the options in the interceptor itself.
 */
export type SuccessionComplianceCheckType =
  | 'WILL_FORMALITIES'
  | 'PROBATE_APPLICATION'
  | 'DEPENDANT_PROVISION';

/**
 * A master decorator that applies a specific post-flight Kenyan legal compliance check
 * to the data returned by a route. It sets metadata specifying the check type and
 * applies the KenyanLawComplianceInterceptor.
 *
 * @param check The type of legal check to perform on the response data.
 */
function SuccessionCompliance(check: SuccessionComplianceCheckType) {
  return applyDecorators(
    SetMetadata(SUCCESSION_COMPLIANCE_METADATA, { check }),
    UseInterceptors(KenyanLawComplianceInterceptor),
  );
}

// --- Specific, user-friendly decorators that use the master decorator ---

/**
 * Decorator for routes that return a will.
 * Applies a post-flight check to ensure the returned will data meets
 * the legal formalities of Section 11 of the Law of Succession Act.
 */
export const CheckWillFormalities = () => SuccessionCompliance('WILL_FORMALITIES');

/**
 * Decorator for routes that return a probate application.
 * Applies a post-flight check to ensure the returned data meets
 * the legal formalities for a probate application.
 */
export const CheckProbateApplication = () => SuccessionCompliance('PROBATE_APPLICATION');

/**
 * Decorator for routes that return a testate distribution plan.
 * Applies a post-flight check to analyze if reasonable provision has been
 * made for dependants as per Sections 26-29.
 */
export const CheckDependantProvision = () => SuccessionCompliance('DEPENDANT_PROVISION');
