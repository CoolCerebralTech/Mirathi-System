import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

import { ValuationSource } from '../../../../../domain/enums/valuation-source.enum';

class MoneyRequestDto {
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
}

export class UpdateAssetValuationRequestDto {
  @ApiProperty({ type: MoneyRequestDto })
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  newValue: MoneyRequestDto;

  @ApiProperty({ enum: ValuationSource, example: 'REGISTERED_VALUER' })
  @IsEnum(ValuationSource)
  source: ValuationSource;

  @ApiProperty({ example: 'Annual statutory valuation' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
