import { DomainEvent } from '../base/domain-event';

export class WillDraftedEvent extends DomainEvent<{
  testatorId: string;
  willId: string;
  type: string;
  status: string;
}> {
  constructor(willId: string, testatorId: string, type: string, status: string) {
    super(willId, 'Will', 1, { willId, testatorId, type, status });
  }
}

export class WillExecutedEvent extends DomainEvent<{
  testatorId: string;
  willId: string;
  executionDate: string;
  witnessCount: number;
}> {
  constructor(willId: string, testatorId: string, executionDate: string, witnessCount: number) {
    super(willId, 'Will', 1, { willId, testatorId, executionDate, witnessCount });
  }
}

export class WillRevokedEvent extends DomainEvent<{
  testatorId: string;
  willId: string;
  revocationMethod: string;
  reason?: string;
}> {
  constructor(willId: string, testatorId: string, revocationMethod: string, reason?: string) {
    super(willId, 'Will', 1, { willId, testatorId, revocationMethod, reason });
  }
}

export class BequestAddedEvent extends DomainEvent<{
  bequestId: string;
  beneficiary: Record<string, any>;
  bequestType: string;
}> {
  constructor(
    willId: string,
    bequestId: string,
    beneficiary: Record<string, any>,
    bequestType: string,
  ) {
    super(willId, 'Will', 1, { bequestId, beneficiary, bequestType });
  }
}

export class ExecutorAddedEvent extends DomainEvent<{
  executorId: string;
  executorName: string;
  priority: Record<string, any>;
}> {
  constructor(
    willId: string,
    executorId: string,
    executorName: string,
    priority: Record<string, any>,
  ) {
    super(willId, 'Will', 1, { executorId, executorName, priority });
  }
}

export class WitnessAddedEvent extends DomainEvent<{
  witnessId: string;
  witnessName: string;
  witnessType: string;
}> {
  constructor(willId: string, witnessId: string, witnessName: string, witnessType: string) {
    super(willId, 'Will', 1, { witnessId, witnessName, witnessType });
  }
}

export class CodicilAddedEvent extends DomainEvent<{
  codicilId: string;
  title: string;
  amendmentType: string;
}> {
  constructor(willId: string, codicilId: string, title: string, amendmentType: string) {
    super(willId, 'Will', 1, { codicilId, title, amendmentType });
  }
}

export class DisinheritanceAddedEvent extends DomainEvent<{
  recordId: string;
  disinheritedPerson: Record<string, any>;
  reasonCategory: string;
}> {
  constructor(
    willId: string,
    recordId: string,
    disinheritedPerson: Record<string, any>,
    reasonCategory: string,
  ) {
    super(willId, 'Will', 1, { recordId, disinheritedPerson, reasonCategory });
  }
}

export class CapacityDeclarationUpdatedEvent extends DomainEvent<{
  willId: string;
  status: string;
  isCompetent: boolean;
}> {
  constructor(willId: string, status: string, isCompetent: boolean) {
    super(willId, 'Will', 1, { willId, status, isCompetent });
  }
}
