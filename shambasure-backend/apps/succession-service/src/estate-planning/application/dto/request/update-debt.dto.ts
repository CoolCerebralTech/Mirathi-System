import { PartialType } from '@nestjs/mapped-types';
import { DebtPriority } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { CreateDebtDto } from './create-debt.dto';

export class UpdateDebtDto extends PartialType(CreateDebtDto) {
  @IsEnum(DebtPriority)
  @IsOptional()
  priority?: DebtPriority;

  @IsString()
  @IsOptional()
  updateReason?: string;
}
