// src/succession-automation/src/presentation/roadmap/dtos/response/task-list.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../../../../domain/entities/roadmap-task.entity';

export class TaskSummaryResponseDto {
  @ApiProperty({ example: 'task-uuid-123' })
  id: string;

  @ApiProperty({ example: 'DOC-001' })
  shortCode: string;

  @ApiProperty({ example: 'Obtain Death Certificate' })
  title: string;

  @ApiProperty({ enum: TaskCategory, example: TaskCategory.DOCUMENT_COLLECTION })
  category: TaskCategory;

  @ApiProperty({ example: 1 })
  phase: number;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.PENDING })
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.CRITICAL })
  priority: TaskPriority;

  @ApiPropertyOptional({ example: '2025-01-20T00:00:00.000Z' })
  dueDate?: string;

  @ApiProperty({ example: false })
  isOverdue: boolean;

  @ApiPropertyOptional({ example: 5, description: 'Days remaining until due date' })
  daysRemaining?: number;

  @ApiProperty({ example: '⏳', description: 'Emoji icon for status' })
  statusIcon: string;

  @ApiProperty({ example: 85, description: 'Calculated urgency score for sorting' })
  urgencyScore: number;

  @ApiProperty({ example: false })
  isLocked: boolean;
}

class PaginationMetaResponse {
  @ApiProperty({ example: 50 })
  totalItems: number;

  @ApiProperty({ example: 20 })
  itemCount: number;

  @ApiProperty({ example: 20 })
  itemsPerPage: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ example: 1 })
  currentPage: number;
}

export class TaskListResponseDto {
  @ApiProperty({ type: [TaskSummaryResponseDto] })
  items: TaskSummaryResponseDto[];

  @ApiProperty({ type: PaginationMetaResponse })
  meta: PaginationMetaResponse;
}
