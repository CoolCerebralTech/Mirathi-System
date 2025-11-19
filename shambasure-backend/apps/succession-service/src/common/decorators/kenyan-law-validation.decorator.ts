import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { KenyanLawValidationGuard } from '../guards/kenyan-law-validation.guard';

/**
 * The metadata key used to store the type of compliance check to perform.
 */
export const KENYAN_LAW_CHECK_KEY = 'kenyanLawCheck';

/**
 * Defines the types of legal checks the KenyanLawValidationGuard can perform.
 * Based on the Kenyan Law of Succession Act.
 */
export type KenyanLawCheckType =
  | 'WILL_FORMALITIES' // Section 11: Formalities for making wills
  | 'DEPENDANT_PROVISION' // Sections 26-29: Reasonable provision for dependants
  | 'TESTATOR_CAPACITY' // Section 7: Capacity to make a will
  | 'PROBATE_APPLICATION' // Probate and Administration Act
  | 'INTESTATE_SUCCESSION' // Part V: Distribution on intestacy
  | 'EXECUTOR_QUALIFICATION' // Sections 56-66: Executor qualifications and duties
  | 'WITNESS_ELIGIBILITY' // Section 11: Witness eligibility requirements
  | 'MINOR_GUARDIANSHIP'; // Guardianship of minors provisions

export interface KenyanLawCheckOptions {
  type: KenyanLawCheckType;
  contextField?: string; // Custom field for contextual data (defaults to 'willId', 'estateId', etc.)
}

/**
 * Master decorator that applies Kenyan legal validation checks to routes.
 *
 * @param options The legal check configuration
 *
 * @example
 * @Post('wills')
 * @KenyanLawValidation({ type: 'WILL_FORMALITIES' })
 * createWill(@Body() dto: CreateWillDto) { ... }
 */
export const KenyanLawValidation = (options: KenyanLawCheckOptions | KenyanLawCheckType) => {
  const normalizedOptions = typeof options === 'string' ? { type: options } : options;

  return applyDecorators(
    SetMetadata(KENYAN_LAW_CHECK_KEY, normalizedOptions),
    UseGuards(KenyanLawValidationGuard),
  );
};

// ============================================================================
// DOMAIN-SPECIFIC LEGAL COMPLIANCE SHORTCUTS
// ============================================================================

/**
 * Decorator for routes that handle will creation or updates.
 * Applies validation for Section 11 of the Law of Succession Act (formalities).
 */
export const RequiresWillFormalities = (contextField?: string) =>
  KenyanLawValidation({ type: 'WILL_FORMALITIES', contextField });

/**
 * Decorator for routes that need to check for reasonable dependant provision.
 * Applies validation for Sections 26-29 of the Law of Succession Act.
 */
export const RequiresDependantProvision = (contextField?: string) =>
  KenyanLawValidation({ type: 'DEPENDANT_PROVISION', contextField });

/**
 * Decorator for routes that need to validate the testator's legal capacity.
 * Applies validation for Section 7 of the Law of Succession Act.
 */
export const RequiresTestatorCapacity = (contextField?: string) =>
  KenyanLawValidation({ type: 'TESTATOR_CAPACITY', contextField });

/**
 * Decorator for probate application routes.
 * Applies validation for Probate and Administration Act requirements.
 */
export const RequiresProbateFormalities = (contextField?: string) =>
  KenyanLawValidation({ type: 'PROBATE_APPLICATION', contextField });

/**
 * Decorator for intestate succession calculations.
 * Applies validation for Part V of the Law of Succession Act.
 */
export const RequiresIntestateRules = (contextField?: string) =>
  KenyanLawValidation({ type: 'INTESTATE_SUCCESSION', contextField });

/**
 * Decorator for executor nomination and qualification checks.
 * Applies validation for Sections 56-66 of the Law of Succession Act.
 */
export const RequiresExecutorQualification = (contextField?: string) =>
  KenyanLawValidation({ type: 'EXECUTOR_QUALIFICATION', contextField });

/**
 * Decorator for witness eligibility validation.
 * Applies validation for Section 11 witness requirements.
 */
export const RequiresWitnessEligibility = (contextField?: string) =>
  KenyanLawValidation({ type: 'WITNESS_ELIGIBILITY', contextField });

/**
 * Decorator for minor guardianship provisions.
 * Applies validation for guardianship of minors under Kenyan law.
 */
export const RequiresMinorGuardianship = (contextField?: string) =>
  KenyanLawValidation({ type: 'MINOR_GUARDIANSHIP', contextField });
