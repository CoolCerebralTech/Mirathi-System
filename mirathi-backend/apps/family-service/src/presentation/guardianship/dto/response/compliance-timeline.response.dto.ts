import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimelineEventItemDto {
  @ApiProperty() id: string;
  @ApiProperty() date: Date;

  @ApiProperty({
    enum: [
      'SCHEDULED',
      'DUE',
      'SUBMITTED',
      'REVIEWED',
      'ACCEPTED',
      'AMENDMENT_REQUESTED',
      'OVERDUE',
      'REMINDER_SENT',
    ],
  })
  type: string;

  @ApiProperty() title: string;
  @ApiProperty() description: string;

  @ApiProperty({ enum: ['green', 'amber', 'red', 'blue', 'gray'] })
  statusColor: string;

  @ApiProperty() icon: string; // Icon name for frontend (e.g., 'file-check')

  @ApiPropertyOptional() actor?: string; // Who performed the action
  @ApiPropertyOptional() referenceId?: string;
  @ApiPropertyOptional() documentUrl?: string;
}

class TimelineSummaryDto {
  @ApiProperty() totalReports: number;
  @ApiProperty() onTimeRate: number;
  @ApiPropertyOptional() nextDueDate?: Date;
  @ApiProperty({ enum: ['COMPLIANT', 'NON_COMPLIANT', 'AT_RISK'] })
  status: string;
}

export class ComplianceTimelineResponseDto {
  @ApiProperty() guardianshipId: string;
  @ApiProperty() wardName: string;

  @ApiProperty({ type: TimelineSummaryDto })
  summary: TimelineSummaryDto;

  @ApiProperty({ type: [TimelineEventItemDto] })
  events: TimelineEventItemDto[];
}
