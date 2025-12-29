import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import {
  FilingPriority,
  ProbateApplicationType,
} from '../../../../domain/aggregates/probate-application.aggregate';
import { SuccessionContext } from '../../../../domain/value-objects/succession-context.vo';

// ==============================================================================
// 1. Create Application (Manual Start)
// ==============================================================================
export class ApplicantContactDto {
  @IsString()
  @IsOptional()
  @IsPhoneNumber('KE')
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  physicalAddress: string;
}

export class CreateApplicationDto {
  @IsUUID()
  estateId: string;

  @IsUUID()
  readinessAssessmentId: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SuccessionContext) // Assuming SuccessionContext can be validated or passed as raw object
  successionContext: any; // In real app, use a dedicated Context DTO

  @IsEnum(ProbateApplicationType)
  applicationType: ProbateApplicationType;

  @IsUUID()
  applicantUserId: string;

  @IsString()
  @IsNotEmpty()
  applicantFullName: string;

  @IsString()
  @IsNotEmpty()
  applicantRelationship: string;

  @ValidateNested()
  @Type(() => ApplicantContactDto)
  applicantContact: ApplicantContactDto;

  @IsString()
  @IsNotEmpty()
  targetCourtJurisdiction: string; // e.g., 'HIGH_COURT'

  @IsString()
  @IsNotEmpty()
  targetCourtName: string;

  @IsString()
  @IsNotEmpty()
  courtStation: string;

  @IsEnum(FilingPriority)
  @IsOptional()
  priority?: FilingPriority;
}

// ==============================================================================
// 2. Auto-Generate (Triggered by Readiness Service)
// ==============================================================================
export class AutoGenerateFromReadinessDto {
  @IsUUID()
  estateId: string;

  @IsUUID()
  readinessAssessmentId: string;

  @IsUUID()
  applicantUserId: string;

  // We fetch the latest score and context from the Readiness service,
  // so we don't pass them here to ensure truth.
}

// ==============================================================================
// 3. Withdraw Application
// ==============================================================================
export class WithdrawApplicationDto {
  @IsUUID()
  applicationId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsUUID()
  withdrawnByUserId: string;
}
