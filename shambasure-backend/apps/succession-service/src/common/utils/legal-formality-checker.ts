import { Injectable } from '@nestjs/common';
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
  private legalRules = legalRulesConfig();
  private features = featureFlagsConfig();

  /**
   * Validate will formalities based on Law of Succession Act + feature flags
   */
  validateWillFormalities(will: Will): FormalityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const lawSections: string[] = ['11']; // Section 11 for will formalities

    // 1. Writing requirement
    if (!will.isInWriting) errors.push('Will must be in writing (Section 11)');

    // 2. Testator signature
    if (!will.testatorSignature) errors.push('Testator must sign the will (Section 11)');

    // 3. Witness validation
    this.validateWitnesses(will, errors, warnings);

    // 4. Testator capacity
    this.validateTestatorCapacity(will, errors, warnings);

    // 5. Date validation
    this.validateDates(will, warnings);

    // 6. Optional AI-powered risk analysis if feature enabled
    if (this.features.analysis?.risk && (will.estateValue ?? 0) > 0) {
      // ✅ Fixed: riskAnalysis → risk
      // Placeholder for AI risk check
      // If risk detected, push warning
      // warnings.push('AI analysis detected potential succession risk');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      lawSections,
    };
  }

  private validateWitnesses(will: Will, errors: string[], warnings: string[]): void {
    const rules = this.legalRules.willFormalities;

    if (!will.witnesses || will.witnesses.length < rules.minWitnesses) {
      errors.push(`Minimum ${rules.minWitnesses} witnesses required (Section 11)`);
      return;
    }

    if (will.witnesses.length > rules.maxWitnesses) {
      warnings.push(`Will has more than maximum allowed witnesses (${rules.maxWitnesses})`);
    }

    will.witnesses.forEach((witness: Witness, index: number) => {
      if (this.isWitnessAlsoBeneficiary(witness, will.beneficiaries)) {
        errors.push(`Witness ${index + 1} cannot be a beneficiary (${witness.name})`);
      }

      if ((witness.age ?? 0) < rules.witnessEligibility.minAge) {
        errors.push(
          `Witness ${index + 1} must be at least ${rules.witnessEligibility.minAge} years old`,
        );
      }

      if (!witness.signature && will.status !== WillStatus.DRAFT) {
        warnings.push(`Witness ${index + 1} has not signed the will`);
      }
    });

    // Check minimum signed witnesses
    const signedWitnesses = will.witnesses.filter(
      (w: Witness) => w.status === WitnessStatus.SIGNED || w.status === WitnessStatus.VERIFIED,
    );
    if (signedWitnesses.length < rules.minWitnesses && will.status === WillStatus.ACTIVE) {
      errors.push(`At least ${rules.minWitnesses} witnesses must sign before activation`);
    }
  }

  private validateTestatorCapacity(will: Will, errors: string[], warnings: string[]): void {
    const rules = this.legalRules.testatorCapacity;

    if ((will.testatorAge ?? 0) < rules.minAge)
      errors.push(`Testator must be at least ${rules.minAge} years old (Section 7)`);
    if (will.testatorMentalCapacity === false)
      errors.push('Testator must be of sound mind (Section 7)');

    if (will.specialCircumstances?.includes('ASSISTED_DRAFTING')) {
      warnings.push('Will drafted with assistance - check for undue influence');
    }

    if (
      rules.capacityAssessment.triggers.some((trigger) =>
        will.specialCircumstances?.includes(trigger),
      )
    ) {
      warnings.push('Testator capacity assessment recommended due to triggering conditions');
    }
  }

  private validateDates(will: Will, warnings: string[]): void {
    if (!will.willDate) warnings.push('Will should have an execution date');
    if (will.willDate && new Date(will.willDate) > new Date())
      warnings.push('Will date cannot be in the future');
  }

  private isWitnessAlsoBeneficiary(witness: Witness, beneficiaries?: Beneficiary[]): boolean {
    return beneficiaries?.some((b) => b.id === witness.id || b.email === witness.email) ?? false;
  }

  /**
   * Validate probate application formalities
   */
  validateProbateFormalities(application: ProbateApplication): FormalityValidationResult {
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
