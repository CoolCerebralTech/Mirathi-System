// src/succession-automation/src/presentation/roadmap/dtos/response/roadmap-dashboard.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  RoadmapPhase,
  RoadmapStatus,
} from '../../../../domain/aggregates/executor-roadmap.aggregate';
import { TaskPriority } from '../../../../domain/entities/roadmap-task.entity';

class PhaseProgressResponse {
  @ApiProperty({ enum: RoadmapPhase, example: RoadmapPhase.PRE_FILING })
  phase: RoadmapPhase;

  @ApiProperty({ example: 'Pre-Filing Preparation' })
  name: string;

  @ApiProperty({ example: 45, description: 'Percentage complete (0-100)' })
  percentComplete: number;

  @ApiProperty({ enum: ['LOCKED', 'ACTIVE', 'COMPLETED'], example: 'ACTIVE' })
  status: 'LOCKED' | 'ACTIVE' | 'COMPLETED';

  @ApiProperty({ example: 10 })
  totalTasks: number;

  @ApiProperty({ example: 4 })
  completedTasks: number;
}

class NextActionResponse {
  @ApiProperty({ example: 'task-uuid-123' })
  taskId: string;

  @ApiProperty({ example: 'Obtain Death Certificate' })
  title: string;

  @ApiProperty({ example: 'Visit the Civil Registration Office...' })
  description: string;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.CRITICAL })
  priority: TaskPriority;

  @ApiPropertyOptional({ example: '2025-01-15T00:00:00.000Z' })
  dueDate?: string;
}

class DashboardAlertResponse {
  @ApiProperty({ enum: ['RISK', 'OVERDUE', 'BLOCKED'], example: 'RISK' })
  type: 'RISK' | 'OVERDUE' | 'BLOCKED';

  @ApiProperty({ example: '2 critical risks are blocking your progress.' })
  message: string;

  @ApiProperty({ enum: ['HIGH', 'CRITICAL'], example: 'CRITICAL' })
  severity: 'HIGH' | 'CRITICAL';

  @ApiPropertyOptional({ example: 'risk-uuid-987' })
  linkTo?: string;
}

export class RoadmapDashboardResponseDto {
  @ApiProperty({ example: 'roadmap-uuid-123' })
  id: string;

  @ApiProperty({ example: 'estate-uuid-456' })
  estateId: string;

  @ApiProperty({ example: 'John Doe' })
  executorName: string;

  @ApiProperty({ enum: RoadmapStatus, example: RoadmapStatus.ACTIVE })
  status: RoadmapStatus;

  @ApiProperty({ example: 15, description: 'Overall roadmap completion percentage' })
  overallProgress: number;

  @ApiProperty({ enum: RoadmapPhase, example: RoadmapPhase.PRE_FILING })
  currentPhase: RoadmapPhase;

  @ApiProperty({ example: 5, description: 'Days since roadmap started' })
  daysActive: number;

  @ApiProperty({ enum: ['HEALTHY', 'WARNING', 'CRITICAL'], example: 'WARNING' })
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';

  @ApiProperty({ example: '#F59E0B', description: 'Hex color code for UI status badge' })
  statusColor: string;

  @ApiProperty({ type: [PhaseProgressResponse] })
  phases: PhaseProgressResponse[];

  @ApiPropertyOptional({ type: NextActionResponse })
  nextAction?: NextActionResponse;

  @ApiProperty({ type: [DashboardAlertResponse] })
  alerts: DashboardAlertResponse[];
}
