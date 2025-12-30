// src/estate-service/src/domain/events/estate-tax.event.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Estate Tax Domain Events
 *
 * Events are triggered by the EstateTaxCompliance entity but belong to the Estate aggregate.
 * Therefore, the aggregateId is the estateId.
 */

export class EstateTaxAssessmentReceivedEvent extends DomainEvent<{
  estateId: string;
  totalLiability: number;
  assessmentReference: string;
  assessedBy: string;
}> {
  constructor(
    estateId: string,
    totalLiability: number,
    assessmentReference: string,
    assessedBy: string,
    version: number,
  ) {
    super(estateId, 'EstateTaxCompliance', version, {
      estateId,
      totalLiability,
      assessmentReference,
      assessedBy,
    });
  }
}

export class EstateTaxPaymentRecordedEvent extends DomainEvent<{
  estateId: string;
  amount: number;
  paymentType: string;
  reference: string;
  paidBy?: string;
}> {
  constructor(
    estateId: string,
    amount: number,
    paymentType: string,
    reference: string,
    paidBy: string | undefined,
    version: number,
  ) {
    super(estateId, 'EstateTaxCompliance', version, {
      estateId,
      amount,
      paymentType,
      reference,
      paidBy,
    });
  }
}

export class EstateTaxClearedEvent extends DomainEvent<{
  estateId: string;
  certificateNumber: string;
  clearedBy: string;
}> {
  constructor(estateId: string, certificateNumber: string, clearedBy: string, version: number) {
    super(estateId, 'EstateTaxCompliance', version, {
      estateId,
      certificateNumber,
      clearedBy,
    });
  }
}

export class EstateTaxExemptedEvent extends DomainEvent<{
  estateId: string;
  reason: string;
  certificateNo?: string;
  exemptedBy?: string;
}> {
  constructor(
    estateId: string,
    reason: string,
    certificateNo: string | undefined,
    exemptedBy: string | undefined,
    version: number,
  ) {
    super(estateId, 'EstateTaxCompliance', version, {
      estateId,
      reason,
      certificateNo,
      exemptedBy,
    });
  }
}

// Optional: Add this event if not exists
export class EstateTaxInvestigationInitiatedEvent extends DomainEvent<{
  estateId: string;
  reason: string;
  investigator?: string;
}> {
  constructor(estateId: string, reason: string, investigator: string | undefined, version: number) {
    super(estateId, 'EstateTaxCompliance', version, {
      estateId,
      reason,
      investigator,
    });
  }
}

// Optional: Add this event if not exists
export class EstateTaxInvestigationResolvedEvent extends DomainEvent<{
  estateId: string;
  outcome: string;
  resolvedBy: string;
}> {
  constructor(estateId: string, outcome: string, resolvedBy: string, version: number) {
    super(estateId, 'EstateTaxCompliance', version, {
      estateId,
      outcome,
      resolvedBy,
    });
  }
}
