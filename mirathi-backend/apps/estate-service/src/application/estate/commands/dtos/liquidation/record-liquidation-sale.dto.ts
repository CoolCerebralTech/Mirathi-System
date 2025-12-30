import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { MoneyDto } from '../common/money.dto';

/**
 * Record Liquidation Sale DTO
 *
 * Captures the actual result of the sale.
 *
 * BUSINESS RULES:
 * 1. Actual Amount is validated against Target Amount in the Handler (70% rule).
 * 2. Buyer details are required for AML (Anti-Money Laundering) compliance.
 */
export class RecordLiquidationSaleDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  liquidationId: string;

  @ValidateNested()
  @Type(() => MoneyDto)
  actualAmount: MoneyDto; // The final sale price

  @Type(() => Date)
  @IsDate()
  saleDate: Date;

  // --- Buyer KYC (Know Your Customer) ---

  @IsString()
  @IsOptional()
  buyerName?: string;

  @IsString()
  @IsOptional()
  buyerIdNumber?: string; // ID / Passport / KRA PIN

  @IsString()
  @IsNotEmpty()
  recordedBy: string;
}
