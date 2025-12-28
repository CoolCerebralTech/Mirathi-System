import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { MoneyDto } from '../common/money.dto';

/**
 * Adjudicate Claim DTO (Approval)
 *
 * Marks the claim as VERIFIED.
 */
export class VerifyDependantClaimDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  dependantId: string;

  @IsString()
  @IsNotEmpty()
  verificationNotes: string;

  @IsString()
  @IsNotEmpty()
  verifiedBy: string;
}

/**
 * Reject Claim DTO
 *
 * Used if the relationship is unproven or needs are invalid.
 */
export class RejectDependantClaimDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  dependantId: string;

  @IsString()
  @IsNotEmpty()
  reason: string; // e.g., "Evidence insufficient for S.29(b) claim"

  @IsString()
  @IsNotEmpty()
  rejectedBy: string;
}

/**
 * Settle Claim DTO
 *
 * Assigns a specific allocation to satisfy the claim.
 */
export class SettleDependantClaimDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  dependantId: string;

  @ValidateNested()
  @Type(() => MoneyDto)
  allocation: MoneyDto; // The agreed amount/value

  @IsString()
  @IsOptional()
  settlementMethod?: string; // LUMP_SUM, MONTHLY_TRUST, ASSET_TRANSFER

  @IsString()
  @IsNotEmpty()
  settledBy: string;
}
