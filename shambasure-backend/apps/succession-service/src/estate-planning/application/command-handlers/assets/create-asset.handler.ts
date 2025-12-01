// command-handlers/assets/create-asset.handler.ts
import { Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { Asset } from '../../domain/entities/asset.entity';
import { EstatePlanningNotFoundException } from '../../domain/exceptions/estate-planning-not-found.exception';
import { AssetPrismaRepository } from '../../infrastructure/persistence/repositories/asset.prisma-repository';
import { EstatePlanningRepository } from '../../infrastructure/repositories/estate-planning.repository';
import { CreateAssetCommand } from '../commands/assets/create-asset.command';

@CommandHandler(CreateAssetCommand)
export class CreateAssetHandler implements ICommandHandler<CreateAssetCommand> {
  private readonly logger = new Logger(CreateAssetHandler.name);

  constructor(
    private readonly assetRepository: AssetPrismaRepository,
    private readonly estatePlanningRepository: EstatePlanningRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateAssetCommand): Promise<string> {
    const { estatePlanningId, data, correlationId } = command;
    this.logger.debug(`Executing CreateAssetCommand: ${correlationId}`);

    // 1. Validate Estate Planning exists
    const estatePlanning = await this.estatePlanningRepository.findById(estatePlanningId);
    if (!estatePlanning) {
      throw new EstatePlanningNotFoundException(estatePlanningId);
    }

    // 2. Generate asset ID (could be UUID from application layer)
    const assetId = await this.assetRepository.nextIdentity();

    // 3. Create Asset Aggregate
    const asset = Asset.create(
      assetId,
      data.name,
      data.type,
      estatePlanning.userId, // Asset owner is the estate planning user
      data.currency,
    );

    // 4. Apply additional domain logic based on DTO
    if (data.description) {
      // Note: Asset entity doesn't have a method to set description directly
      // This would need to be handled in the reconstitution or via a domain method
      // For now, we'll update through properties if needed
    }

    if (data.ownershipType) {
      asset.updateOwnership(data.ownershipType, data.ownershipShare || 100);
    }

    if (data.location) {
      asset.setKenyanLocation(
        data.location.county,
        data.location.subCounty,
        data.location.ward,
        data.location.village,
        data.location.landReferenceNumber,
        data.location.gpsCoordinates,
      );
    }

    if (data.identification) {
      asset.setKenyanIdentification(
        data.identification.titleDeedNumber,
        data.identification.registrationNumber,
        data.identification.kraPin,
        data.identification.identificationDetails,
      );
    }

    if (data.valuation) {
      asset.updateValuation(
        data.valuation.amount,
        data.valuation.valuationDate,
        data.valuation.valuationSource || 'Initial valuation',
      );
    }

    if (data.isMatrimonialProperty) {
      asset.markAsMatrimonialProperty(data.acquiredDuringMarriage || true);
    }

    if (data.requiresProbate !== undefined) {
      // Note: This is a property setter, would need domain method or set during reconstitution
    }

    // 5. Save asset
    const savedAsset = await this.assetRepository.save(asset);
    this.logger.debug(`Asset created with ID: ${savedAsset.id}`);

    // 6. Register asset with estate planning aggregate
    estatePlanning.registerAsset(assetId);
    await this.estatePlanningRepository.save(estatePlanning);
    this.logger.debug(`Asset registered with estate planning: ${estatePlanningId}`);

    // 7. Publish events (if using event sourcing)
    this.publisher.mergeObjectContext(asset).commit();

    return assetId;
  }
}
