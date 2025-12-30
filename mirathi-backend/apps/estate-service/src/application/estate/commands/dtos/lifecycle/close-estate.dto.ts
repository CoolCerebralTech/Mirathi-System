import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Close Estate DTO
 *
 * Finalizes the estate after all assets are distributed and taxes paid.
 *
 * BUSINESS RULES:
 * 1. This is a destructive state change (cannot easily reopen).
 * 2. Only the Executor or Court Officer can perform this.
 */
export class CloseEstateDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsString()
  @IsOptional()
  closureNotes?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  closedAt?: Date;

  @IsString()
  @IsNotEmpty()
  closedBy: string; // Must be Executor or Court Official
}
