// apps/succession-automation-service/src/presentation/dtos/roadmap.dtos.ts
import { ApiProperty } from '@nestjs/swagger';
import { RoadmapPhase, TaskCategory, TaskStatus } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class RoadmapTaskDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiProperty({ enum: TaskCategory })
  @IsEnum(TaskCategory)
  category: TaskCategory;

  @ApiProperty({ enum: RoadmapPhase })
  @IsEnum(RoadmapPhase)
  phase: RoadmapPhase;

  @ApiProperty()
  @IsNumber()
  orderIndex: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  dependsOnTaskIds: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  whatIsIt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  whyNeeded?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  howToGet?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  estimatedDays?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  completedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RoadmapPhaseOverviewDto {
  @ApiProperty({ enum: RoadmapPhase })
  @IsEnum(RoadmapPhase)
  phase: RoadmapPhase;

  @ApiProperty()
  @IsNumber()
  totalTasks: number;

  @ApiProperty()
  @IsNumber()
  completed: number;

  @ApiProperty()
  @IsNumber()
  available: number;

  @ApiProperty()
  @IsNumber()
  inProgress: number;

  @ApiProperty()
  @IsNumber()
  locked: number;

  @ApiProperty()
  @IsNumber()
  progressPercentage: number;

  @ApiProperty()
  @IsNumber()
  estimatedDays: number;

  @ApiProperty({ type: [RoadmapTaskDto] })
  tasks: RoadmapTaskDto[];
}

export class ExecutorRoadmapDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsUUID()
  estateId: string;

  @ApiProperty({ enum: RoadmapPhase })
  @IsEnum(RoadmapPhase)
  currentPhase: RoadmapPhase;

  @ApiProperty()
  @IsNumber()
  overallProgress: number;

  @ApiProperty()
  @IsNumber()
  totalTasks: number;

  @ApiProperty()
  @IsNumber()
  completedTasks: number;

  @ApiProperty()
  @IsNumber()
  availableTasks: number;

  @ApiProperty()
  @IsNumber()
  lockedTasks: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  estimatedDays?: number;

  @ApiProperty()
  @IsDate()
  startedAt: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  estimatedCompletion?: Date;

  @ApiProperty({ type: [RoadmapTaskDto] })
  tasks: RoadmapTaskDto[];

  @ApiProperty({ type: [RoadmapTaskDto] })
  currentPhaseTasks: RoadmapTaskDto[];

  @ApiProperty({ required: false, enum: RoadmapPhase })
  @IsOptional()
  @IsEnum(RoadmapPhase)
  nextPhase?: RoadmapPhase;
}

export class StartTaskRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteTaskRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SkipTaskRequestDto {
  @ApiProperty({ description: 'Reason for skipping the task' })
  @IsString()
  reason: string;
}

export class TaskCompletionResponseDto {
  @ApiProperty()
  completedTask: RoadmapTaskDto;

  @ApiProperty({ type: [RoadmapTaskDto] })
  unlockedTasks: RoadmapTaskDto[];

  @ApiProperty()
  @IsBoolean()
  phaseChanged: boolean;

  @ApiProperty({ required: false, enum: RoadmapPhase })
  @IsOptional()
  @IsEnum(RoadmapPhase)
  newPhase?: RoadmapPhase;
}

export class RecommendedTasksResponseDto {
  @ApiProperty({ type: [RoadmapTaskDto] })
  tasks: RoadmapTaskDto[];

  @ApiProperty()
  @IsNumber()
  priorityTaskCount: number;
}
