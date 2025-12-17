// application/guardianship/dto/response/guardianship.response.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GuardianType } from '@prisma/client';
import { Expose, Type } from 'class-transformer';

export class GuardianshipResponse {
  @ApiProperty({
    description: 'Guardianship ID',
    example: 'grd-1234567890',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'ID of the ward',
    example: 'ward-123',
  })
  @Expose()
  wardId: string;

  @ApiProperty({
    description: 'ID of the guardian',
    example: 'guardian-456',
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

  // Legal details
  @ApiPropertyOptional({
    description: 'Court order number',
    example: 'HC/SUCC/123/2024',
  })
  @Expose()
  courtOrderNumber?: string;

  @ApiPropertyOptional({
    description: 'Court station',
    example: 'High Court - Nairobi',
  })
  @Expose()
  courtStation?: string;

  @ApiProperty({
    description: 'Appointment date',
    example: '2024-01-15T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  appointmentDate: Date;

  @ApiPropertyOptional({
    description: 'Valid until date',
    example: '2026-01-15T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  validUntil?: Date;

  @ApiPropertyOptional({
    description: 'Guardian ID number',
    example: '12345678',
  })
  @Expose()
  guardianIdNumber?: string;

  @ApiPropertyOptional({
    description: 'Court case number',
    example: 'SCC 1234 of 2023',
  })
  @Expose()
  courtCaseNumber?: string;

  @ApiPropertyOptional({
    description: 'Interim order ID',
    example: 'INT/ORD/456/2023',
  })
  @Expose()
  interimOrderId?: string;

  // Powers
  @ApiProperty({
    description: 'Has property management powers',
    example: false,
  })
  @Expose()
  hasPropertyManagementPowers: boolean;

  @ApiProperty({
    description: 'Can consent to medical treatment',
    example: true,
  })
  @Expose()
  canConsentToMedical: boolean;

  @ApiProperty({
    description: 'Can consent to marriage',
    example: false,
  })
  @Expose()
  canConsentToMarriage: boolean;

  @ApiPropertyOptional({
    description: 'Restrictions (JSON)',
    example: { cannotSellProperty: true },
  })
  @Expose()
  restrictions?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Special instructions',
    example: 'Quarterly reporting required',
  })
  @Expose()
  specialInstructions?: string;

  // Bond (S.72 LSA)
  @ApiProperty({
    description: 'Bond required',
    example: true,
  })
  @Expose()
  bondRequired: boolean;

  @ApiPropertyOptional({
    description: 'Bond amount in KES',
    example: 500000,
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
    example: 'BOND/2024/001',
  })
  @Expose()
  bondPolicyNumber?: string;

  @ApiPropertyOptional({
    description: 'Bond expiry date',
    example: '2025-01-15T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  bondExpiry?: Date;

  // Annual Reporting (S.73 LSA)
  @ApiPropertyOptional({
    description: 'Last report date',
    example: '2024-01-15T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  lastReportDate?: Date;

  @ApiPropertyOptional({
    description: 'Next report due date',
    example: '2025-01-15T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  nextReportDue?: Date;

  @ApiProperty({
    description: 'Report status',
    example: 'PENDING',
  })
  @Expose()
  reportStatus: string;

  // Allowances
  @ApiPropertyOptional({
    description: 'Annual allowance in KES',
    example: 120000,
  })
  @Expose()
  annualAllowanceKES?: number;

  @ApiPropertyOptional({
    description: 'Allowance approved by',
    example: 'court-clerk-123',
  })
  @Expose()
  allowanceApprovedBy?: string;

  // Status
  @ApiProperty({
    description: 'Is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Termination date',
    example: '2024-01-15T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  terminationDate?: Date;

  @ApiPropertyOptional({
    description: 'Termination reason',
    example: 'Ward reached majority age',
  })
  @Expose()
  terminationReason?: string;

  // Computed properties
  @ApiProperty({
    description: 'Is bond posted',
    example: true,
  })
  @Expose()
  isBondPosted: boolean;

  @ApiProperty({
    description: 'Is bond expired',
    example: false,
  })
  @Expose()
  isBondExpired: boolean;

  @ApiProperty({
    description: 'Is report overdue',
    example: false,
  })
  @Expose()
  isReportOverdue: boolean;

  @ApiProperty({
    description: 'Is term expired',
    example: false,
  })
  @Expose()
  isTermExpired: boolean;

  @ApiProperty({
    description: 'Requires annual report',
    example: true,
  })
  @Expose()
  requiresAnnualReport: boolean;

  // Kenyan Law Compliance
  @ApiProperty({
    description: 'S.73 compliance status',
    enum: ['COMPLIANT', 'NON_COMPLIANT', 'NOT_REQUIRED'],
    example: 'COMPLIANT',
  })
  @Expose()
  s73ComplianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_REQUIRED';

  @ApiProperty({
    description: 'Is compliant with Kenyan law',
    example: true,
  })
  @Expose()
  isCompliantWithKenyanLaw: boolean;

  // Audit
  @ApiProperty({
    description: 'Version for optimistic concurrency',
    example: 1,
  })
  @Expose()
  version: number;

  @ApiProperty({
    description: 'Created at',
    example: '2024-01-15T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at',
    example: '2024-01-15T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}
