import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

class MoneyRequestDto {
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
}

export class ExecuteWaterfallRequestDto {
  @ApiProperty({
    type: MoneyRequestDto,
    description: 'Lump sum cash available to pay debts according to S.45 priority',
  })
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  availableCash: MoneyRequestDto;
}
