import { DebtPriority } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UpdateDebtPriorityDto {
  @IsEnum(DebtPriority)
  priority: DebtPriority;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
