// src/estate-service/src/infrastructure/persistence/mappers/asset-liquidation.mapper.ts
import { Injectable } from '@nestjs/common';
import { AssetLiquidation as PrismaAssetLiquidation } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { AssetLiquidation } from '../../../domain/entities/asset-liquidation.entity';
import { LiquidationStatus } from '../../../domain/enums/liquidation-status.enum';
import { LiquidationType } from '../../../domain/enums/liquidation-type.enum';
import { MoneyVO } from '../../../domain/value-objects/money.vo';

@Injectable()
export class AssetLiquidationMapper {
  /**
   * Convert Prisma model to Domain Entity
   */
  toDomain(prismaLiquidation: PrismaAssetLiquidation): AssetLiquidation {
    if (!prismaLiquidation) throw new Error('Cannot map null Prisma object');

    const {
      id,
      assetId,
      estateId,
      liquidationType,
      status,
      approvedByCourt,
      courtOrderRef,
      buyerName,
      buyerIdNumber,
      targetAmountAmount,
      targetAmountCurrency,
      actualAmountAmount,
      actualAmountCurrency,
      commissionRate,
      commissionAmountAmount,
      // commissionAmountCurrency, // Note: Prisma Schema uses main currency
      netProceedsAmount,
      // netProceedsCurrency, // Note: Prisma Schema uses main currency
      currency, // The main currency fallback
      saleDate,
      initiatedAt,
      completedAt,
      cancelledAt,
      liquidationNotes,
      liquidatedBy,
    } = prismaLiquidation;

    // Create MoneyVO objects
    const targetAmount = MoneyVO.create({
      amount: Number(targetAmountAmount),
      currency: targetAmountCurrency || 'KES',
    });

    const actualAmount = actualAmountAmount
      ? MoneyVO.create({
          amount: Number(actualAmountAmount),
          currency: actualAmountCurrency || targetAmountCurrency || 'KES',
        })
      : undefined;

    // Use main currency or target currency for commission/net proceeds
    const derivedCurrency = currency || targetAmountCurrency || 'KES';

    const commissionAmount = commissionAmountAmount
      ? MoneyVO.create({
          amount: Number(commissionAmountAmount),
          currency: derivedCurrency,
        })
      : undefined;

    const netProceeds = netProceedsAmount
      ? MoneyVO.create({
          amount: Number(netProceedsAmount),
          currency: derivedCurrency,
        })
      : undefined;

    const liquidationProps = {
      assetId,
      estateId,
      liquidationType: this.mapToDomainLiquidationType(liquidationType),
      targetAmount,
      actualAmount,
      currency: derivedCurrency,
      status: this.mapToDomainLiquidationStatus(status),
      approvedByCourt,
      courtOrderRef: courtOrderRef || undefined,
      buyerName: buyerName || undefined,
      buyerIdNumber: buyerIdNumber || undefined,
      saleDate: saleDate || undefined,
      initiatedAt: initiatedAt || undefined,
      completedAt: completedAt || undefined,
      cancelledAt: cancelledAt || undefined,
      commissionRate: commissionRate !== null ? Number(commissionRate) : undefined,
      commissionAmount,
      netProceeds,
      liquidationNotes: liquidationNotes || undefined,
      liquidatedBy: liquidatedBy || undefined,
    };

    return AssetLiquidation.create(liquidationProps, new UniqueEntityID(id));
  }

