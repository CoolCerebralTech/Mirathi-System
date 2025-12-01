// command-handlers/assets/verify-asset.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { AssetNotFoundException } from '../../../domain/exceptions/asset-not-found.exception';
import { AssetRepository } from '../../../infrastructure/repositories/asset.repository';
import { VerifyAssetCommand } from '../commands/assets/verify-asset.command';

@CommandHandler(VerifyAssetCommand)
export class VerifyAssetHandler implements ICommandHandler<VerifyAssetCommand> {
  private readonly logger = new Logger(VerifyAssetHandler.name);

  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: VerifyAssetCommand): Promise<void> {
    const { assetId, data, correlationId } = command;
    this.logger.debug(`Executing VerifyAssetCommand: ${correlationId}`);

    // 1. Load Asset Aggregate
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new AssetNotFoundException(assetId);
    }

    // 2. Apply domain behavior
    asset.updateVerificationStatus(data.verificationStatus, data.verifiedByUserId);

    // 3. Save changes
    await this.assetRepository.save(asset);

    this.logger.debug(
      `Asset verification status updated: ${assetId} -> ${data.verificationStatus}`,
    );

    // 4. Publish events
    this.publisher.mergeObjectContext(asset).commit();
  }
}
