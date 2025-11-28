import { AggregateRoot } from '@nestjs/cqrs';
import {
  CasePriority,
  CaseStatus,
  GazetteNoticeType,
  GrantType,
  KenyanCounty,
} from '@prisma/client';

import { CaseClosedEvent } from '../events/case-closed.event';
import { GazetteNoticePublishedEvent } from '../events/gazette-notice-published.event';
import { GrantIssuedEvent } from '../events/grant-issued.event';
// Domain Events
import { ProbateCaseFiledEvent } from '../events/probate-case-filed.event';

// Value Objects
export class KenyanCourtIdentification {
  constructor(
    private readonly courtLevel: string,
    private readonly courtStation: string,
    private readonly courtCounty: KenyanCounty,
  ) {
    if (!courtLevel?.trim() || !courtStation?.trim() || !courtCounty) {
      throw new Error('Court level, station, and county are required');
    }
  }

  getCourtLevel(): string {
    return this.courtLevel;
  }
  getCourtStation(): string {
    return this.courtStation;
  }
  getCourtCounty(): KenyanCounty {
    return this.courtCounty;
  }

  getFormattedReference(): string {
    return `${this.courtStation} ${this.courtLevel} - ${this.courtCounty}`;
  }
}

export class GazetteNoticeDetails {
  constructor(
    private readonly noticeNumber: string,
    private readonly publicationDate: Date,
    private readonly noticeType: GazetteNoticeType,
    private readonly objectionPeriodDays: number = 30,
  ) {
    if (!noticeNumber?.trim()) {
      throw new Error('Gazette notice number is required');
    }
    if (objectionPeriodDays < 1) {
      throw new Error('Objection period must be at least 1 day');
    }
  }

  getNoticeNumber(): string {
    return this.noticeNumber;
  }
  getPublicationDate(): Date {
    return this.publicationDate;
  }
  getNoticeType(): GazetteNoticeType {
    return this.noticeType;
  }
  getObjectionPeriodDays(): number {
    return this.objectionPeriodDays;
  }

  getObjectionExpiryDate(): Date {
    const expiry = new Date(this.publicationDate);
    expiry.setDate(expiry.getDate() + this.objectionPeriodDays);
    return expiry;
  }

  isObjectionPeriodActive(): boolean {
    return new Date() <= this.getObjectionExpiryDate();
  }

  hasObjectionPeriodExpired(): boolean {
    return new Date() > this.getObjectionExpiryDate();
  }
}

