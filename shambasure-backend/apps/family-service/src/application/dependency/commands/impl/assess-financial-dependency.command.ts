// application/dependency/commands/impl/assess-financial-dependency.command.ts
import { DependencyLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { BaseCommand, CommandMetadata } from '../base.command';

export enum AssessmentMethod {
  FINANCIAL_RATIO_ANALYSIS = 'FINANCIAL_RATIO_ANALYSIS',
  COURT_ORDER = 'COURT_ORDER',
  STATUTORY = 'STATUTORY',
  EXPERT_OPINION = 'EXPERT_OPINION',
  HISTORICAL_AVERAGE = 'HISTORICAL_AVERAGE',
  NEEDS_BASED = 'NEEDS_BASED',
}

export class AssessFinancialDependencyCommand extends BaseCommand {
  @IsString()
  dependencyAssessmentId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlySupportEvidence: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  dependencyRatio: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  dependencyPercentage: number;

  @IsEnum(AssessmentMethod)
  assessmentMethod: AssessmentMethod;

  // Alternative calculation method
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyNeeds?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalDeceasedIncome?: number;

  // Reason for assessment/reassessment
  @IsOptional()
  @IsString()
  reassessmentReason?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveDate?: Date;

  // Evidence references
  @IsOptional()
  @IsString({ each: true })
  evidenceDocumentIds?: string[];

  @IsOptional()
  @IsBoolean()
  isCourtOrdered?: boolean;

  // Metadata
  readonly metadata: CommandMetadata;

  constructor(
    data: {
      dependencyAssessmentId: string;
      monthlySupportEvidence: number;
      dependencyRatio: number;
      dependencyPercentage: number;
      assessmentMethod: AssessmentMethod;
      monthlyNeeds?: number;
      totalDeceasedIncome?: number;
      reassessmentReason?: string;
      effectiveDate?: Date;
      evidenceDocumentIds?: string[];
      isCourtOrdered?: boolean;
    },
    metadata: CommandMetadata,
    correlationId?: string,
    causationId?: string,
  ) {
    super(correlationId, causationId);

    Object.assign(this, data);
    this.metadata = metadata;

    // Set effective date if not provided
    if (!this.effectiveDate) {
      this.effectiveDate = new Date();
    }
  }

  get commandType(): string {
    return 'AssessFinancialDependencyCommand';
  }

  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate dependency ratio consistency
    if (this.dependencyRatio < 0 || this.dependencyRatio > 1) {
      errors.push('Dependency ratio must be between 0 and 1.');
    }

    // Validate percentage consistency with ratio
    const calculatedPercentage = this.dependencyRatio * 100;
    if (Math.abs(calculatedPercentage - this.dependencyPercentage) > 5) {
      warnings.push(
        `Dependency percentage (${this.dependencyPercentage}%) differs significantly from calculated ratio (${calculatedPercentage.toFixed(2)}%).`,
      );
    }

    // Validate monthly support evidence
    if (this.monthlySupportEvidence < 0) {
      errors.push('Monthly support evidence cannot be negative.');
    }

    // Validate if using alternative calculation method
    if (this.monthlyNeeds !== undefined || this.totalDeceasedIncome !== undefined) {
      if (this.monthlyNeeds === undefined || this.totalDeceasedIncome === undefined) {
        warnings.push(
          'Both monthly needs and total deceased income should be provided for accurate calculation.',
        );
      } else {
        if (this.monthlyNeeds <= 0) {
          errors.push('Monthly needs must be positive.');
        }
        if (this.totalDeceasedIncome <= 0) {
          errors.push('Total deceased income must be positive.');
        }
      }
    }

    // Validate evidence for non-court-ordered assessments
    if (
      !this.isCourtOrdered &&
      (!this.evidenceDocumentIds || this.evidenceDocumentIds.length === 0)
    ) {
      warnings.push('Financial dependency assessment should have supporting evidence documents.');
    }

    // Check if reassessment reason is provided for updates
    if (this.reassessmentReason && this.reassessmentReason.length < 10) {
      warnings.push('Reassessment reason should be descriptive.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Calculate derived dependency level
  get calculatedDependencyLevel(): DependencyLevel {
    if (this.dependencyPercentage >= 75) {
      return DependencyLevel.FULL;
    } else if (this.dependencyPercentage >= 25) {
      return DependencyLevel.PARTIAL;
    } else {
      return DependencyLevel.NONE;
    }
  }

  // Check if assessment is comprehensive
  get isComprehensive(): boolean {
    return (
      this.monthlyNeeds !== undefined &&
      this.totalDeceasedIncome !== undefined &&
      (this.evidenceDocumentIds?.length || 0) > 0
    );
  }

  get description(): string {
    return `Assess financial dependency for assessment ${this.dependencyAssessmentId} with ${this.dependencyPercentage}% dependency`;
  }
}
