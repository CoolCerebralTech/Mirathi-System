import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { MoneyDto } from '../common/money.dto';

/**
 * Receive Liquidation Proceeds DTO
 *
 * Confirms that cash has hit the Estate's Bank Account.
 * This triggers the update to `Estate.cashOnHand`.
 */
export class ReceiveLiquidationProceedsDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  liquidationId: string;

  @ValidateNested()
  @Type(() => MoneyDto)
  netProceeds: MoneyDto; // Amount after commissions/fees

  @Type(() => Date)
  @IsDate()
  receivedDate: Date;

  @IsString()
  @IsOptional()
  bankReference?: string; // e.g. "FT234567890"

  @IsString()
  @IsNotEmpty()
  receivedBy: string;
}
