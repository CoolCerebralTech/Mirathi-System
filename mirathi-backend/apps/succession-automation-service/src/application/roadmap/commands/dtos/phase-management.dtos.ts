// src/succession-automation/src/application/roadmap/commands/dtos/phase-management.dtos.ts
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

import { RoadmapPhase } from '../../../../domain/aggregates/executor-roadmap.aggregate';

/**
 * COMMAND: Transition Phase
 *
 * Moves the roadmap to the next legal stage (e.g., PRE_FILING -> FILING).
 * This will trigger strict validation rules (80% completion, Critical Tasks done).
 */
export class TransitionPhaseDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(RoadmapPhase)
  @IsNotEmpty()
  currentPhase: RoadmapPhase;
}

/**
 * COMMAND: Force Phase Override
 *
 * "Break Glass" functionality for Admins.
 * Used if the system gets stuck or physical court reality diverges from system state.
 */
export class ForcePhaseOverrideDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string; // Must have ADMIN role

  @IsEnum(RoadmapPhase)
  @IsNotEmpty()
  targetPhase: RoadmapPhase;

  @IsString()
  @IsNotEmpty()
  justification: string;
}
