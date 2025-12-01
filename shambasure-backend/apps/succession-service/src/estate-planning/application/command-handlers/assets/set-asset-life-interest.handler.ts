// command-handlers/assets/set-asset-life-interest.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { AssetNotFoundException } from '../../../domain/exceptions/asset-not-found.exception';
import { EstatePlanningNotFoundException } from '../../../domain/exceptions/estate-planning-not-found.exception';
import { AssetRepository } from '../../../infrastructure/repositories/asset.repository';
import { EstatePlanningRepository } from '../../../infrastructure/repositories/estate-planning.repository';
import { SetAssetLifeInterestCommand } from '../commands/assets/set-asset-life-interest.command';

@CommandHandler(SetAssetLifeInterestCommand)
export class SetAssetLifeInterestHandler implements ICommandHandler<SetAssetLifeInterestCommand> {
  private readonly logger = new Logger(SetAssetLifeInterestHandler.name);

  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly estatePlanningRepository: EstatePlanningRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: SetAssetLifeInterestCommand): Promise<void> {
    const { assetId, estatePlanningId, data, correlationId } = command;
    this.logger.debug(`Executing SetAssetLifeInterestCommand: ${correlationId}`);

    // 1. Validate Estate Planning exists and owns asset
    const estatePlanning = await this.estatePlanningRepository.findById(estatePlanningId);
    if (!estatePlanning) {
      throw new EstatePlanningNotFoundException(estatePlanningId);
    }

    // 2. Load Asset Aggregate
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new AssetNotFoundException(assetId);
    }

    // 3. Validate ownership
    if (asset.ownerId !== estatePlanning.userId) {
      throw new Error(`Asset ${assetId} not owned by estate planning user`);
    }

    // 4. Apply domain behavior
    asset.setLifeInterest(data.lifeInterestHolderId, data.lifeInterestEndsAt);

    // 5. Save changes
    await this.assetRepository.save(asset);

    this.logger.debug(`Asset life interest set: ${assetId}`);

    // 6. Publish events
    this.publisher.mergeObjectContext(asset).commit();
  }
}
