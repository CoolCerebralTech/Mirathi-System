// src/estate-service/src/infrastructure/persistence/mappers/estate-tax-compliance.mapper.ts
import { Injectable } from '@nestjs/common';
import { EstateTaxCompliance as PrismaEstateTaxCompliance } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { EstateTaxCompliance } from '../../../domain/entities/estate-tax-compliance.entity';
import { MoneyVO } from '../../../domain/value-objects/money.vo';
import { TaxStatusVO } from '../../../domain/value-objects/tax-status.vo';

@Injectable()
export class EstateTaxComplianceMapper {
  /**
   * Convert Prisma model to Domain Entity
   */
  toDomain(prismaTaxCompliance: PrismaEstateTaxCompliance): EstateTaxCompliance {
    if (!prismaTaxCompliance) return null;

    const {
      id,
      estateId,
      kraPin,
      status,
      incomeTaxLiabilityAmount,
      capitalGainsTaxLiabilityAmount,
      stampDutyLiabilityAmount,
      otherLeviesLiabilityAmount,
      totalPaidAmount,
      lastPaymentDate,
      paymentHistory,
      clearanceCertificateNo,
      clearanceDate,
      clearanceIssuedBy,
      assessmentDate,
      assessmentReference,
      assessedBy,
      exemptionReason,
      exemptionCertificateNo,
      exemptedBy,
      exemptionDate,
      requiresProfessionalValuation,
      isUnderInvestigation,
      notes,
    } = prismaTaxCompliance;

    // Create MoneyVO objects for liabilities
    const incomeTaxLiability = MoneyVO.create({
      amount: Number(incomeTaxLiabilityAmount),
      currency: 'KES',
    });

    const capitalGainsTaxLiability = MoneyVO.create({
      amount: Number(capitalGainsTaxLiabilityAmount),
      currency: 'KES',
    });

    const stampDutyLiability = MoneyVO.create({
      amount: Number(stampDutyLiabilityAmount),
      currency: 'KES',
    });

    const otherLeviesLiability = MoneyVO.create({
      amount: Number(otherLeviesLiabilityAmount),
      currency: 'KES',
    });

    const totalPaid = MoneyVO.create({
      amount: Number(totalPaidAmount),
      currency: 'KES',
    });

    // Parse payment history
    const parsedPaymentHistory = paymentHistory
      ? Array.isArray(paymentHistory)
        ? paymentHistory
        : JSON.parse(paymentHistory as string)
      : [];

    // Create TaxStatusVO
    const taxStatus = this.mapToDomainTaxStatus(status);

    // Create EstateTaxComplianceProps
    const taxComplianceProps = {
      estateId,
      kraPin,
      status: taxStatus,
      incomeTaxLiability,
      capitalGainsTaxLiability,
      stampDutyLiability,
      otherLeviesLiability,
      totalPaid,
      lastPaymentDate: lastPaymentDate || undefined,
      paymentHistory: parsedPaymentHistory,
      clearanceCertificateNo: clearanceCertificateNo || undefined,
      clearanceDate: clearanceDate || undefined,
      clearanceIssuedBy: clearanceIssuedBy || undefined,
      assessmentDate: assessmentDate || undefined,
      assessmentReference: assessmentReference || undefined,
      assessedBy: assessedBy || undefined,
      exemptionReason: exemptionReason || undefined,
      exemptionCertificateNo: exemptionCertificateNo || undefined,
      exemptedBy: exemptedBy || undefined,
      exemptionDate: exemptionDate || undefined,
      requiresProfessionalValuation,
      isUnderInvestigation,
      notes: notes || undefined,
    };

    return EstateTaxCompliance.create(estateId, kraPin, undefined, new UniqueEntityID(id));
  }

