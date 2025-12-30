import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { GiftStatus } from '../../../../../domain/entities/gift-inter-vivos.entity';
import { AssetType } from '../../../../../domain/enums/asset-type.enum';

class MoneyRequestDto {
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
}

export class RecordGiftRequestDto {
  @ApiProperty({ description: 'Family Member ID of Recipient' })
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: AssetType })
  @IsEnum(AssetType)
  assetType: AssetType;

  @ApiProperty({ type: MoneyRequestDto, description: 'Value at time of gift (for S.35 Hotchpot)' })
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  valueAtTimeOfGift: MoneyRequestDto;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  dateGiven: Date;

  @ApiProperty()
  @IsBoolean()
  isFormalGift: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deedReference?: string;
}

export class ContestGiftRequestDto {
  @ApiProperty({ example: 'Recipient claims it was a loan' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ResolveGiftDisputeRequestDto {
  @ApiProperty({ enum: GiftStatus })
  @IsEnum(GiftStatus)
  outcome: GiftStatus;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resolutionDetails: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  courtOrderReference?: string;
}
