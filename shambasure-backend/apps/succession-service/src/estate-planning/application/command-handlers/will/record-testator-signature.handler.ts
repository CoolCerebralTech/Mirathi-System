// record-testator-signature.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { WillAggregate } from '../../domain/aggregates/will.aggregate';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { RecordTestatorSignatureCommand } from './record-testator-signature.command';

@CommandHandler(RecordTestatorSignatureCommand)
export class RecordTestatorSignatureHandler implements ICommandHandler<RecordTestatorSignatureCommand> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly publisher: EventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(command: RecordTestatorSignatureCommand): Promise<void> {
    const { willId, testatorId } = command;

    this.logger.debug(`Recording testator signature for will ${willId}`);

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

    // Check if will can record signature
    if (!will.isEditable()) {
      this.logger.warn(`Will ${willId} is not editable in status ${will.status}`);
      throw new Error(`Will is not editable in status ${will.status}`);
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

    // Record testator signature through Will entity
    willAggregate.getWill().recordTestatorSignature();

    // Save updated will
    await this.willRepository.save(willAggregate.getWill());

    // Commit events
    willAggregate.commit();

    this.logger.log(`Testator signature recorded for will ${willId}`);
  }
}