  /**
   * Convert Domain Entity to Prisma model
   */
  toPersistence(taxCompliance: EstateTaxCompliance): Partial<PrismaEstateTaxCompliance> {
    const props = taxCompliance.getProps();

    return {
      id: taxCompliance.id.toString(),
      estateId: props.estateId,
      kraPin: props.kraPin,
      status: this.mapToPrismaTaxStatus(props.status),
      incomeTaxLiabilityAmount: props.incomeTaxLiability.amount,
      capitalGainsTaxLiabilityAmount: props.capitalGainsTaxLiability.amount,
      stampDutyLiabilityAmount: props.stampDutyLiability.amount,
      otherLeviesLiabilityAmount: props.otherLeviesLiability.amount,
      totalPaidAmount: props.totalPaid.amount,
      lastPaymentDate: props.lastPaymentDate || null,
      paymentHistory: props.paymentHistory,
      clearanceCertificateNo: props.clearanceCertificateNo || null,
      clearanceDate: props.clearanceDate || null,
      clearanceIssuedBy: props.clearanceIssuedBy || null,
      assessmentDate: props.assessmentDate || null,
      assessmentReference: props.assessmentReference || null,
      assessedBy: props.assessedBy || null,
      exemptionReason: props.exemptionReason || null,
      exemptionCertificateNo: props.exemptionCertificateNo || null,
      exemptedBy: props.exemptedBy || null,
      exemptionDate: props.exemptionDate || null,
      requiresProfessionalValuation: props.requiresProfessionalValuation,
      isUnderInvestigation: props.isUnderInvestigation,
      notes: props.notes || null,
    };
  }

  /**
   * Map Prisma tax status to Domain TaxStatusVO
   */
  private mapToDomainTaxStatus(prismaStatus: string): TaxStatusVO {
    switch (prismaStatus) {
      case 'PENDING':
        return TaxStatusVO.pending();
      case 'ASSESSED':
        return TaxStatusVO.assessed();
      case 'PARTIALLY_PAID':
        return TaxStatusVO.partiallyPaid();
      case 'CLEARED':
        return TaxStatusVO.cleared();
      case 'EXEMPT':
        return TaxStatusVO.exempt();
      case 'DISPUTED':
        return TaxStatusVO.disputed();
      default:
        throw new Error(`Unknown tax status: ${prismaStatus}`);
    }
  }

  /**
   * Map Domain TaxStatusVO to Prisma enum
   */
  private mapToPrismaTaxStatus(taxStatus: TaxStatusVO): string {
    switch (taxStatus.value) {
      case 'PENDING':
        return 'PENDING';
      case 'ASSESSED':
        return 'ASSESSED';
      case 'PARTIALLY_PAID':
        return 'PARTIALLY_PAID';
      case 'CLEARED':
        return 'CLEARED';
      case 'EXEMPT':
        return 'EXEMPT';
      case 'DISPUTED':
        return 'DISPUTED';
      default:
        throw new Error(`Unknown tax status: ${taxStatus.value}`);
    }
  }

  /**
   * Get tax compliance summary
   */
  getTaxComplianceSummary(taxCompliance: EstateTaxCompliance): {
    status: string;
    totalLiability: number;
    totalPaid: number;
    remainingBalance: number;
    paymentPercentage: number;
    isClearedForDistribution: boolean;
    clearanceCertificateNo?: string;
  } {
    const props = taxCompliance.getProps();

    return {
      status: props.status.value,
      totalLiability: taxCompliance.getTotalLiability().amount,
      totalPaid: props.totalPaid.amount,
      remainingBalance: taxCompliance.getRemainingBalance().amount,
      paymentPercentage: taxCompliance.getPaymentPercentage(),
      isClearedForDistribution: taxCompliance.isClearedForDistribution(),
      clearanceCertificateNo: props.clearanceCertificateNo,
    };
  }

  /**
   * Check if tax compliance is a liability
   */
  isTaxLiability(taxCompliance: EstateTaxCompliance): boolean {
    return taxCompliance.isLiability();
  }

  /**
   * Get payment history summary
   */
  getPaymentHistorySummary(taxCompliance: EstateTaxCompliance): {
    totalPayments: number;
    lastPaymentDate?: Date;
    averagePaymentAmount?: number;
    paymentMethods: Set<string>;
  } {
    const props = taxCompliance.getProps();
    const paymentHistory = props.paymentHistory || [];

    if (paymentHistory.length === 0) {
      return {
        totalPayments: 0,
        paymentMethods: new Set(),
      };
    }

    const totalPayments = paymentHistory.length;
    const totalAmount = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    const averagePaymentAmount = totalAmount / totalPayments;
    const paymentMethods = new Set(paymentHistory.map((payment) => payment.type));
    const lastPaymentDate = paymentHistory.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0]?.date;

