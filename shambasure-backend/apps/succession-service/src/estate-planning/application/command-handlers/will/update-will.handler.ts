// update-will.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { WillAggregate } from '../../domain/aggregates/will.aggregate';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { UpdateWillCommand } from './update-will.command';

@CommandHandler(UpdateWillCommand)
export class UpdateWillHandler implements ICommandHandler<UpdateWillCommand> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly publisher: EventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(command: UpdateWillCommand): Promise<void> {
    const { willId, testatorId, data } = command;

    this.logger.debug(`Updating will ${willId} for testator ${testatorId}`);

    // Load the Will aggregate
    const will = await this.willRepository.findById(willId);
    if (!will) {
      this.logger.warn(`Will ${willId} not found`);
      throw new Error(`Will ${willId} not found`);
    }

    // Verify testator ownership
    if (will.testatorId !== testatorId) {
      this.logger.warn(`Testator ${testatorId} does not own will ${willId}`);
      throw new Error('Unauthorized will update');
    }

    // Check if will is editable
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

    // Update title if provided
    if (data.title) {
      willAggregate.updateTitle(data.title);
    }

    // Update type if provided
    if (data.type) {
      willAggregate.updateType(data.type);
    }

    // Update details if provided
    if (
      data.funeralWishes ||
      data.burialLocation ||
      data.cremationInstructions ||
      data.organDonation !== undefined ||
      data.organDonationDetails ||
      data.residuaryClause ||
      data.digitalAssetInstructions ||
      data.specialInstructions
    ) {
      willAggregate.updateWillDetails(
        data.funeralWishes,
        data.burialLocation,
        data.cremationInstructions,
        data.organDonation,
        data.organDonationDetails,
        data.residuaryClause,
        data.digitalAssetInstructions,
        data.specialInstructions,
      );
    }

    // Update storage if provided
    if (data.storageLocation) {
      willAggregate.getWill().setStorageLocation(data.storageLocation, data.storageDetails);
    }

    // Update dependant provision
    if (data.hasDependantProvision && data.dependantProvisionDetails) {
      willAggregate.getWill().addDependantProvision(data.dependantProvisionDetails);
    }

    // Save updated will
    await this.willRepository.save(willAggregate.getWill());

    // Commit events
    willAggregate.commit();

    this.logger.log(`Will ${willId} updated successfully`);
  }
}
