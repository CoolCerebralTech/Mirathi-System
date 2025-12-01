// command-handlers/assets/update-asset-valuation.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { AssetRepository } from '../../../infrastructure/repositories/asset.repository';
import { EstatePlanningRepository } from '../../../infrastructure/repositories/estate-planning.repository';
import { UpdateAssetValuationCommand } from '../../commands/assets/update-asset-valuation.command';
import { AssetNotFoundException } from '../../../domain/exceptions/asset-not-found.exception';
import { AssetNotOwnedException } from '../../domain/exceptions/asset-not-owned.exception';
import { EstatePlanningNotFoundException } from '../../domain/exceptions/estate-planning-not-found.exception';

@CommandHandler(UpdateAssetValuationCommand)
export class UpdateAssetValuationHandler implements ICommandHandler<UpdateAssetValuationCommand> {
  private readonly logger = new Logger(UpdateAssetValuationHandler.name);

  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly estatePlanningRepository: EstatePlanningRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: UpdateAssetValuationCommand): Promise<void> {
    const { assetId, estatePlanningId, data, correlationId } = command;
    this.logger.debug(`Executing UpdateAssetValuationCommand: ${correlationId}`);

    // 1. Validate Estate Planning exists and owns asset
    const estatePlanning = await this.estatePlanningRepository.findById(estatePlanningId);
    if (!estatePlanning) {
      throw new EstatePlanningNotFoundException(estatePlanningId);
    }

    if (!estatePlanning.getAssetIds().includes(assetId)) {
      throw new AssetNotOwnedException(assetId, estatePlanningId);
    }

    // 2. Load Asset Aggregate
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new AssetNotFoundException(assetId);
    }

    // 3. Apply domain behavior
    asset.updateValuation(data.amount, data.valuationDate, data.valuationSource || 'Manual update');

    // 4. Invalidate estate planning financial cache
    estatePlanning.invalidateFinancialCache();

    // 5. Save changes
    await this.assetRepository.save(asset);
    await this.estatePlanningRepository.save(estatePlanning);

    this.logger.debug(`Asset valuation updated: ${assetId}`);

    // 6. Publish events
    this.publisher.mergeObjectContext(asset).commit();
    this.publisher.mergeObjectContext(estatePlanning).commit();
  }
}
