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
  toDomain(prismaDebt: PrismaDebt): Debt {
    if (!prismaDebt) throw new Error('Cannot map null Prisma object');

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

    // 1. Money VOs
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

    // 2. Map Enums
    const debtTier = this.mapToDomainDebtTier(priorityTier);
    const debtType = this.mapToDomainDebtType(type);

    // 3. Priority VO
    const priority = DebtPriorityVO.restore(debtTier, debtType);

    // 4. Props
    const debtProps = {
      estateId,
      creditorName,
      description,
      initialAmount,
      outstandingBalance,
      interestRate: Number(interestRate),
      currency: currency || 'KES',
      priority,
      tier: debtTier,
      type: debtType,
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

  toPersistence(debt: Debt): any {
    return {
      id: debt.id.toString(),
      estateId: debt.estateId,
      creditorName: debt.creditorName,
      description: debt.description,

      initialAmountAmount: debt.initialAmount.amount,
      initialAmountCurrency: debt.initialAmount.currency,

      outstandingBalanceAmount: debt.outstandingBalance.amount,
      outstandingBalanceCurrency: debt.outstandingBalance.currency,

      interestRate: debt.interestRate,
      currency: debt.currency,

      priorityTier: this.mapToPrismaDebtTier(debt.tier) as any,
      type: this.mapToPrismaDebtType(debt.type) as any,

      isSecured: debt.isSecured,
      securedAssetId: debt.securedAssetId || null,

      status: this.mapToPrismaDebtStatus(debt.status) as any,

      isStatuteBarred: debt.isStatuteBarred,
      dueDate: debt.dueDate || null,
      disputeReason: debt.disputeReason || null,
      lastPaymentDate: debt.lastPaymentDate || null,
      totalPaidAmount: debt.totalPaid.amount,

      creditorContact: debt.creditorContact || null,
      referenceNumber: debt.referenceNumber || null,
      evidenceDocumentId: debt.evidenceDocumentId || null,
      requiresCourtApproval: debt.requiresCourtApproval || null,

      createdAt: debt.createdAt,
      updatedAt: debt.updatedAt,
    };
  }

  /**
   * [ADDED] Convert List of Prisma Objects to Domain Entities
   */
  toDomainList(prismaDebts: PrismaDebt[]): Debt[] {
    if (!prismaDebts) return [];
    return prismaDebts
      .map((debt) => {
        try {
          return this.toDomain(debt);
        } catch (e) {
          console.error(`Failed to map debt ${debt.id}:`, e);
          return null;
        }
      })
      .filter((debt): debt is Debt => debt !== null);
  }

  /**
   * [ADDED] Convert List of Domain Entities to Persistence Objects
   */
  toPersistenceList(debts: Debt[]): any[] {
    return debts.map((d) => this.toPersistence(d));
  }

  // --- MAPPING HELPERS ---

  private mapToDomainDebtTier(prismaTier: string): DebtTier {
    return prismaTier as DebtTier;
  }

  private mapToPrismaDebtTier(domainTier: DebtTier): string {
    return domainTier.toString();
  }

  private mapToDomainDebtType(prismaType: string): DebtType {
    switch (prismaType) {
      case 'MORTGAGE':
        return DebtType.MORTGAGE;
      case 'PERSONAL_LOAN':
        return DebtType.PERSONAL_LOAN;
      case 'CREDIT_CARD':
        return DebtType.CREDIT_CARD;
      case 'BUSINESS_DEBT':
        return DebtType.BUSINESS_LOAN;
      case 'TAX_OBLIGATION':
        return DebtType.INCOME_TAX;
      case 'FUNERAL_EXPENSE':
        return DebtType.FUNERAL_EXPENSES;
      case 'MEDICAL_BILL':
        return DebtType.MEDICAL_BILLS;
      case 'OTHER':
        return DebtType.OTHER;
      default:
        return DebtType.OTHER;
    }
  }

  private mapToPrismaDebtType(domainType: DebtType): string {
    switch (domainType) {
      // Secured
      case DebtType.MORTGAGE:
        return 'MORTGAGE';
      case DebtType.CAR_LOAN:
        return 'MORTGAGE';
      case DebtType.LOGBOOK_LOAN:
        return 'MORTGAGE';

      // Personal
      case DebtType.PERSONAL_LOAN:
        return 'PERSONAL_LOAN';
      case DebtType.FAMILY_LOAN:
        return 'PERSONAL_LOAN';
      case DebtType.FRIEND_LOAN:
        return 'PERSONAL_LOAN';

      // Credit
      case DebtType.CREDIT_CARD:
        return 'CREDIT_CARD';

      // Business
      case DebtType.BUSINESS_LOAN:
        return 'BUSINESS_DEBT';
      case DebtType.SUPPLIER_DEBT:
        return 'BUSINESS_DEBT';
      case DebtType.RENT_ARREARS:
        return 'BUSINESS_DEBT';

      // Tax
      case DebtType.INCOME_TAX:
        return 'TAX_OBLIGATION';
      case DebtType.PROPERTY_RATES:
        return 'TAX_OBLIGATION';
      case DebtType.LAND_RATES:
        return 'TAX_OBLIGATION';
      case DebtType.VAT:
        return 'TAX_OBLIGATION';

      // Funeral
      case DebtType.FUNERAL_EXPENSES:
        return 'FUNERAL_EXPENSE';
      case DebtType.DEATH_CERTIFICATE:
        return 'FUNERAL_EXPENSE';
      case DebtType.OBITUARY:
        return 'FUNERAL_EXPENSE';

      // Medical
      case DebtType.MEDICAL_BILLS:
        return 'MEDICAL_BILL';

      // Other
      default:
        return 'OTHER';
    }
  }

  private mapToDomainDebtStatus(prismaStatus: string): DebtStatus {
    return prismaStatus as DebtStatus;
  }

  private mapToPrismaDebtStatus(domainStatus: DebtStatus): string {
    return domainStatus.toString();
  }
}
