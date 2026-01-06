import { ApiProperty } from '@nestjs/swagger';
import { ReadinessStatus, RiskCategory, RiskSeverity } from '@prisma/client';

// --- RESPONSES ---

export class RiskDto {
  @ApiProperty({ enum: RiskSeverity, description: 'How critical this issue is' })
  severity: RiskSeverity;

  @ApiProperty({ enum: RiskCategory, description: 'Type of risk' })
  category: RiskCategory;

  @ApiProperty({ example: 'Death Certificate Missing' })
  title: string;

  @ApiProperty({ example: 'Cannot proceed without official death certificate.' })
  description: string;

  @ApiProperty({ required: false, example: 'Section 45 Law of Succession Act' })
  legalBasis?: string;

  @ApiProperty({ description: 'If true, you cannot generate court forms yet' })
  isBlocking: boolean;

  @ApiProperty({ type: [String], description: 'How to fix this risk' })
  resolutionSteps: string[];
}

export class ReadinessScoreDto {
  @ApiProperty({ example: 65, description: '0-100 Score' })
  overall: number;

  @ApiProperty({ example: 10, description: 'Max 30' })
  documentScore: number;

  @ApiProperty({ example: 20, description: 'Max 30' })
  legalScore: number;

  @ApiProperty({ example: 15, description: 'Max 20' })
  familyScore: number;

  @ApiProperty({ example: 20, description: 'Max 20' })
  financialScore: number;
}

export class ReadinessAssessmentResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ enum: ReadinessStatus })
  status: ReadinessStatus;

  @ApiProperty({ type: ReadinessScoreDto })
  scores: ReadinessScoreDto;

  @ApiProperty({ description: 'Total number of risks found' })
  totalRisks: number;

  @ApiProperty({ type: [RiskDto] })
  risks: RiskDto[];

  @ApiProperty({ type: [String], description: 'Recommended next actions' })
  nextSteps: string[];

  @ApiProperty()
  lastCheckedAt: Date;
}
