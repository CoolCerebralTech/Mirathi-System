import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { MoneyDto } from '../common/money.dto';

/**
 * Pay Debt DTO (Manual)
 *
 * Instructs the system to pay a SPECIFIC debt.
 *
 * VALIDATION NOTE:
 * The Command Handler will intercept this and THROW an error if
 * a higher-priority S.45 debt exists (The "Priority Police").
 */
export class PayDebtDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  debtId: string;

  @ValidateNested()
  @Type(() => MoneyDto)
  amount: MoneyDto;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // BANK_TRANSFER, CHEQUE, MPESA

  @IsString()
  @IsOptional()
  reference?: string; // Transaction ID

  @IsString()
  @IsNotEmpty()
  paidBy: string;
}
