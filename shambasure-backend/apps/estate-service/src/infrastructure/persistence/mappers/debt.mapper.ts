// src/estate-service/src/infrastructure/persistence/mappers/debt.mapper.ts
import { Injectable } from '@nestjs/common';
import { Debt as PrismaDebt } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { Debt } from '../../../domain/entities/debt.entity';
import { DebtStatus } from '../../../domain/enums/debt-status.enum';
import { DebtTier } from '../../../domain/enums/debt-tier.enum';
import { DebtType } from '../../../domain/enums/debt-type.enum';
import { DebtPriorityVO } from '../../../domain/value-objects/debt-priority.vo';
import { MoneyVO } from '../../../domain/value-objects/money.vo';

@Injectable()
export class DebtMapper {
  /**
   * Convert Prisma model to Domain Entity
   */
  toDomain(prismaDebt: PrismaDebt): Debt {
    if (!prismaDebt) return null;

    const {
      id,
      estateId,
      creditorName,
      description,
      initialAmountAmount,
      initialAmountCurrency,
      outstandingBalanceAmount,
      outstandingBalanceCurrency,
      interestRate,
      currency,
      priorityTier,
      type,
      isSecured,
      securedAssetId,
      status,
      isStatuteBarred,
      dueDate,
      disputeReason,
      lastPaymentDate,
      totalPaidAmount,
      creditorContact,
      referenceNumber,
      evidenceDocumentId,
      requiresCourtApproval,
      createdAt,
      updatedAt,
    } = prismaDebt;

    // Create MoneyVO objects
    const initialAmount = MoneyVO.create({
      amount: Number(initialAmountAmount),
      currency: initialAmountCurrency || 'KES',
    });

    const outstandingBalance = MoneyVO.create({
      amount: Number(outstandingBalanceAmount),
      currency: outstandingBalanceCurrency || 'KES',
    });

    const totalPaid = MoneyVO.create({
      amount: Number(totalPaidAmount || 0),
      currency: outstandingBalanceCurrency || 'KES',
    });

    // Map priority tier to DebtPriorityVO
    const priority = DebtPriorityVO.create(priorityTier);

    // Create DebtProps
    const debtProps = {
      estateId,
      creditorName,
      description,
      initialAmount,
      outstandingBalance,
      interestRate: Number(interestRate),
      currency: currency || 'KES',
      priority,
      tier: this.mapToDomainDebtTier(priorityTier),
      type: this.mapToDomainDebtType(type),
      isSecured,
      securedAssetId: securedAssetId || undefined,
      status: this.mapToDomainDebtStatus(status),
      isStatuteBarred,
      dueDate: dueDate || undefined,
      disputeReason: disputeReason || undefined,
      lastPaymentDate: lastPaymentDate || undefined,
      totalPaid,
      creditorContact: creditorContact || undefined,
      referenceNumber: referenceNumber || undefined,
      evidenceDocumentId: evidenceDocumentId || undefined,
      requiresCourtApproval: requiresCourtApproval || undefined,
      createdAt,
      updatedAt,
    };

    return Debt.create(debtProps, new UniqueEntityID(id));
  }

