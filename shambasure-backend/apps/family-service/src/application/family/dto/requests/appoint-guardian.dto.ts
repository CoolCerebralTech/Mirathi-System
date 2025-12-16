import { GuardianType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class AppointGuardianDto {
  @IsNotEmpty()
  @IsUUID()
  wardId: string;

  @IsNotEmpty()
  @IsUUID()
  guardianId: string;

  @IsNotEmpty()
  @IsEnum(GuardianType)
  type: GuardianType;

  @IsNotEmpty()
  @IsDateString()
  appointmentDate: string;

  // Legal / Court
  @IsOptional()
  @IsString()
  courtOrderNumber?: string;

  @IsOptional()
  @IsString()
  courtStation?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  // Powers
  @IsOptional()
  @IsBoolean()
  hasPropertyManagementPowers?: boolean;

  @IsOptional()
  @IsBoolean()
  canConsentToMedical?: boolean;

  // Bond (S. 72 LSA)
  @IsOptional()
  @IsBoolean()
  bondRequired?: boolean;

  @IsOptional()
  @IsNumber()
  bondAmountKES?: number;
}
