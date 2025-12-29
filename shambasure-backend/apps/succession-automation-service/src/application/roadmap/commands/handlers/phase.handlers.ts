// src/succession-automation/src/application/roadmap/commands/handlers/phase.handlers.ts
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import type { IRoadmapRepository } from '../../../../domain/repositories/i-roadmap.repository';
import { EXECUTOR_ROADMAP_REPOSITORY } from '../../../../domain/repositories/i-roadmap.repository';
import { Result } from '../../../common/result';
import { TransitionPhaseCommand } from '../impl/phase.commands';

@CommandHandler(TransitionPhaseCommand)
export class TransitionPhaseHandler implements ICommandHandler<TransitionPhaseCommand> {
  private readonly logger = new Logger(TransitionPhaseHandler.name);

  constructor(
    @Inject(EXECUTOR_ROADMAP_REPOSITORY)
    private readonly roadmapRepository: IRoadmapRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: TransitionPhaseCommand): Promise<Result<void>> {
    const { roadmapId, currentPhase } = command.dto;
    const traceId = command.traceId;

    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) return Result.fail(`Roadmap not found: ${roadmapId}`);

      if (roadmap.currentPhase !== currentPhase) {
        return Result.fail(
          `Phase mismatch. Current: ${roadmap.currentPhase}, Requested transition from: ${currentPhase}`,
        );
      }

      // Domain Logic: Validates strict completion percentages internally
      roadmap.transitionToNextPhase();

      await this.roadmapRepository.save(roadmap);

      roadmap.getDomainEvents().forEach((e) => this.eventBus.publish(e));
      roadmap.clearEvents();

      this.logger.log(`[${traceId}] Roadmap transitioned to phase: ${roadmap.currentPhase}`);
      return Result.ok();
    } catch (error) {
      this.logger.error(`[${traceId}] Phase transition failed`, error);
      return Result.fail(error instanceof Error ? error : new Error('Phase transition failed'));
    }
  }
}
