// src/estate-service/src/domain/events/estate-tax.event.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Base Estate Tax Event
 */
export abstract class EstateTaxEvent<T = any> extends DomainEvent<T> {
  constructor(
    aggregateId: string,
    eventType: string,
    version: number,
    payload: T,
    occurredAt?: Date,
  ) {
    super(aggregateId, eventType, version, payload, occurredAt);
  }
}

/**
 * Tax Assessment Received
 * Triggered when KRA demands payment (Liabilities increase).
 */
export class EstateTaxAssessmentReceivedEvent extends EstateTaxEvent<{
  estateId: string;
  totalLiability: number;
  breakdown: {
    incomeTax: number;
    cgt: number;
    stampDuty: number;
    other: number;
  };
  assessedBy: string;
}> {
  constructor(
    estateId: string,
    totalLiability: number,
    breakdown: { incomeTax: number; cgt: number; stampDuty: number; other: number },
    assessedBy: string,
    version: number,
  ) {
    super(estateId, 'EstateTaxAssessmentReceivedEvent', version, {
      estateId,
      totalLiability,
      breakdown,
      assessedBy,
    });
  }
}

/**
 * Tax Payment Recorded
 * Triggered when funds are sent to KRA.
 */
export class EstateTaxPaymentRecordedEvent extends EstateTaxEvent<{
  estateId: string;
  amountPaid: number;
  currency: string;
  remainingBalance: number;
  paidBy: string;
}> {
  constructor(
    estateId: string,
    amountPaid: number,
    currency: string,
    remainingBalance: number,
    paidBy: string,
    version: number,
  ) {
    super(estateId, 'EstateTaxPaymentRecordedEvent', version, {
      estateId,
      amountPaid,
      currency,
      remainingBalance,
      paidBy,
    });
  }
}

/**
 * Tax Cleared (The "Green Light")
 * Triggered when the Clearance Certificate is issued.
 * Unlocks Estate Distribution.
 */
export class EstateTaxClearedEvent extends EstateTaxEvent<{
  estateId: string;
  certificateNumber: string;
  clearedBy: string;
  clearanceDate: Date;
}> {
  constructor(estateId: string, certificateNumber: string, clearedBy: string, version: number) {
    super(estateId, 'EstateTaxClearedEvent', version, {
      estateId,
      certificateNumber,
      clearedBy,
      clearanceDate: new Date(),
    });
  }
}

/**
 * Tax Exempted
 * Triggered if the estate falls below the threshold or has specific exemptions.
 */
export class EstateTaxExemptedEvent extends EstateTaxEvent<{
  estateId: string;
  reason: string;
  authorizedBy: string;
}> {
  constructor(estateId: string, reason: string, authorizedBy: string, version: number) {
    super(estateId, 'EstateTaxExemptedEvent', version, {
      estateId,
      reason,
      authorizedBy,
    });
  }
}
