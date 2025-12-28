import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { EstateStatus } from '../../../../../domain/aggregates/estate.aggregate';
import { PaginationDto } from '../common/pagination.dto';

export class SearchEstatesDto extends PaginationDto {
  // --- Identity Filters ---
  @IsOptional()
  @IsString()
  searchTerm?: string; // Searches name, deceased name, KRA PIN

  @IsOptional()
  @IsUUID()
  executorId?: string; // "Show me estates I manage"

  @IsOptional()
  @IsUUID()
  deceasedId?: string;

  // --- Status & Flags ---
  @IsOptional()
  @IsEnum(EstateStatus)
  status?: EstateStatus;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFrozen?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isInsolvent?: boolean; // Critical for Bankruptcy checks

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasActiveDisputes?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  requiresCourtSupervision?: boolean;

  // --- Timeline ---
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfDeathFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfDeathTo?: Date;

  // --- Financial thresholds (e.g. "High Value Estates") ---
  @IsOptional()
  @Type(() => Number)
  minNetWorth?: number;

  @IsOptional()
  @Type(() => Number)
  maxNetWorth?: number;
}
