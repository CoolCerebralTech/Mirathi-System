import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

/**
 * Unfreeze Estate DTO
 *
 * Used to resume administration after a dispute is resolved.
 *
 * BUSINESS RULES:
 * 1. Resolution details must be provided.
 * 2. This action triggers a recalculation of the Estate Status.
 */
export class UnfreezeEstateDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Unfreeze reason/resolution must be descriptive' })
  reason: string;

  @IsString()
  @IsOptional()
  resolutionReference?: string; // e.g., "Settlement Deed #456"

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  unfrozenAt?: Date;

  @IsString()
  @IsNotEmpty()
  unfrozenBy: string;
}
