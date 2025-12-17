// application/guardianship/dto/request/appoint-guardian.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GuardianType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AppointGuardianRequest {
  @ApiProperty({
    description: 'ID of the ward (person needing guardianship)',
    example: 'ward-123',
  })
  @IsString()
  wardId: string;

  @ApiProperty({
    description: 'ID of the guardian (person appointed)',
    example: 'guardian-456',
  })
  @IsString()
  guardianId: string;

  @ApiProperty({
    description: 'Type of guardianship',
    enum: GuardianType,
    example: GuardianType.COURT_APPOINTED,
  })
  @IsEnum(GuardianType)
  type: GuardianType;

  @ApiProperty({
    description: 'Date of appointment',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  appointmentDate: Date;

  // Legal details
  @ApiPropertyOptional({
    description: 'Court order number (required for court-appointed)',
    example: 'HC/SUCC/123/2024',
  })
  @IsOptional()
  @IsString()
  courtOrderNumber?: string;

  @ApiPropertyOptional({
    description: 'Court station where order was issued',
    example: 'High Court - Nairobi',
  })
  @IsOptional()
  @IsString()
  courtStation?: string;

  @ApiPropertyOptional({
    description: 'Date when guardianship term expires',
    example: '2026-01-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  validUntil?: Date;

  @ApiPropertyOptional({
    description: 'Guardian ID number (National ID/Passport)',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  guardianIdNumber?: string;

  @ApiPropertyOptional({
    description: 'Court case number',
    example: 'SCC 1234 of 2023',
  })
  @IsOptional()
  @IsString()
  courtCaseNumber?: string;

  @ApiPropertyOptional({
    description: 'Interim order ID if applicable',
    example: 'INT/ORD/456/2023',
  })
  @IsOptional()
  @IsString()
  interimOrderId?: string;

  // Powers
  @ApiPropertyOptional({
    description: 'Whether guardian has property management powers',
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
    description: 'Whether guardian can consent to marriage (S.70 LSA)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  canConsentToMarriage?: boolean = false;

  @ApiPropertyOptional({
    description: 'Any restrictions on guardianship (JSON)',
    example: { cannotSellProperty: true, requiresCourtApproval: true },
  })
  @IsOptional()
  @IsObject()
  restrictions?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Special instructions from the court',
    example: 'Guardian must consult with social worker quarterly',
  })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  // Bond (S.72 LSA)
  @ApiPropertyOptional({
    description: 'Whether a bond is required (S.72 LSA)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  bondRequired?: boolean = false;

  @ApiPropertyOptional({
    description: 'Amount of bond in KES if required',
    example: 500000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bondAmountKES?: number;

  // Allowances
  @ApiPropertyOptional({
    description: 'Annual allowance for guardian in KES',
    example: 120000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annualAllowanceKES?: number;
}