  /**
   * Convert Domain Entity to Prisma Persistence Object
   * Returning 'any' allows JS numbers for Decimal fields (Prisma Client accepts this)
   */
  toPersistence(assetLiquidation: AssetLiquidation): any {
    // Use public getters to respect encapsulation

    return {
      id: assetLiquidation.id.toString(),
      assetId: assetLiquidation.assetId,
      estateId: assetLiquidation.estateId,

      // Enums: Cast to any to bypass strict type check between Domain Enum and DB Enum type
      liquidationType: this.mapToPrismaLiquidationType(assetLiquidation.liquidationType) as any,
      status: this.mapToPrismaLiquidationStatus(assetLiquidation.status) as any,

      approvedByCourt: assetLiquidation.approvedByCourt,
      courtOrderRef: assetLiquidation.courtOrderRef || null,
      buyerName: assetLiquidation.buyerName || null,
      buyerIdNumber: assetLiquidation.buyerIdNumber || null,

      // Decimals: Passing JS numbers is valid for Prisma Input
      targetAmountAmount: assetLiquidation.targetAmount.amount,
      targetAmountCurrency: assetLiquidation.targetAmount.currency,

      actualAmountAmount: assetLiquidation.actualAmount?.amount || null,
      actualAmountCurrency: assetLiquidation.actualAmount?.currency || null,

      commissionRate: assetLiquidation.commissionRate || null,

      commissionAmountAmount: assetLiquidation.commissionAmount?.amount || null,
      // Note: Schema doesn't have commissionAmountCurrency, ignoring

      netProceedsAmount: assetLiquidation.netProceeds?.amount || null,
      // Note: Schema doesn't have netProceedsCurrency, ignoring

      currency: assetLiquidation.currency, // Main currency field

      saleDate: assetLiquidation.saleDate || null,

      // Accessing metadata properties via explicit casting if getters are missing on Entity
      initiatedAt: (assetLiquidation as any).initiatedAt || null,
      completedAt: (assetLiquidation as any).completedAt || null,
      cancelledAt: (assetLiquidation as any).cancelledAt || null,
      liquidationNotes: assetLiquidation.liquidationNotes || null,
      liquidatedBy: (assetLiquidation as any).liquidatedBy || null,
    };
  }

  /**
   * Convert array of Prisma models to Domain Entities
   */
  toDomainList(prismaLiquidations: PrismaAssetLiquidation[]): AssetLiquidation[] {
    return prismaLiquidations
      .map((liquidation) => {
        try {
          return this.toDomain(liquidation);
        } catch (e) {
          console.error(`Failed to map liquidation ${liquidation.id}:`, e);
          return null;
        }
      })
      .filter((liquidation): liquidation is AssetLiquidation => liquidation !== null);
  }

  /**
   * Convert array of Domain Entities to Persistence Objects
   */
  toPersistenceList(assetLiquidations: AssetLiquidation[]): any[] {
    return assetLiquidations.map((liquidation) => this.toPersistence(liquidation));
  }

  // --- MAPPING HELPERS ---

  private mapToDomainLiquidationType(prismaType: string): LiquidationType {
    switch (prismaType) {
      case 'PRIVATE_TREATY':
        return LiquidationType.PRIVATE_SALE;
      case 'PUBLIC_AUCTION':
        return LiquidationType.AUCTION;
      case 'SALE_TO_BENEFICIARY':
        return LiquidationType.FAMILY_SALE;
      case 'BUYBACK':
        return LiquidationType.REDEMPTION;
      case 'MARKET_SALE':
        return LiquidationType.NEGOTIATED_SALE;
      default:
        return LiquidationType.PRIVATE_SALE; // Safe default
    }
  }

  private mapToPrismaLiquidationType(domainType: LiquidationType): string {
    switch (domainType) {
      case LiquidationType.PRIVATE_SALE:
        return 'PRIVATE_TREATY';
      case LiquidationType.AUCTION:
        return 'PUBLIC_AUCTION';
      case LiquidationType.FAMILY_SALE:
        return 'SALE_TO_BENEFICIARY';
      case LiquidationType.REDEMPTION:
        return 'BUYBACK';
      case LiquidationType.NEGOTIATED_SALE:
        return 'MARKET_SALE';
      // Mappings for other domain types to nearest DB enum
      case LiquidationType.TENDER:
        return 'PUBLIC_AUCTION';
      case LiquidationType.COURT_ORDERED_SALE:
        return 'PUBLIC_AUCTION';
      case LiquidationType.FORCED_SALE:
        return 'PUBLIC_AUCTION';
      case LiquidationType.TRANSFER_IN_LIEU:
        return 'SALE_TO_BENEFICIARY';
      case LiquidationType.DONATION:
        return 'PRIVATE_TREATY';
      case LiquidationType.DESTRUCTION:
        return 'PRIVATE_TREATY';
      default:
        return 'PRIVATE_TREATY';
    }
  }

  private mapToDomainLiquidationStatus(prismaStatus: string): LiquidationStatus {
    // Safety check if DB has a status not in Domain Enum
    const status = prismaStatus as LiquidationStatus;
    if (Object.values(LiquidationStatus).includes(status)) {
      return status;
    }
    return LiquidationStatus.DRAFT; // Fallback
  }

  private mapToPrismaLiquidationStatus(domainStatus: LiquidationStatus): string {
    return domainStatus.toString();
  }
}
