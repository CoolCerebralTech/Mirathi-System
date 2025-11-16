import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { KenyanLawValidationGuard } from '../guards/legal-compliance.guard';

/**
 * The metadata key used to store the type of compliance check to perform.
 */
export const KENYAN_LAW_CHECK_KEY = 'kenyanLawCheck';

/**
 * Defines the types of legal checks the KenyanLawValidationGuard can perform.
 */
export type KenyanLawCheckType =
  | 'WILL_FORMALITIES'
  | 'DEPENDANT_PROVISION'
  | 'TESTATOR_CAPACITY'
  | 'PROBATE_APPLICATION';

/**
 * A master decorator that applies a specific Kenyan legal validation check to a route.
 * It sets metadata specifying the check type and applies the KenyanLawValidationGuard,
 * which reads the metadata and executes the corresponding logic.
 *
 * @param check The type of legal check to perform.
 */
function KenyanLawValidation(check: KenyanLawCheckType) {
  return applyDecorators(
    SetMetadata(KENYAN_LAW_CHECK_KEY, check),
    UseGuards(KenyanLawValidationGuard),
  );
}

// --- Specific, user-friendly decorators that use the master decorator ---

/**
 * Decorator for routes that handle will creation or updates.
 * Applies validation for Section 11 of the Law of Succession Act (formalities).
 */
export const RequiresWillFormalities = () => KenyanLawValidation('WILL_FORMALITIES');

/**
 * Decorator for routes that need to check for reasonable dependant provision.
 * Applies validation for Sections 26-29 of the Law of Succession Act.
 */
export const RequiresDependantProvision = () => KenyanLawValidation('DEPENDANT_PROVISION');

/**
 * Decorator for routes that need to validate the testator's legal capacity.
 * Applies validation for Section 7 of the Law of Succession Act.
 */
export const RequiresTestatorCapacity = () => KenyanLawValidation('TESTATOR_CAPACITY');
