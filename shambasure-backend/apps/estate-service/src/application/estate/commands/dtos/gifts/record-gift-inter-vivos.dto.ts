import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { AssetType } from '../../../../../domain/enums/asset-type.enum';
import { MoneyDto } from '../common/money.dto';

/**
 * Record Gift Inter Vivos DTO
 *
 * Tracks significant gifts given during the deceased's lifetime.
 *
 * BUSINESS RULES:
 * 1. Used to calculate the "Hotchpot" (Distribution Pool Adjustment).
 * 2. Value is fixed at the "Time of Gift" (not current value).
 */
export class RecordGiftInterVivosDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsString()
  @IsNotEmpty()
  recipientId: string; // Family Member ID

  @IsString()
  @IsNotEmpty()
  description: string; // e.g., "Funds for Master's Degree"

  @IsEnum(AssetType)
  assetType: AssetType;

  @ValidateNested()
  @Type(() => MoneyDto)
  valueAtTimeOfGift: MoneyDto;

  @Type(() => Date)
  @IsDate()
  dateGiven: Date;

  @IsBoolean()
  isFormalGift: boolean; // Was there a Deed of Gift?

  @IsString()
  @IsOptional()
  deedReference?: string;

  @IsString()
  @IsNotEmpty()
  recordedBy: string;
}
