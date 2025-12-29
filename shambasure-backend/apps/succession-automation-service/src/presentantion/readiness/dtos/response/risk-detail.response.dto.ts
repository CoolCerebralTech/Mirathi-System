import { ApiProperty } from '@nestjs/swagger';

import {
  RiskCategory,
  RiskSeverity,
  RiskStatus,
} from '../../../../domain/entities/risk-flag.entity';

export class RiskDetailResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Missing Death Certificate' })
  title: string;

  @ApiProperty({
    example: 'Death Certificate is mandatory for all succession cases under S.56 LSA.',
  })
  description: string;

  @ApiProperty({ enum: RiskSeverity, example: RiskSeverity.CRITICAL })
  severity: RiskSeverity;

  @ApiProperty({ enum: RiskCategory, example: RiskCategory.MISSING_DOCUMENT })
  category: RiskCategory;

  @ApiProperty({ enum: RiskStatus, example: RiskStatus.ACTIVE })
  status: RiskStatus;

  // --- UI Helpers ---

  @ApiProperty({
    description: 'Suggested UI badge color',
    example: 'red',
    enum: ['red', 'orange', 'yellow', 'green', 'gray'],
  })
  badgeColor: string;

  @ApiProperty({ example: 'BLOCKER' })
  priorityLabel: string;

  @ApiProperty({ description: 'Material Design icon name', example: 'file-document-alert' })
  icon: string;

  // --- Context ---

  @ApiProperty({ example: 'S.56 Law of Succession Act' })
  legalBasis: string;

  @ApiProperty({
    type: [String],
    example: ['Visit Civil Registration Office', 'Pay KES 50 fee'],
  })
  mitigationSteps: string[];

  @ApiProperty({ description: 'Number of days this risk has been active', example: 5 })
  daysActive: number;

  @ApiProperty({ example: true })
  isBlocking: boolean;

  @ApiProperty({ description: 'ID of the affected entity (e.g. Asset ID)', required: false })
  linkedEntityId?: string;
}
