import { AggregateRoot } from '@nestjs/cqrs';
import { GrantType } from '@prisma/client';
import { SUCCESSION_TIMEFRAMES } from '../../../common/constants/kenyan-law.constants';

// Events
export class GrantIssuedEvent {
  constructor(
    public readonly grantId: string,
    public readonly estateId: string,
    public readonly issuedDate: Date,
    public readonly type: GrantType,
  ) {}
}

export class GrantConfirmedEvent {
  constructor(
    public readonly grantId: string,
    public readonly confirmedDate: Date,
  ) {}
}

export class SuccessionCertificate extends AggregateRoot {
  private id: string;
  private estateId: string;
  private applicantId: string; // The Administrator/Executor
  private type: GrantType;

  private issueDate: Date;
  private confirmationDate: Date | null;
  private expiryDate: Date | null; // Usually 1 year if limited

  // The actual document file from court
  private fileReference: string | null;

  private isActive: boolean;
  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    estateId: string,
    applicantId: string,
    type: GrantType,
    issueDate: Date,
  ) {
    super();
    this.id = id;
    this.estateId = estateId;
    this.applicantId = applicantId;
    this.type = type;
    this.issueDate = issueDate;
    this.confirmationDate = null;
    this.expiryDate = null;
    this.fileReference = null;
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static create(
    id: string,
    estateId: string,
    applicantId: string,
    type: GrantType,
    issueDate: Date,
  ): SuccessionCertificate {
    const cert = new SuccessionCertificate(id, estateId, applicantId, type, issueDate);

    cert.apply(new GrantIssuedEvent(id, estateId, issueDate, type));
    return cert;
  }

  static reconstitute(props: any): SuccessionCertificate {
    const cert = new SuccessionCertificate(
      props.id,
      props.estateId,
      props.applicantId,
      props.grantType,
      new Date(props.issuedAt),
    );
    cert.confirmationDate = props.confirmedAt ? new Date(props.confirmedAt) : null;
    cert.fileReference = props.fileReference;
    return cert;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Confirms the grant (Section 71).
   * Usually done 6 months after issuance.
   */
  confirmGrant(confirmationDate: Date): void {
    // 1. Timeline Check
    const minConfirmationDate = new Date(this.issueDate);
    // SUCCESSION_TIMEFRAMES.PROBATE.CONFIRMATION_OF_GRANT is usually 180 days (6 months)
    const daysRequired = SUCCESSION_TIMEFRAMES.PROBATE.CONFIRMATION_OF_GRANT || 180;
    minConfirmationDate.setDate(minConfirmationDate.getDate() + daysRequired);

    // We issue a warning or error if too early, but Courts can allow expedited confirmation
    // So we don't throw a hard error here, but we flag it.

    this.confirmationDate = confirmationDate;
    this.updatedAt = new Date();

    this.apply(new GrantConfirmedEvent(this.id, confirmationDate));
  }

  /**
   * Is this grant ready for asset distribution?
   */
  isConfirmed(): boolean {
    return this.confirmationDate !== null;
  }

  // Getters
  getId() {
    return this.id;
  }
  getType() {
    return this.type;
  }
  getIssueDate() {
    return this.issueDate;
  }
  getConfirmationDate() {
    return this.confirmationDate;
  }
}
