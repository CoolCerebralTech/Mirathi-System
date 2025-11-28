import { AggregateRoot } from '@nestjs/cqrs';
import { GrantStatus, GrantType } from '@prisma/client';

import { GrantAmendedEvent } from '../events/grant-amended.event';
import { GrantConfirmedEvent } from '../events/grant-confirmed.event';
import { GrantExpiredEvent } from '../events/grant-expired.event';
// Domain Events
import { GrantIssuedEvent } from '../events/grant-issued.event';
import { GrantReplacedEvent } from '../events/grant-replaced.event';
import { GrantRevokedEvent } from '../events/grant-revoked.event';

// Main Entity
export class GrantOfAdministration extends AggregateRoot {
  constructor(
    private readonly id: string,
    private readonly estateId: string,
    private grantType: GrantType,
    private status: GrantStatus = GrantStatus.ISSUED,
    private applicantId?: string,
    private applicantName?: string,
    private issuedBy?: string,
    private issuedAt?: Date,
    private expiresAt?: Date,
    private caseNumber?: string,
    private fileReference?: string,
    private notes?: string,
    private grantNumber?: string,
    private courtStation?: string,
    private confirmedBy?: string,
    private confirmationDate?: Date,
    private revokedBy?: string,
    private revocationDate?: Date,
    private revocationReason?: string,
    private courtOrderNumber?: string,
    private isActive: boolean = true,
    private conditions: any[] = [],
    private amendmentHistory: any[] = [],
    private replacedByGrantId?: string,
    private replacementReason?: string,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {
    super();
    this.validate();
  }

  // ==========================================================================
  // FACTORY METHODS (Creation & Reconstitution)
  // ==========================================================================

  static issue(
    id: string,
    estateId: string,
    grantType: GrantType,
    options: {
      applicantId?: string;
      applicantName?: string;
      issuedBy?: string;
      issuedAt?: Date;
      expiresAt?: Date;
      caseNumber?: string;
      fileReference?: string;
      notes?: string;
      grantNumber?: string;
      courtStation?: string;
      conditions?: any[];
    },
  ): GrantOfAdministration {
    // Legal Validation: Kenyan grant types and requirements
    GrantOfAdministration.validateGrantType(grantType, options);

    const grant = new GrantOfAdministration(
      id,
      estateId,
      grantType,
      GrantStatus.ISSUED,
      options.applicantId,
      options.applicantName,
      options.issuedBy,
      options.issuedAt || new Date(),
      options.expiresAt,
      options.caseNumber,
      options.fileReference,
      options.notes,
      options.grantNumber,
      options.courtStation,
      undefined, // confirmedBy
      undefined, // confirmationDate
      undefined, // revokedBy
      undefined, // revocationDate
      undefined, // revocationReason
      undefined, // courtOrderNumber
      true, // isActive
      options.conditions || [],
      [], // amendmentHistory
      undefined, // replacedByGrantId
      undefined, // replacementReason
      new Date(), // createdAt
      new Date(), // updatedAt
    );

    grant.apply(
      new GrantIssuedEvent(
        grant.id,
        grant.estateId,
        grant.grantType,
        grant.issuedAt!,
        grant.grantNumber,
        grant.courtStation,
      ),
    );

    return grant;
  }

  static reconstitute(props: {
    id: string;
    estateId: string;
    grantType: GrantType;
    status: GrantStatus;
    applicantId?: string;
    applicantName?: string;
    issuedBy?: string;
    issuedAt?: Date;
    expiresAt?: Date;
    caseNumber?: string;
    fileReference?: string;
    notes?: string;
    grantNumber?: string;
    courtStation?: string;
    confirmedBy?: string;
    confirmationDate?: Date;
    revokedBy?: string;
    revocationDate?: Date;
    revocationReason?: string;
    courtOrderNumber?: string;
    isActive?: boolean;
    conditions?: any[];
    amendmentHistory?: any[];
    replacedByGrantId?: string;
    replacementReason?: string;
    createdAt: Date;
    updatedAt: Date;
  }): GrantOfAdministration {
    return new GrantOfAdministration(
      props.id,
      props.estateId,
      props.grantType,
      props.status,
      props.applicantId,
      props.applicantName,
      props.issuedBy,
      props.issuedAt,
      props.expiresAt,
      props.caseNumber,
      props.fileReference,
      props.notes,
      props.grantNumber,
      props.courtStation,
      props.confirmedBy,
      props.confirmationDate,
      props.revokedBy,
      props.revocationDate,
      props.revocationReason,
      props.courtOrderNumber,
      props.isActive ?? true,
      props.conditions || [],
      props.amendmentHistory || [],
      props.replacedByGrantId,
      props.replacementReason,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ==========================================================================
  // BUSINESS LOGIC (Domain Behavior)
  // ==========================================================================

  // Legal Requirement: Confirmation of grant under Kenyan law
  confirmGrant(
    confirmedBy: string,
    confirmationDate: Date = new Date(),
    options?: {
      courtOrderNumber?: string;
      confirmationNotes?: string;
    },
  ): void {
    if (this.status !== GrantStatus.ISSUED) {
      throw new Error('Only issued grants can be confirmed');
    }

    if (!this.isActive) {
      throw new Error('Cannot confirm an inactive grant');
    }

    // Legal Requirement: Minimum timeframe for confirmation (typically 6 months)
    const minimumConfirmationPeriod = this.calculateMinimumConfirmationPeriod();
    if (confirmationDate < minimumConfirmationPeriod) {
      console.warn('Grant confirmed earlier than typical minimum confirmation period');
    }

    this.status = GrantStatus.CONFIRMED;
    this.confirmedBy = confirmedBy;
    this.confirmationDate = confirmationDate;

    if (options?.courtOrderNumber) {
      this.courtOrderNumber = options.courtOrderNumber;
    }

    if (options?.confirmationNotes) {
      this.notes = options.confirmationNotes;
    }

    this.updatedAt = new Date();

    this.apply(
      new GrantConfirmedEvent(
        this.id,
        this.estateId,
        confirmationDate,
        confirmedBy,
        options?.courtOrderNumber,
      ),
    );
  }

  // Legal Requirement: Revocation with proper legal grounds
  revokeGrant(
    revocationReason: string,
    revokedBy: string,
    revocationDate: Date = new Date(),
    courtOrderNumber?: string,
  ): void {
    if (this.status === GrantStatus.REVOKED) {
      throw new Error('Grant is already revoked');
    }

    // Legal Requirement: Valid revocation reasons
    if (!GrantOfAdministration.isValidRevocationReason(revocationReason)) {
      throw new Error('Invalid revocation reason under Kenyan succession law');
    }

    this.status = GrantStatus.REVOKED;
    this.isActive = false;
    this.revokedBy = revokedBy;
    this.revocationDate = revocationDate;
    this.revocationReason = revocationReason;

    if (courtOrderNumber) {
      this.courtOrderNumber = courtOrderNumber;
    }

    this.updatedAt = new Date();

    this.apply(
      new GrantRevokedEvent(
        this.id,
        this.estateId,
        revocationDate,
        revocationReason,
        revokedBy,
        courtOrderNumber,
      ),
    );
  }

  // Legal Requirement: Amendment with court approval
  amendGrant(
    amendmentReason: string,
    amendedBy: string,
    changes: any[],
    amendmentDate: Date = new Date(),
    courtOrderNumber?: string,
  ): void {
    if (!this.isActive) {
      throw new Error('Cannot amend an inactive grant');
    }

    // Legal Requirement: Amendments typically require court approval
    if (!courtOrderNumber) {
      console.warn('Grant amendments should typically have court order reference');
    }

    const amendmentRecord = {
      amendmentDate,
      amendmentReason,
      amendedBy,
      changes,
      courtOrderNumber,
    };

    this.amendmentHistory.push(amendmentRecord);
    this.status = GrantStatus.AMENDED;
    this.updatedAt = new Date();

    this.apply(
      new GrantAmendedEvent(
        this.id,
        this.estateId,
        amendmentDate,
        amendmentReason,
        amendedBy,
        changes,
        courtOrderNumber,
      ),
    );
  }

  // Legal Requirement: Grant replacement process
  replaceGrant(
    newGrantId: string,
    replacementReason: string,
    replacedBy: string,
    replacementDate: Date = new Date(),
  ): void {
    if (!this.isActive) {
      throw new Error('Cannot replace an inactive grant');
    }

    this.status = GrantStatus.REPLACED;
    this.isActive = false;
    this.replacedByGrantId = newGrantId;
    this.replacementReason = replacementReason;
    this.updatedAt = new Date();

    this.apply(
      new GrantReplacedEvent(
        this.id,
        newGrantId,
        this.estateId,
        replacementDate,
        replacementReason,
        replacedBy,
      ),
    );
  }

  // Legal Requirement: Automatic expiration
  markAsExpired(): void {
    if (this.status === GrantStatus.EXPIRED) {
      return;
    }

    if (this.expiresAt && new Date() > this.expiresAt) {
      this.status = GrantStatus.EXPIRED;
      this.isActive = false;
      this.updatedAt = new Date();

      this.apply(new GrantExpiredEvent(this.id, this.estateId, new Date(), this.grantType));
    }
  }

  updateConditions(newConditions: any[]): void {
    if (!this.isActive) {
      throw new Error('Cannot update conditions of an inactive grant');
    }

    this.conditions = newConditions;
    this.updatedAt = new Date();
  }

  addCondition(condition: any): void {
    if (!this.isActive) {
      throw new Error('Cannot add conditions to an inactive grant');
    }

    this.conditions.push(condition);
    this.updatedAt = new Date();
  }

  // ==========================================================================
  // LEGAL COMPLIANCE & VALIDATION
  // ==========================================================================

  private validate(): void {
    if (!this.id) throw new Error('Grant ID is required');
    if (!this.estateId) throw new Error('Estate ID is required');
    if (!this.grantType) throw new Error('Grant type is required');
    if (!this.status) throw new Error('Grant status is required');

    // Legal Requirement: Validation based on grant type
    switch (this.grantType) {
      case GrantType.PROBATE:
        if (!this.applicantId && !this.applicantName) {
          throw new Error('Probate grants require applicant identification');
        }
        break;
      case GrantType.LETTERS_OF_ADMINISTRATION:
        if (!this.applicantName) {
          console.warn('Letters of administration should have applicant name');
        }
        break;
    }

    // Validate date consistency
    if (this.issuedAt && this.confirmationDate && this.confirmationDate < this.issuedAt) {
      throw new Error('Confirmation date cannot be before issue date');
    }

    if (this.issuedAt && this.revocationDate && this.revocationDate < this.issuedAt) {
      throw new Error('Revocation date cannot be before issue date');
    }
  }

  private static validateGrantType(grantType: GrantType, options: any): void {
    // Legal Requirement: Specific validations by grant type
    switch (grantType) {
      case GrantType.PROBATE:
        if (!options.applicantId && !options.applicantName) {
          throw new Error('Probate grants require applicant identification');
        }
        break;
      case GrantType.LIMITED_GRANT:
        if (!options.expiresAt) {
          throw new Error('Limited grants must have an expiration date');
        }
        break;
      case GrantType.SPECIAL_GRANT:
        if (!options.conditions || options.conditions.length === 0) {
          console.warn('Special grants typically have specific conditions');
        }
        break;
    }
  }

  private static isValidRevocationReason(reason: string): boolean {
    const validReasons = [
      'invalid will',
      'undue influence',
      'lack of capacity',
      'fraud',
      'better right applicant',
      'court order',
      'administrator misconduct',
    ];

    return validReasons.some((validReason) => reason.toLowerCase().includes(validReason));
  }

  private calculateMinimumConfirmationPeriod(): Date {
    const minimumDate = new Date(this.issuedAt!);
    // Kenyan law: Typically 6 months for confirmation
    minimumDate.setMonth(minimumDate.getMonth() + 6);
    return minimumDate;
  }

  // ==========================================================================
  // QUERY METHODS & BUSINESS RULES
  // ==========================================================================

  isExpired(): boolean {
    return (
      this.status === GrantStatus.EXPIRED || (this.expiresAt ? new Date() > this.expiresAt : false)
    );
  }

  isValid(): boolean {
    return (
      this.isActive &&
      !this.isExpired() &&
      this.status !== GrantStatus.REVOKED &&
      this.status !== GrantStatus.REPLACED
    );
  }

  requiresConfirmation(): boolean {
    return this.status === GrantStatus.ISSUED && this.grantType !== GrantType.LIMITED_GRANT;
  }

  canBeAmended(): boolean {
    return this.isActive && this.isValid();
  }

  getDaysUntilExpiry(): number {
    if (!this.expiresAt) return Infinity;

    const now = new Date();
    const diffTime = this.expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysSinceIssuance(): number {
    if (!this.issuedAt) return 0;

    const now = new Date();
    const diffTime = now.getTime() - this.issuedAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  isCourtSupervised(): boolean {
    return [
      GrantType.PROBATE,
      GrantType.LETTERS_OF_ADMINISTRATION,
      GrantType.LETTERS_OF_ADMINISTRATION_WITH_WILL,
    ].includes(this.grantType);
  }

  getLegalDescription(): string {
    const grantTypeDescriptions: Record<GrantType, string> = {
      [GrantType.PROBATE]: 'Grant of Probate',
      [GrantType.LETTERS_OF_ADMINISTRATION]: 'Letters of Administration',
      [GrantType.LETTERS_OF_ADMINISTRATION_WITH_WILL]:
        'Letters of Administration with Will Annexed',
      [GrantType.LIMITED_GRANT]: 'Limited Grant',
      [GrantType.SPECIAL_GRANT]: 'Special Grant',
    };

    return `${grantTypeDescriptions[this.grantType]} - ${this.grantNumber || 'No Grant Number'}`;
  }

  // ==========================================================================
  // GETTERS (Persistence Interface)
  // ==========================================================================

  getId(): string {
    return this.id;
  }
  getEstateId(): string {
    return this.estateId;
  }
  getGrantType(): GrantType {
    return this.grantType;
  }
  getStatus(): GrantStatus {
    return this.status;
  }
  getApplicantId(): string | undefined {
    return this.applicantId;
  }
  getApplicantName(): string | undefined {
    return this.applicantName;
  }
  getIssuedBy(): string | undefined {
    return this.issuedBy;
  }
  getIssuedAt(): Date | undefined {
    return this.issuedAt;
  }
  getExpiresAt(): Date | undefined {
    return this.expiresAt;
  }
  getCaseNumber(): string | undefined {
    return this.caseNumber;
  }
  getFileReference(): string | undefined {
    return this.fileReference;
  }
  getNotes(): string | undefined {
    return this.notes;
  }
  getGrantNumber(): string | undefined {
    return this.grantNumber;
  }
  getCourtStation(): string | undefined {
    return this.courtStation;
  }
  getConfirmedBy(): string | undefined {
    return this.confirmedBy;
  }
  getConfirmationDate(): Date | undefined {
    return this.confirmationDate;
  }
  getRevokedBy(): string | undefined {
    return this.revokedBy;
  }
  getRevocationDate(): Date | undefined {
    return this.revocationDate;
  }
  getRevocationReason(): string | undefined {
    return this.revocationReason;
  }
  getCourtOrderNumber(): string | undefined {
    return this.courtOrderNumber;
  }
  getIsActive(): boolean {
    return this.isActive;
  }
  getConditions(): any[] {
    return [...this.conditions];
  }
  getAmendmentHistory(): any[] {
    return [...this.amendmentHistory];
  }
  getReplacedByGrantId(): string | undefined {
    return this.replacedByGrantId;
  }
  getReplacementReason(): string | undefined {
    return this.replacementReason;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // For persistence reconstitution
  getProps() {
    return {
      id: this.id,
      estateId: this.estateId,
      grantType: this.grantType,
      status: this.status,
      applicantId: this.applicantId,
      applicantName: this.applicantName,
      issuedBy: this.issuedBy,
      issuedAt: this.issuedAt,
      expiresAt: this.expiresAt,
      caseNumber: this.caseNumber,
      fileReference: this.fileReference,
      notes: this.notes,
      grantNumber: this.grantNumber,
      courtStation: this.courtStation,
      confirmedBy: this.confirmedBy,
      confirmationDate: this.confirmationDate,
      revokedBy: this.revokedBy,
      revocationDate: this.revocationDate,
      revocationReason: this.revocationReason,
      courtOrderNumber: this.courtOrderNumber,
      isActive: this.isActive,
      conditions: this.conditions,
      amendmentHistory: this.amendmentHistory,
      replacedByGrantId: this.replacedByGrantId,
      replacementReason: this.replacementReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
