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
    if (!prismaLiquidation) return null;

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
      commissionAmountCurrency,
      netProceedsAmount,
      netProceedsCurrency,
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

    const commissionAmount = commissionAmountAmount
      ? MoneyVO.create({
          amount: Number(commissionAmountAmount),
          currency: commissionAmountCurrency || targetAmountCurrency || 'KES',
        })
      : undefined;

    const netProceeds = netProceedsAmount
      ? MoneyVO.create({
          amount: Number(netProceedsAmount),
          currency: netProceedsCurrency || targetAmountCurrency || 'KES',
        })
      : undefined;

    const liquidationProps = {
      assetId,
      estateId,
      liquidationType: this.mapToDomainLiquidationType(liquidationType),
      targetAmount,
      actualAmount,
      currency: targetAmountCurrency || 'KES',
      status: this.mapToDomainLiquidationStatus(status),
      approvedByCourt,
      courtOrderRef: courtOrderRef || undefined,
      buyerName: buyerName || undefined,
      buyerIdNumber: buyerIdNumber || undefined,
      saleDate: saleDate || undefined,
      initiatedAt: initiatedAt || undefined,
      completedAt: completedAt || undefined,
      cancelledAt: cancelledAt || undefined,
      commissionRate: commissionRate || undefined,
      commissionAmount,
      netProceeds,
      liquidationNotes: liquidationNotes || undefined,
      liquidatedBy: liquidatedBy || undefined,
    };

    return AssetLiquidation.create(liquidationProps, new UniqueEntityID(id));
  }

  /**
   * Convert Domain Entity to Prisma model
   */
  toPersistence(assetLiquidation: AssetLiquidation): Partial<PrismaAssetLiquidation> {
    const props = assetLiquidation.getProps();

    return {
      id: assetLiquidation.id.toString(),
      assetId: props.assetId,
      estateId: props.estateId,
      liquidationType: this.mapToPrismaLiquidationType(props.liquidationType),
      status: this.mapToPrismaLiquidationStatus(props.status),
      approvedByCourt: props.approvedByCourt,
      courtOrderRef: props.courtOrderRef || null,
      buyerName: props.buyerName || null,
      buyerIdNumber: props.buyerIdNumber || null,
      targetAmountAmount: props.targetAmount.amount,
      targetAmountCurrency: props.targetAmount.currency,
      actualAmountAmount: props.actualAmount?.amount || null,
      actualAmountCurrency: props.actualAmount?.currency || null,
      commissionRate: props.commissionRate || null,
      commissionAmountAmount: props.commissionAmount?.amount || null,
      commissionAmountCurrency: props.commissionAmount?.currency || null,
      netProceedsAmount: props.netProceeds?.amount || null,
      netProceedsCurrency: props.netProceeds?.currency || null,
      saleDate: props.saleDate || null,
      initiatedAt: props.initiatedAt || null,
      completedAt: props.completedAt || null,
      cancelledAt: props.cancelledAt || null,
      liquidationNotes: props.liquidationNotes || null,
      liquidatedBy: props.liquidatedBy || null,
    };
  }

  /**
   * Convert array of Prisma models to Domain Entities
   */
  toDomainList(prismaLiquidations: PrismaAssetLiquidation[]): AssetLiquidation[] {
    return prismaLiquidations
      .map((liquidation) => this.toDomain(liquidation))
      .filter((liquidation) => liquidation !== null);
  }

  /**
   * Convert array of Domain Entities to Prisma models
   */
  toPersistenceList(assetLiquidations: AssetLiquidation[]): Partial<PrismaAssetLiquidation>[] {
    return assetLiquidations.map((liquidation) => this.toPersistence(liquidation));
  }

  /**
   * Map Prisma liquidation type to Domain enum
   */
  private mapToDomainLiquidationType(prismaType: string): LiquidationType {
    switch (prismaType) {
      case 'PRIVATE_TREATY':
        return LiquidationType.PRIVATE_TREATY;
      case 'PUBLIC_AUCTION':
        return LiquidationType.PUBLIC_AUCTION;
      case 'SALE_TO_BENEFICIARY':
        return LiquidationType.SALE_TO_BENEFICIARY;
      case 'BUYBACK':
        return LiquidationType.BUYBACK;
      case 'MARKET_SALE':
        return LiquidationType.MARKET_SALE;
      default:
        throw new Error(`Unknown liquidation type: ${prismaType}`);
    }
  }

  /**
   * Map Domain liquidation type to Prisma enum
   */
  private mapToPrismaLiquidationType(domainType: LiquidationType): string {
    switch (domainType) {
      case LiquidationType.PRIVATE_TREATY:
        return 'PRIVATE_TREATY';
      case LiquidationType.PUBLIC_AUCTION:
        return 'PUBLIC_AUCTION';
      case LiquidationType.SALE_TO_BENEFICIARY:
        return 'SALE_TO_BENEFICIARY';
      case LiquidationType.BUYBACK:
        return 'BUYBACK';
      case LiquidationType.MARKET_SALE:
        return 'MARKET_SALE';
      default:
        throw new Error(`Unknown liquidation type: ${domainType}`);
    }
  }

  /**
   * Map Prisma liquidation status to Domain enum
   */
  private mapToDomainLiquidationStatus(prismaStatus: string): LiquidationStatus {
    switch (prismaStatus) {
      case 'DRAFT':
        return LiquidationStatus.DRAFT;
      case 'PENDING_APPROVAL':
        return LiquidationStatus.PENDING_APPROVAL;
      case 'APPROVED':
        return LiquidationStatus.APPROVED;
      case 'LISTED_FOR_SALE':
        return LiquidationStatus.LISTED_FOR_SALE;
      case 'AUCTION_SCHEDULED':
        return LiquidationStatus.AUCTION_SCHEDULED;
      case 'AUCTION_IN_PROGRESS':
        return LiquidationStatus.AUCTION_IN_PROGRESS;
      case 'SALE_PENDING':
        return LiquidationStatus.SALE_PENDING;
      case 'SALE_COMPLETED':
        return LiquidationStatus.SALE_COMPLETED;
      case 'PROCEEDS_RECEIVED':
        return LiquidationStatus.PROCEEDS_RECEIVED;
      case 'DISTRIBUTED':
        return LiquidationStatus.DISTRIBUTED;
      case 'CLOSED':
        return LiquidationStatus.CLOSED;
      case 'CANCELLED':
        return LiquidationStatus.CANCELLED;
      case 'FAILED':
        return LiquidationStatus.FAILED;
      case 'EXPIRED':
        return LiquidationStatus.EXPIRED;
      default:
        throw new Error(`Unknown liquidation status: ${prismaStatus}`);
    }
  }

  /**
   * Map Domain liquidation status to Prisma enum
   */
  private mapToPrismaLiquidationStatus(domainStatus: LiquidationStatus): string {
    switch (domainStatus) {
      case LiquidationStatus.DRAFT:
        return 'DRAFT';
      case LiquidationStatus.PENDING_APPROVAL:
        return 'PENDING_APPROVAL';
      case LiquidationStatus.APPROVED:
        return 'APPROVED';
      case LiquidationStatus.LISTED_FOR_SALE:
        return 'LISTED_FOR_SALE';
      case LiquidationStatus.AUCTION_SCHEDULED:
        return 'AUCTION_SCHEDULED';
      case LiquidationStatus.AUCTION_IN_PROGRESS:
        return 'AUCTION_IN_PROGRESS';
      case LiquidationStatus.SALE_PENDING:
        return 'SALE_PENDING';
      case LiquidationStatus.SALE_COMPLETED:
        return 'SALE_COMPLETED';
      case LiquidationStatus.PROCEEDS_RECEIVED:
        return 'PROCEEDS_RECEIVED';
      case LiquidationStatus.DISTRIBUTED:
        return 'DISTRIBUTED';
      case LiquidationStatus.CLOSED:
        return 'CLOSED';
      case LiquidationStatus.CANCELLED:
        return 'CANCELLED';
      case LiquidationStatus.FAILED:
        return 'FAILED';
      case LiquidationStatus.EXPIRED:
        return 'EXPIRED';
      default:
        throw new Error(`Unknown liquidation status: ${domainStatus}`);
    }
  }

  /**
   * Get liquidation statistics for reporting
   */
  getLiquidationStatistics(liquidations: AssetLiquidation[]): {
    totalCount: number;
    activeCount: number;
    completedCount: number;
    totalProceeds: MoneyVO;
    totalCommission: MoneyVO;
    averageCommissionRate: number;
  } {
    const activeLiquidations = liquidations.filter((l) => l.isActive());
    const completedLiquidations = liquidations.filter((l) => l.isCompleted());

    // Calculate total proceeds (from actual amounts where available, otherwise target)
    const totalProceeds = activeLiquidations.reduce((sum, liquidation) => {
      const props = liquidation.getProps();
      const amount = props.actualAmount || props.targetAmount;
      return sum.add(amount);
    }, MoneyVO.zero('KES'));

    // Calculate total commission
    const totalCommission = activeLiquidations.reduce((sum, liquidation) => {
      const props = liquidation.getProps();
      if (props.commissionAmount) {
        return sum.add(props.commissionAmount);
      }
      return sum;
    }, MoneyVO.zero('KES'));

    // Calculate average commission rate
    const liquidationsWithCommission = activeLiquidations.filter(
      (l) => l.getProps().commissionRate,
    );
    const averageCommissionRate =
      liquidationsWithCommission.length > 0
        ? liquidationsWithCommission.reduce((sum, l) => sum + l.getProps().commissionRate, 0) /
          liquidationsWithCommission.length
        : 0;

    return {
      totalCount: liquidations.length,
      activeCount: activeLiquidations.length,
      completedCount: completedLiquidations.length,
      totalProceeds,
      totalCommission,
      averageCommissionRate,
    };
  }

  /**
   * Filter liquidations by status
   */
  filterByStatus(liquidations: AssetLiquidation[], status: LiquidationStatus): AssetLiquidation[] {
    return liquidations.filter((liquidation) => liquidation.status === status);
  }

  /**
   * Get liquidations that generate cash
   */
  filterCashGeneratingLiquidations(liquidations: AssetLiquidation[]): AssetLiquidation[] {
    return liquidations.filter((liquidation) => liquidation.generatesCash());
  }

  /**
   * Get liquidations requiring court approval
   */
  filterCourtApprovalRequired(liquidations: AssetLiquidation[]): AssetLiquidation[] {
    const liquidationTypeHelper = {
      requiresCourtApproval: (type: LiquidationType) => {
        return [LiquidationType.PUBLIC_AUCTION, LiquidationType.SALE_TO_BENEFICIARY].includes(type);
      },
    };

    return liquidations.filter((liquidation) => {
      const props = liquidation.getProps();
      return liquidationTypeHelper.requiresCourtApproval(props.liquidationType);
    });
  }
}
