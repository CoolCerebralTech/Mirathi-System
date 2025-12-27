// src/estate-service/src/infrastructure/persistence/prisma/mappers/gift-inter-vivos.mapper.ts
import { Injectable } from '@nestjs/common';
import { GiftInterVivos as PrismaGiftInterVivos } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { GiftInterVivos, GiftStatus } from '../../../domain/entities/gift-inter-vivos.entity';
import { AssetType } from '../../../domain/enums/asset-type.enum';
import { MoneyVO } from '../../../domain/value-objects/money.vo';

@Injectable()
export class GiftInterVivosMapper {
  /**
   * Convert Prisma model to Domain Entity
   */
  toDomain(prismaGift: PrismaGiftInterVivos): GiftInterVivos {
    if (!prismaGift) return null;

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

    // Create MoneyVO object
    const valueAtTimeOfGift = MoneyVO.create({
      amount: Number(valueAtTimeOfGiftAmount),
      currency: valueAtTimeOfGiftCurrency || 'KES',
    });

    // Parse witnesses array
    const parsedWitnesses = witnesses
      ? Array.isArray(witnesses)
        ? witnesses
        : JSON.parse(witnesses as string)
      : [];

    // Create GiftInterVivosProps
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
      hotchpotMultiplier: hotchpotMultiplier || undefined,
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

  /**
   * Convert Domain Entity to Prisma model
   */
  toPersistence(gift: GiftInterVivos): Partial<PrismaGiftInterVivos> {
    const props = gift.getProps();

    return {
      id: gift.id.toString(),
      estateId: props.estateId,
      recipientId: props.recipientId,
      recipientName: props.recipientName || null,
      description: props.description,
      assetType: this.mapToPrismaAssetType(props.assetType),
      valueAtTimeOfGiftAmount: props.valueAtTimeOfGift.amount,
      valueAtTimeOfGiftCurrency: props.valueAtTimeOfGift.currency,
      dateGiven: props.dateGiven,
      isFormalGift: props.isFormalGift,
      deedOfGiftRef: props.deedOfGiftRef || null,
      witnesses: props.witnesses || null,
      isSubjectToHotchpot: props.isSubjectToHotchpot,
      hotchpotMultiplier: props.hotchpotMultiplier || null,
      status: this.mapToPrismaGiftStatus(props.status),
      contestReason: props.contestReason || null,
      contestedBy: props.contestedBy || null,
      contestedAt: props.contestedAt || null,
      courtOrderRef: props.courtOrderRef || null,
      givenDuringLifetime: props.givenDuringLifetime,
      relationshipToDeceased: props.relationshipToDeceased || null,
      notes: props.notes || null,
      requiresReconciliation: props.requiresReconciliation,
    };
  }

  /**
   * Convert array of Prisma models to Domain Entities
   */
  toDomainList(prismaGifts: PrismaGiftInterVivos[]): GiftInterVivos[] {
    return prismaGifts.map((gift) => this.toDomain(gift)).filter((gift) => gift !== null);
  }

  /**
   * Convert array of Domain Entities to Prisma models
   */
  toPersistenceList(gifts: GiftInterVivos[]): Partial<PrismaGiftInterVivos>[] {
    return gifts.map((gift) => this.toPersistence(gift));
  }

  /**
   * Map Prisma asset type to Domain enum
   */
  private mapToDomainAssetType(prismaType: string): AssetType {
    switch (prismaType) {
      case 'LAND_PARCEL':
      case 'PROPERTY':
        return AssetType.LAND_PARCEL;
      case 'FINANCIAL_ASSET':
        return AssetType.FINANCIAL_ASSET;
      case 'DIGITAL_ASSET':
        return AssetType.DIGITAL_ASSET;
      case 'BUSINESS_INTEREST':
        return AssetType.BUSINESS_INTEREST;
      case 'VEHICLE':
        return AssetType.VEHICLE;
      case 'INTELLECTUAL_PROPERTY':
        return AssetType.INTELLECTUAL_PROPERTY;
      case 'LIVESTOCK':
        return AssetType.LIVESTOCK;
      case 'PERSONAL_EFFECTS':
        return AssetType.PERSONAL_EFFECTS;
      case 'OTHER':
        return AssetType.OTHER;
      default:
        throw new Error(`Unknown asset type: ${prismaType}`);
    }
  }

  /**
   * Map Domain asset type to Prisma enum
   */
  private mapToPrismaAssetType(domainType: AssetType): string {
    switch (domainType) {
      case AssetType.LAND_PARCEL:
        return 'LAND_PARCEL';
      case AssetType.FINANCIAL_ASSET:
        return 'FINANCIAL_ASSET';
      case AssetType.DIGITAL_ASSET:
        return 'DIGITAL_ASSET';
      case AssetType.BUSINESS_INTEREST:
        return 'BUSINESS_INTEREST';
      case AssetType.VEHICLE:
        return 'VEHICLE';
      case AssetType.INTELLECTUAL_PROPERTY:
        return 'INTELLECTUAL_PROPERTY';
      case AssetType.LIVESTOCK:
        return 'LIVESTOCK';
      case AssetType.PERSONAL_EFFECTS:
        return 'PERSONAL_EFFECTS';
      case AssetType.OTHER:
        return 'OTHER';
      default:
        throw new Error(`Unknown asset type: ${domainType}`);
    }
  }

  /**
   * Map Prisma gift status to Domain enum
   */
  private mapToDomainGiftStatus(prismaStatus: string): GiftStatus {
    switch (prismaStatus) {
      case 'CONFIRMED':
        return GiftStatus.CONFIRMED;
      case 'CONTESTED':
        return GiftStatus.CONTESTED;
      case 'EXCLUDED':
        return GiftStatus.EXCLUDED;
      case 'RECLASSIFIED_AS_LOAN':
        return GiftStatus.RECLASSIFIED_AS_LOAN;
      case 'VOID':
        return GiftStatus.VOID;
      default:
        throw new Error(`Unknown gift status: ${prismaStatus}`);
    }
  }

  /**
   * Map Domain gift status to Prisma enum
   */
  private mapToPrismaGiftStatus(domainStatus: GiftStatus): string {
    switch (domainStatus) {
      case GiftStatus.CONFIRMED:
        return 'CONFIRMED';
      case GiftStatus.CONTESTED:
        return 'CONTESTED';
      case GiftStatus.EXCLUDED:
        return 'EXCLUDED';
      case GiftStatus.RECLASSIFIED_AS_LOAN:
        return 'RECLASSIFIED_AS_LOAN';
      case GiftStatus.VOID:
        return 'VOID';
      default:
        throw new Error(`Unknown gift status: ${domainStatus}`);
    }
  }

  /**
   * Get gift statistics for hotchpot calculation
   */
  getGiftStatistics(gifts: GiftInterVivos[]): {
    totalCount: number;
    confirmedCount: number;
    totalHotchpotValue: MoneyVO;
    byAssetType: Record<string, number>;
    byStatus: Record<string, number>;
    hotchpotEligibleGifts: GiftInterVivos[];
    contestedGifts: GiftInterVivos[];
  } {
    const hotchpotEligibleGifts = gifts.filter((gift) => gift.isIncludedInHotchpot());
    const contestedGifts = gifts.filter((gift) => gift.status === GiftStatus.CONTESTED);

    // Calculate total hotchpot value
    const totalHotchpotValue = hotchpotEligibleGifts.reduce(
      (sum, gift) => sum.add(gift.getHotchpotValue()),
      MoneyVO.zero('KES'),
    );

    // Count by asset type
    const byAssetType = gifts.reduce(
      (acc, gift) => {
        const assetType = gift.assetType;
        acc[assetType] = (acc[assetType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Count by status
    const byStatus = gifts.reduce(
      (acc, gift) => {
        const status = gift.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

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

  /**
   * Filter gifts included in hotchpot
   */
  filterHotchpotEligible(gifts: GiftInterVivos[]): GiftInterVivos[] {
    return gifts.filter((gift) => gift.isIncludedInHotchpot());
  }

  /**
   * Filter gifts by recipient
   */
  filterByRecipient(gifts: GiftInterVivos[], recipientId: string): GiftInterVivos[] {
    return gifts.filter((gift) => gift.recipientId === recipientId);
  }

  /**
   * Calculate total gifts value for a recipient
   */
  calculateTotalGiftsForRecipient(gifts: GiftInterVivos[], recipientId: string): MoneyVO {
    const recipientGifts = this.filterByRecipient(gifts, recipientId);
    return recipientGifts.reduce(
      (sum, gift) => sum.add(gift.valueAtTimeOfGift),
      MoneyVO.zero('KES'),
    );
  }

  /**
   * Prepare gift data for hotchpot calculation report
   */
  prepareHotchpotReport(gifts: GiftInterVivos[]): Array<{
    recipientId: string;
    recipientName?: string;
    totalGifts: number;
    hotchpotValue: number;
    giftCount: number;
    relationship?: string;
  }> {
    const recipientMap = new Map<
      string,
      {
        recipientId: string;
        recipientName?: string;
        totalGifts: MoneyVO;
        hotchpotValue: MoneyVO;
        giftCount: number;
        relationship?: string;
      }
    >();

    gifts.forEach((gift) => {
      const props = gift.getProps();
      const recipientId = props.recipientId;

      if (!recipientMap.has(recipientId)) {
        recipientMap.set(recipientId, {
          recipientId,
          recipientName: props.recipientName,
          totalGifts: MoneyVO.zero('KES'),
          hotchpotValue: MoneyVO.zero('KES'),
          giftCount: 0,
          relationship: props.relationshipToDeceased,
        });
      }

      const record = recipientMap.get(recipientId)!;
      record.totalGifts = record.totalGifts.add(props.valueAtTimeOfGift);
      record.hotchpotValue = record.hotchpotValue.add(gift.getHotchpotValue());
      record.giftCount += 1;
    });

    return Array.from(recipientMap.values()).map((record) => ({
      ...record,
      totalGifts: record.totalGifts.amount,
      hotchpotValue: record.hotchpotValue.amount,
    }));
  }

  /**
   * Validate gifts for S.35(3) hotchpot compliance
   */
  validateHotchpotCompliance(gifts: GiftInterVivos[]): {
    isValid: boolean;
    issues: string[];
    totalHotchpotValue: number;
  } {
    const issues: string[] = [];
    const now = new Date();

    gifts.forEach((gift) => {
      const props = gift.getProps();

      // Check for expired gifts (statute barred)
      const yearsAgo = (now.getTime() - props.dateGiven.getTime()) / (1000 * 3600 * 24 * 365);
      if (yearsAgo > 12) {
        issues.push(
          `Gift ${gift.id.toString()} given ${yearsAgo.toFixed(1)} years ago may be statute barred`,
        );
      }

      // Check for high-value gifts without formal documentation
      if (gift.requiresFormalDocumentation() && !props.isFormalGift) {
        issues.push(
          `High-value gift ${gift.id.toString()} (${props.valueAtTimeOfGift.toString()}) lacks formal documentation`,
        );
      }

      // Check for contested gifts
      if (props.status === GiftStatus.CONTESTED) {
        issues.push(`Gift ${gift.id.toString()} is contested by ${props.contestedBy || 'unknown'}`);
      }
    });

    const hotchpotEligibleGifts = this.filterHotchpotEligible(gifts);
    const totalHotchpotValue = hotchpotEligibleGifts.reduce(
      (sum, gift) => sum + gift.getHotchpotValue().amount,
      0,
    );

    return {
      isValid: issues.length === 0,
      issues,
      totalHotchpotValue,
    };
  }

  /**
   * Prepare bulk gift creation data
   */
  prepareBulkCreateData(
    estateId: string,
    gifts: Array<{
      recipientId: string;
      recipientName?: string;
      description: string;
      assetType: AssetType;
      value: MoneyVO;
      dateGiven: Date;
      isFormalGift?: boolean;
      relationshipToDeceased?: string;
    }>,
  ): Partial<PrismaGiftInterVivos>[] {
    return gifts.map((gift) => ({
      id: new UniqueEntityID().toString(),
      estateId,
      recipientId: gift.recipientId,
      recipientName: gift.recipientName || null,
      description: gift.description,
      assetType: this.mapToPrismaAssetType(gift.assetType),
      valueAtTimeOfGiftAmount: gift.value.amount,
      valueAtTimeOfGiftCurrency: gift.value.currency,
      dateGiven: gift.dateGiven,
      isFormalGift: gift.isFormalGift || false,
      isSubjectToHotchpot: true,
      givenDuringLifetime: true,
      relationshipToDeceased: gift.relationshipToDeceased || null,
      status: 'CONFIRMED',
      requiresReconciliation: !gift.isFormalGift,
    }));
  }
}
