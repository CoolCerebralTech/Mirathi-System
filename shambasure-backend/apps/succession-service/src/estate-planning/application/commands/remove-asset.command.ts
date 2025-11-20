import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { AssetRepositoryInterface } from '../../domain/interfaces/asset.repository.interface';

export class RemoveAssetCommand {
  constructor(
    public readonly assetId: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(RemoveAssetCommand)
export class RemoveAssetHandler implements ICommandHandler<RemoveAssetCommand> {
  constructor(
    @Inject('AssetRepositoryInterface')
    private readonly assetRepository: AssetRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RemoveAssetCommand): Promise<void> {
    const { assetId, userId } = command;

    // 1. Load
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundException(`Asset ${assetId} not found.`);
    }

    // 2. Security
    if (asset.getOwnerId() !== userId) {
      throw new ForbiddenException('You cannot delete an asset you do not own.');
    }

    // 3. Validation (Optional: Check if asset is locked in an Active Will)
    // In a strict system, we might check if the asset is part of an Active/Executed will
    // and block deletion. For now, we allow soft delete, which logic in WillAggregate handles.

    // 4. Merge & Action
    const assetModel = this.publisher.mergeObjectContext(asset);
    assetModel.softDelete();

    // 5. Save
    await this.assetRepository.save(assetModel); // Save the soft-deleted state
    assetModel.commit();
  }
}
