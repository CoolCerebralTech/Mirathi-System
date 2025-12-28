import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { Asset } from '../../../../../domain/entities/asset.entity';
import { AssetType } from '../../../../../domain/enums/asset-type.enum';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import {
  BusinessAssetDetailsVO,
  FinancialAssetDetailsVO,
  LandAssetDetailsVO,
  VehicleAssetDetailsVO,
} from '../../../../../domain/value-objects/asset-details';
import { AssetTypeVO } from '../../../../../domain/value-objects/asset-type.vo';
import { KenyanCountyVO } from '../../../../../domain/value-objects/kenyan-county.vo';
import { MoneyVO } from '../../../../../domain/value-objects/money.vo';
import { Result } from '../../../../common/result';
import { AddAssetCommand } from '../../impl/assets/add-asset.command';

@CommandHandler(AddAssetCommand)
export class AddAssetHandler implements ICommandHandler<AddAssetCommand> {
  private readonly logger = new Logger(AddAssetHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: AddAssetCommand): Promise<Result<void>> {
    const { dto, userId, correlationId } = command;

    this.logger.log(
      `Adding asset '${dto.name}' to Estate: ${dto.estateId} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Convert String ID to Domain ID
      const estateId = new UniqueEntityID(dto.estateId);

      // 2. Load Aggregate
      const estate = await this.estateRepository.findById(estateId);
      if (!estate) {
        this.logger.warn(`Estate not found: ${dto.estateId}`);
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      // 3. Create Value Objects
      const currentValue = MoneyVO.create({
        amount: dto.currentValue.amount,
        currency: dto.currentValue.currency,
      });

      // 4. Polymorphic Factory Logic
      let asset: Asset;

      switch (dto.type) {
        case AssetType.LAND: {
          if (!dto.landDetails) return Result.fail(new Error('Land details missing'));

          const landDetails = LandAssetDetailsVO.create({
            titleDeedNumber: dto.landDetails.titleDeedNumber,
            landReferenceNumber: dto.landDetails.landReferenceNumber,
            county: new KenyanCountyVO(dto.landDetails.county),
            subCounty: dto.landDetails.subCounty,
            locationDescription: dto.landDetails.locationDescription,
            acreage: dto.landDetails.acreage,
            landUse: dto.landDetails.landUse,
            registeredOwner: dto.landDetails.registeredOwner,
          });

          asset = Asset.createLandAsset(dto.estateId, dto.name, currentValue, landDetails, {
            description: dto.description,
            location: dto.location,
            purchaseDate: dto.purchaseDate,
          });
          break;
        }

        case AssetType.VEHICLE: {
          if (!dto.vehicleDetails) return Result.fail(new Error('Vehicle details missing'));

          const vehicleDetails = VehicleAssetDetailsVO.create(dto.vehicleDetails);
          asset = Asset.createVehicleAsset(dto.estateId, dto.name, currentValue, vehicleDetails, {
            description: dto.description,
            location: dto.location,
            purchaseDate: dto.purchaseDate,
          });
          break;
        }

        case AssetType.FINANCIAL: {
          if (!dto.financialDetails) return Result.fail(new Error('Financial details missing'));

          const financialDetails = FinancialAssetDetailsVO.create(dto.financialDetails);
          asset = Asset.create({
            estateId: dto.estateId,
            name: dto.name,
            type: AssetTypeVO.createFinancial(),
            currentValue,
            financialDetails,
            description: dto.description,
            status: 'ACTIVE' as any,
            isEncumbered: false,
            valuations: [],
            isVerified: false,
            location: dto.location,
            purchaseDate: dto.purchaseDate,
          });
          break;
        }

        case AssetType.BUSINESS: {
          if (!dto.businessDetails) return Result.fail(new Error('Business details missing'));

          const businessDetails = BusinessAssetDetailsVO.create({
            ...dto.businessDetails,
            businessType: dto.businessDetails.businessType as
              | 'SOLE_PROPRIETORSHIP'
              | 'PARTNERSHIP'
              | 'LIMITED_COMPANY'
              | 'LLP',
          });
          asset = Asset.create({
            estateId: dto.estateId,
            name: dto.name,
            type: AssetTypeVO.createBusiness(),
            currentValue,
            businessDetails,
            description: dto.description,
            status: 'ACTIVE' as any,
            isEncumbered: false,
            valuations: [],
            isVerified: false,
            location: dto.location,
            purchaseDate: dto.purchaseDate,
          });
          break;
        }

        default:
          return Result.fail(new Error(`Unsupported asset type: ${dto.type}`));
      }

      // 5. Modify Aggregate
      estate.addAsset(asset, userId);

      // 6. Persist
      await this.estateRepository.save(estate);

      this.logger.log(`Asset ${asset.id.toString()} added successfully.`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to add asset: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
