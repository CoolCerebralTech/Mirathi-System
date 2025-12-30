import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { MoneyDto } from '../common/money.dto';

/**
 * Write Off Debt DTO
 *
 * Removes the liability from the balance sheet.
 * Used for:
 * 1. Debt forgiveness by creditor.
 * 2. Unenforceable debts (Statute Barred confirmed).
 */
export class WriteOffDebtDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  debtId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyDto)
  amountToWriteOff?: MoneyDto; // Defaults to full outstanding balance if omitted

  @IsString()
  @IsNotEmpty()
  authorizedBy: string;
}
