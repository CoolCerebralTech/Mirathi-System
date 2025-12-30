import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { MoneyDto } from '../common/money.dto';

export class ResolveDebtDisputeDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  debtId: string;

  @IsString()
  @IsNotEmpty()
  resolution: string; // e.g. "Creditor agreed to reduce amount"

  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyDto)
  negotiatedAmount?: MoneyDto; // If the amount changed

  @IsString()
  @IsNotEmpty()
  resolvedBy: string;
}
