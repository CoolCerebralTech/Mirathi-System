import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { MoneyDto } from '../common/money.dto';

export class EncumberAssetDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  assetId: string;

  @IsString()
  @IsNotEmpty()
  encumbranceType: string; // e.g., "MORTGAGE", "LIEN", "COURT_ORDER"

  @IsString()
  @IsNotEmpty()
  details: string; // e.g., "Charge to KCB Bank for Loan #123"

  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyDto)
  encumbranceAmount?: MoneyDto; // How much of the value is locked?

  @IsString()
  @IsNotEmpty()
  markedBy: string;
}
