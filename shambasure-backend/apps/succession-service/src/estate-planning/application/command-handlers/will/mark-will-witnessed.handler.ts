// mark-will-witnessed.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { WillAggregate } from '../../domain/aggregates/will.aggregate';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { MarkWillWitnessedCommand } from './mark-will-witnessed.command';

@CommandHandler(MarkWillWitnessedCommand)
export class MarkWillWitnessedHandler implements ICommandHandler<MarkWillWitnessedCommand> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly publisher: EventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(command: MarkWillWitnessedCommand): Promise<void> {
    const { willId, testatorId } = command;

    this.logger.debug(`Marking will ${willId} as witnessed`);

    // Load the Will aggregate
    const will = await this.willRepository.findById(willId);
    if (!will) {
      this.logger.warn(`Will ${willId} not found`);
      throw new Error(`Will ${willId} not found`);
    }

    // Verify testator ownership
    if (will.testatorId !== testatorId) {
      this.logger.warn(`Testator ${testatorId} does not own will ${willId}`);
      throw new Error('Unauthorized will witnessing');
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

    // Mark as witnessed through aggregate
    willAggregate.markAsWitnessed();

    // Save updated will
    await this.willRepository.save(willAggregate.getWill());

    // Commit events
    willAggregate.commit();

    this.logger.log(`Will ${willId} marked as witnessed`);
  }
}
