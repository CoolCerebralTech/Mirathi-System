// application/dependency/dto/request/assess-financial-dependency.request.ts
import { IsDateString, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class AssessFinancialDependencyRequest {
  @IsString()
  dependencyAssessmentId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlySupportEvidence: number; // Monthly contribution from deceased

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  dependencyRatio: number; // Ratio of deceased's contribution to dependant's needs

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  dependencyPercentage: number;

  @IsString()
  assessmentMethod: string; // e.g., 'FINANCIAL_RATIO_ANALYSIS', 'COURT_ORDER', 'STATUTORY'

  // Alternative: Calculate using needs and income
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyNeeds?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalDeceasedIncome?: number;

  // For recalculation with different method
  @IsOptional()
  @IsString()
  recalculationReason?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsString()
  assessedBy?: string; // User ID or system identifier
}
