import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { MoneyDto } from '../common/money.dto';

/**
 * Record Tax Assessment DTO
 *
 * Captures the official tax liability assessed by KRA.
 *
 * BUSINESS RULES:
 * 1. Must breakdown liabilities by Tax Head (Income, CGT, Stamp Duty).
 * 2. Requires an Assessment Reference (e.g., KRA Assessment No).
 * 3. This sets the target for the "Gatekeeper" - must be paid to clear.
 */
export class RecordTaxAssessmentDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsString()
  @IsNotEmpty()
  assessmentReference: string; // e.g., KRA/2024/123456

  @Type(() => Date)
  @IsNotEmpty()
  assessmentDate: Date;

  // --- Liability Breakdown (Optional fields, as not all apply) ---

  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyDto)
  incomeTax?: MoneyDto; // Final Income Tax for deceased

  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyDto)
  capitalGainsTax?: MoneyDto; // On asset sales

  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyDto)
  stampDuty?: MoneyDto; // On transfers

  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyDto)
  otherLevies?: MoneyDto; // Penalties or interest

  @IsString()
  @IsNotEmpty()
  assessedBy: string; // The officer or system user recording this
}
