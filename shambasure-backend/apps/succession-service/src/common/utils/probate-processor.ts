import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { courtFeesConfig } from '../config/court-fees.config';
import { legalRulesConfig } from '../config/legal-rules.config';
import { featureFlagsConfig } from '../config/feature-flags.config'; // ✅ Fixed: Added proper import
import { DateCalculator } from './date-calculator';

// These interfaces define the data structures this processor works with.
// They should be aligned with our Prisma models where applicable.
export interface ProbateCase {
  id: string;
  caseType: 'TESTATE' | 'INTESTATE';
  applicationDate: Date;
  estateValue: number;
  isMuslimEstate: boolean;
  complexity?: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'UNDER_REVIEW' | 'HEARING_SCHEDULED' | 'GRANT_ISSUED' | 'CLOSED';
}

export interface CourtFeeCalculation {
  estateValue: number;
  filingFee: number;
  adValoremFee: number;
  totalFee: number;
  currency: string;
  breakdown: string[];
}

export interface GrantValidationResult {
  // ✅ Added: Missing interface
  canIssue: boolean;
  reasons: string[];
  warnings?: string[]; // ✅ Added: Optional warnings array
}

@Injectable()
export class ProbateProcessor {
  constructor(
    @Inject(courtFeesConfig.KEY)
    private readonly courtFees: ConfigType<typeof courtFeesConfig>,
    @Inject(legalRulesConfig.KEY)
    private readonly legalRules: ConfigType<typeof legalRulesConfig>,
    @Inject(featureFlagsConfig.KEY)
    private readonly features: ConfigType<typeof featureFlagsConfig>,
    private readonly dateCalculator: DateCalculator,
  ) {}

  /**
   * Determines the correct court jurisdiction based on estate value, complexity, and religious law.
   */
  public determineJurisdiction(
    estateValue: number,
    isMuslimEstate: boolean,
    complexity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM',
  ): 'HIGH_COURT' | 'MAGISTRATE_COURT' | 'KADHIS_COURT' {
    // Check Kadhi's Court jurisdiction first
    if (
      isMuslimEstate &&
      this.legalRules.probateProcess.courtJurisdiction.kadhisCourt.muslimMatters
    ) {
      return 'KADHIS_COURT';
    }

    const highCourtThreshold = this.legalRules.probateProcess.courtJurisdiction.highCourt.threshold;
    const magistrateThreshold =
      this.legalRules.probateProcess.courtJurisdiction.magistrateCourt.threshold;

    // ✅ FIXED: Restructured logic to avoid the TypeScript error
    if (complexity === 'HIGH') {
      return 'HIGH_COURT';
    }

    if (estateValue > highCourtThreshold) {
      return 'HIGH_COURT';
    }

    if (estateValue <= magistrateThreshold) {
      return 'MAGISTRATE_COURT';
    }

    // Default to High Court for medium complexity cases above magistrate threshold
    return 'HIGH_COURT';
  }

  /**
   * Calculates court fees by consuming the centralized court-fees config.
   */
  public calculateCourtFees(
    estateValue: number,
    courtType: 'HIGH_COURT' | 'MAGISTRATE_COURT' | 'KADHIS_COURT', // ✅ Fixed: Match return type from determineJurisdiction
  ): CourtFeeCalculation {
    // Map jurisdiction to config keys
    const configKeyMap = {
      HIGH_COURT: 'highCourt' as const,
      MAGISTRATE_COURT: 'magistrateCourt' as const,
      KADHIS_COURT: 'kadhisCourt' as const,
    };

    const configKey = configKeyMap[courtType];
    const config = this.courtFees.probateFees;

    // ✅ Fixed: Safe access with fallbacks
    const filingFee = config.filingFee[configKey] || 0;

    let adValoremFee = 0;

    // ✅ Fixed: Added null checks for adValorem config
    if (config.adValorem?.tiers) {
      for (const tier of config.adValorem.tiers) {
        if (estateValue >= tier.range.min && estateValue <= (tier.range.max ?? Infinity)) {
          adValoremFee = estateValue * tier.rate;
          if (tier.minFee !== null && tier.minFee !== undefined && adValoremFee < tier.minFee) {
            adValoremFee = tier.minFee;
          }
          if (tier.maxFee !== null && tier.maxFee !== undefined && adValoremFee > tier.maxFee) {
            adValoremFee = tier.maxFee;
          }
          break;
        }
      }
    }

    const totalFee = filingFee + adValoremFee;

    // ✅ Fixed: Safe access with fallback
    const currency = this.courtFees.calculationRules?.currency || 'KES';

    return {
      estateValue,
      filingFee,
      adValoremFee,
      totalFee,
      currency,
      breakdown: [
        `Filing Fee: ${currency} ${filingFee.toLocaleString()}`,
        `Ad Valorem Fee: ${currency} ${adValoremFee.toLocaleString()}`,
        `Total Estimated Court Fees: ${currency} ${totalFee.toLocaleString()}`,
      ],
    };
  }

