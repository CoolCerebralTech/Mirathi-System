import { ApiProperty } from '@nestjs/swagger';
import { RoadmapPhase, TaskCategory, TaskStatus } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

// --- REQUESTS ---

export class CompleteTaskDto {
  @ApiProperty({ required: false, description: 'User notes about how they finished it' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// --- RESPONSES ---

export class RoadmapTaskDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ enum: RoadmapPhase })
  phase: RoadmapPhase;

  @ApiProperty({ enum: TaskCategory })
  category: TaskCategory;

  @ApiProperty({ example: 'Obtain Death Certificate' })
  title: string;

  @ApiProperty({ example: 'Get the original certificate from Civil Registration' })
  description: string;

  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus;

  // Educational Content
  @ApiProperty({ required: false })
  whatIsIt?: string;

  @ApiProperty({ required: false })
  whyNeeded?: string;

  @ApiProperty({ required: false })
  howToGet?: string;

  @ApiProperty({ required: false, example: 3 })
  estimatedDays?: number;

  @ApiProperty({ description: 'IDs of tasks that must be done before this one' })
  dependsOn: string[];
}

export class RoadmapResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ enum: RoadmapPhase })
  currentPhase: RoadmapPhase;

  @ApiProperty({ example: 45, description: '0-100 Progress Percentage' })
  overallProgress: number;

  @ApiProperty({ description: 'Grouped by Phase', example: { PRE_FILING: [] } })
  tasksByPhase: Record<string, RoadmapTaskDto[]>;

  @ApiProperty()
  meta: {
    total: number;
    completed: number;
  };
}
