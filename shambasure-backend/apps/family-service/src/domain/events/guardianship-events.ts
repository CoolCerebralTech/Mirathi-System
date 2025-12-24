// src/domain/events/guardianship-events.ts
import { DomainEvent } from '../base/domain-event';

// 🎯 INNOVATIVE: All Guardianship-related domain events

export class GuardianshipActivatedEvent extends DomainEvent<{
  activationDate: Date;
  guardiansCount: number;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class GuardianRemovedEvent extends DomainEvent<{
  guardianId: string;
  reason: string;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class ComplianceCheckCreatedEvent extends DomainEvent<{
  checkId: string;
  dueDate: Date;
  period: string;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class ComplianceCheckSubmittedEvent extends DomainEvent<{
  checkId: string;
  submissionDate: Date;
  qualityScore: number;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class RiskFactorAddedEvent extends DomainEvent<{
  category: string;
  description: string;
  severity: string;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class BondPostedEvent extends DomainEvent<{
  amount: number;
  suretyCompany: string;
  bondReference: string;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class EmergencyModeActivatedEvent extends DomainEvent<{
  reason: string;
  activationTime: Date;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class GuardianshipSuspendedEvent extends DomainEvent<{
  reason: string;
  suspensionDate: Date;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class GuardianshipResumedEvent extends DomainEvent<{
  resumptionDate: Date;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}
// 🎯 INNOVATIVE: Custom Domain Events for Guardianship
export class GuardianshipCreatedEvent extends DomainEvent<{
  wardId: string;
  guardianshipType: string;
  establishedDate: Date;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class GuardianAppointedEvent extends DomainEvent<{
  guardianId: string;
  role: string;
  isPrimary: boolean;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class GuardianshipTerminatedEvent extends DomainEvent<{
  reason: string;
  terminatedDate: Date;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class ComplianceCheckDueEvent extends DomainEvent<{
  dueDate: Date;
  checkType: string;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class RiskFlagRaisedEvent extends DomainEvent<{
  riskLevel: string;
  factor: string;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}
