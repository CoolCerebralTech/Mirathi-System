// command-handlers/assets/set-asset-encumbrance.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { AssetNotFoundException } from '../../../domain/exceptions/asset-not-found.exception';
import { EstatePlanningNotFoundException } from '../../../domain/exceptions/estate-planning-not-found.exception';
import { AssetRepository } from '../../../infrastructure/repositories/asset.repository';
import { EstatePlanningRepository } from '../../../infrastructure/repositories/estate-planning.repository';
import { SetAssetEncumbranceCommand } from '../commands/assets/set-asset-encumbrance.command';

@CommandHandler(SetAssetEncumbranceCommand)
export class SetAssetEncumbranceHandler implements ICommandHandler<SetAssetEncumbranceCommand> {
  private readonly logger = new Logger(SetAssetEncumbranceHandler.name);

  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly estatePlanningRepository: EstatePlanningRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: SetAssetEncumbranceCommand): Promise<void> {
    const { assetId, estatePlanningId, data, correlationId } = command;
    this.logger.debug(`Executing SetAssetEncumbranceCommand: ${correlationId}`);

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
    asset.addEncumbrance(
      data.encumbranceType,
      data.encumbranceDetails,
      data.encumbranceAmount || 0,
    );

    // 5. Invalidate estate planning financial cache
    estatePlanning.invalidateFinancialCache();

    // 6. Save changes
    await this.assetRepository.save(asset);
    await this.estatePlanningRepository.save(estatePlanning);

    this.logger.debug(`Asset encumbrance set: ${assetId}`);

    // 7. Publish events
    this.publisher.mergeObjectContext(asset).commit();
    this.publisher.mergeObjectContext(estatePlanning).commit();
  }
}
