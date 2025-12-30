// src/succession-automation/src/application/roadmap/queries/dtos/task-list.dtos.ts
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { RoadmapPhase } from '../../../../domain/aggregates/executor-roadmap.aggregate';
import {
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../../../../domain/entities/roadmap-task.entity';

/**
 * QUERY: Get Tasks
 *
 * A powerful, flexible query for the main task list.
 * Supports filtering by phase, status, priority, and date ranges.
 */
export class GetTaskListDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  // --- Filtering ---

  @IsOptional()
  @IsEnum(RoadmapPhase)
  phase?: RoadmapPhase;

  @IsOptional()
  @IsEnum(TaskStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: TaskStatus[];

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isOverdue?: boolean;

  /**
   * "Upcoming" filter: Tasks due within X days
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  dueWithinDays?: number;

  // --- Pagination ---

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;

  // --- Sorting ---

  @IsOptional()
  @IsString()
  sortBy?: 'dueDate' | 'priority' | 'status' | 'orderIndex' = 'orderIndex';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
