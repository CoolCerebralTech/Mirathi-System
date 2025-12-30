import { ApiProperty } from '@nestjs/swagger';

export class FeeItemResponseDto {
  @ApiProperty({ example: 'Court Filing Base Fee' })
  description: string;

  @ApiProperty({ example: 1000 })
  amount: number;

  @ApiProperty({ example: 'KES' })
  currency: string;

  @ApiProperty({ example: false })
  isOptional: boolean;
}

export class FilingFeeBreakdownResponseDto {
  @ApiProperty({ type: [FeeItemResponseDto] })
  items: FeeItemResponseDto[];

  @ApiProperty({ example: 2500 })
  subtotal: number;

  @ApiProperty({ example: 5000 })
  serviceFee: number;

  @ApiProperty({ example: 7500 })
  total: number;

  @ApiProperty({ example: false })
  isPaid: boolean;

  @ApiProperty({ required: false })
  paidAt?: Date;

  @ApiProperty({ required: false })
  receiptNumber?: string;
}

export class ComplianceViolationResponseDto {
  @ApiProperty({ example: 'Section 56 LSA' })
  section: string;

  @ApiProperty({ example: 'Universal Consent' })
  requirement: string;

  @ApiProperty({ example: 'Missing consent from beneficiary: John Doe' })
  description: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], example: 'HIGH' })
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class FilingReadinessResponseDto {
  @ApiProperty()
  applicationId: string;

  @ApiProperty({ example: false, description: 'True if compliant AND fees paid AND forms ready' })
  isReady: boolean;

  @ApiProperty({ type: FilingFeeBreakdownResponseDto })
  fees: FilingFeeBreakdownResponseDto;

  @ApiProperty({ enum: ['PASS', 'WARNING', 'FAIL'], example: 'WARNING' })
  complianceStatus: 'PASS' | 'WARNING' | 'FAIL';

  @ApiProperty({ type: [ComplianceViolationResponseDto] })
  violations: ComplianceViolationResponseDto[];

  @ApiProperty({ type: [String], example: ['Forms may not be accepted in Kadhis Court'] })
  warnings: string[];

  @ApiProperty({ example: 'High Court of Kenya at Nairobi' })
  courtName: string;

  @ApiProperty({ example: 'Milimani Registry' })
  registryLocation: string;

  @ApiProperty()
  estimatedFilingDate: Date;

  @ApiProperty()
  estimatedGrantDate: Date;
}
