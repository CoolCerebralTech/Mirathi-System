import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';

import { ValuationSource } from '../../../../../domain/enums/valuation-source.enum';
import { MoneyDto } from '../common/money.dto';

export class UpdateAssetValueDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  assetId: string;

  @ValidateNested()
  @Type(() => MoneyDto)
  newValue: MoneyDto;

  @IsEnum(ValuationSource)
  source: ValuationSource; // REGISTERED_VALUER, MARKET_ESTIMATE, etc.

  @IsString()
  @IsNotEmpty()
  reason: string; // e.g. "Annual Tax Valuation"

  @IsString()
  @IsNotEmpty()
  updatedBy: string;
}
