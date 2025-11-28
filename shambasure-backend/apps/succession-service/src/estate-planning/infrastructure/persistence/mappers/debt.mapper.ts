import { Prisma, Debt as PrismaDebt } from '@prisma/client';

import { Debt, DebtReconstituteProps } from '../../../domain/entities/debt.entity';

export class DebtMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaDebt): Debt {
    // 1. Safe JSON extraction for creditor address
    const creditorAddress = this.parseCreditorAddress(raw.creditorAddress);

    // 2. Construct Reconstruction Props with ALL fields
    const props: DebtReconstituteProps = {
      // Core Identity
      id: raw.id,
      ownerId: raw.ownerId,

      // Core Debt Information
      type: raw.type,
      description: raw.description,

      // Asset Linkage
      assetId: raw.assetId,

      // Financial Details
      principalAmount: Number(raw.principalAmount),
      outstandingBalance: Number(raw.outstandingBalance),
      currency: raw.currency,

      // Kenyan Tax-Specific Fields
      taxType: raw.taxType,
      kraPin: raw.kraPin,
      taxPeriod: raw.taxPeriod,

      // Creditor Information
      creditorName: raw.creditorName,
      creditorContact: raw.creditorContact,
      creditorAddress: creditorAddress,
      creditorAccountNumber: raw.creditorAccountNumber,
      creditorKraPin: raw.creditorKraPin,

      // Loan Terms & Conditions
      dueDate: raw.dueDate,
      interestRate: raw.interestRate ? Number(raw.interestRate) : null,
      interestType: raw.interestType,
      compoundingFrequency: raw.compoundingFrequency,

      // Kenyan Succession Priority
      priority: raw.priority,
      status: raw.status,

      // Legal & Compliance
      isStatuteBarred: raw.isStatuteBarred,
      statuteBarredDate: raw.statuteBarredDate,
      requiresCourtApproval: raw.requiresCourtApproval,
      courtApprovalObtained: raw.courtApprovalObtained,

      // Security & Collateral
      isSecured: raw.isSecured,
      securityDetails: raw.securityDetails,
      collateralDescription: raw.collateralDescription,

      // Payment Tracking
      lastPaymentDate: raw.lastPaymentDate,
      lastPaymentAmount: raw.lastPaymentAmount ? Number(raw.lastPaymentAmount) : null,
      totalPaid: Number(raw.totalPaid),

      // Settlement Information
      isPaid: raw.isPaid,
      paidAt: raw.paidAt,
      settlementMethod: raw.settlementMethod,

      // Dispute Information
      isDisputed: raw.isDisputed,
      disputeReason: raw.disputeReason,
      disputeResolvedAt: raw.disputeResolvedAt,

      // Audit Trail
      incurredDate: raw.incurredDate,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    return Debt.reconstitute(props);
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format
   */
  static toPersistence(entity: Debt): Prisma.DebtUncheckedCreateInput {
    // Prepare JSON objects with proper Prisma null handling
    const creditorAddressJson = entity.creditorAddress
      ? (JSON.parse(JSON.stringify(entity.creditorAddress)) as Prisma.JsonObject)
      : Prisma.JsonNull;

    return {
      // Core Identity
      id: entity.id,
      ownerId: entity.ownerId,

      // Core Debt Information
      type: entity.type,
      description: entity.description,

      // Asset Linkage
      assetId: entity.assetId,

      // Financial Details
      principalAmount: entity.principalAmount,
      outstandingBalance: entity.outstandingBalance,
      currency: entity.currency,

      // Kenyan Tax-Specific Fields
      taxType: entity.taxType,
      kraPin: entity.kraPin,
      taxPeriod: entity.taxPeriod,

      // Creditor Information
      creditorName: entity.creditorName,
      creditorContact: entity.creditorContact,
      creditorAddress: creditorAddressJson,
      creditorAccountNumber: entity.creditorAccountNumber,
      creditorKraPin: entity.creditorKraPin,

      // Loan Terms & Conditions
      dueDate: entity.dueDate,
      interestRate: entity.interestRate,
      interestType: entity.interestType,
      compoundingFrequency: entity.compoundingFrequency,

      // Kenyan Succession Priority
      priority: entity.priority,
      status: entity.status,

      // Legal & Compliance
      isStatuteBarred: entity.isStatuteBarred,
      statuteBarredDate: entity.statuteBarredDate,
      requiresCourtApproval: entity.requiresCourtApproval,
      courtApprovalObtained: entity.courtApprovalObtained,

      // Security & Collateral
      isSecured: entity.isSecured,
      securityDetails: entity.securityDetails,
      collateralDescription: entity.collateralDescription,

      // Payment Tracking
      lastPaymentDate: entity.lastPaymentDate,
      lastPaymentAmount: entity.lastPaymentAmount,
      totalPaid: entity.totalPaid,

      // Settlement Information
      isPaid: entity.isPaid,
      paidAt: entity.paidAt,
      settlementMethod: entity.settlementMethod,

      // Dispute Information
      isDisputed: entity.isDisputed,
      disputeReason: entity.disputeReason,
      disputeResolvedAt: entity.disputeResolvedAt,

      // Audit Trail
      incurredDate: entity.incurredDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Create update-specific persistence data
   */
  static toUpdatePersistence(entity: Debt): Prisma.DebtUncheckedUpdateInput {
    const full = this.toPersistence(entity);

    const updatableFields: Omit<Prisma.DebtUncheckedCreateInput, 'id' | 'ownerId' | 'createdAt'> =
      full;

    return {
      ...updatableFields,
      updatedAt: new Date(),
    };
  }

  /**
   * Parse creditor address from Prisma JSON field
   */
  private static parseCreditorAddress(
    creditorAddress: Prisma.JsonValue,
  ): Record<string, any> | null {
    if (!creditorAddress || typeof creditorAddress !== 'object' || Array.isArray(creditorAddress)) {
      return null;
    }

    return creditorAddress as Record<string, any>;
  }

  /**
   * Batch domain conversion for performance
   */
  static toDomainBatch(records: PrismaDebt[]): Debt[] {
    return records.map((record) => this.toDomain(record));
  }

  /**
   * Batch persistence conversion for performance
   */
  static toPersistenceBatch(entities: Debt[]): Prisma.DebtUncheckedCreateInput[] {
    return entities.map((entity) => this.toPersistence(entity));
  }
}
