// src/estate-service/src/infrastructure/persistence/mappers/gift-inter-vivos.mapper.ts
import { Injectable } from '@nestjs/common';
import { GiftInterVivos as PrismaGiftInterVivos } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { GiftInterVivos, GiftStatus } from '../../../domain/entities/gift-inter-vivos.entity';
import { AssetType } from '../../../domain/enums/asset-type.enum';
import { MoneyVO } from '../../../domain/value-objects/money.vo';

@Injectable()
export class GiftInterVivosMapper {
  toDomain(prismaGift: PrismaGiftInterVivos): GiftInterVivos {
    if (!prismaGift) throw new Error('Cannot map null Prisma object');

    const {
      id,
      estateId,
      recipientId,
      recipientName,
      description,
      assetType,
      valueAtTimeOfGiftAmount,
      valueAtTimeOfGiftCurrency,
      dateGiven,
      isFormalGift,
      deedOfGiftRef,
      witnesses,
      isSubjectToHotchpot,
      hotchpotMultiplier,
      status,
      contestReason,
      contestedBy,
      contestedAt,
      courtOrderRef,
      givenDuringLifetime,
      relationshipToDeceased,
      notes,
      requiresReconciliation,
    } = prismaGift;

    const valueAtTimeOfGift = MoneyVO.create({
      amount: Number(valueAtTimeOfGiftAmount),
      currency: valueAtTimeOfGiftCurrency || 'KES',
    });

    const parsedWitnesses = witnesses
      ? Array.isArray(witnesses)
        ? witnesses
        : JSON.parse(witnesses as unknown as string)
      : [];

    const giftProps = {
      estateId,
      recipientId,
      recipientName: recipientName || undefined,
      description,
      assetType: this.mapToDomainAssetType(assetType),
      valueAtTimeOfGift,
      dateGiven,
      isFormalGift,
      deedOfGiftRef: deedOfGiftRef || undefined,
      witnesses: parsedWitnesses,
      isSubjectToHotchpot,
      hotchpotMultiplier: hotchpotMultiplier !== null ? Number(hotchpotMultiplier) : undefined,
      status: this.mapToDomainGiftStatus(status),
      contestReason: contestReason || undefined,
      contestedBy: contestedBy || undefined,
      contestedAt: contestedAt || undefined,
      courtOrderRef: courtOrderRef || undefined,
      givenDuringLifetime,
      relationshipToDeceased: relationshipToDeceased || undefined,
      notes: notes || undefined,
      requiresReconciliation,
    };

    return GiftInterVivos.create(giftProps, new UniqueEntityID(id));
  }

  toPersistence(gift: GiftInterVivos): any {
    // USE PUBLIC GETTERS

    return {
      id: gift.id.toString(),
      estateId: gift.estateId,
      recipientId: gift.recipientId,
      recipientName: gift.recipientName || null,
      description: gift.description,

      assetType: this.mapToPrismaAssetType(gift.assetType),

      valueAtTimeOfGiftAmount: gift.valueAtTimeOfGift.amount,
      valueAtTimeOfGiftCurrency: gift.valueAtTimeOfGift.currency,

      dateGiven: gift.dateGiven,
      isFormalGift: gift.isFormalGift,
      deedOfGiftRef: gift.deedOfGiftRef || null,
      witnesses: gift.witnesses || [], // Scalar list

      isSubjectToHotchpot: gift.isSubjectToHotchpot,
      hotchpotMultiplier: gift.hotchpotMultiplier || null,

      status: this.mapToPrismaGiftStatus(gift.status) as any, // Cast to Prisma Enum

      contestReason: gift.contestReason || null,
      contestedBy: gift.contestedBy || null,
      contestedAt: gift.contestedAt || null,
      courtOrderRef: gift.courtOrderRef || null,

      givenDuringLifetime: gift.givenDuringLifetime,
      relationshipToDeceased: gift.relationshipToDeceased || null,
      notes: gift.notes || null,
      requiresReconciliation: gift.requiresReconciliation,
    };
  }

  toDomainList(prismaGifts: PrismaGiftInterVivos[]): GiftInterVivos[] {
    if (!prismaGifts) return [];
    return prismaGifts
      .map((gift) => {
        try {
          return this.toDomain(gift);
        } catch {
          return null;
        }
      })
      .filter((gift): gift is GiftInterVivos => gift !== null);
  }

  toPersistenceList(gifts: GiftInterVivos[]): any[] {
    return gifts.map((gift) => this.toPersistence(gift));
  }

  private mapToDomainAssetType(prismaType: string): AssetType {
    // Map using enum keys or fallbacks
    // Assuming AssetType (Domain) is string enum compatible with strings
    try {
      return prismaType as AssetType;
    } catch {
      return AssetType.OTHER;
    }
  }

  private mapToPrismaAssetType(domainType: AssetType): string {
    return domainType.toString();
  }

  private mapToDomainGiftStatus(prismaStatus: string): GiftStatus {
    return prismaStatus as GiftStatus;
  }

  private mapToPrismaGiftStatus(domainStatus: GiftStatus): string {
    return domainStatus.toString();
  }

  getGiftStatistics(gifts: GiftInterVivos[]) {
    const hotchpotEligibleGifts = gifts.filter((gift) => gift.isIncludedInHotchpot());
    const contestedGifts = gifts.filter((gift) => gift.status === GiftStatus.CONTESTED);

    const totalHotchpotValue = hotchpotEligibleGifts.reduce(
      (sum, gift) => sum.add(gift.getHotchpotValue()),
      MoneyVO.zero('KES'),
    );

    const byAssetType = gifts.reduce((acc: any, gift) => {
      const assetType = gift.assetType;
      acc[assetType] = (acc[assetType] || 0) + 1;
      return acc;
    }, {});

    const byStatus = gifts.reduce((acc: any, gift) => {
      const status = gift.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalCount: gifts.length,
      confirmedCount: gifts.filter((g) => g.status === GiftStatus.CONFIRMED).length,
      totalHotchpotValue,
      byAssetType,
      byStatus,
      hotchpotEligibleGifts,
      contestedGifts,
    };
  }
}
