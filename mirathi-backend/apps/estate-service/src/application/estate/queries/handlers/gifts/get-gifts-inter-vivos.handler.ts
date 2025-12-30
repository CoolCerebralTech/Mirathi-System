import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { GiftStatus } from '../../../../../domain/entities/gift-inter-vivos.entity';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { Result } from '../../../../common/result';
import { GetGiftsInterVivosQuery } from '../../impl/gifts.query';
import { GiftItemVM, GiftListVM } from '../../view-models/gift-list.vm';

@QueryHandler(GetGiftsInterVivosQuery)
export class GetGiftsInterVivosHandler implements IQueryHandler<GetGiftsInterVivosQuery> {
  private readonly logger = new Logger(GetGiftsInterVivosHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(query: GetGiftsInterVivosQuery): Promise<Result<GiftListVM>> {
    const { dto } = query;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found: ${dto.estateId}`));

      // 1. Filter Gifts
      let gifts = estate.gifts;
      if (dto.includeInHotchpotOnly) {
        gifts = gifts.filter((g) => g.isIncludedInHotchpot());
      }
      if (dto.isContested !== undefined) {
        gifts = gifts.filter((g) => (g.status === GiftStatus.CONTESTED) === dto.isContested);
      }

      // 2. Map to VM
      const items: GiftItemVM[] = gifts.map((g) => {
        const hotchpotVal = g.getHotchpotValue();
        return {
          id: g.id.toString(),
          recipientId: g.recipientId,
          description: g.description,
          assetType: g.assetType,
          status: g.status,
          isContested: g.status === GiftStatus.CONTESTED,
          isSubjectToHotchpot: g.isSubjectToHotchpot,
          dateGiven: g.dateGiven,
          valueAtTimeOfGift: {
            amount: g.valueAtTimeOfGift.amount,
            currency: g.valueAtTimeOfGift.currency,
            formatted: g.valueAtTimeOfGift.toString(),
          },
          hotchpotValue: {
            amount: hotchpotVal.amount,
            currency: hotchpotVal.currency,
            formatted: hotchpotVal.toString(),
          },
        };
      });

      // 3. Aggregate S.35 Hotchpot Total
      const totalHotchpot = items.reduce((sum, i) => sum + i.hotchpotValue.amount, 0);

      return Result.ok({
        items,
        totalHotchpotAddBack: {
          amount: totalHotchpot,
          currency: 'KES',
          formatted: `KES ${totalHotchpot}`,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch gifts: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error as Error);
    }
  }
}
