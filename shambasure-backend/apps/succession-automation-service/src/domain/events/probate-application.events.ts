// src/succession-automation/src/domain/events/probate-application.events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Domain Events for Probate Application Aggregate
 *
 * PURPOSE: Communicate form generation and consent status to other services
 *
 * EVENT CONSUMERS:
 * - Notification Service: "Your forms are ready for review"
 * - Email Service: Send consent requests to family members
 * - SMS Service: Send OTP codes for consent
 * - Executor Roadmap: Update tasks ("Forms generated ✓")
 * - Analytics Service: Track filing success rates
 */

// ============================================================================
// Probate Application Created
// ============================================================================

export interface ProbateApplicationCreatedPayload {
  applicationId: string;
  estateId: string;
  applicationType: string;
  targetCourt: string;
  courtStation: string;
}

export class ProbateApplicationCreated extends DomainEvent<ProbateApplicationCreatedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ProbateApplicationCreatedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'ProbateApplicationCreated';
  }

  public getPayload(): ProbateApplicationCreatedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Form Generated
// ============================================================================

export interface FormGeneratedPayload {
  applicationId: string;
  estateId: string;
  formId: string;
  formType: string; // KenyanFormTypeEnum value
  formCode: string; // "P&A 1", "P&A 80", etc.
}

export class FormGenerated extends DomainEvent<FormGeneratedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: FormGeneratedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'FormGenerated';
  }

  public getPayload(): FormGeneratedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// All Forms Generated
// ============================================================================

export interface AllFormsGeneratedPayload {
  applicationId: string;
  estateId: string;
  totalForms: number;
}

export class AllFormsGenerated extends DomainEvent<AllFormsGeneratedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: AllFormsGeneratedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'AllFormsGenerated';
  }

  public getPayload(): AllFormsGeneratedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Consent Requested
// ============================================================================

export interface ConsentRequestedPayload {
  applicationId: string;
  consentId: string;
  familyMemberId: string;
  familyMemberName: string;
  method: 'SMS' | 'EMAIL' | 'BOTH';
}

export class ConsentRequested extends DomainEvent<ConsentRequestedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ConsentRequestedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'ConsentRequested';
  }

  public getPayload(): ConsentRequestedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Consent Granted
// ============================================================================

export interface ConsentGrantedPayload {
  applicationId: string;
  consentId: string;
  familyMemberId: string;
  familyMemberName: string;
}

export class ConsentGranted extends DomainEvent<ConsentGrantedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ConsentGrantedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'ConsentGranted';
  }

  public getPayload(): ConsentGrantedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Consent Declined
// ============================================================================

export interface ConsentDeclinedPayload {
  applicationId: string;
  consentId: string;
  familyMemberId: string;
  familyMemberName: string;
  reason: string;
}

export class ConsentDeclined extends DomainEvent<ConsentDeclinedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ConsentDeclinedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'ConsentDeclined';
  }

  public getPayload(): ConsentDeclinedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// All Consents Received
// ============================================================================

export interface AllConsentsReceivedPayload {
  applicationId: string;
  estateId: string;
  totalConsents: number;
}

export class AllConsentsReceived extends DomainEvent<AllConsentsReceivedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: AllConsentsReceivedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'AllConsentsReceived';
  }

  public getPayload(): AllConsentsReceivedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Application Ready To File
// ============================================================================

export interface ApplicationReadyToFilePayload {
  applicationId: string;
  estateId: string;
}

export class ApplicationReadyToFile extends DomainEvent<ApplicationReadyToFilePayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ApplicationReadyToFilePayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'ApplicationReadyToFile';
  }

  public getPayload(): ApplicationReadyToFilePayload {
    return super.getPayload();
  }
}

// ============================================================================
// Application Filed
// ============================================================================

export interface ApplicationFiledPayload {
  applicationId: string;
  estateId: string;
  courtCaseNumber?: string;
  courtStation: string;
  filedAt: Date;
}

export class ApplicationFiled extends DomainEvent<ApplicationFiledPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ApplicationFiledPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'ApplicationFiled';
  }

  public getPayload(): ApplicationFiledPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Application Rejected (By Court)
// ============================================================================

export interface ApplicationRejectedPayload {
  applicationId: string;
  estateId: string;
  reason: string;
  rejectedAt: Date;
}

export class ApplicationRejected extends DomainEvent<ApplicationRejectedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ApplicationRejectedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'ApplicationRejected';
  }

  public getPayload(): ApplicationRejectedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Form Superseded
// ============================================================================

export interface FormSupersededPayload {
  applicationId: string;
  oldFormId: string;
  newFormId: string;
  formType: string;
}

export class FormSuperseded extends DomainEvent<FormSupersededPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: FormSupersededPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'FormSuperseded';
  }

  public getPayload(): FormSupersededPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Form Approved
// ============================================================================

export interface FormApprovedPayload {
  applicationId: string;
  formId: string;
  formType: string;
  approvedBy: string;
  approvedAt: Date;
}

export class FormApproved extends DomainEvent<FormApprovedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: FormApprovedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'FormApproved';
  }

  public getPayload(): FormApprovedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Filing Fee Paid
// ============================================================================

export interface FilingFeePaidPayload {
  applicationId: string;
  estateId: string;
  amount: number;
  paidAt: Date;
}

export class FilingFeePaid extends DomainEvent<FilingFeePaidPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: FilingFeePaidPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'FilingFeePaid';
  }

  public getPayload(): FilingFeePaidPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Grant Approved (Court Decision)
// ============================================================================

export interface GrantApprovedPayload {
  applicationId: string;
  estateId: string;
  grantNumber: string;
  grantedAt: Date;
}

export class GrantApproved extends DomainEvent<GrantApprovedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: GrantApprovedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'GrantApproved';
  }

  public getPayload(): GrantApprovedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Application Withdrawn
// ============================================================================

export interface ApplicationWithdrawnPayload {
  applicationId: string;
  estateId: string;
  reason: string;
  withdrawnAt: Date;
}

export class ApplicationWithdrawn extends DomainEvent<ApplicationWithdrawnPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ApplicationWithdrawnPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'ApplicationWithdrawn';
  }

  public getPayload(): ApplicationWithdrawnPayload {
    return super.getPayload();
  }
}
