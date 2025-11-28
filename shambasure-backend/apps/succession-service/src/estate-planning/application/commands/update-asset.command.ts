import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateAssetDto } from '../dto/request/update-asset.dto';
import type { AssetRepositoryInterface } from '../../domain/interfaces/asset.repository.interface';
import { AssetValue } from '../../domain/value-objects/asset-value.vo';

export class UpdateAssetCommand {
  constructor(
    public readonly assetId: string,
    public readonly userId: string,
    public readonly dto: UpdateAssetDto,
  ) {}
}

@CommandHandler(UpdateAssetCommand)
export class UpdateAssetHandler implements ICommandHandler<UpdateAssetCommand> {
  constructor(
    @Inject('AssetRepositoryInterface')
    private readonly assetRepository: AssetRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: UpdateAssetCommand): Promise<void> {
    const { assetId, userId, dto } = command;

    // 1. Load Aggregate
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found.`);
    }

    // 2. Security Check
    if (asset.getOwnerId() !== userId) {
      throw new ForbiddenException('You do not own this asset.');
    }

    // 3. Merge Context for Events
    const assetModel = this.publisher.mergeObjectContext(asset);

    // 4. Handle Valuation Updates (Critical for Audit)
    if (dto.value) {
      const newValue = new AssetValue(dto.value.amount, dto.value.currency);

      // Only update if value actually changed to avoid spamming events
      if (!newValue.equals(asset.getCurrentValue())) {
        assetModel.updateValue(newValue, dto.updateReason || 'User Manual Update');
      }
    }

    // 5. Handle Detail Updates
    if (dto.name || dto.description) {
      assetModel.updateDetails(
        dto.name || asset.getName(),
        dto.description || asset.getDescription(),
      );
    }

    // 6. Handle Ownership Updates
    if (dto.ownershipType || dto.ownershipShare !== undefined) {
      assetModel.updateOwnership(
        dto.ownershipType || asset.getOwnershipType(),
        dto.ownershipShare !== undefined ? dto.ownershipShare : asset.getOwnershipShare(),
      );
    }

    // 7. Handle Location/ID updates
    if (dto.location) {
      assetModel.setLocation({
        county: dto.location.county,
        subCounty: dto.location.subCounty,
        ward: dto.location.ward,
      });
    }

    if (dto.identification) {
      assetModel.setIdentification({
        registrationNumber: dto.identification.registrationNumber,
        parcelNumber: dto.identification.parcelNumber,
      });
    }

    // 8. Persist & Commit
    await this.assetRepository.save(assetModel);
    assetModel.commit();
  }
}
