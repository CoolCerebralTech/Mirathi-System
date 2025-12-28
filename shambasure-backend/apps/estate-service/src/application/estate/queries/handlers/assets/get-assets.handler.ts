import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AssetTypeVO } from 'apps/estate-service/src/domain/value-objects/asset-type.vo';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { Result } from '../../../../common/result';
import { GetEstateAssetsQuery } from '../../impl/assets.query';
import { AssetInventoryItemVM, AssetInventoryVM } from '../../view-models/asset-inventory.vm';

@QueryHandler(GetEstateAssetsQuery)
export class GetEstateAssetsHandler implements IQueryHandler<GetEstateAssetsQuery> {
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(query: GetEstateAssetsQuery): Promise<Result<AssetInventoryVM>> {
    const { dto } = query;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      let assets = estate.assets;
      if (dto.type) {
        const filterType = AssetTypeVO.create(dto.type);
        assets = assets.filter((a) => a.type.equals(filterType));
      }

      if (dto.status) assets = assets.filter((a) => a.status === dto.status);
      if (dto.isEncumbered !== undefined)
        assets = assets.filter((a) => a.isEncumbered === dto.isEncumbered);

      const items: AssetInventoryItemVM[] = assets.map((a) => ({
        id: a.id.toString(),
        name: a.name,
        type: a.type.value as any,
        description: a.description,
        currentValue: {
          amount: a.currentValue.amount,
          currency: a.currentValue.currency,
          formatted: a.currentValue.toString(),
        },
        status: a.status,
        isEncumbered: a.isEncumbered,
        encumbranceDetails: a.encumbranceDetails,
        isCoOwned: !!a.coOwnership && a.coOwnership.coOwners.length > 0,
        estateSharePercentage:
          (a.getDistributableValue().amount / a.currentValue.amount) * 100 || 100,
        identifier:
          a.landDetails?.toJSON().titleDeedNumber ||
          a.vehicleDetails?.toJSON().registrationNumber ||
          a.financialDetails?.toJSON().accountNumber ||
          'N/A',

        location: a.location,
      }));

      const totalValue = items.reduce((sum, i) => sum + i.currentValue.amount, 0);

      return Result.ok({
        items,
        totalValue: { amount: totalValue, currency: 'KES', formatted: `KES ${totalValue}` },
        totalCount: items.length,
        liquidAssetsValue: { amount: 0, currency: 'KES', formatted: 'KES 0' },
        illiquidAssetsValue: { amount: 0, currency: 'KES', formatted: 'KES 0' },
      });
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
