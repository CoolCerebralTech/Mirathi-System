import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';

import { LiquidationType } from '../../../../../domain/enums/liquidation-type.enum';
import { MoneyDto } from '../common/money.dto';

/**
 * Initiate Liquidation DTO
 *
 * Starts the process of converting an asset to cash.
 *
 * BUSINESS RULES:
 * 1. Must define a Target Amount (Reserve Price) to prevent undervaluation.
 * 2. Must select a valid Liquidation Method (Auction vs Private Treaty).
 */
export class InitiateLiquidationDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  assetId: string;

  @IsEnum(LiquidationType)
  liquidationType: LiquidationType;

  @ValidateNested()
  @Type(() => MoneyDto)
  targetAmount: MoneyDto; // The "Reserve Price"

  @IsString()
  @IsNotEmpty()
  reason: string; // e.g., "To settle S.45(a) Funeral Debts"

  @IsString()
  @IsNotEmpty()
  initiatedBy: string;
}
