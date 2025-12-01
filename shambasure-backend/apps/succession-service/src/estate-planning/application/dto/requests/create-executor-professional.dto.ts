import { ExecutorAppointmentType } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateExecutorProfessionalDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  professionalQualification: string;

  @IsString()
  @IsNotEmpty()
  practicingCertificateNumber: string;

  @IsString()
  @IsOptional()
  relationship?: string = 'Professional Advisor';

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
