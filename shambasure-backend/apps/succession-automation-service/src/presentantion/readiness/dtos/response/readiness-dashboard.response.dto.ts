import { ApiProperty } from '@nestjs/swagger';

import { RiskDetailResponseDto } from './risk-detail.response.dto';

class CaseContextDto {
  @ApiProperty({ example: 'High Court of Kenya' })
  courtJurisdiction: string;

  @ApiProperty({ example: 'Grant of Probate (P&A 1)' })
  applicationType: string;

  @ApiProperty({ example: '3-6 months' })
  estimatedTimeline: string;

  @ApiProperty({ example: false })
  isComplex: boolean;
}

export class ReadinessDashboardResponseDto {
  @ApiProperty({ example: 'uuid-assessment-id' })
  assessmentId: string;

  @ApiProperty({ example: 'uuid-estate-id' })
  estateId: string;

  @ApiProperty({ example: '2025-01-01T12:00:00Z' })
  lastUpdated: Date;

  // --- The Traffic Light ---

  @ApiProperty({ description: 'Readiness Score (0-100)', example: 85 })
  score: number;

  @ApiProperty({ example: 'Ready to File' })
  statusLabel: string;

  @ApiProperty({ enum: ['green', 'yellow', 'orange', 'red'], example: 'green' })
  statusColor: string;

  @ApiProperty({ example: 'HIGH' })
  confidenceLevel: string;

  // --- The "Digital Lawyer" Advice ---

  @ApiProperty({ example: '✅ COURT READY: Your case is well-prepared.' })
  summaryMessage: string;

  @ApiProperty({ example: 'Review active risks' })
  nextBestAction: string;

  // --- Stats ---

  @ApiProperty({ example: 3 })
  totalRisks: number;

  @ApiProperty({ example: 0 })
  criticalRisks: number;

  // --- Data ---

  @ApiProperty({ type: [RiskDetailResponseDto] })
  topRisks: RiskDetailResponseDto[];

  @ApiProperty({ type: CaseContextDto })
  caseContext: CaseContextDto;
}