// Main Entity
export class ProbateCase extends AggregateRoot {
  constructor(
    private readonly id: string,
    private readonly estateId: string,
    private applicationType: GrantType,
    private courtIdentification: KenyanCourtIdentification,
    private status: CaseStatus = CaseStatus.DRAFT_FILING,
    private priority: CasePriority = CasePriority.NORMAL,
    private caseNumber?: string,
    private gazetteNotice?: GazetteNoticeDetails,
    private filingDate?: Date,
    private filingFee?: number,
    private filedBy?: string,
    private applicantId?: string,
    private applicantName?: string,
    private applicantRelationship?: string,
    private applicantContactInfo?: string,
    private lawyerName?: string,
    private lawyerFirm?: string,
    private lawyerContactInfo?: string,
    private grantId?: string,
    private inventoryId?: string,
    private isExpedited: boolean = false,
    private requiresConfirmationHearing: boolean = false,
    private confirmationHearingDate?: Date,
    private closureDate?: Date,
    private closureReason?: string,
    private closedBy?: string,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {
    super();
    this.validate();
  }

  // ==========================================================================
  // FACTORY METHODS (Creation & Reconstitution)
  // ==========================================================================

  static create(
    id: string,
    estateId: string,
    applicationType: GrantType,
    courtLevel: string,
    courtStation: string,
    courtCounty: KenyanCounty,
    options?: {
      priority?: CasePriority;
      applicantId?: string;
      applicantName?: string;
      applicantRelationship?: string;
      applicantContactInfo?: string;
      lawyerName?: string;
      lawyerFirm?: string;
      lawyerContactInfo?: string;
      isExpedited?: boolean;
      requiresConfirmationHearing?: boolean;
    },
  ): ProbateCase {
    // Legal Validation: Kenyan court jurisdiction
    const courtId = new KenyanCourtIdentification(courtLevel, courtStation, courtCounty);

    const probateCase = new ProbateCase(
      id,
      estateId,
      applicationType,
      courtId,
      CaseStatus.DRAFT_FILING,
      options?.priority || CasePriority.NORMAL,
      undefined, // caseNumber
      undefined, // gazetteNotice
      undefined, // filingDate
      undefined, // filingFee
      undefined, // filedBy
      options?.applicantId,
      options?.applicantName,
      options?.applicantRelationship,
      options?.applicantContactInfo,
      options?.lawyerName,
      options?.lawyerFirm,
      options?.lawyerContactInfo,
      undefined, // grantId
      undefined, // inventoryId
      options?.isExpedited || false,
      options?.requiresConfirmationHearing || false,
      undefined, // confirmationHearingDate
      undefined, // closureDate
      undefined, // closureReason
      undefined, // closedBy
      new Date(), // createdAt
      new Date(), // updatedAt
    );

    return probateCase;
  }

  static reconstitute(props: {
    id: string;
    estateId: string;
    applicationType: GrantType;
    courtLevel: string;
    courtStation: string;
    courtCounty: KenyanCounty;
    status: CaseStatus;
    priority: CasePriority;
    caseNumber?: string;
    gazetteNoticeNumber?: string;
    gazettePublicationDate?: Date;
    gazetteObjectionPeriodDays?: number;
    gazetteNoticeType?: GazetteNoticeType;
    filingDate?: Date;
    filingFee?: number;
    filedBy?: string;
    applicantId?: string;
    applicantName?: string;
    applicantRelationship?: string;
    applicantContactInfo?: string;
    lawyerName?: string;
    lawyerFirm?: string;
    lawyerContactInfo?: string;
    grantId?: string;
    inventoryId?: string;
    isExpedited?: boolean;
    requiresConfirmationHearing?: boolean;
    confirmationHearingDate?: Date;
    closureDate?: Date;
    closureReason?: string;
    closedBy?: string;
    createdAt: Date;
    updatedAt: Date;
  }): ProbateCase {
    const courtId = new KenyanCourtIdentification(
      props.courtLevel,
      props.courtStation,
      props.courtCounty,
    );

    let gazetteNotice: GazetteNoticeDetails | undefined;
    if (props.gazetteNoticeNumber && props.gazettePublicationDate && props.gazetteNoticeType) {
      gazetteNotice = new GazetteNoticeDetails(
        props.gazetteNoticeNumber,
        props.gazettePublicationDate,
        props.gazetteNoticeType,
        props.gazetteObjectionPeriodDays,
      );
    }

    return new ProbateCase(
      props.id,
      props.estateId,
      props.applicationType,
      courtId,
      props.status,
      props.priority,
      props.caseNumber,
      gazetteNotice,
      props.filingDate,
      props.filingFee,
      props.filedBy,
      props.applicantId,
      props.applicantName,
      props.applicantRelationship,
      props.applicantContactInfo,
      props.lawyerName,
      props.lawyerFirm,
      props.lawyerContactInfo,
      props.grantId,
      props.inventoryId,
      props.isExpedited || false,
      props.requiresConfirmationHearing || false,
      props.confirmationHearingDate,
      props.closureDate,
      props.closureReason,
      props.closedBy,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ==========================================================================
  // BUSINESS LOGIC (Domain Behavior)
  // ==========================================================================

  // Legal Requirement: Proper case filing with Kenyan court procedures
  fileCase(caseNumber: string, filingFee: number, filedBy: string, inventoryId?: string): void {
    if (this.status !== CaseStatus.DRAFT_FILING) {
      throw new Error('Case can only be filed from draft status');
    }

    // Legal Requirement: Applicant information must be complete
    if (!this.applicantName || !this.applicantRelationship) {
      throw new Error('Applicant name and relationship are required for filing');
    }

    this.caseNumber = caseNumber;
    this.filingDate = new Date();
    this.filingFee = filingFee;
    this.filedBy = filedBy;
    this.inventoryId = inventoryId;
    this.status = CaseStatus.FILED;
    this.updatedAt = new Date();

    this.apply(
      new ProbateCaseFiledEvent(
        this.id,
        this.estateId,
        caseNumber,
        this.courtIdentification.getCourtStation(),
        this.filingDate,
        this.applicationType,
        this.applicantName,
        filingFee,
      ),
    );
  }

  // Legal Requirement: Kenya Gazette publication for probate notices
  publishGazetteNotice(
    noticeNumber: string,
    publicationDate: Date,
    noticeType: GazetteNoticeType,
  ): void {
    if (this.status !== CaseStatus.FILED) {
      throw new Error('Case must be filed before gazette publication');
    }

    // Legal Requirement: 30-day objection period for Kenyan probate
    const objectionPeriodDays = 30;

    this.gazetteNotice = new GazetteNoticeDetails(
      noticeNumber,
      publicationDate,
      noticeType,
      objectionPeriodDays,
    );

    this.status = CaseStatus.GAZETTED;
    this.updatedAt = new Date();

    this.apply(
      new GazetteNoticePublishedEvent(
        this.id,
        this.estateId,
        noticeNumber,
        publicationDate,
        this.gazetteNotice.getObjectionExpiryDate(),
        noticeType,
      ),
    );
  }

  // Legal Requirement: Objection period management
  markObjectionPeriodActive(): void {
    if (this.status !== CaseStatus.GAZETTED) {
      throw new Error('Case must be gazetted before objection period can start');
    }

    this.status = CaseStatus.OBJECTION_PERIOD;
    this.updatedAt = new Date();
  }

  // Legal Requirement: Objection handling
  recordObjectionReceived(): void {
    if (this.status !== CaseStatus.OBJECTION_PERIOD) {
      throw new Error('Objections can only be received during objection period');
    }

    this.status = CaseStatus.OBJECTION_RECEIVED;
    this.updatedAt = new Date();
  }

  // Legal Requirement: Hearing scheduling
  scheduleHearing(hearingType: string = 'DIRECTIONS'): void {
    if (![CaseStatus.OBJECTION_RECEIVED, CaseStatus.FILED].includes(this.status)) {
      throw new Error('Hearing can only be scheduled after objections or for directions');
    }

    this.status = CaseStatus.HEARING_SCHEDULED;
    this.updatedAt = new Date();
  }

  // Legal Requirement: Hearing completion
  completeHearing(): void {
    if (this.status !== CaseStatus.HEARING_SCHEDULED) {
      throw new Error('Only scheduled hearings can be completed');
    }

    this.status = CaseStatus.HEARING_COMPLETED;
    this.updatedAt = new Date();
  }

  // Legal Requirement: Grant issuance
  issueGrant(grantId: string, issuedBy: string): void {
    if (this.status !== CaseStatus.HEARING_COMPLETED && this.status !== CaseStatus.GAZETTED) {
      throw new Error(
        'Grant can only be issued after hearing completion or gazettement without objections',
      );
    }

    // Legal Requirement: Check if objection period has expired for non-objection cases
    if (
      this.status === CaseStatus.GAZETTED &&
      this.gazetteNotice &&
      !this.gazetteNotice.hasObjectionPeriodExpired()
    ) {
      throw new Error('Grant cannot be issued before objection period expires');
    }

    this.grantId = grantId;
    this.status = CaseStatus.GRANT_ISSUED;
    this.updatedAt = new Date();

    this.apply(
      new GrantIssuedEvent(
        grantId,
        this.estateId,
        this.applicationType,
        this.caseNumber!,
        issuedBy,
      ),
    );
  }

  // Legal Requirement: Confirmation hearing for grants
  scheduleConfirmationHearing(hearingDate: Date): void {
    if (this.status !== CaseStatus.GRANT_ISSUED) {
      throw new Error('Confirmation hearing can only be scheduled after grant issuance');
    }

    this.requiresConfirmationHearing = true;
    this.confirmationHearingDate = hearingDate;
    this.status = CaseStatus.CONFIRMATION_HEARING;
    this.updatedAt = new Date();
  }

  // Legal Requirement: Grant confirmation
  confirmGrant(confirmedBy: string): void {
    if (this.status !== CaseStatus.CONFIRMATION_HEARING) {
      throw new Error('Grant can only be confirmed after confirmation hearing');
    }

    this.status = CaseStatus.CONFIRMED;
    this.updatedAt = new Date();
  }

  // Legal Requirement: Case closure
  closeCase(closureReason: string, closedBy: string): void {
    if (![CaseStatus.CONFIRMED, CaseStatus.GRANT_ISSUED].includes(this.status)) {
      throw new Error('Only confirmed cases or cases with issued grants can be closed');
    }

    this.closureDate = new Date();
    this.closureReason = closureReason;
    this.closedBy = closedBy;
    this.status = CaseStatus.CLOSED;
    this.updatedAt = new Date();

    this.apply(
      new CaseClosedEvent(this.id, this.estateId, this.closureDate, closureReason, closedBy),
    );
  }

  // Legal Requirement: Case withdrawal
  withdrawCase(withdrawalReason: string, withdrawnBy: string): void {
    if ([CaseStatus.CLOSED, CaseStatus.CONFIRMED].includes(this.status)) {
      throw new Error('Cannot withdraw closed or confirmed cases');
    }

    this.closureDate = new Date();
    this.closureReason = `Withdrawn: ${withdrawalReason}`;
    this.closedBy = withdrawnBy;
    this.status = CaseStatus.WITHDRAWN;
    this.updatedAt = new Date();
  }

  // Legal Requirement: Appeal handling
  markAsAppealed(): void {
    this.status = CaseStatus.APPEALED;
    this.updatedAt = new Date();
  }

  // ==========================================================================
  // LEGAL COMPLIANCE & VALIDATION
  // ==========================================================================

  private validate(): void {
    if (!this.id) throw new Error('Case ID is required');
    if (!this.estateId) throw new Error('Estate ID is required');
    if (!this.applicationType) throw new Error('Application type is required');
    if (!this.courtIdentification) throw new Error('Court identification is required');
    if (!this.status) throw new Error('Case status is required');
    if (!this.priority) throw new Error('Case priority is required');

    // Legal Requirement: Filing validation
    if (this.filingDate && this.filingDate > new Date()) {
      throw new Error('Filing date cannot be in the future');
    }

    // Legal Requirement: Gazette notice validation
    if (this.gazetteNotice && this.gazetteNotice.getPublicationDate() > new Date()) {
      throw new Error('Gazette publication date cannot be in the future');
    }

    // Legal Requirement: Confirmation hearing validation
    if (this.confirmationHearingDate && this.confirmationHearingDate < new Date()) {
      throw new Error('Confirmation hearing date cannot be in the past');
    }
  }

  // ==========================================================================
  // QUERY METHODS & BUSINESS RULES
  // ==========================================================================

  isObjectionPeriodActive(): boolean {
    return this.gazetteNotice ? this.gazetteNotice.isObjectionPeriodActive() : false;
  }

  canIssueGrant(): boolean {
    // Legal Requirements for Grant Issuance:
    // 1. Must be gazetted
    // 2. Objection period must have expired OR objections must be resolved
    // 3. No pending objections
    if (!this.gazetteNotice) return false;

    const objectionPeriodExpired = this.gazetteNotice.hasObjectionPeriodExpired();
    const noObjections = this.status !== CaseStatus.OBJECTION_RECEIVED;

    return objectionPeriodExpired && noObjections;
  }

  requiresConfirmation(): boolean {
    // Legal Requirement: Certain grant types require confirmation hearing
    const confirmationRequiredTypes = [
      GrantType.LETTERS_OF_ADMINISTRATION,
      GrantType.LETTERS_OF_ADMINISTRATION_WITH_WILL,
    ];
    return confirmationRequiredTypes.includes(this.applicationType);
  }

  isOverdue(): boolean {
    const overdueThreshold = 365; // 1 year in days
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - this.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    return (
      daysSinceUpdate > overdueThreshold &&
      ![CaseStatus.CLOSED, CaseStatus.WITHDRAWN, CaseStatus.CONFIRMED].includes(this.status)
    );
  }

  getNextRequiredAction(): string {
    switch (this.status) {
      case CaseStatus.DRAFT_FILING:
        return 'Complete applicant details and file case';
      case CaseStatus.FILED:
        return 'Publish gazette notice';
      case CaseStatus.GAZETTED:
        return 'Wait for objection period to expire';
      case CaseStatus.OBJECTION_PERIOD:
        return 'Monitor for objections';
      case CaseStatus.OBJECTION_RECEIVED:
        return 'Schedule hearing for objections';
      case CaseStatus.HEARING_SCHEDULED:
        return 'Conduct hearing';
      case CaseStatus.HEARING_COMPLETED:
        return 'Issue grant';
      case CaseStatus.GRANT_ISSUED:
        return this.requiresConfirmation() ? 'Schedule confirmation hearing' : 'Close case';
      case CaseStatus.CONFIRMATION_HEARING:
        return 'Conduct confirmation hearing';
      case CaseStatus.CONFIRMED:
        return 'Close case';
      default:
        return 'No action required';
    }
  }

  getDaysInCurrentStatus(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.updatedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
  getApplicationType(): GrantType {
    return this.applicationType;
  }
  getCourtLevel(): string {
    return this.courtIdentification.getCourtLevel();
  }
  getCourtStation(): string {
    return this.courtIdentification.getCourtStation();
  }
  getCourtCounty(): KenyanCounty {
    return this.courtIdentification.getCourtCounty();
  }
  getStatus(): CaseStatus {
    return this.status;
  }
  getPriority(): CasePriority {
    return this.priority;
  }
  getCaseNumber(): string | undefined {
    return this.caseNumber;
  }
  getGazetteNoticeNumber(): string | undefined {
    return this.gazetteNotice?.getNoticeNumber();
  }
  getGazettePublicationDate(): Date | undefined {
    return this.gazetteNotice?.getPublicationDate();
  }
  getGazetteObjectionPeriodDays(): number | undefined {
    return this.gazetteNotice?.getObjectionPeriodDays();
  }
  getGazetteNoticeType(): GazetteNoticeType | undefined {
    return this.gazetteNotice?.getNoticeType();
  }
  getFilingDate(): Date | undefined {
    return this.filingDate;
  }
  getFilingFee(): number | undefined {
    return this.filingFee;
  }
  getFiledBy(): string | undefined {
    return this.filedBy;
  }
  getApplicantId(): string | undefined {
    return this.applicantId;
  }
  getApplicantName(): string | undefined {
    return this.applicantName;
  }
  getApplicantRelationship(): string | undefined {
    return this.applicantRelationship;
  }
  getApplicantContactInfo(): string | undefined {
    return this.applicantContactInfo;
  }
  getLawyerName(): string | undefined {
    return this.lawyerName;
  }
  getLawyerFirm(): string | undefined {
    return this.lawyerFirm;
  }
  getLawyerContactInfo(): string | undefined {
    return this.lawyerContactInfo;
  }
  getGrantId(): string | undefined {
    return this.grantId;
  }
  getInventoryId(): string | undefined {
    return this.inventoryId;
  }
  getIsExpedited(): boolean {
    return this.isExpedited;
  }
  getRequiresConfirmationHearing(): boolean {
    return this.requiresConfirmationHearing;
  }
  getConfirmationHearingDate(): Date | undefined {
    return this.confirmationHearingDate;
  }
  getClosureDate(): Date | undefined {
    return this.closureDate;
  }
  getClosureReason(): string | undefined {
    return this.closureReason;
  }
  getClosedBy(): string | undefined {
    return this.closedBy;
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
      applicationType: this.applicationType,
      courtLevel: this.courtIdentification.getCourtLevel(),
      courtStation: this.courtIdentification.getCourtStation(),
      courtCounty: this.courtIdentification.getCourtCounty(),
      status: this.status,
      priority: this.priority,
      caseNumber: this.caseNumber,
      gazetteNoticeNumber: this.gazetteNotice?.getNoticeNumber(),
      gazettePublicationDate: this.gazetteNotice?.getPublicationDate(),
      gazetteObjectionPeriodDays: this.gazetteNotice?.getObjectionPeriodDays(),
      gazetteNoticeType: this.gazetteNotice?.getNoticeType(),
      filingDate: this.filingDate,
      filingFee: this.filingFee,
      filedBy: this.filedBy,
      applicantId: this.applicantId,
      applicantName: this.applicantName,
      applicantRelationship: this.applicantRelationship,
      applicantContactInfo: this.applicantContactInfo,
      lawyerName: this.lawyerName,
      lawyerFirm: this.lawyerFirm,
      lawyerContactInfo: this.lawyerContactInfo,
      grantId: this.grantId,
      inventoryId: this.inventoryId,
      isExpedited: this.isExpedited,
      requiresConfirmationHearing: this.requiresConfirmationHearing,
      confirmationHearingDate: this.confirmationHearingDate,
      closureDate: this.closureDate,
      closureReason: this.closureReason,
      closedBy: this.closedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
