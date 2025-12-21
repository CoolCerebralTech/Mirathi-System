import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AssessFinancialDependencyRequest {
  @IsUUID()
  dependencyAssessmentId: string;

  /**
   * The amount the deceased was contributing monthly.
   * Must be backed by receipts/mpesa statements in the evidence collection.
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlySupportEvidence: number;

  /**
   * The calculated ratio of (Contribution / Total Needs).
   * Determines strict S.29(b) eligibility.
   */
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  dependencyRatio: number;

  /**
   * The derived percentage (0-100).
   * Used for estate distribution weighting.
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  dependencyPercentage: number;

  @IsString()
  assessmentMethod: string; // 'FINANCIAL_RATIO_ANALYSIS', 'COURT_ORDER_PRECEDENT', 'AFFIDAVIT_BASED'

  // --- Alternative Calculation Params ---

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyNeeds?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalDeceasedIncome?: number;

  // --- Audit ---

  @IsOptional()
  @IsString()
  recalculationReason?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsUUID()
  assessedBy?: string;
}
