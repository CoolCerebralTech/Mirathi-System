// activate-will.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { WillAggregate } from '../../domain/aggregates/will.aggregate';
import { EstatePlanningRepository } from '../../infrastructure/repositories/estate-planning.repository';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { ActivateWillCommand } from './activate-will.command';

@CommandHandler(ActivateWillCommand)
export class ActivateWillHandler implements ICommandHandler<ActivateWillCommand> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly estatePlanningRepository: EstatePlanningRepository,
    private readonly publisher: EventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(command: ActivateWillCommand): Promise<void> {
    const { willId, testatorId, data } = command;

    this.logger.debug(`Activating will ${willId}`);

    // Load the Will aggregate
    const will = await this.willRepository.findById(willId);
    if (!will) {
      this.logger.warn(`Will ${willId} not found`);
      throw new Error(`Will ${willId} not found`);
    }

    // Verify testator ownership
    if (will.testatorId !== testatorId) {
      this.logger.warn(`Testator ${testatorId} does not own will ${willId}`);
      throw new Error('Unauthorized will activation');
    }

    // Reconstruct aggregate
    const willAggregate = this.publisher.mergeObjectContext(
      WillAggregate.reconstitute(
        will,
        will.assetIds,
        will.beneficiaryIds,
        will.executorIds,
        will.witnessIds,
      ),
    );

    // Validate will for activation
    const validation = willAggregate.validateForActivation();
    if (!validation.isValid) {
      this.logger.warn(`Will ${willId} cannot be activated: ${validation.issues.join(', ')}`);
      throw new Error(`Will activation failed: ${validation.issues.join(', ')}`);
    }

    // Activate will through aggregate
    willAggregate.activate(data.activatedBy);

    // Load estate planning aggregate to register will
    const estatePlanning = await this.estatePlanningRepository.findByUserId(testatorId);
    if (estatePlanning) {
      // Register will in estate planning
      estatePlanning.registerWill(willId);

      // Set as active will
      estatePlanning.setActiveWill(willId);

      // Save estate planning
      await this.estatePlanningRepository.save(estatePlanning);
    }

    // Save updated will
    await this.willRepository.save(willAggregate.getWill());

    // Commit events
    willAggregate.commit();

    this.logger.log(`Will ${willId} activated successfully`);
  }
}
