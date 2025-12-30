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
    if (!prismaTaxCompliance) throw new Error('Cannot map null Prisma object');

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

    // Create MoneyVO objects
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
    const totalPaid = MoneyVO.create({ amount: Number(totalPaidAmount), currency: 'KES' });

    // Parse payment history (JSON array)
    const parsedPaymentHistory = paymentHistory
      ? Array.isArray(paymentHistory)
        ? paymentHistory
        : JSON.parse(paymentHistory as unknown as string)
      : [];

    const taxStatus = this.mapToDomainTaxStatus(status);

    // Use reconstitute to load exact state
    return EstateTaxCompliance.reconstitute(
      {
        estateId,
        kraPin: kraPin || 'UNKNOWN', // Guard against null if DB allows it
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
      },
      new UniqueEntityID(id),
    );
  }

  /**
   * Convert Domain Entity to Prisma model
   */
  toPersistence(taxCompliance: EstateTaxCompliance): any {
    // USE PUBLIC GETTERS

    return {
      id: taxCompliance.id.toString(),
      estateId: taxCompliance.estateId,
      kraPin: taxCompliance.kraPin,

      status: this.mapToPrismaTaxStatus(taxCompliance.status) as any, // Cast for Prisma Enum

      incomeTaxLiabilityAmount: taxCompliance.incomeTaxLiability.amount,
      capitalGainsTaxLiabilityAmount: taxCompliance.capitalGainsTaxLiability.amount,
      stampDutyLiabilityAmount: taxCompliance.stampDutyLiability.amount,
      otherLeviesLiabilityAmount: taxCompliance.otherLeviesLiability.amount,
      totalPaidAmount: taxCompliance.totalPaid.amount,

      lastPaymentDate: taxCompliance.lastPaymentDate || null,
      paymentHistory: taxCompliance.paymentHistory, // JSON

      clearanceCertificateNo: taxCompliance.clearanceCertificateNo || null,
      clearanceDate: taxCompliance.clearanceDate || null,
      clearanceIssuedBy: taxCompliance.clearanceIssuedBy || null,

      assessmentDate: taxCompliance.assessmentDate || null,
      assessmentReference: taxCompliance.assessmentReference || null,
      assessedBy: taxCompliance.assessedBy || null,

      exemptionReason: taxCompliance.exemptionReason || null,
      exemptionCertificateNo: taxCompliance.exemptionCertificateNo || null,
      exemptedBy: taxCompliance.exemptedBy || null,
      exemptionDate: taxCompliance.exemptionDate || null,

      requiresProfessionalValuation: taxCompliance.requiresProfessionalValuation,
      isUnderInvestigation: taxCompliance.isUnderInvestigation,
      notes: taxCompliance.notes || null,
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
        return TaxStatusVO.pending(); // Safe default
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
        return 'PENDING';
    }
  }
}
