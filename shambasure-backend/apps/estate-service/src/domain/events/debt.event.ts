// src/estate-service/src/domain/events/debt.event.ts
import { DomainEvent } from '../base/domain-event';
import { DebtType } from '../enums/debt-type.enum';

export class DebtCreatedEvent extends DomainEvent<{
  estateId: string;
  debtType: DebtType;
  amount: number;
  creditorName: string;
}> {
  constructor(
    debtId: string,
    estateId: string,
    debtType: DebtType,
    amount: number,
    creditorName: string,
    version: number,
  ) {
    super(debtId, 'Debt', version, {
      estateId,
      debtType,
      amount,
      creditorName,
    });
  }
}

export class DebtPaymentRecordedEvent extends DomainEvent<{
  estateId: string;
  paymentAmount: number;
  interestPaid: number;
  principalPaid: number;
  newBalance: number;
  paidBy: string;
}> {
  constructor(
    debtId: string,
    estateId: string,
    paymentAmount: number,
    interestPaid: number,
    principalPaid: number,
    newBalance: number,
    paidBy: string,
    version: number,
  ) {
    super(debtId, 'Debt', version, {
      estateId,
      paymentAmount,
      interestPaid,
      principalPaid,
      newBalance,
      paidBy,
    });
  }
}

export class DebtSettledEvent extends DomainEvent<{
  estateId: string;
  settlementDate: Date;
  settledBy: string;
}> {
  constructor(
    debtId: string,
    estateId: string,
    settlementDate: Date,
    settledBy: string,
    version: number,
  ) {
    super(debtId, 'Debt', version, {
      estateId,
      settlementDate,
      settledBy,
    });
  }
}

export class DebtDisputedEvent extends DomainEvent<{
  estateId: string;
  reason: string;
  disputedBy: string;
}> {
  constructor(
    debtId: string,
    estateId: string,
    reason: string,
    disputedBy: string,
    version: number,
  ) {
    super(debtId, 'Debt', version, {
      estateId,
      reason,
      disputedBy,
    });
  }
}

export class DebtWrittenOffEvent extends DomainEvent<{
  estateId: string;
  amountWrittenOff: number;
  reason: string;
  authorizedBy: string;
}> {
  constructor(
    debtId: string,
    estateId: string,
    amountWrittenOff: number,
    reason: string,
    authorizedBy: string,
    version: number,
  ) {
    super(debtId, 'Debt', version, {
      estateId,
      amountWrittenOff,
      reason,
      authorizedBy,
    });
  }
}

export class DebtStatuteBarredEvent extends DomainEvent<{
  estateId: string;
  yearsElapsed: number;
}> {
  constructor(debtId: string, estateId: string, yearsElapsed: number, version: number) {
    super(debtId, 'Debt', version, {
      estateId,
      yearsElapsed,
    });
  }
}
