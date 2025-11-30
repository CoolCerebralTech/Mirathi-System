import { ExecutorAppointmentType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateExecutorUserDto {
  @IsString()
  @IsNotEmpty()
  executorId: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = false;

  @IsNumber()
  @Min(1)
  @IsOptional()
  orderOfPriority?: number = 1;

  @IsEnum(ExecutorAppointmentType)
  @IsOptional()
  appointmentType?: ExecutorAppointmentType = ExecutorAppointmentType.TESTAMENTARY;
}
