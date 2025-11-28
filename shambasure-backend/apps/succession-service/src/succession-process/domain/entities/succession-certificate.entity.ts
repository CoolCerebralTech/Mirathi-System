import { AggregateRoot } from '@nestjs/cqrs';
import { GrantType } from '@prisma/client';

import { SUCCESSION_TIMEFRAMES } from '../../../common/constants/kenyan-law.constants';
import { GrantAmendedEvent } from '../events/grant-amended.event';
import { GrantConfirmedEvent } from '../events/grant-confirmed.event';
import { GrantExpiredEvent } from '../events/grant-expired.event';
import { GrantIssuedEvent } from '../events/grant-issued.event';
import { GrantReplacedEvent } from '../events/grant-replaced.event';
import { GrantRevokedEvent } from '../events/grant-revoked.event';

export type GrantStatus = 'ISSUED' | 'CONFIRMED' | 'REVOKED' | 'EXPIRED' | 'AMENDED' | 'REPLACED';
export type CertificateType =
  | 'PROBATE'
  | 'LETTERS_OF_ADMINISTRATION'
  | 'LETTERS_OF_ADMINISTRATION_WITH_WILL'
  | 'CONFIRMED_GRANT';

// Safe interface for reconstitution
export interface SuccessionCertificateProps {
  id: string;
  estateId: string;
  applicantId: string;
  type: GrantType;
  status: GrantStatus;
  issueDate: Date | string;
  confirmationDate?: Date | string | null;
  expiryDate?: Date | string | null;
  fileReference?: string | null;
  grantNumber: string;
  courtStation: string;
  courtCaseNumber: string;
  issuedBy: string;
  confirmedBy?: string | null;
  revocationDetails?: {
    revocationDate?: Date | string | null;
    revocationReason?: string | null;
    revokedBy?: string | null;
    courtOrderNumber?: string | null;
  } | null;
  amendmentHistory?: {
    amendmentDate: Date | string;
    amendmentReason: string;
    amendedBy: string;
    changes: string[];
    courtOrderNumber?: string | null;
  }[];
  conditions?: string[];
  replacementDetails?: {
    replacedByGrantId?: string | null;
    replacementDate?: Date | string | null;
    replacementReason?: string | null;
  } | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class SuccessionCertificate extends AggregateRoot {
  private id: string;
  private estateId: string;
  private applicantId: string;
  private type: GrantType;
  private status: GrantStatus;

  // Certificate Details
  private issueDate: Date;
  private confirmationDate: Date | null;
  private expiryDate: Date | null;
  private fileReference: string | null;
  private grantNumber: string;
  private courtStation: string;
  private courtCaseNumber: string;
  private issuedBy: string;
  private confirmedBy: string | null;

  // Legal Details
  private conditions: string[];

  // Revocation Details
  private revocationDetails: {
    revocationDate: Date | null;
    revocationReason: string | null;
    revokedBy: string | null;
    courtOrderNumber: string | null;
  };

  // Amendment History
  private amendmentHistory: {
    amendmentDate: Date;
    amendmentReason: string;
    amendedBy: string;
    changes: string[];
    courtOrderNumber: string | null;
  }[];

  // Replacement Details
  private replacementDetails: {
    replacedByGrantId: string | null;
    replacementDate: Date | null;
    replacementReason: string | null;
  };

  private isActive: boolean;
  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    estateId: string,
    applicantId: string,
    type: GrantType,
    issueDate: Date,
    grantNumber: string,
    courtStation: string,
    courtCaseNumber: string,
    issuedBy: string,
  ) {
    super();
    this.id = id;
    this.estateId = estateId;
    this.applicantId = applicantId;
    this.type = type;
    this.issueDate = issueDate;
    this.grantNumber = grantNumber;
    this.courtStation = courtStation;
    this.courtCaseNumber = courtCaseNumber;
    this.issuedBy = issuedBy;

    this.status = 'ISSUED';
    this.confirmationDate = null;
    this.confirmedBy = null;
    this.fileReference = null;
    this.conditions = [];
    this.isActive = true;

    this.expiryDate = this.calculateExpiryDate();

    this.revocationDetails = {
      revocationDate: null,
      revocationReason: null,
      revokedBy: null,
      courtOrderNumber: null,
    };

    this.amendmentHistory = [];

    this.replacementDetails = {
      replacedByGrantId: null,
      replacementDate: null,
      replacementReason: null,
    };

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    estateId: string,
    applicantId: string,
    type: GrantType,
    issueDate: Date,
    options: {
      grantNumber: string;
      courtStation: string;
      courtCaseNumber: string;
      issuedBy: string;
      fileReference?: string;
      conditions?: string[];
      expiryDate?: Date;
    },
  ): SuccessionCertificate {
    const cert = new SuccessionCertificate(
      id,
      estateId,
      applicantId,
      type,
      issueDate,
      options.grantNumber,
      options.courtStation,
      options.courtCaseNumber,
      options.issuedBy,
    );

    if (options.fileReference) cert.fileReference = options.fileReference;
    if (options.conditions) cert.conditions = options.conditions;
    if (options.expiryDate) cert.expiryDate = options.expiryDate;

    cert.apply(
      new GrantIssuedEvent(
        id,
        estateId,
        applicantId,
        issueDate,
        type,
        options.grantNumber,
        options.courtStation,
        cert.expiryDate || undefined,
        options.conditions,
      ),
    );

    return cert;
  }