    return {
      totalPayments,
      lastPaymentDate,
      averagePaymentAmount,
      paymentMethods,
    };
  }

  /**
   * Prepare tax compliance for court submission
   */
  prepareCourtSubmissionData(taxCompliance: EstateTaxCompliance): {
    kraPin: string;
    status: string;
    totalLiability: number;
    totalPaid: number;
    clearanceStatus: string;
    assessmentReference?: string;
    clearanceCertificateNo?: string;
    requiresProfessionalValuation: boolean;
  } {
    const props = taxCompliance.getProps();
    const summary = this.getTaxComplianceSummary(taxCompliance);

    return {
      kraPin: props.kraPin,
      status: props.status.value,
      totalLiability: summary.totalLiability,
      totalPaid: summary.totalPaid,
      clearanceStatus: summary.isClearedForDistribution ? 'CLEARED' : 'PENDING',
      assessmentReference: props.assessmentReference,
      clearanceCertificateNo: props.clearanceCertificateNo,
      requiresProfessionalValuation: props.requiresProfessionalValuation,
    };
  }

  /**
   * Create initial tax compliance record
   */
  createInitialTaxCompliance(
    estateId: string,
    kraPin: string,
    initialNetWorth?: MoneyVO,
  ): Partial<PrismaEstateTaxCompliance> {
    const requiresProfessionalValuation = initialNetWorth
      ? initialNetWorth.amount > 10000000 // 10M KES threshold
      : false;

    return {
      id: new UniqueEntityID().toString(),
      estateId,
      kraPin,
      status: 'PENDING',
      incomeTaxLiabilityAmount: 0,
      capitalGainsTaxLiabilityAmount: 0,
      stampDutyLiabilityAmount: 0,
      otherLeviesLiabilityAmount: 0,
      totalPaidAmount: 0,
      paymentHistory: [],
      requiresProfessionalValuation,
      isUnderInvestigation: false,
    };
  }

  /**
   * Update tax compliance with assessment data
   */
  updateWithAssessment(
    taxCompliance: EstateTaxCompliance,
    assessment: {
      incomeTax?: number;
      capitalGainsTax?: number;
      stampDuty?: number;
      otherLevies?: number;
    },
    assessmentReference: string,
    assessedBy: string,
  ): Partial<PrismaEstateTaxCompliance> {
    const props = taxCompliance.getProps();

    const updates: Partial<PrismaEstateTaxCompliance> = {
      status: 'ASSESSED',
      assessmentReference,
      assessedBy,
      assessmentDate: new Date(),
    };

    if (assessment.incomeTax !== undefined) {
      updates.incomeTaxLiabilityAmount = assessment.incomeTax;
    }
    if (assessment.capitalGainsTax !== undefined) {
      updates.capitalGainsTaxLiabilityAmount = assessment.capitalGainsTax;
    }
    if (assessment.stampDuty !== undefined) {
      updates.stampDutyLiabilityAmount = assessment.stampDuty;
    }
    if (assessment.otherLevies !== undefined) {
      updates.otherLeviesLiabilityAmount = assessment.otherLevies;
    }

    return updates;
  }

  /**
   * Update tax compliance with payment
   */
  updateWithPayment(
    taxCompliance: EstateTaxCompliance,
    amount: MoneyVO,
    paymentType: string,
    reference: string,
    paidBy?: string,
  ): Partial<PrismaEstateTaxCompliance> {
    const props = taxCompliance.getProps();
    const paymentRecord = {
      date: new Date(),
      amount: amount.amount,
      type: paymentType,
      reference,
      paidBy,
    };

    const currentPaymentHistory = props.paymentHistory || [];
    const newPaymentHistory = [...currentPaymentHistory, paymentRecord];

    return {
      totalPaidAmount: props.totalPaid.amount + amount.amount,
      lastPaymentDate: new Date(),
      paymentHistory: newPaymentHistory,
      status:
        taxCompliance.getRemainingBalance().amount === 0
          ? 'PARTIALLY_PAID' // Fully paid but needs clearance
          : 'PARTIALLY_PAID',
    };
  }

  /**
   * Mark tax compliance as cleared
   */
  markAsCleared(
    taxCompliance: EstateTaxCompliance,
    certificateNumber: string,
    clearedBy: string,
  ): Partial<PrismaEstateTaxCompliance> {
    return {
      status: 'CLEARED',
      clearanceCertificateNo: certificateNumber,
      clearanceDate: new Date(),
      clearanceIssuedBy: clearedBy,
    };
  }
}
