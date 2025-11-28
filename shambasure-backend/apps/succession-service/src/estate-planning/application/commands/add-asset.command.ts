import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { AssetOwnershipType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { Asset } from '../../domain/entities/asset.entity';
import type { AssetRepositoryInterface } from '../../domain/interfaces/asset.repository.interface';
import { AssetValue } from '../../domain/value-objects/asset-value.vo';
import { AddAssetDto } from '../dto/request/add-asset.dto';

export class AddAssetCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: AddAssetDto,
  ) {}
}

@CommandHandler(AddAssetCommand)
export class AddAssetHandler implements ICommandHandler<AddAssetCommand> {
  constructor(
    @Inject('AssetRepositoryInterface')
    private readonly assetRepository: AssetRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: AddAssetCommand): Promise<string> {
    const { userId, dto } = command;

    // 1. Construct Value Objects
    const initialValue = new AssetValue(
      dto.value.amount,
      dto.value.currency,
      new Date(), // Valuation date is now
    );

    // 2. Create Entity via Factory
    // Note: We generate UUID here (Application Layer responsibility in this architecture)
    const assetId = uuidv4();

    const asset = Asset.create(
      assetId,
      dto.name,
      dto.type,
      userId,
      initialValue,
      dto.ownershipType || AssetOwnershipType.SOLE,
      dto.ownershipShare || 100,
    );

    // 3. Apply Optional Data
    if (dto.description) {
      asset.updateDetails(dto.name, dto.description);
    }

    if (dto.location) {
      asset.setLocation({
        county: dto.location.county,
        subCounty: dto.location.subCounty,
        ward: dto.location.ward,
        // gpsCoordinates handling if added to DTO later
      });
    }

    if (dto.identification) {
      asset.setIdentification({
        registrationNumber: dto.identification.registrationNumber,
        parcelNumber: dto.identification.parcelNumber,
      });
    }

    // 4. Merge Context (Connects Entity to NestJS EventBus)
    const assetModel = this.publisher.mergeObjectContext(asset);

    // 5. Persist
    await this.assetRepository.save(assetModel);

    // 6. Commit Events (Triggers AssetAddedEvent)
    assetModel.commit();

    return assetId;
  }
}
