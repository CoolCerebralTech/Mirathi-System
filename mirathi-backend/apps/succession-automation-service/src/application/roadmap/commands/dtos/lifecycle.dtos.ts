// src/succession-automation/src/application/roadmap/commands/dtos/lifecycle.dtos.ts
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * COMMAND: Generate a new Executor Roadmap
 *
 * Triggers:
 * 1. Fetching of Readiness Assessment
 * 2. Analysis of Succession Context
 * 3. Generation of initial task list
 */
export class GenerateRoadmapDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  readinessAssessmentId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  executorName: string;

  /**
   * Current estimated value of the estate in KES.
   * Critical for determining court jurisdiction (High Court vs Magistrate).
   */
  @IsNumber()
  @Min(0)
  estateValueKES: number;
}

/**
 * COMMAND: Regenerate Roadmap
 *
 * Used when fundamental facts change (e.g., "We found a Will").
 * This is a destructive action that preserves completed tasks but rebuilds the future.
 */
export class RegenerateRoadmapDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string; // Admin or Executor

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string; // e.g., "New Will discovered", "Court jurisdiction change"

  /**
   * New estate value if that was the trigger for regeneration.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  updatedEstateValueKES?: number;
}

/**
 * COMMAND: Optimize Roadmap
 *
 * Triggers the AI engine to re-order tasks based on:
 * - Court backlog data
 * - Critical path analysis
 * - User's working speed
 */
export class OptimizeRoadmapDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  optimizationFocus?: 'SPEED' | 'COST' | 'LEGAL_SAFETY';
}
