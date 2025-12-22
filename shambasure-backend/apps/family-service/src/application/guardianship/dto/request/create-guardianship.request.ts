// application/guardianship/dto/request/create-guardianship.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GuardianType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateGuardianshipRequest {
  @ApiProperty({
    description: 'ID of the ward (FamilyMember ID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  wardId: string;

  @ApiProperty({
    description: 'ID of the guardian (FamilyMember ID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsString()
  guardianId: string;

  @ApiProperty({
    description: 'Type of guardianship as per Kenyan Law of Succession Act',
    enum: GuardianType,
    example: GuardianType.COURT_APPOINTED,
  })
  @IsNotEmpty()
  @IsEnum(GuardianType)
  type: GuardianType;

  @ApiProperty({
    description: 'Appointment date (when guardianship becomes effective)',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  appointmentDate: Date;

  // --- Kenyan Legal Requirements ---

  @ApiPropertyOptional({
    description: 'Court order number (required for court-appointed guardians)',
    example: 'HC/SUCC/123/2024',
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.type === GuardianType.COURT_APPOINTED)
  courtOrderNumber?: string;

  @ApiPropertyOptional({
    description: 'Court station where order was issued',
    example: 'Milimani Law Courts',
  })
  @IsOptional()
  @IsString()
  courtStation?: string;

  @ApiPropertyOptional({
    description: 'Guardianship expiration date (if temporary)',
    example: '2026-01-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  validUntil?: Date;

  @ApiPropertyOptional({
    description: 'Guardian national ID number (for external guardians)',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  guardianIdNumber?: string;

  @ApiPropertyOptional({
    description: 'Court case number for guardianship proceedings',
    example: 'CASE NO. 123 OF 2024',
  })
  @IsOptional()
  @IsString()
  courtCaseNumber?: string;

  @ApiPropertyOptional({
    description: 'Interim order ID (for temporary guardianship)',
    example: 'INTERIM/ORD/123/2024',
  })
  @IsOptional()
  @IsString()
  interimOrderId?: string;

  // --- Powers & Restrictions ---

  @ApiPropertyOptional({
    description: 'Whether guardian has property management powers (S.72 LSA)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasPropertyManagementPowers?: boolean = false;

  @ApiPropertyOptional({
    description: 'Whether guardian can consent to medical treatment',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  canConsentToMedical?: boolean = true;

  @ApiPropertyOptional({
    description: 'Whether guardian can consent to marriage (for wards over 18)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  canConsentToMarriage?: boolean = false;

  @ApiPropertyOptional({
    description: 'Restrictions on guardian powers (JSON format)',
    example: { cannotSellProperty: true, travelRestricted: true },
  })
  @IsOptional()
  restrictions?: any;

  @ApiPropertyOptional({
    description: 'Special instructions from court/testator',
    example: 'Guardian must consult with family council quarterly',
  })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  // --- S.72 Bond Requirements ---

  @ApiPropertyOptional({
    description: 'Whether bond is required (S.72 LSA)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  bondRequired?: boolean = false;

  @ApiPropertyOptional({
    description: 'Bond amount in KES (required if bondRequired is true)',
    example: 1000000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.bondRequired === true)
  bondAmountKES?: number;

  // --- Allowances ---

  @ApiPropertyOptional({
    description: 'Annual allowance in KES for guardian expenses',
    example: 240000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annualAllowanceKES?: number;
}
