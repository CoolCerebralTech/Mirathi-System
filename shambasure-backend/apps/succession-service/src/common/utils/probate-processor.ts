import { Injectable } from '@nestjs/common';
import { courtFeesConfig } from '../config/court-fees.config';
import { legalRulesConfig } from '../config/legal-rules.config';
import featureFlagsConfig from '../config/feature-flags.config';

export interface ProbateCase {
  id: string;
  deceasedId: string;
  caseType: 'TESTATE' | 'INTESTATE';
  applicationDate: Date;
  deceasedDate: Date;
  estateValue: number;
  jurisdiction: 'HIGH_COURT' | 'MAGISTRATE_COURT' | 'KADHIS_COURT';
  status: 'PENDING' | 'UNDER_REVIEW' | 'HEARING_SCHEDULED' | 'GRANT_ISSUED' | 'CLOSED';
  complexity?: 'LOW' | 'MEDIUM' | 'HIGH';
  executorId?: string;
}

export interface CourtFeeCalculation {
  estateValue: number;
  filingFee: number;
  adValoremFee: number;
  totalFee: number;
  currency: string;
  breakdown: string[];
}

@Injectable()
export class ProbateProcessor {
  private courtFees = courtFeesConfig();
  private legalRules = legalRulesConfig();
  private features = featureFlagsConfig();

  /**
   * Determine court jurisdiction based on estate value and complexity
   */
  determineJurisdiction(
    estateValue: number,
    complexity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM',
  ): 'HIGH_COURT' | 'MAGISTRATE_COURT' | 'KADHIS_COURT' {
    // Kadhis Court only if deceased is Muslim and applicable
    // This could be determined by context; here we just show logic
    // Example: if (isMuslim) return 'KADHIS_COURT';

    if (estateValue > 5_000_000 || complexity === 'HIGH') return 'HIGH_COURT';
    return 'MAGISTRATE_COURT';
  }

  /**
   * Calculate court fees dynamically using court-fees config
   */
  calculateCourtFees(
    estateValue: number,
    courtType: 'highCourt' | 'magistrateCourt' | 'kadhisCourt' = 'highCourt',
  ): CourtFeeCalculation {
    const probateFees = this.courtFees.probateFees;

    const filingFee = probateFees.filingFee[courtType] ?? probateFees.filingFee.highCourt;

    let adValoremFee = 0;
    for (const tier of probateFees.adValorem.tiers) {
      if (estateValue >= tier.range.min && estateValue <= (tier.range.max ?? Infinity)) {
        adValoremFee = estateValue * tier.rate;
        if (tier.minFee !== null && adValoremFee < tier.minFee) adValoremFee = tier.minFee;
        if (tier.maxFee !== null && adValoremFee > tier.maxFee) adValoremFee = tier.maxFee;
        break;
      }
    }

    const totalFee = filingFee + adValoremFee;

    return {
      estateValue,
      filingFee,
      adValoremFee,
      totalFee,
      currency: this.courtFees.calculationRules.currency ?? 'KES',
      breakdown: [
        `Filing fee: ${this.courtFees.calculationRules.currency ?? 'KES'} ${filingFee.toLocaleString()}`,
        `Ad valorem fee: ${this.courtFees.calculationRules.currency ?? 'KES'} ${adValoremFee.toLocaleString()}`,
        `Total court fees: ${this.courtFees.calculationRules.currency ?? 'KES'} ${totalFee.toLocaleString()}`,
      ],
    };
  }

  /**
   * Generate next hearing date based on status and dispute resolution rules
   */
  calculateNextHearingDate(currentStatus: ProbateCase['status'], lastHearingDate?: Date): Date {
    const date = new Date(lastHearingDate || new Date());
    const disputeTiming = this.legalRules.disputeResolution?.timeLimits || { courtHearing: 180 };

    switch (currentStatus) {
      case 'PENDING':
        date.setDate(date.getDate() + 30);
        break;
      case 'UNDER_REVIEW':
        date.setDate(date.getDate() + 60);
        break;
      case 'HEARING_SCHEDULED':
        date.setDate(date.getDate() + 14);
        break;
      case 'GRANT_ISSUED':
        date.setDate(date.getDate() + disputeTiming.courtHearing);
        break;
      default:
        date.setDate(date.getDate() + 30);
    }

    return date;
  }

  /**
   * Validate if grant can be issued based on legal rules
   */
  validateGrantIssuance(probateCase: ProbateCase): { canIssue: boolean; reasons: string[] } {
    const reasons: string[] = [];

    if (!['UNDER_REVIEW', 'HEARING_SCHEDULED'].includes(probateCase.status)) {
      reasons.push('Case must be under review or have completed hearing');
    }

    if (!probateCase.estateValue || probateCase.estateValue <= 0) {
      reasons.push('Estate value must be determined and positive');
    }

    // 30-day objection period
    const objectionEnd = new Date(probateCase.applicationDate);
    objectionEnd.setDate(objectionEnd.getDate() + 30);

    if (new Date() < objectionEnd) reasons.push('30-day objection period not yet completed');

    // Optional: check testator capacity if feature enabled
    if (this.features.analysis?.risk) {
      if (probateCase.estateValue > 0 && probateCase.complexity === 'HIGH') {
        // hypothetical AI check
        // if failed, reasons.push('Risk analysis indicates succession issues');
      }
    }

    return { canIssue: reasons.length === 0, reasons };
  }

  /**
   * Calculate executor fees using config
   */
  calculateExecutorFees(
    estateValue: number,
    complexity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM',
  ): number {
    // Use court fees config if available
    const percentages = {
      LOW: 0.02,
      MEDIUM: 0.03,
      HIGH: 0.05,
    };

    const fee = estateValue * (percentages[complexity] ?? 0.03);

    const maxFee = 1_000_000; // configurable in future from feature flags
    return Math.min(fee, maxFee);
  }

  /**
   * Generate a standardized case number for Probate & Administration
   */
  generateCaseNumber(
    jurisdiction: 'HIGH_COURT' | 'MAGISTRATE_COURT' | 'KADHIS_COURT',
    year: number = new Date().getFullYear(),
  ): string {
    const courtCode =
      jurisdiction === 'HIGH_COURT' ? 'HC' : jurisdiction === 'MAGISTRATE_COURT' ? 'MC' : 'KC';
    const randomNum = Math.floor(Math.random() * 10_000)
      .toString()
      .padStart(4, '0');
    return `P&A/${courtCode}/${year}/${randomNum}`;
  }

  /**
   * Validate will formalities based on legal rules
   */
  validateWillFormalities(
    probateCase: ProbateCase,
    witnessesCount: number,
    signed: boolean,
  ): { valid: boolean; reasons: string[] } {
    const reasons: string[] = [];
    const rules = this.legalRules.willFormalities;

    if (rules.requiresWriting && !signed)
      reasons.push('Will must be signed by the testator in writing');
    if (witnessesCount < rules.minWitnesses || witnessesCount > rules.maxWitnesses)
      reasons.push('Incorrect number of witnesses');
    return { valid: reasons.length === 0, reasons };
  }
}
