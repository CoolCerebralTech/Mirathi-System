import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
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
  @IsUUID()
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

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyNeeds?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalDeceasedIncome?: number;

  @IsOptional()
  @IsString()
  reassessmentReason?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveDate?: Date;

  @IsOptional()
  @IsBoolean()
  isCourtOrdered?: boolean;

  readonly metadata: CommandMetadata;

  constructor(
    data: Omit<
      AssessFinancialDependencyCommand,
      'metadata' | 'commandType' | 'correlationId' | 'causationId' | 'commandId' | 'timestamp'
    >,
    metadata: CommandMetadata,
    correlationId?: string,
    causationId?: string,
  ) {
    super(correlationId, causationId);
    Object.assign(this, data);
    this.metadata = metadata;

    if (!this.effectiveDate) {
      this.effectiveDate = new Date();
    }
  }

  get commandType(): string {
    return 'AssessFinancialDependencyCommand';
  }
}
