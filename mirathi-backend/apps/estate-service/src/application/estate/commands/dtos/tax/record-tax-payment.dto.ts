import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';

import { MoneyDto } from '../common/money.dto';

/**
 * Record Tax Payment DTO
 *
 * Records a payment made to KRA via iTax/Banks.
 *
 * BUSINESS RULES:
 * 1. Requires Payment Registration Number (PRN).
 * 2. Validates against the total assessed liability in the Handler.
 */
export class RecordTaxPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @ValidateNested()
  @Type(() => MoneyDto)
  amount: MoneyDto;

  @IsString()
  @IsNotEmpty()
  paymentType: string; // e.g., "CGT_PAYMENT", "INCOME_TAX_FINAL"

  @IsString()
  @IsNotEmpty()
  paymentReference: string; // The KRA PRN (Payment Registration Number)

  @Type(() => Date)
  @IsDate()
  paymentDate: Date;

  @IsString()
  @IsNotEmpty()
  paidBy: string;
}
