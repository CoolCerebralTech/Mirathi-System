import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { AssetCoOwner } from '../../../../../domain/entities/asset-co-owner.entity';
import { CoOwnershipType } from '../../../../../domain/enums/co-ownership-type.enum';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { Result } from '../../../../common/result';
import { AddAssetCoOwnerCommand } from '../../impl/assets/manage-asset-co-ownership.command';

@CommandHandler(AddAssetCoOwnerCommand)
export class AddAssetCoOwnerHandler implements ICommandHandler<AddAssetCoOwnerCommand> {
  private readonly logger = new Logger(AddAssetCoOwnerHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: AddAssetCoOwnerCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;

    this.logger.log(`Adding co-owner to asset ${dto.assetId} [CorrelationID: ${correlationId}]`);

    try {
      const estateId = new UniqueEntityID(dto.estateId);
      const estate = await this.estateRepository.findById(estateId);

      if (!estate) {
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      const asset = estate.assets.find((a) => a.id.toString() === dto.assetId);
      if (!asset) {
        return Result.fail(new Error(`Asset ${dto.assetId} not found in estate`));
      }

      let coOwner: AssetCoOwner;

      if (dto.ownershipType === CoOwnershipType.JOINT_TENANCY) {
        coOwner = AssetCoOwner.createJointTenancy(
          dto.assetId,
          dto.familyMemberId,
          dto.sharePercentage,
          dto.addedBy,
        );
      } else {
        coOwner = AssetCoOwner.createTenancyInCommon(
          dto.assetId,
          dto.familyMemberId,
          dto.sharePercentage,
          dto.addedBy,
        );
      }

      asset.addCoOwner(coOwner, dto.addedBy);

      if (dto.evidenceUrl) {
        coOwner.updateEvidence(dto.evidenceUrl, 'Initial evidence submission', dto.addedBy);
      }

      await this.estateRepository.save(estate);

      this.logger.log(`Co-owner added successfully.`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to add co-owner: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
