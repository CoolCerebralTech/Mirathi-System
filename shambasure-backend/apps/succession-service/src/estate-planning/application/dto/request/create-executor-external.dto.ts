import { ExecutorAppointmentType } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateExecutorExternalDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  @IsString()
  @IsOptional()
  idNumber?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A]{1}\d{9}[A-Z]{1}$/, { message: 'Invalid KRA PIN format' })
  kraPin?: string;

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
