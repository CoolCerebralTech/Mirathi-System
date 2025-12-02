// create-will.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { WillAggregate } from '../../domain/aggregates/will.aggregate';
import { Will } from '../../domain/entities/will.entity';
import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { CreateWillCommand } from './create-will.command';

@CommandHandler(CreateWillCommand)
export class CreateWillHandler implements ICommandHandler<CreateWillCommand> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly publisher: EventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(command: CreateWillCommand): Promise<void> {
    const { willId, testatorId, data } = command;

    this.logger.debug(`Creating will ${willId} for testator ${testatorId}`);

    // Check if will already exists
    const existingWill = await this.willRepository.findById(willId);
    if (existingWill) {
      this.logger.warn(`Will ${willId} already exists`);
      return;
    }

    // Create Will entity
    const will = Will.create(willId, data.title, testatorId, data.type);

    // Update Will details if provided
    if (
      data.funeralWishes ||
      data.burialLocation ||
      data.cremationInstructions ||
      data.organDonation ||
      data.organDonationDetails ||
      data.residuaryClause ||
      data.digitalAssetInstructions ||
      data.specialInstructions
    ) {
      will.updateDetails(
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

    // Set storage if provided
    if (data.storageLocation) {
      will.setStorageLocation(data.storageLocation, data.storageDetails);
    }

    // Create Will Aggregate
    const willAggregate = this.publisher.mergeObjectContext(
      WillAggregate.create(willId, data.title, testatorId),
    );

    // Register the will in the aggregate
    willAggregate.getWill().addAsset = (assetId: string) => {};
    willAggregate.getWill().addBeneficiary = (beneficiaryId: string) => {};
    willAggregate.getWill().addExecutor = (executorId: string) => {};

    // Save will entity first
    await this.willRepository.save(will);

    // Commit events from the aggregate
    willAggregate.commit();

    this.logger.log(`Will ${willId} created successfully for testator ${testatorId}`);
  }
}
