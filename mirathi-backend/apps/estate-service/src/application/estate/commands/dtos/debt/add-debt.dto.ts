import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { DebtType } from '../../../../../domain/enums/debt-type.enum';
import { MoneyDto } from '../common/money.dto';

/**
 * Add Debt DTO
 *
 * Registers a claim against the estate.
 *
 * BUSINESS RULES:
 * 1. Debt Type determines S.45 Priority (Critical).
 * 2. If Debt Type is SECURED (e.g. Mortgage), 'securedAssetId' is MANDATORY.
 * 3. Court Approval flag allows flagging contentious debts early.
 */
export class AddDebtDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsString()
  @IsNotEmpty()
  creditorName: string;

  @IsString()
  @IsNotEmpty()
  description: string; // e.g., "Funeral Home Services"

  @ValidateNested()
  @Type(() => MoneyDto)
  initialAmount: MoneyDto;

  @IsEnum(DebtType)
  type: DebtType; // FUNERAL, MORTGAGE, UNSECURED_LOAN, etc.

  // --- Secured Debt Logic ---

  @ValidateIf((o) => o.type === DebtType.MORTGAGE || o.type === DebtType.BUSINESS_LOAN)
  @IsUUID()
  @IsNotEmpty({ message: 'Secured debts must be linked to an Asset' })
  securedAssetId?: string;

  // --- Metadata ---

  @IsString()
  @IsOptional()
  referenceNumber?: string; // Invoice No, Loan Account No

  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @IsString()
  @IsNotEmpty()
  addedBy: string;
}
