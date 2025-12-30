import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { SuccessionContext } from '../../../../domain/value-objects/succession-context.vo';
import { Result } from '../../../common/result';
import { UpdateContextCommand } from '../impl/update-context.command';

@CommandHandler(UpdateContextCommand)
export class UpdateContextHandler implements ICommandHandler<UpdateContextCommand> {
  private readonly logger = new Logger(UpdateContextHandler.name);

  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
  ) {}

  async execute(command: UpdateContextCommand): Promise<Result<void>> {
    const { assessmentId, ...contextProps } = command.dto;

    try {
      const assessment = await this.repository.findById(assessmentId);
      if (!assessment) return Result.fail('Assessment not found');

      // Create new VO
      const newContext = SuccessionContext.create(contextProps);

      // Update Aggregate (triggering recalculation)
      assessment.updateContext(newContext, 'manual_context_update');

      await this.repository.save(assessment);
      this.logger.log(`Succession Context updated for ${assessmentId}`);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
