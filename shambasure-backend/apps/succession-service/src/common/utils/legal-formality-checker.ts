import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { WillStatus, WitnessStatus } from '@prisma/client';
import { legalRulesConfig } from '../config/legal-rules.config';
import featureFlagsConfig from '../config/feature-flags.config'; // Fixed import

// Define proper interfaces to replace 'any'
export interface Witness {
  id?: string;
  name?: string;
  email?: string;
  age?: number;
  signature?: boolean;
  status?: WitnessStatus;
}

export interface Beneficiary {
  id?: string;
  email?: string;
}

export interface Will {
  isInWriting?: boolean;
  testatorSignature?: boolean;
  witnesses?: Witness[];
  beneficiaries?: Beneficiary[];
  estateValue?: number;
  testatorAge?: number;
  testatorMentalCapacity?: boolean;
  specialCircumstances?: string[];
  willDate?: string | Date;
  status?: WillStatus;
}

export interface ProbateApplication {
  deceasedDate?: string | Date;
  applicationDate?: string | Date;
  documents?: string[];
  applicants?: any[];
  submittedOnline?: boolean;
}

export interface FormalityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  lawSections: string[];
}

@Injectable()
export class LegalFormalityChecker {
  // --- IMPROVEMENT: Using professional Dependency Injection ---
  constructor(
    @Inject(legalRulesConfig.KEY)
    private readonly rules: ConfigType<typeof legalRulesConfig>,
    @Inject(featureFlagsConfig.KEY)
    private readonly features: ConfigType<typeof featureFlagsConfig>,
  ) {}
  /**
   * Validates will formalities based on the Law of Succession Act (Cap 160).
   */
  public validateWillFormalities(will: Will): FormalityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const lawSections: string[] = ['11']; // Section 11 is the primary source for will formalities

    // 1. Writing Requirement
    if (this.rules.willFormalities.requiresWriting && !will.isInWriting) {
      errors.push('Will must be in writing (Section 11)');
    }

    // 2. Testator Signature
    if (this.rules.willFormalities.requiresTestatorSignature && !will.testatorSignature) {
      errors.push(
        'Testator must sign the will, or have someone sign in their presence (Section 11)',
      );
    }

    // 3. Witness Validation
    this.validateWitnesses(will, errors, warnings);

    // 4. Testator Capacity Validation
    this.validateTestatorCapacity(will, errors);

    // 5. Date Validation
    this.validateDates(will, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      lawSections,
    };
  }

  private validateWitnesses(will: Will, errors: string[], warnings: string[]): void {
    const witnessRules = this.rules.willFormalities;
    const witnesses = will.witnesses || [];

    if (witnesses.length < witnessRules.minWitnesses) {
      errors.push(
        `A minimum of ${witnessRules.minWitnesses} competent witnesses are required (Section 11).`,
      );
      return; // Stop further witness validation if there aren't enough.
    }

    if (witnesses.length > witnessRules.maxWitnesses) {
      warnings.push(
        `The will has more than the system's configured maximum of ${witnessRules.maxWitnesses} witnesses.`,
      );
    }

    witnesses.forEach((witness, index) => {
      const witnessLabel = witness.name ? `Witness '${witness.name}'` : `Witness #${index + 1}`;

      if (
        witnessRules.witnessEligibility.cannotBeBeneficiary &&
        this.isWitnessAlsoBeneficiary(witness, will.beneficiaries)
      ) {
        errors.push(`${witnessLabel} cannot be a beneficiary.`);
      }

      if ((witness.age ?? 0) < witnessRules.witnessEligibility.minAge) {
        errors.push(
          `${witnessLabel} must be at least ${witnessRules.witnessEligibility.minAge} years old.`,
        );
      }

      // A warning for unsigned witnesses is relevant only before activation
      if (!witness.signature && will.status !== WillStatus.DRAFT) {
        warnings.push(`${witnessLabel} has not signed the will.`);
      }
    });
  }

  private validateTestatorCapacity(will: Will, errors: string[]): void {
    const capacityRules = this.rules.testatorCapacity;

    if ((will.testatorAge ?? 0) < capacityRules.minAge) {
      errors.push(`Testator must be at least ${capacityRules.minAge} years old (Section 7).`);
    }
    if (capacityRules.requiresSoundMind && will.testatorMentalCapacity === false) {
      errors.push(
        'Testator must be of sound mind and memory at the time of execution (Section 7).',
      );
    }
  }

  private validateDates(will: Will, warnings: string[]): void {
    if (!will.willDate) warnings.push('Will should have an execution date');
    if (will.willDate && new Date(will.willDate) > new Date())
      warnings.push('Will date cannot be in the future');
  }

  private isWitnessAlsoBeneficiary(witness: Witness, beneficiaries?: Beneficiary[]): boolean {
    if (!beneficiaries) return false;
    return beneficiaries.some(
      (b) => (b.id && b.id === witness.id) || (b.email && b.email === witness.email),
    );
  }

  /**
   * Validate probate application formalities
   */
  public validateProbateFormalities(application: ProbateApplication): FormalityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const lawSections: string[] = ['51', '55'];

    // Check 6-month application deadline
    if (application.deceasedDate) {
      const deadline = new Date(application.deceasedDate);
      deadline.setMonth(deadline.getMonth() + 6);
      if (new Date(application.applicationDate!) > deadline) {
        warnings.push('Probate application filed after 6-month deadline (Section 51)');
      }
    }

    // Required documents
    const requiredDocs = ['death_certificate', 'id_copy', 'will_if_any'];
    const missingDocs = requiredDocs.filter((doc) => !application.documents?.includes(doc));
    if (missingDocs.length) errors.push(`Missing required documents: ${missingDocs.join(', ')}`);

    // Applicant eligibility
    if (!application.applicants || application.applicants.length === 0) {
      errors.push('At least one applicant required (Section 55)');
    }

    // Optional: check feature flags for digital submissions
    if (this.features.probate?.eFiling && !application.submittedOnline) {
      warnings.push('E-filing feature enabled - consider online submission');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      lawSections,
    };
  }
}
