// record-witness-signatures.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { WillAggregate } from '../../domain/aggregates/will.aggregate';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { RecordWitnessSignaturesCommand } from './record-witness-signatures.command';

@CommandHandler(RecordWitnessSignaturesCommand)
export class RecordWitnessSignaturesHandler implements ICommandHandler<RecordWitnessSignaturesCommand> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly publisher: EventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(command: RecordWitnessSignaturesCommand): Promise<void> {
    const { willId, testatorId } = command;

    this.logger.debug(`Recording witness signatures for will ${willId}`);

    // Load the Will aggregate
    const will = await this.willRepository.findById(willId);
    if (!will) {
      this.logger.warn(`Will ${willId} not found`);
      throw new Error(`Will ${willId} not found`);
    }

    // Verify testator ownership
    if (will.testatorId !== testatorId) {
      this.logger.warn(`Testator ${testatorId} does not own will ${willId}`);
      throw new Error('Unauthorized signature recording');
    }

    // Check if will is in correct status
    if (will.status !== 'PENDING_WITNESS') {
      this.logger.warn(`Will ${willId} not in PENDING_WITNESS status`);
      throw new Error(`Will must be in PENDING_WITNESS status`);
    }

    // Check minimum witnesses requirement
    if (!will.hasMinimumWitnesses()) {
      this.logger.warn(`Will ${willId} does not have minimum witnesses`);
      throw new Error(`Minimum ${will.minimumWitnessesRequired} witnesses required`);
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

    // Record witness signatures through Will entity
    willAggregate.getWill().recordWitnessSignatures();

    // Save updated will
    await this.willRepository.save(willAggregate.getWill());

    // Commit events
    willAggregate.commit();

    this.logger.log(`Witness signatures recorded for will ${willId}`);
  }
}
