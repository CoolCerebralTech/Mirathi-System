// src/succession-automation/src/presentation/roadmap/dtos/request/task-filter.request.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

import { RoadmapPhase } from '../../../../domain/aggregates/executor-roadmap.aggregate';
import {
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../../../../domain/entities/roadmap-task.entity';

export class TaskFilterRequestDto {
  @ApiPropertyOptional({ enum: RoadmapPhase, description: 'Filter by phase' })
  @IsOptional()
  @IsEnum(RoadmapPhase)
  phase?: RoadmapPhase;

  @ApiPropertyOptional({
    enum: TaskStatus,
    isArray: true,
    description: 'Filter by status (can provide multiple)',
  })
  @IsOptional()
  @IsEnum(TaskStatus, { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    return value.split(','); // Allow ?status=PENDING,IN_PROGRESS
  })
  status?: TaskStatus[];

  @ApiPropertyOptional({ enum: TaskPriority, description: 'Filter by priority' })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskCategory, description: 'Filter by category' })
  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;

  @ApiPropertyOptional({ description: 'Show only overdue tasks' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isOverdue?: boolean;

  @ApiPropertyOptional({ description: 'Filter tasks due within X days' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  dueWithinDays?: number;

  // --- Pagination ---

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;

  // --- Sorting ---

  @ApiPropertyOptional({
    enum: ['dueDate', 'priority', 'status', 'orderIndex'],
    default: 'orderIndex',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'dueDate' | 'priority' | 'status' | 'orderIndex' = 'orderIndex';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
