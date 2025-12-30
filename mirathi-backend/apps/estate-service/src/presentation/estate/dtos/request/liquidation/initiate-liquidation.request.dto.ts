import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';

import { LiquidationType } from '../../../../../domain/enums/liquidation-type.enum';

class MoneyRequestDto {
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
}

export class InitiateLiquidationRequestDto {
  @ApiProperty({ description: 'Asset to sell' })
  @IsUUID()
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({ enum: LiquidationType, example: 'PUBLIC_AUCTION' })
  @IsEnum(LiquidationType)
  liquidationType: LiquidationType;

  @ApiProperty({ type: MoneyRequestDto, description: 'Reserve Price' })
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  targetAmount: MoneyRequestDto;

  @ApiProperty({ example: 'To raise cash for estate duty' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
