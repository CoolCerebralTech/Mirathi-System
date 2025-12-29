// src/succession-automation/src/presentation/roadmap/dtos/request/phase-management.request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { RoadmapPhase } from '../../../../domain/aggregates/executor-roadmap.aggregate';

export class TransitionPhaseRequestDto {
  @ApiProperty({
    description: 'The current phase being completed (Validation check)',
    enum: RoadmapPhase,
    example: RoadmapPhase.PRE_FILING,
  })
  @IsEnum(RoadmapPhase)
  @IsNotEmpty()
  currentPhase: RoadmapPhase;
}
