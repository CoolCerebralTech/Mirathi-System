import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';

import { MoneyDto } from '../common/money.dto';

/**
 * Execute S.45 Waterfall DTO
 *
 * Instead of picking a debt, the Executor provides a lump sum of cash.
 * The system automatically allocates it to debts based on legal priority.
 *
 * USE CASE: "I have 500k from a car sale. Pay off whatever is most urgent."
 */
export class ExecuteS45WaterfallDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @ValidateNested()
  @Type(() => MoneyDto)
  availableCash: MoneyDto;

  @IsString()
  @IsNotEmpty()
  authorizedBy: string;
}
