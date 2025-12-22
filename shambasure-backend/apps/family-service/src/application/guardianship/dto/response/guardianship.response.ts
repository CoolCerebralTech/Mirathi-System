// application/guardianship/dto/response/guardianship.response.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GuardianType } from '@prisma/client';
import { Expose, Transform } from 'class-transformer';

export class GuardianshipResponse {
  @ApiProperty({
    description: 'Guardianship unique ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Ward ID (FamilyMember ID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Expose()
  wardId: string;

  @ApiProperty({
    description: 'Guardian ID (FamilyMember ID)',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Expose()
  guardianId: string;

  @ApiProperty({
    description: 'Type of guardianship',
    enum: GuardianType,
    example: GuardianType.COURT_APPOINTED,
  })
  @Expose()
  type: GuardianType;

  @ApiProperty({
    description: 'Court order number (if applicable)',
    example: 'HC/SUCC/123/2024',
    required: false,
  })
  @Expose()
  courtOrderNumber?: string;

  @ApiProperty({
    description: 'Appointment date',
    example: '2024-01-15T00:00:00.000Z',
  })
  @Expose()
  appointmentDate: Date;

  @ApiPropertyOptional({
    description: 'Valid until date (for temporary guardianship)',
    example: '2026-01-15T00:00:00.000Z',
  })
  @Expose()
  validUntil?: Date;

  @ApiProperty({
    description: 'Whether guardian has property management powers',
    example: false,
  })
  @Expose()
  hasPropertyManagementPowers: boolean;

  @ApiProperty({
    description: 'Whether guardian can consent to medical treatment',
    example: true,
  })
  @Expose()
  canConsentToMedical: boolean;

  @ApiProperty({
    description: 'Whether guardian can consent to marriage',
    example: false,
  })
  @Expose()
  canConsentToMarriage: boolean;

  @ApiPropertyOptional({
    description: 'Restrictions on guardian powers',
    example: { cannotSellProperty: true },
  })
  @Expose()
  restrictions?: any;

  @ApiPropertyOptional({
    description: 'Special instructions',
    example: 'Must consult with family council quarterly',
  })
  @Expose()
  specialInstructions?: string;

  @ApiProperty({
    description: 'Whether bond is required (S.72 LSA)',
    example: true,
  })
  @Expose()
  bondRequired: boolean;

  @ApiPropertyOptional({
    description: 'Bond amount in KES',
    example: 1000000,
  })
  @Expose()
  bondAmountKES?: number;

  @ApiPropertyOptional({
    description: 'Bond provider',
    example: 'Kenya Reinsurance Corporation',
  })
  @Expose()
  bondProvider?: string;

  @ApiPropertyOptional({
    description: 'Bond policy number',
    example: 'BOND-KRC-2024-001',
  })
  @Expose()
  bondPolicyNumber?: string;

  @ApiPropertyOptional({
    description: 'Bond expiry date',
    example: '2025-01-15T00:00:00.000Z',
  })
  @Expose()
  bondExpiry?: Date;

  @ApiProperty({
    description: 'Annual allowance in KES',
    example: 240000,
    required: false,
  })
  @Expose()
  annualAllowanceKES?: number;

  @ApiProperty({
    description: 'Last annual report submission date',
    example: '2024-12-31T00:00:00.000Z',
    required: false,
  })
  @Expose()
  lastReportDate?: Date;

  @ApiProperty({
    description: 'Next annual report due date (S.73 LSA)',
    example: '2025-12-31T00:00:00.000Z',
    required: false,
  })
  @Expose()
  nextReportDue?: Date;

  @ApiProperty({
    description: 'Report status',
    enum: ['PENDING', 'SUBMITTED', 'APPROVED', 'OVERDUE'],
    example: 'PENDING',
  })
  @Expose()
  reportStatus: string;

  @ApiProperty({
    description: 'Whether guardianship is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Termination date',
    example: '2024-12-31T00:00:00.000Z',
  })
  @Expose()
  terminationDate?: Date;

  @ApiPropertyOptional({
    description: 'Termination reason',
    example: 'WARD_CAME_OF_AGE',
  })
  @Expose()
  terminationReason?: string;

  // --- Computed Properties ---

  @ApiProperty({
    description: 'Whether bond has been posted',
    example: true,
  })
  @Expose()
  isBondPosted: boolean;

  @ApiProperty({
    description: 'Whether bond is expired',
    example: false,
  })
  @Expose()
  isBondExpired: boolean;

  @ApiProperty({
    description: 'Whether annual report is overdue',
    example: false,
  })
  @Expose()
  isReportOverdue: boolean;

  @ApiProperty({
    description: 'Whether term has expired',
    example: false,
  })
  @Expose()
  isTermExpired: boolean;

  @ApiProperty({
    description: 'S.73 compliance status',
    enum: ['COMPLIANT', 'NON_COMPLIANT', 'NOT_REQUIRED'],
    example: 'NOT_REQUIRED',
  })
  @Expose()
  s73ComplianceStatus: string;

  @ApiProperty({
    description: 'S.72 compliance status',
    enum: ['COMPLIANT', 'NON_COMPLIANT', 'NOT_REQUIRED'],
    example: 'COMPLIANT',
  })
  @Expose()
  s72ComplianceStatus: string;

  @ApiProperty({
    description: 'Overall compliance with Kenyan law',
    example: true,
  })
  @Expose()
  isCompliantWithKenyanLaw: boolean;

  @ApiProperty({
    description: 'Version for optimistic concurrency control',
    example: 1,
  })
  @Expose()
  version: number;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  // --- Denormalized Data for UI ---

  @ApiPropertyOptional({
    description: 'Ward full name (denormalized)',
    example: 'John Doe',
  })
  @Expose()
  wardName?: string;

  @ApiPropertyOptional({
    description: 'Guardian full name (denormalized)',
    example: 'Jane Smith',
  })
  @Expose()
  guardianName?: string;

  @ApiPropertyOptional({
    description: 'Ward age',
    example: 15,
  })
  @Expose()
  wardAge?: number;

  @ApiPropertyOptional({
    description: 'Ward date of birth',
    example: '2009-05-20T00:00:00.000Z',
  })
  @Expose()
  wardDateOfBirth?: Date;

  @ApiPropertyOptional({
    description: 'Days until next report due',
    example: 45,
  })
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.nextReportDue) return null;
    const diff = new Date(obj.nextReportDue).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  })
  daysUntilNextReport?: number;

  @ApiPropertyOptional({
    description: 'Days until bond expiry',
    example: 120,
  })
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.bondExpiry) return null;
    const diff = new Date(obj.bondExpiry).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  })
  daysUntilBondExpiry?: number;
  @ApiPropertyOptional({
    description: 'Court station where order was issued',
    example: 'Milimani Law Courts',
  })
  @Expose()
  courtStation?: string;

  constructor(partial: Partial<GuardianshipResponse>) {
    Object.assign(this, partial);
  }
}
