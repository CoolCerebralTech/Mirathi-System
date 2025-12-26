// src/estate-service/src/domain/entities/factories/debt.factory.ts
import { UniqueEntityID } from '../base/unique-entity-id';
import { Debt } from '../entities/debt.entity';
import { DebtStatus } from '../enums/debt-status.enum';
import { DebtTierHelper } from '../enums/debt-tier.enum';
import { DebtType } from '../enums/debt-type.enum';
import { DebtCreatedEvent } from '../events/debt.event';

/**
 * Debt Factory for creating debt records
 *
 * Design Pattern: Factory Method
 * Purpose: Centralize debt creation with S.45 priority assignment
 */
export class DebtFactory {
  /**
   * Create a new debt
   */
  static create(params: {
    debtId: UniqueEntityID;
    estateId: string;
    description: string;
    type: DebtType;
    amount: number;
    currency: string;
    creditorName: string;
    isSecured: boolean;
    securedAssetId?: string;
    dueDate?: Date;
    interestRate?: number;
    createdBy: string;
  }): Debt {
    // Determine tier based on debt type
    const tier = DebtTierHelper.getTierNumber(DebtTierHelper.getTierFromType(params.type));

    const debt = new Debt(params.debtId, {
      estateId: params.estateId,
      description: params.description,
      type: params.type,
      amount: params.amount,
      currency: params.currency,
      outstandingBalance: params.amount,
      tier: tier,
      priority: DebtTierHelper.getPriorityLevel(DebtTierHelper.getTierFromType(params.type)),
      isSecured: params.isSecured,
      securedAssetId: params.securedAssetId,
      dueDate: params.dueDate,
      interestRate: params.interestRate || 0,
      isStatuteBarred: false,
      status: DebtStatus.OUTSTANDING,
      creditorName: params.creditorName,
      isActive: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add creation event
    debt.addDomainEvent(
      new DebtCreatedEvent(
        params.debtId.toString(),
        params.estateId,
        params.description,
        params.type,
        params.amount,
        params.currency,
        DebtTierHelper.getTierFromType(params.type),
        DebtTierHelper.getPriorityLevel(DebtTierHelper.getTierFromType(params.type)),
        params.creditorName,
        params.isSecured,
        params.securedAssetId,
        params.createdBy,
        1,
      ),
    );

    return debt;
  }

  /**
   * Create funeral expense debt (S.45(a) highest priority)
   */
  static createFuneralExpense(params: {
    debtId: UniqueEntityID;
    estateId: string;
    description: string;
    amount: number;
    creditorName: string;
    expenseType: string; // Burial, coffin, transport, etc.
    createdBy: string;
  }): Debt {
    return this.create({
      debtId: params.debtId,
      estateId: params.estateId,
      description: `${params.expenseType}: ${params.description}`,
      type: DebtType.FUNERAL_EXPENSES,
      amount: params.amount,
      currency: 'KES',
      creditorName: params.creditorName,
      isSecured: false,
      createdBy: params.createdBy,
    });
  }

  /**
   * Create mortgage debt (secured, S.45(b))
   */
  static createMortgage(params: {
    debtId: UniqueEntityID;
    estateId: string;
    description: string;
    amount: number;
    creditorName: string;
    propertyAddress: string;
    mortgageAccountNumber: string;
    interestRate: number;
    dueDate?: Date;
    createdBy: string;
  }): Debt {
    const debt = this.create({
      debtId: params.debtId,
      estateId: params.estateId,
      description: `Mortgage: ${params.propertyAddress} (Account: ${params.mortgageAccountNumber})`,
      type: DebtType.MORTGAGE,
      amount: params.amount,
      currency: 'KES',
      creditorName: params.creditorName,
      isSecured: true,
      dueDate: params.dueDate,
      interestRate: params.interestRate,
      createdBy: params.createdBy,
    });

    // Note: securedAssetId would be set separately after asset is linked
    return debt;
  }

  /**
   * Create tax debt (S.45(c))
   */
  static createTaxDebt(params: {
    debtId: UniqueEntityID;
    estateId: string;
    taxType: string; // Income, VAT, Property rates
    amount: number;
    taxYear: string;
    kraPin?: string;
    createdBy: string;
  }): Debt {
    let debtType: DebtType;
    switch (params.taxType.toUpperCase()) {
      case 'INCOME':
        debtType = DebtType.INCOME_TAX;
        break;
      case 'VAT':
        debtType = DebtType.VAT;
        break;
      case 'PROPERTY':
        debtType = DebtType.PROPERTY_RATES;
        break;
      case 'LAND':
        debtType = DebtType.LAND_RATES;
        break;
      default:
        debtType = DebtType.INCOME_TAX;
    }

    return this.create({
      debtId: params.debtId,
      estateId: params.estateId,
      description: `${params.taxType} Tax for ${params.taxYear}${params.kraPin ? ` (KRA PIN: ${params.kraPin})` : ''}`,
      type: debtType,
      amount: params.amount,
      currency: 'KES',
      creditorName: 'Kenya Revenue Authority (KRA)',
      isSecured: false,
      createdBy: params.createdBy,
    });
  }

  /**
   * Create medical bill debt (unsecured, S.45(d))
   */
  static createMedicalDebt(params: {
    debtId: UniqueEntityID;
    estateId: string;
    description: string;
    amount: number;
    hospitalName: string;
    treatmentDate: Date;
    patientName: string;
    createdBy: string;
  }): Debt {
    return this.create({
      debtId: params.debtId,
      estateId: params.estateId,
      description: `Medical bill: ${params.hospitalName} for ${params.patientName} (${params.treatmentDate.toLocaleDateString()})`,
      type: DebtType.MEDICAL_BILLS,
      amount: params.amount,
      currency: 'KES',
      creditorName: params.hospitalName,
      isSecured: false,
      dueDate: new Date(params.treatmentDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days after treatment
      createdBy: params.createdBy,
    });
  }

  /**
   * Check if debt is statute barred
   */
  private static checkIfStatuteBarred(
    debtType: DebtType,
    lastPaymentDate?: Date,
    debtDate?: Date,
  ): boolean {
    const limitationPeriod = DebtTierHelper.getLimitationPeriod(
      DebtTierHelper.getTierFromType(debtType),
    );
    const referenceDate = lastPaymentDate || debtDate || new Date();
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - limitationPeriod);

    return referenceDate < cutoffDate;
  }

  /**
   * Reconstruct debt from persistence
   */
  static reconstruct(params: {
    debtId: UniqueEntityID;
    estateId: string;
    description: string;
    type: DebtType;
    amount: number;
    outstandingBalance: number;
    currency: string;
    tier: number;
    priority: string;
    isSecured: boolean;
    securedAssetId?: string;
    dueDate?: Date;
    interestRate: number;
    isStatuteBarred: boolean;
    status: DebtStatus;
    creditorName: string;
    isActive: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
  }): Debt {
    return new Debt(params.debtId, {
      estateId: params.estateId,
      description: params.description,
      type: params.type,
      amount: params.amount,
      outstandingBalance: params.outstandingBalance,
      currency: params.currency,
      tier: params.tier,
      priority: params.priority,
      isSecured: params.isSecured,
      securedAssetId: params.securedAssetId,
      dueDate: params.dueDate,
      interestRate: params.interestRate,
      isStatuteBarred: params.isStatuteBarred,
      status: params.status,
      creditorName: params.creditorName,
      isActive: params.isActive,
      version: params.version,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      deletedAt: params.deletedAt,
    });
  }
}
