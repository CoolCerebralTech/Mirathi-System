// add-will-witness.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { WillAggregate } from '../../domain/aggregates/will.aggregate';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { WitnessRepository } from '../../infrastructure/repositories/witness.repository';
import { AddWillWitnessCommand } from './add-will-witness.command';

@CommandHandler(AddWillWitnessCommand)
export class AddWillWitnessHandler implements ICommandHandler<AddWillWitnessCommand> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly witnessRepository: WitnessRepository,
    private readonly publisher: EventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(command: AddWillWitnessCommand): Promise<void> {
    const { willId, testatorId, data } = command;

    this.logger.debug(`Adding witness to will ${willId}`);

    // Load the Will aggregate
    const will = await this.willRepository.findById(willId);
    if (!will) {
      this.logger.warn(`Will ${willId} not found`);
      throw new Error(`Will ${willId} not found`);
    }

    // Verify testator ownership
    if (will.testatorId !== testatorId) {
      this.logger.warn(`Testator ${testatorId} does not own will ${willId}`);
      throw new Error('Unauthorized witness addition');
    }

    // Check if witnesses can be added
    if (!will.canAddWitnesses()) {
      this.logger.warn(`Cannot add witnesses to will ${willId} in status ${will.status}`);
      throw new Error(`Cannot add witnesses in status ${will.status}`);
    }

    // Check if witness already exists in will
    if (will.witnessIds.includes(data.witnessId)) {
      this.logger.warn(`Witness ${data.witnessId} already added to will ${willId}`);
      return;
    }

    // Load witness entity to verify existence
    const witness = await this.witnessRepository.findById(data.witnessId);
    if (!witness) {
      this.logger.warn(`Witness ${data.witnessId} not found`);
      throw new Error(`Witness ${data.witnessId} not found`);
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

    // Add witness to will through Will entity
    willAggregate.getWill().addWitness(data.witnessId);

    // Update witness with will reference
    // Note: This would require a bidirectional relationship setup
    // For now, we just add the witness ID to the will

    // Save updated will
    await this.willRepository.save(willAggregate.getWill());

    // Commit events
    willAggregate.commit();

    this.logger.log(`Witness ${data.witnessId} added to will ${willId}`);
  }
}
