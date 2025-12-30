import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

// Helper DTO for Contact Info
export class ApplicantContactRequestDto {
  @ApiPropertyOptional({ example: '+254712345678' })
  @IsString()
  @IsOptional()
  @IsPhoneNumber('KE')
  phone?: string;

  @ApiPropertyOptional({ example: 'applicant@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'P.O. Box 12345, Nairobi' })
  @IsString()
  @IsNotEmpty()
  physicalAddress: string;
}

// 1. Create Application
export class CreateApplicationRequestDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID of the Estate' })
  @IsUUID()
  estateId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Linked Readiness Assessment',
  })
  @IsUUID()
  readinessAssessmentId: string;

  @ApiProperty({
    description: 'Succession Context Object (Regime, Marriage Type, etc.)',
    example: { regime: 'INTESTATE', marriageType: 'MONOGAMOUS', religion: 'CHRISTIAN' },
  })
  @IsNotEmpty()
  // In a real implementation, you would use a strict nested DTO here mirroring the VO
  successionContext: any;

  @ApiProperty({
    enum: ProbateApplicationType,
    example: ProbateApplicationType.LETTERS_OF_ADMINISTRATION,
  })
  @IsEnum(ProbateApplicationType)
  applicationType: ProbateApplicationType;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  applicantFullName: string;

  @ApiProperty({ example: 'Son' })
  @IsString()
  @IsNotEmpty()
  applicantRelationship: string;

  @ApiProperty({ type: ApplicantContactRequestDto })
  @ValidateNested()
  @Type(() => ApplicantContactRequestDto)
  applicantContact: ApplicantContactRequestDto;

  @ApiProperty({ example: 'HIGH_COURT' })
  @IsString()
  @IsNotEmpty()
  targetCourtJurisdiction: string;

  @ApiProperty({ example: 'High Court of Kenya at Nairobi' })
  @IsString()
  @IsNotEmpty()
  targetCourtName: string;

  @ApiProperty({ example: 'Milimani' })
  @IsString()
  @IsNotEmpty()
  courtStation: string;

  @ApiPropertyOptional({ enum: FilingPriority, default: FilingPriority.NORMAL })
  @IsEnum(FilingPriority)
  @IsOptional()
  priority?: FilingPriority;
}

// 2. Auto-Generate (Simplified)
export class AutoGenerateRequestDto {
  @ApiProperty({ description: 'The Readiness Assessment ID to build from' })
  @IsUUID()
  readinessAssessmentId: string;

  @ApiProperty({ description: 'The Estate ID' })
  @IsUUID()
  estateId: string;
}

// 3. Withdraw
export class WithdrawApplicationRequestDto {
  @ApiProperty({ example: 'Family decided to settle out of court (not recommended)' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
