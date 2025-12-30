import { IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

/**
 * Dispute Debt DTO
 *
 * Marks a debt as DISPUTED, removing it from the S.45 Waterfall
 * until resolved.
 */
export class DisputeDebtDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  debtId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string; // e.g. "Services were never rendered"

  @IsString()
  @IsOptional()
  evidenceDocumentId?: string;

  @IsString()
  @IsNotEmpty()
  disputedBy: string;
}
