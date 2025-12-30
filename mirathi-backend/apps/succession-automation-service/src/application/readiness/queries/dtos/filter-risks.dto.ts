import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';

import {
  RiskCategory,
  RiskSeverity,
  RiskStatus,
} from '../../../../domain/entities/risk-flag.entity';

export class FilterRisksDto {
  @IsUUID()
  assessmentId: string;

  @IsOptional()
  @IsEnum(RiskSeverity)
  severity?: RiskSeverity;

  @IsOptional()
  @IsEnum(RiskCategory)
  category?: RiskCategory;

  @IsOptional()
  @IsEnum(RiskStatus)
  status?: RiskStatus;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isBlocking?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeResolved?: boolean;
}