  /**
   * Convert Domain Entity to Prisma model
   */
  toPersistence(debt: Debt): Partial<PrismaDebt> {
    const props = debt.getProps();

    return {
      id: debt.id.toString(),
      estateId: props.estateId,
      creditorName: props.creditorName,
      description: props.description,
      initialAmountAmount: props.initialAmount.amount,
      initialAmountCurrency: props.initialAmount.currency,
      outstandingBalanceAmount: props.outstandingBalance.amount,
      outstandingBalanceCurrency: props.outstandingBalance.currency,
      interestRate: props.interestRate,
      currency: props.currency,
      priorityTier: props.priority.tier,
      type: this.mapToPrismaDebtType(props.type),
      isSecured: props.isSecured,
      securedAssetId: props.securedAssetId || null,
      status: this.mapToPrismaDebtStatus(props.status),
      isStatuteBarred: props.isStatuteBarred,
      dueDate: props.dueDate || null,
      disputeReason: props.disputeReason || null,
      lastPaymentDate: props.lastPaymentDate || null,
      totalPaidAmount: props.totalPaid.amount,
      creditorContact: props.creditorContact || null,
      referenceNumber: props.referenceNumber || null,
      evidenceDocumentId: props.evidenceDocumentId || null,
      requiresCourtApproval: props.requiresCourtApproval || null,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Convert array of Prisma models to Domain Entities
   */
  toDomainList(prismaDebts: PrismaDebt[]): Debt[] {
    return prismaDebts.map((debt) => this.toDomain(debt)).filter((debt) => debt !== null);
  }

  /**
   * Convert array of Domain Entities to Prisma models
   */
  toPersistenceList(debts: Debt[]): Partial<PrismaDebt>[] {
    return debts.map((debt) => this.toPersistence(debt));
  }

  /**
   * Map Prisma debt tier to Domain enum
   */
  private mapToDomainDebtTier(prismaTier: string): DebtTier {
    switch (prismaTier) {
      case 'FUNERAL_EXPENSES':
        return DebtTier.FUNERAL_EXPENSES;
      case 'TESTAMENTARY_EXPENSES':
        return DebtTier.TESTAMENTARY_EXPENSES;
      case 'SECURED_DEBTS':
        return DebtTier.SECURED_DEBTS;
      case 'TAXES_RATES_WAGES':
        return DebtTier.TAXES_RATES_WAGES;
      case 'UNSECURED_GENERAL':
        return DebtTier.UNSECURED_GENERAL;
      default:
        throw new Error(`Unknown debt tier: ${prismaTier}`);
    }
  }

  /**
   * Map Domain debt tier to Prisma enum
   */
  private mapToPrismaDebtTier(domainTier: DebtTier): string {
    switch (domainTier) {
      case DebtTier.FUNERAL_EXPENSES:
        return 'FUNERAL_EXPENSES';
      case DebtTier.TESTAMENTARY_EXPENSES:
        return 'TESTAMENTARY_EXPENSES';
      case DebtTier.SECURED_DEBTS:
        return 'SECURED_DEBTS';
      case DebtTier.TAXES_RATES_WAGES:
        return 'TAXES_RATES_WAGES';
      case DebtTier.UNSECURED_GENERAL:
        return 'UNSECURED_GENERAL';
      default:
        throw new Error(`Unknown debt tier: ${domainTier}`);
    }
  }

  /**
   * Map Prisma debt type to Domain enum
   */
  private mapToDomainDebtType(prismaType: string): DebtType {
    switch (prismaType) {
      case 'MORTGAGE':
        return DebtType.MORTGAGE;
      case 'PERSONAL_LOAN':
        return DebtType.PERSONAL_LOAN;
      case 'CREDIT_CARD':
        return DebtType.CREDIT_CARD;
      case 'BUSINESS_DEBT':
        return DebtType.BUSINESS_DEBT;
      case 'TAX_OBLIGATION':
        return DebtType.TAX_OBLIGATION;
      case 'FUNERAL_EXPENSE':
        return DebtType.FUNERAL_EXPENSE;
      case 'MEDICAL_BILL':
        return DebtType.MEDICAL_BILL;
      case 'OTHER':
        return DebtType.OTHER;
      default:
        throw new Error(`Unknown debt type: ${prismaType}`);
    }
  }

  /**
   * Map Domain debt type to Prisma enum
   */
  private mapToPrismaDebtType(domainType: DebtType): string {
    switch (domainType) {
      case DebtType.MORTGAGE:
        return 'MORTGAGE';
      case DebtType.PERSONAL_LOAN:
        return 'PERSONAL_LOAN';
      case DebtType.CREDIT_CARD:
        return 'CREDIT_CARD';
      case DebtType.BUSINESS_DEBT:
        return 'BUSINESS_DEBT';
      case DebtType.TAX_OBLIGATION:
        return 'TAX_OBLIGATION';
      case DebtType.FUNERAL_EXPENSE:
        return 'FUNERAL_EXPENSE';
      case DebtType.MEDICAL_BILL:
        return 'MEDICAL_BILL';
      case DebtType.OTHER:
        return 'OTHER';
      default:
        throw new Error(`Unknown debt type: ${domainType}`);
    }
  }

  /**
   * Map Prisma debt status to Domain enum
   */
  private mapToDomainDebtStatus(prismaStatus: string): DebtStatus {
    switch (prismaStatus) {
      case 'OUTSTANDING':
        return DebtStatus.OUTSTANDING;
      case 'PARTIALLY_PAID':
        return DebtStatus.PARTIALLY_PAID;
      case 'SETTLED':
        return DebtStatus.SETTLED;
      case 'WRITTEN_OFF':
        return DebtStatus.WRITTEN_OFF;
      case 'DISPUTED':
        return DebtStatus.DISPUTED;
      case 'STATUTE_BARRED':
        return DebtStatus.STATUTE_BARRED;
      default:
        throw new Error(`Unknown debt status: ${prismaStatus}`);
    }
  }

  /**
   * Map Domain debt status to Prisma enum
   */
  private mapToPrismaDebtStatus(domainStatus: DebtStatus): string {
    switch (domainStatus) {
      case DebtStatus.OUTSTANDING:
        return 'OUTSTANDING';
      case DebtStatus.PARTIALLY_PAID:
        return 'PARTIALLY_PAID';
      case DebtStatus.SETTLED:
        return 'SETTLED';
      case DebtStatus.WRITTEN_OFF:
        return 'WRITTEN_OFF';
      case DebtStatus.DISPUTED:
        return 'DISPUTED';
      case DebtStatus.STATUTE_BARRED:
        return 'STATUTE_BARRED';
      default:
        throw new Error(`Unknown debt status: ${domainStatus}`);
    }
  }

  /**
   * Get debt statistics
   */
  getDebtStatistics(debts: Debt[]): {
    totalCount: number;
    totalOutstanding: MoneyVO;
    totalPaid: MoneyVO;
    totalInitial: MoneyVO;
    byStatus: Record<string, number>;
    byTier: Record<string, number>;
    collectibleDebts: Debt[];
    blockingDebts: Debt[];
  } {
    const collectibleDebts = debts.filter((debt) => debt.isCollectible());
    const blockingDebts = debts.filter((debt) => debt.blocksDistribution());

    // Calculate totals
    const totalOutstanding = debts.reduce(
      (sum, debt) => sum.add(debt.outstandingBalance),
      MoneyVO.zero('KES'),
    );

    const totalPaid = debts.reduce((sum, debt) => sum.add(debt.totalPaid), MoneyVO.zero('KES'));

    const totalInitial = debts.reduce((sum, debt) => {
      const props = debt.getProps();
      return sum.add(props.initialAmount);
    }, MoneyVO.zero('KES'));

    // Count by status
    const byStatus = debts.reduce(
      (acc, debt) => {
        const status = debt.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Count by tier
    const byTier = debts.reduce(
      (acc, debt) => {
        const tier = debt.tier;
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalCount: debts.length,
      totalOutstanding,
      totalPaid,
      totalInitial,
      byStatus,
      byTier,
      collectibleDebts,
      blockingDebts,
    };
  }

  /**
   * Filter debts by tier (S.45 priority)
   */
  filterByTier(debts: Debt[], tier: DebtTier): Debt[] {
    return debts.filter((debt) => debt.tier === tier);
  }

  /**
   * Filter collectible debts (excluding statute barred, written off, etc.)
   */
  filterCollectibleDebts(debts: Debt[]): Debt[] {
    return debts.filter((debt) => debt.isCollectible());
  }

  /**
   * Sort debts by S.45 priority
   */
  sortByS45Priority(debts: Debt[]): Debt[] {
    return debts.sort((a, b) => a.comparePriority(b));
  }

  /**
   * Calculate total S.45 liability by tier
   */
  calculateS45LiabilityByTier(debts: Debt[]): Record<string, MoneyVO> {
    const liabilityByTier: Record<string, MoneyVO> = {};

    debts.forEach((debt) => {
      if (debt.isIncludedInS45()) {
        const tier = debt.tier;
        if (!liabilityByTier[tier]) {
          liabilityByTier[tier] = MoneyVO.zero('KES');
        }
        liabilityByTier[tier] = liabilityByTier[tier].add(debt.outstandingBalance);
      }
    });

    return liabilityByTier;
  }

  /**
   * Check if any debts block distribution
   */
  hasBlockingDebts(debts: Debt[]): boolean {
    return debts.some((debt) => debt.blocksDistribution());
  }

  /**
   * Prepare bulk debt creation data
   */
  prepareBulkCreateData(
    estateId: string,
    debts: Array<{
      creditorName: string;
      description: string;
      initialAmount: MoneyVO;
      type: DebtType;
      isSecured: boolean;
      priorityTier: DebtTier;
      dueDate?: Date;
      securedAssetId?: string;
      creditorContact?: string;
      referenceNumber?: string;
    }>,
    createdBy: string,
  ): Partial<PrismaDebt>[] {
    const now = new Date();

    return debts.map((debt) => ({
      id: new UniqueEntityID().toString(),
      estateId,
      creditorName: debt.creditorName,
      description: debt.description,
      initialAmountAmount: debt.initialAmount.amount,
      initialAmountCurrency: debt.initialAmount.currency,
      outstandingBalanceAmount: debt.initialAmount.amount,
      outstandingBalanceCurrency: debt.initialAmount.currency,
      interestRate: 0,
      currency: debt.initialAmount.currency,
      priorityTier: this.mapToPrismaDebtTier(debt.priorityTier),
      type: this.mapToPrismaDebtType(debt.type),
      isSecured: debt.isSecured,
      securedAssetId: debt.securedAssetId || null,
      status: 'OUTSTANDING',
      isStatuteBarred: false,
      dueDate: debt.dueDate || null,
      totalPaidAmount: 0,
      creditorContact: debt.creditorContact || null,
      referenceNumber: debt.referenceNumber || null,
      createdAt: now,
      updatedAt: now,
    }));
  }
}
