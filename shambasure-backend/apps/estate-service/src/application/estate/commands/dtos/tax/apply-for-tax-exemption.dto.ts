import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

/**
 * Apply For Tax Exemption DTO
 *
 * Used when the Estate does not require full tax processing.
 *
 * LEGAL CONTEXT:
 * - Small estates (<100k KES) may be exempt.
 * - Certain trust setups may be exempt.
 */
export class ApplyForTaxExemptionDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string; // e.g., "Estate value below taxable threshold"

  @IsString()
  @IsOptional()
  exemptionCertificateNo?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  exemptionDate?: Date;

  @IsString()
  @IsNotEmpty()
  appliedBy: string;
}
