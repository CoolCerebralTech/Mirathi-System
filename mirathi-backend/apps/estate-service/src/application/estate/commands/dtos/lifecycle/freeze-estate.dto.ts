import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

/**
 * Freeze Estate DTO
 *
 * Used when a dispute arises or a court order (Interdict) is issued.
 *
 * BUSINESS RULES:
 * 1. A reason is mandatory for the legal audit trail.
 * 2. If prompted by a court order, the reference is required.
 */
export class FreezeEstateDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Freeze reason must be descriptive (min 10 chars)' })
  reason: string;

  @IsString()
  @IsOptional()
  courtOrderReference?: string; // e.g., "High Court Order #123 of 2024"

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  frozenAt?: Date; // Allows retroactive recording of court orders

  @IsString()
  @IsNotEmpty()
  frozenBy: string; // User ID (System Admin or Executor)
}
