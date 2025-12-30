import { ApiProperty } from '@nestjs/swagger';

import {
  ApplicationStatus,
  FilingPriority,
} from '../../../../domain/aggregates/probate-application.aggregate';

export class ApplicationAlertResponseDto {
  @ApiProperty({ enum: ['INFO', 'WARNING', 'ERROR', 'SUCCESS'], example: 'WARNING' })
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

  @ApiProperty({ example: 'Deadline Approaching' })
  title: string;

  @ApiProperty({ example: 'Your objection period ends in 3 days.' })
  message: string;

  @ApiProperty({ required: false })
  actionLink?: string;
}

export class ProbateDashboardResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'PA-2024-001', description: 'Human readable reference' })
  referenceNumber: string;

  @ApiProperty({ enum: ApplicationStatus, example: ApplicationStatus.PENDING_FORMS })
  status: ApplicationStatus;

  @ApiProperty({ example: 'Pending Forms', description: 'User-friendly status label' })
  statusLabel: string;

  @ApiProperty({ enum: FilingPriority, example: FilingPriority.NORMAL })
  priority: FilingPriority;

  @ApiProperty({ example: 45, description: 'Overall completeness percentage' })
  progressPercentage: number;

  @ApiProperty({ example: 1, description: 'Current step number (1-5)' })
  currentStep: number;

  @ApiProperty({ example: 5 })
  totalSteps: number;

  @ApiProperty({ example: 'High Court of Kenya at Nairobi' })
  targetCourt: string;

  @ApiProperty({ example: 'Milimani' })
  courtStation: string;

  @ApiProperty({ required: false, example: '2025-06-01T00:00:00Z' })
  estimatedGrantDate?: Date;

  @ApiProperty({
    example: 'Review generated forms',
    description: 'The single most important next step',
  })
  nextAction: string;

  @ApiProperty({ type: [ApplicationAlertResponseDto] })
  alerts: ApplicationAlertResponseDto[];

  @ApiProperty({ example: 3 })
  formsReadyCount: number;

  @ApiProperty({ example: 5 })
  formsTotalCount: number;

  @ApiProperty({ example: 2 })
  consentsReceivedCount: number;

  @ApiProperty({ example: 4 })
  consentsTotalCount: number;

  @ApiProperty({ example: false })
  filingFeePaid: boolean;

  @ApiProperty({ example: 5500 })
  totalFilingCost: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  lastModifiedAt: Date;
}
