import { ExecutorCompensationType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, Max, Min, ValidateIf } from 'class-validator';

export class SetExecutorCompensationDto {
  @IsEnum(ExecutorCompensationType)
  compensationType: ExecutorCompensationType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ValidateIf((o) => o.compensationType === ExecutorCompensationType.FIXED_AMOUNT)
  compensationAmount?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @ValidateIf((o) => o.compensationType === ExecutorCompensationType.PERCENTAGE_OF_ESTATE)
  compensationPercentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ValidateIf((o) => o.compensationType === ExecutorCompensationType.HOURLY_RATE)
  hourlyRate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ValidateIf((o) => o.compensationType === ExecutorCompensationType.HOURLY_RATE)
  estimatedHours?: number;
}