  static reconstitute(props: SuccessionCertificateProps): SuccessionCertificate {
    if (
      !props.id ||
      !props.estateId ||
      !props.applicantId ||
      !props.type ||
      !props.issueDate ||
      !props.grantNumber ||
      !props.courtStation ||
      !props.courtCaseNumber ||
      !props.issuedBy
    ) {
      throw new Error('Missing required properties for SuccessionCertificate reconstitution');
    }

    const cert = new SuccessionCertificate(
      props.id,
      props.estateId,
      props.applicantId,
      props.type,
      new Date(props.issueDate),
      props.grantNumber,
      props.courtStation,
      props.courtCaseNumber,
      props.issuedBy,
    );

    cert.status = props.status;
    cert.fileReference = props.fileReference ?? null;
    cert.confirmedBy = props.confirmedBy ?? null;
    cert.conditions = props.conditions || [];
    cert.isActive = props.isActive;

    cert.confirmationDate = props.confirmationDate ? new Date(props.confirmationDate) : null;
    cert.expiryDate = props.expiryDate ? new Date(props.expiryDate) : cert.calculateExpiryDate();

    if (props.revocationDetails) {
      cert.revocationDetails = {
        revocationDate: props.revocationDetails.revocationDate
          ? new Date(props.revocationDetails.revocationDate)
          : null,
        revocationReason: props.revocationDetails.revocationReason ?? null,
        revokedBy: props.revocationDetails.revokedBy ?? null,
        courtOrderNumber: props.revocationDetails.courtOrderNumber ?? null,
      };
    }

    if (props.amendmentHistory) {
      cert.amendmentHistory = props.amendmentHistory.map((amendment) => ({
        amendmentDate: new Date(amendment.amendmentDate),
        amendmentReason: amendment.amendmentReason,
        amendedBy: amendment.amendedBy,
        changes: amendment.changes,
        courtOrderNumber: amendment.courtOrderNumber ?? null,
      }));
    }

    if (props.replacementDetails) {
      cert.replacementDetails = {
        replacedByGrantId: props.replacementDetails.replacedByGrantId ?? null,
        replacementDate: props.replacementDetails.replacementDate
          ? new Date(props.replacementDetails.replacementDate)
          : null,
        replacementReason: props.replacementDetails.replacementReason ?? null,
      };
    }

    cert.createdAt = new Date(props.createdAt);
    cert.updatedAt = new Date(props.updatedAt);

    return cert;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  confirmGrant(
    confirmationDate: Date,
    confirmedBy: string,
    options?: { courtOrderNumber?: string; confirmationNotes?: string },
  ): void {
    if (this.status !== 'ISSUED') throw new Error('Only issued grants can be confirmed.');

    const minConfirmationDate = new Date(this.issueDate);
    const daysRequired = SUCCESSION_TIMEFRAMES.PROBATE?.CONFIRMATION_OF_GRANT || 180;
    minConfirmationDate.setDate(minConfirmationDate.getDate() + daysRequired);

    if (confirmationDate < minConfirmationDate) {
      console.warn(`Grant confirmed early. Min date: ${minConfirmationDate.toISOString()}`);
    }

    this.status = 'CONFIRMED';
    this.confirmationDate = confirmationDate;
    this.confirmedBy = confirmedBy;
    this.updatedAt = new Date();

    this.apply(
      new GrantConfirmedEvent(
        this.id,
        this.estateId,
        confirmationDate,
        confirmedBy,
        options?.courtOrderNumber,
        options?.confirmationNotes,
      ),
    );
  }

  revokeGrant(
    revocationDate: Date,
    revocationReason: string,
    revokedBy: string,
    courtOrderNumber?: string,
  ): void {
    if (this.status === 'REVOKED') throw new Error('Grant is already revoked.');

    this.status = 'REVOKED';
    this.isActive = false;
    this.revocationDetails = {
      revocationDate,
      revocationReason,
      revokedBy,
      courtOrderNumber: courtOrderNumber || null,
    };
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

  amendGrant(
    amendmentDate: Date,
    amendmentReason: string,
    amendedBy: string,
    changes: string[],
    courtOrderNumber?: string,
  ): void {
    if (!this.isActive) throw new Error('Cannot amend an inactive grant.');

    this.status = 'AMENDED';
    this.amendmentHistory.push({
      amendmentDate,
      amendmentReason,
      amendedBy,
      changes,
      courtOrderNumber: courtOrderNumber || null,
    });
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

  replaceGrant(
    newGrantId: string,
    replacementDate: Date,
    replacementReason: string,
    replacedBy: string,
  ): void {
    this.status = 'REPLACED';
    this.isActive = false;
    this.replacementDetails = {
      replacedByGrantId: newGrantId,
      replacementDate,
      replacementReason,
    };
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

  markAsExpired(): void {
    if (this.status === 'EXPIRED') return;
    this.status = 'EXPIRED';
    this.isActive = false;
    this.updatedAt = new Date();
    this.apply(
      new GrantExpiredEvent(this.id, this.estateId, new Date(), this.type, this.applicantId),
    );
  }

  updateFileReference(fileReference: string): void {
    if (!this.isActive) throw new Error('Cannot update file reference for inactive grant.');
    this.fileReference = fileReference;
    this.updatedAt = new Date();
  }

  addConditions(newConditions: string[]): void {
    if (!this.isActive) throw new Error('Cannot add conditions to inactive grant.');
    this.conditions = [...this.conditions, ...newConditions];
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private calculateExpiryDate(): Date {
    const expiryDate = new Date(this.issueDate);
    switch (this.type) {
      case 'LIMITED_GRANT':
        expiryDate.setMonth(expiryDate.getMonth() + 6);
        break;
      case 'SPECIAL_GRANT':
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        break;
      default:
        return new Date('9999-12-31');
    }
    return expiryDate;
  }

  isConfirmed(): boolean {
    return this.status === 'CONFIRMED';
  }

  hasExpired(): boolean {
    if (this.status === 'EXPIRED') return true;
    if (this.expiryDate && new Date() > this.expiryDate) {
      this.markAsExpired();
      return true;
    }
    return false;
  }

  isValid(): boolean {
    return (
      this.isActive && !this.hasExpired() && this.status !== 'REVOKED' && this.status !== 'REPLACED'
    );
  }

  getDaysUntilExpiry(): number {
    if (!this.expiryDate || this.expiryDate.getFullYear() === 9999) return Infinity;
    const now = new Date();
    const diffTime = this.expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysSinceIssuance(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.issueDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  canBeConfirmed(): boolean {
    if (this.status !== 'ISSUED') return false;
    const minConfirmationDate = new Date(this.issueDate);
    const daysRequired = SUCCESSION_TIMEFRAMES.PROBATE?.CONFIRMATION_OF_GRANT || 180;
    minConfirmationDate.setDate(minConfirmationDate.getDate() + daysRequired);
    return new Date() >= minConfirmationDate;
  }

  getCertificateType(): CertificateType {
    if (this.status === 'CONFIRMED') return 'CONFIRMED_GRANT';
    switch (this.type) {
      case 'PROBATE':
        return 'PROBATE';
      case 'LETTERS_OF_ADMINISTRATION':
        return 'LETTERS_OF_ADMINISTRATION';
      case 'LETTERS_OF_ADMINISTRATION_WITH_WILL':
        return 'LETTERS_OF_ADMINISTRATION_WITH_WILL';
      default:
        return 'LETTERS_OF_ADMINISTRATION';
    }
  }

  // Getters
  getId(): string {
    return this.id;
  }
  getType(): GrantType {
    return this.type;
  }
  getStatus(): GrantStatus {
    return this.status;
  }
  getIssueDate(): Date {
    return this.issueDate;
  }
  getConfirmationDate(): Date | null {
    return this.confirmationDate;
  }
  getExpiryDate(): Date | null {
    return this.expiryDate;
  }
  getEstateId(): string {
    return this.estateId;
  }
  getApplicantId(): string {
    return this.applicantId;
  }
  getFileReference(): string | null {
    return this.fileReference;
  }
  getGrantNumber(): string {
    return this.grantNumber;
  }
  getCourtStation(): string {
    return this.courtStation;
  }
  getCourtCaseNumber(): string {
    return this.courtCaseNumber;
  }
  getIssuedBy(): string {
    return this.issuedBy;
  }
  getConfirmedBy(): string | null {
    return this.confirmedBy;
  }
  getConditions(): string[] {
    return [...this.conditions];
  }
  getRevocationDetails() {
    return { ...this.revocationDetails };
  }
  getAmendmentHistory() {
    return [...this.amendmentHistory];
  }
  getReplacementDetails() {
    return { ...this.replacementDetails };
  }
  getIsActive(): boolean {
    return this.isActive;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getProps(): SuccessionCertificateProps {
    return {
      id: this.id,
      estateId: this.estateId,
      applicantId: this.applicantId,
      type: this.type,
      status: this.status,
      issueDate: this.issueDate,
      confirmationDate: this.confirmationDate,
      expiryDate: this.expiryDate,
      fileReference: this.fileReference,
      grantNumber: this.grantNumber,
      courtStation: this.courtStation,
      courtCaseNumber: this.courtCaseNumber,
      issuedBy: this.issuedBy,
      confirmedBy: this.confirmedBy,
      revocationDetails: this.revocationDetails,
      amendmentHistory: this.amendmentHistory,
      conditions: this.conditions,
      replacementDetails: this.replacementDetails,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
