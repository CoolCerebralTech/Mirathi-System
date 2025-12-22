// application/guardianship/commands/impl/create-guardianship.command.ts
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
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

import { BaseCommand } from '../base.command';

export class CreateGuardianshipCommand extends BaseCommand {
  @ApiProperty({
    description: 'Command name',
    example: 'CreateGuardianshipCommand',
  })
  getCommandName(): string {
    return 'CreateGuardianshipCommand';
  }

  @ApiProperty({
    description: 'ID of the ward (FamilyMember ID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly wardId: string;

  @ApiProperty({
    description: 'ID of the guardian (FamilyMember ID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianId: string;

  @ApiProperty({
    description: 'Type of guardianship as per Kenyan Law of Succession Act',
    enum: GuardianType,
    example: GuardianType.COURT_APPOINTED,
  })
  @IsNotEmpty()
  @IsEnum(GuardianType)
  readonly type: GuardianType;

  @ApiProperty({
    description: 'Appointment date (when guardianship becomes effective)',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly appointmentDate: Date;

  // --- Kenyan Legal Requirements ---

  @ApiPropertyOptional({
    description: 'Court order number (required for court-appointed guardians)',
    example: 'HC/SUCC/123/2024',
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.type === GuardianType.COURT_APPOINTED)
  readonly courtOrderNumber?: string;

  @ApiPropertyOptional({
    description: 'Court station where order was issued',
    example: 'Milimani Law Courts',
  })
  @IsOptional()
  @IsString()
  readonly courtStation?: string;

  @ApiPropertyOptional({
    description: 'Guardianship expiration date (if temporary)',
    example: '2026-01-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly validUntil?: Date;

  @ApiPropertyOptional({
    description: 'Guardian national ID number (for external guardians)',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  readonly guardianIdNumber?: string;

  @ApiPropertyOptional({
    description: 'Court case number for guardianship proceedings',
    example: 'CASE NO. 123 OF 2024',
  })
  @IsOptional()
  @IsString()
  readonly courtCaseNumber?: string;

  @ApiPropertyOptional({
    description: 'Interim order ID (for temporary guardianship)',
    example: 'INTERIM/ORD/123/2024',
  })
  @IsOptional()
  @IsString()
  readonly interimOrderId?: string;

  // --- Powers & Restrictions ---

  @ApiPropertyOptional({
    description: 'Whether guardian has property management powers (S.72 LSA)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  readonly hasPropertyManagementPowers?: boolean = false;

  @ApiPropertyOptional({
    description: 'Whether guardian can consent to medical treatment',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly canConsentToMedical?: boolean = true;

  @ApiPropertyOptional({
    description: 'Whether guardian can consent to marriage (for wards over 18)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  readonly canConsentToMarriage?: boolean = false;

  @ApiPropertyOptional({
    description: 'Restrictions on guardian powers (JSON format)',
    example: { cannotSellProperty: true, travelRestricted: true },
  })
  @IsOptional()
  readonly restrictions?: any;

  @ApiPropertyOptional({
    description: 'Special instructions from court/testator',
    example: 'Guardian must consult with family council quarterly',
  })
  @IsOptional()
  @IsString()
  readonly specialInstructions?: string;

  // --- S.72 Bond Requirements ---

  @ApiPropertyOptional({
    description: 'Whether bond is required (S.72 LSA)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  readonly bondRequired?: boolean = false;

  @ApiPropertyOptional({
    description: 'Bond amount in KES (required if bondRequired is true)',
    example: 1000000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.bondRequired === true)
  readonly bondAmountKES?: number;

  // --- Allowances ---

  @ApiPropertyOptional({
    description: 'Annual allowance in KES for guardian expenses',
    example: 240000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly annualAllowanceKES?: number;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      wardId: string;
      guardianId: string;
      type: GuardianType;
      appointmentDate: Date;
      courtOrderNumber?: string;
      courtStation?: string;
      validUntil?: Date;
      guardianIdNumber?: string;
      courtCaseNumber?: string;
      interimOrderId?: string;
      hasPropertyManagementPowers?: boolean;
      canConsentToMedical?: boolean;
      canConsentToMarriage?: boolean;
      restrictions?: any;
      specialInstructions?: string;
      bondRequired?: boolean;
      bondAmountKES?: number;
      annualAllowanceKES?: number;
    },
  ) {
    super(commandId, timestamp, userId, correlationId);

    this.wardId = data.wardId;
    this.guardianId = data.guardianId;
    this.type = data.type;
    this.appointmentDate = data.appointmentDate;
    this.courtOrderNumber = data.courtOrderNumber;
    this.courtStation = data.courtStation;
    this.validUntil = data.validUntil;
    this.guardianIdNumber = data.guardianIdNumber;
    this.courtCaseNumber = data.courtCaseNumber;
    this.interimOrderId = data.interimOrderId;
    this.hasPropertyManagementPowers = data.hasPropertyManagementPowers;
    this.canConsentToMedical = data.canConsentToMedical;
    this.canConsentToMarriage = data.canConsentToMarriage;
    this.restrictions = data.restrictions;
    this.specialInstructions = data.specialInstructions;
    this.bondRequired = data.bondRequired;
    this.bondAmountKES = data.bondAmountKES;
    this.annualAllowanceKES = data.annualAllowanceKES;
  }
}
