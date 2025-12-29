// src/succession-automation/src/application/roadmap/commands/handlers/risk.handlers.ts
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import type { IRoadmapRepository } from '../../../../domain/repositories/i-roadmap.repository';
import { EXECUTOR_ROADMAP_REPOSITORY } from '../../../../domain/repositories/i-roadmap.repository';
import { Result } from '../../../common/result';
import { LinkRiskToTaskCommand } from '../impl/risk.commands';

@CommandHandler(LinkRiskToTaskCommand)
export class LinkRiskToTaskHandler implements ICommandHandler<LinkRiskToTaskCommand> {
  private readonly logger = new Logger(LinkRiskToTaskHandler.name);

  constructor(
    @Inject(EXECUTOR_ROADMAP_REPOSITORY)
    private readonly roadmapRepository: IRoadmapRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LinkRiskToTaskCommand): Promise<Result<void>> {
    const { roadmapId, riskId, blockingTaskIds } = command.dto;
    const traceId = command.traceId;

    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) return Result.fail(`Roadmap not found: ${roadmapId}`);

      // Domain Logic: Blocks tasks and updates status to BLOCKED if critical
      roadmap.linkRisk(riskId, blockingTaskIds);

      await this.roadmapRepository.save(roadmap);

      roadmap.getDomainEvents().forEach((e) => this.eventBus.publish(e));
      roadmap.clearEvents();

      this.logger.log(
        `[${traceId}] Risk ${riskId} linked to roadmap. Blocked ${blockingTaskIds.length} tasks.`,
      );
      return Result.ok();
    } catch (error) {
      this.logger.error(`[${traceId}] Risk linking failed`, error);
      return Result.fail(error instanceof Error ? error : new Error('Risk linking failed'));
    }
  }
}