  /**
   * Calculates executor fees based on configured percentages.
   */
  public calculateExecutorFees(estateValue: number): number {
    // ✅ Fixed: Use correct property path and handle missing values
    const compensationRules = this.legalRules.executorRules?.compensation;

    if (!compensationRules) {
      // Default to 2% if no compensation rules found
      return estateValue * 0.02;
    }

    // Use average of min and max percentages, or min if only one exists
    const minPercentage = compensationRules.minPercentage ?? 0;
    const maxPercentage = compensationRules.maxPercentage ?? minPercentage;

    const feePercentage =
      maxPercentage > minPercentage ? (minPercentage + maxPercentage) / 2 : minPercentage;

    return estateValue * feePercentage;
  }

  /**
   * Validates if a grant of representation can be issued.
   */
  public validateGrantIssuance(probateCase: ProbateCase): GrantValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = []; // ✅ Fixed: Declare warnings array

    // ✅ Fixed: Safe access with optional chaining
    const objectionPeriodDays = this.legalRules.probateProcess?.objectionPeriod || 30;

    if (!['UNDER_REVIEW', 'HEARING_SCHEDULED'].includes(probateCase.status)) {
      reasons.push(
        'Case is not in a state where a grant can be issued (must be UNDER_REVIEW or HEARING_SCHEDULED).',
      );
    }

    const objectionEndDate = this.dateCalculator.calculateFutureDate(
      probateCase.applicationDate,
      objectionPeriodDays,
    ).endDate;

    if (new Date() < objectionEndDate) {
      reasons.push(
        `The legally mandated ${objectionPeriodDays}-day objection period has not yet passed.`,
      );
    }

    // ✅ Fixed: Safe feature flag check and proper warning handling
    if (this.features?.analysis?.risk && probateCase.complexity === 'HIGH') {
      warnings.push('High-complexity case; recommend final legal review before grant issuance.');
    }

    return {
      canIssue: reasons.length === 0,
      reasons,
      warnings: warnings.length > 0 ? warnings : undefined, // Only include if there are warnings
    };
  }

  /**
   * Generates a standardized case number for Probate & Administration.
   */
  public generateCaseNumber(
    jurisdiction: 'HIGH_COURT' | 'MAGISTRATE_COURT' | 'KADHIS_COURT',
    year: number = new Date().getFullYear(),
  ): string {
    const courtCode =
      jurisdiction === 'HIGH_COURT' ? 'HC' : jurisdiction === 'MAGISTRATE_COURT' ? 'MC' : 'KC';
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    return `P&A/${courtCode}/${randomNum}/${year}`;
  }

  // ✅ Added: Utility method for better case number generation (optional improvement)
  public generateSequentialCaseNumber(
    jurisdiction: 'HIGH_COURT' | 'MAGISTRATE_COURT' | 'KADHIS_COURT',
    sequenceNumber: number,
    year: number = new Date().getFullYear(),
  ): string {
    const courtCode =
      jurisdiction === 'HIGH_COURT' ? 'HC' : jurisdiction === 'MAGISTRATE_COURT' ? 'MC' : 'KC';
    return `P&A/${courtCode}/${sequenceNumber.toString().padStart(4, '0')}/${year}`;
  }
}
