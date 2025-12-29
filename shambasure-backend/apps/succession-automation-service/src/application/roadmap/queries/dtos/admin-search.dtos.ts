// src/succession-automation/src/application/roadmap/queries/dtos/admin-search.dtos.ts
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

import { TaskCategory, TaskStatus } from '../../../../domain/entities/roadmap-task.entity';

/**
 * QUERY: Search Tasks (Admin)
 *
 * Cross-roadmap search to find bottlenecks across the system.
 */
export class AdminTaskSearchDto {
  @IsOptional()
  @IsString()
  taskTitleKeyword?: string;

  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsBoolean()
  isOverdue?: boolean;

  @IsOptional()
  @IsString()
  estateId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit: number = 50;
}
