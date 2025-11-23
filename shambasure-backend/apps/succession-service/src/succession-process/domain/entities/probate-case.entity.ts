import { AggregateRoot } from '@nestjs/cqrs';
import { GrantType } from '@prisma/client';
import { ProbateCaseFiledEvent } from '../events/probate-case-filed.event';
import { ProbateStatusChangedEvent } from '../events/probate-status-changed.event';
import { GazetteNoticePublishedEvent } from '../events/gazette-notice-published.event';
import { ObjectionFiledEvent } from '../events/objection-filed.event';
import { GrantIssuedEvent } from '../events/grant-issued.event';
import { CaseClosedEvent } from '../events/case-closed.event';
import { GrantApplicationType } from '../value-objects/grant-application-type.vo';
import { KenyanCourtJurisdiction } from '../value-objects/kenyan-court-jurisdiction.vo';
import { ProbateCaseNumber } from '../value-objects/probate-case-number.vo';
import { GazetteNotice } from '../value-objects/gazette-notice.vo';

export type CaseStatus =
  | 'DRAFT_FILING'
  | 'FILED'
  | 'GAZETTED'
  | 'OBJECTION_PERIOD'
  | 'OBJECTION_RECEIVED'
  | 'HEARING_SCHEDULED'
  | 'HEARING_COMPLETED'
  | 'GRANT_ISSUED'
  | 'CONFIRMATION_HEARING'
  | 'CONFIRMED'
  | 'APPEALED'
  | 'CLOSED'
  | 'WITHDRAWN';

export type CasePriority = 'NORMAL' | 'URGENT' | 'EXPEDITED';

// Safe interface for reconstitution
export interface ProbateCaseProps {
  id: string;
  estateId: string;
  caseNumber?: string | null;
  court: KenyanCourtJurisdiction | { level: string; station: string; county: string };
  applicationType: GrantApplicationType | { type: GrantType };
  status: CaseStatus;
  gazetteNotice?: {
    noticeNumber: string;
    publicationDate: Date | string;
    objectionPeriodDays: number;
    noticeType: 'PROBATE' | 'LETTERS_OF_ADMINISTRATION';
  } | null;
  filingDate?: Date | string | null;
  grantId?: string | null;
  inventoryId?: string | null;
  applicantDetails?: {
    applicantId: string;
    applicantName: string;
    relationship: string;
    contactInfo: string;
  } | null;
  priority: CasePriority;
  objections: {
    objectionId: string;
    objectorName: string;
    grounds: string[];
    filingDate: Date | string;
    status: 'PENDING' | 'WITHDRAWN' | 'DISMISSED' | 'UPHELD';
  }[];
  hearings: {
    hearingId: string;
    date: Date | string;
    type: string;
    outcome?: string;
  }[];
  grantDetails?: {
    grantNumber?: string;
    issueDate?: Date | string;
    issuedBy?: string;
    expiryDate?: Date | string;
  } | null;
  closureDetails?: {
    closureDate?: Date | string;
    closureReason?: string;
    closedBy?: string;
  } | null;
  legalRepresentation?: {
    lawyerName?: string;
    lawyerFirm?: string;
    contactInfo?: string;
  } | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class ProbateCase extends AggregateRoot {
  private id: string;
  private estateId: string;

  // Court Info
  private caseNumber: ProbateCaseNumber | null;
  private court: KenyanCourtJurisdiction;
  private applicationType: GrantApplicationType;
  private priority: CasePriority;

  // Workflow
  private status: CaseStatus;
  private gazetteNotice: GazetteNotice | null;
  private filingDate: Date | null;

  // Applicant Information
  private applicantDetails: {
    applicantId: string | null;
    applicantName: string | null;
    relationship: string | null;
    contactInfo: string | null;
  };

  // Legal Representation
  private legalRepresentation: {
    lawyerName: string | null;
    lawyerFirm: string | null;
    contactInfo: string | null;
  };

  // Linked Entities (IDs)
  private grantId: string | null;
  private inventoryId: string | null;

  // Case Tracking
  private objections: {
    objectionId: string;
    objectorName: string;
    grounds: string[];
    filingDate: Date;
    status: 'PENDING' | 'WITHDRAWN' | 'DISMISSED' | 'UPHELD';
  }[];

  private hearings: {
    hearingId: string;
    date: Date;
    type: string;
    outcome: string | null;
  }[];

  private grantDetails: {
    grantNumber: string | null;
    issueDate: Date | null;
    issuedBy: string | null;
    expiryDate: Date | null;
  };

  private closureDetails: {
    closureDate: Date | null;
    closureReason: string | null;
    closedBy: string | null;
  };

  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    estateId: string,
    applicationType: GrantApplicationType,
    court: KenyanCourtJurisdiction,
    priority: CasePriority = 'NORMAL',
  ) {
    super();
    this.id = id;
    this.estateId = estateId;
    this.applicationType = applicationType;
    this.court = court;
    this.priority = priority;

    this.caseNumber = null;
    this.status = 'DRAFT_FILING';
    this.gazetteNotice = null;
    this.filingDate = null;
    this.grantId = null;
    this.inventoryId = null;

    this.applicantDetails = {
      applicantId: null,
      applicantName: null,
      relationship: null,
      contactInfo: null,
    };

    this.legalRepresentation = {
      lawyerName: null,
      lawyerFirm: null,
      contactInfo: null,
    };

    this.objections = [];
    this.hearings = [];

    this.grantDetails = {
      grantNumber: null,
      issueDate: null,
      issuedBy: null,
      expiryDate: null,
    };

    this.closureDetails = {
      closureDate: null,
      closureReason: null,
      closedBy: null,
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
    type: GrantType,
    courtDetails: { level: any; station: string; county: string },
    options?: {
      priority?: CasePriority;
      applicantDetails?: {
        applicantId: string;
        applicantName: string;
        relationship: string;
        contactInfo: string;
      };
      legalRepresentation?: {
        lawyerName: string;
        lawyerFirm: string;
        contactInfo: string;
      };
    },
  ): ProbateCase {
    const appType = new GrantApplicationType(type);
    const court = new KenyanCourtJurisdiction(
      courtDetails.level,
      courtDetails.station,
      courtDetails.county,
    );

    const probateCase = new ProbateCase(
      id,
      estateId,
      appType,
      court,
      options?.priority || 'NORMAL',
    );

    if (options?.applicantDetails) {
      probateCase.applicantDetails = { ...options.applicantDetails };
    }

    if (options?.legalRepresentation) {
      probateCase.legalRepresentation = { ...options.legalRepresentation };
    }

    return probateCase;
  }

  static reconstitute(props: ProbateCaseProps): ProbateCase {
    // Validate required fields
    if (!props.id || !props.estateId || !props.court || !props.applicationType) {
      throw new Error('Missing required properties for ProbateCase reconstitution');
    }

    // Reconstruct GrantApplicationType safely
    let applicationType: GrantApplicationType;
    if (props.applicationType instanceof GrantApplicationType) {
      applicationType = props.applicationType;
    } else {
      applicationType = new GrantApplicationType(props.applicationType.type);
    }

    // Reconstruct KenyanCourtJurisdiction safely
    let court: KenyanCourtJurisdiction;
    if (props.court instanceof KenyanCourtJurisdiction) {
      court = props.court;
    } else {
      court = new KenyanCourtJurisdiction(
        props.court.level,
        props.court.station,
        props.court.county,
      );
    }

    const probateCase = new ProbateCase(
      props.id,
      props.estateId,
      applicationType,
      court,
      props.priority || 'NORMAL',
    );

    // Safe property assignments
    probateCase.status = props.status;
    probateCase.grantId = props.grantId ?? null;
    probateCase.inventoryId = props.inventoryId ?? null;

    // Case number
    if (props.caseNumber) {
      probateCase.caseNumber = new ProbateCaseNumber(props.caseNumber);
    }

    // Filing date
    if (props.filingDate) {
      probateCase.filingDate = new Date(props.filingDate);
    } else {
      probateCase.filingDate = null;
    }

    // Gazette notice
    if (props.gazetteNotice) {
      probateCase.gazetteNotice = new GazetteNotice(
        props.gazetteNotice.noticeNumber,
        new Date(props.gazetteNotice.publicationDate),
        props.gazetteNotice.noticeType,
        props.gazetteNotice.objectionPeriodDays,
      );
    }

    // Applicant details
    if (props.applicantDetails) {
      probateCase.applicantDetails = {
        applicantId: props.applicantDetails.applicantId || null,
        applicantName: props.applicantDetails.applicantName || null,
        relationship: props.applicantDetails.relationship || null,
        contactInfo: props.applicantDetails.contactInfo || null,
      };
    }

    // Legal representation
    if (props.legalRepresentation) {
      probateCase.legalRepresentation = {
        lawyerName: props.legalRepresentation.lawyerName || null,
        lawyerFirm: props.legalRepresentation.lawyerFirm || null,
        contactInfo: props.legalRepresentation.contactInfo || null,
      };
    }

    // Objections
    if (props.objections) {
      probateCase.objections = props.objections.map((obj) => ({
        objectionId: obj.objectionId,
        objectorName: obj.objectorName,
        grounds: obj.grounds,
        filingDate: new Date(obj.filingDate),
        status: obj.status,
      }));
    }

    // Hearings
    if (props.hearings) {
      probateCase.hearings = props.hearings.map((hearing) => ({
        hearingId: hearing.hearingId,
        date: new Date(hearing.date),
        type: hearing.type,
        outcome: hearing.outcome || null,
      }));
    }

    // Grant details
    if (props.grantDetails) {
      probateCase.grantDetails = {
        grantNumber: props.grantDetails.grantNumber || null,
        issueDate: props.grantDetails.issueDate ? new Date(props.grantDetails.issueDate) : null,
        issuedBy: props.grantDetails.issuedBy || null,
        expiryDate: props.grantDetails.expiryDate ? new Date(props.grantDetails.expiryDate) : null,
      };
    }

    // Closure details
    if (props.closureDetails) {
      probateCase.closureDetails = {
        closureDate: props.closureDetails.closureDate
          ? new Date(props.closureDetails.closureDate)
          : null,
        closureReason: props.closureDetails.closureReason || null,
        closedBy: props.closureDetails.closedBy || null,
      };
    }

    probateCase.createdAt = new Date(props.createdAt);
    probateCase.updatedAt = new Date(props.updatedAt);

    return probateCase;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Officially records the case in the court system
   */
  fileCase(caseNumberString: string, filingFee: number, filedBy: string): void {
    if (this.status !== 'DRAFT_FILING') {
      throw new Error('Case is already filed.');
    }

    if (!this.applicantDetails.applicantName) {
      throw new Error('Applicant details must be set before filing case.');
    }

    this.caseNumber = new ProbateCaseNumber(caseNumberString);
    this.filingDate = new Date();
    this.changeStatus('FILED', 'Case officially filed in court', filedBy);

    this.apply(
      new ProbateCaseFiledEvent(
        this.id,
        this.estateId,
        this.caseNumber.getValue(),
        this.court.getStation(),
        this.filingDate,
        this.applicationType.getValue(),
        this.applicantDetails.applicantName,
        filingFee,
      ),
    );
  }

  /**
   * Records publication in the Kenya Gazette
   */
  publishGazetteNotice(noticeNumber: string, pubDate: Date, gazetteIssueNumber: string): void {
    if (this.status !== 'FILED') {
      throw new Error('Case must be filed before gazettement.');
    }

    this.gazetteNotice = new GazetteNotice(
      noticeNumber,
      pubDate,
      this.applicationType.getValue().includes('PROBATE') ? 'PROBATE' : 'LETTERS_OF_ADMINISTRATION',
    );

    this.changeStatus('OBJECTION_PERIOD', 'Gazette notice published');

    this.apply(
      new GazetteNoticePublishedEvent(
        this.id,
        this.estateId,
        noticeNumber,
        pubDate,
        this.gazetteNotice.getObjectionExpiryDate(),
        gazetteIssueNumber,
        this.applicationType.getValue().includes('PROBATE')
          ? 'PROBATE'
          : 'LETTERS_OF_ADMINISTRATION',
      ),
    );
  }

  /**
   * Records an objection to the grant
   */
  recordObjection(
    objectionId: string,
    objectorName: string,
    grounds: string[],
    filingDate: Date = new Date(),
  ): void {
    if (this.status !== 'OBJECTION_PERIOD' && this.status !== 'GAZETTED') {
      throw new Error('Objections can only be filed during objection period.');
    }

    this.objections.push({
      objectionId,
      objectorName,
      grounds,
      filingDate,
      status: 'PENDING',
    });

    this.changeStatus('OBJECTION_RECEIVED', `Objection filed by ${objectorName}`);

    this.apply(
      new ObjectionFiledEvent(
        this.id,
        this.estateId,
        objectionId,
        objectorName,
        grounds,
        filingDate,
      ),
    );
  }

  /**
   * Schedules a hearing for the case
   */
  scheduleHearing(hearingId: string, date: Date, type: string): void {
    this.hearings.push({
      hearingId,
      date,
      type,
      outcome: null,
    });

    this.changeStatus('HEARING_SCHEDULED', `${type} hearing scheduled`);
  }

  /**
   * Records hearing outcome
   */
  recordHearingOutcome(hearingId: string, outcome: string): void {
    const hearing = this.hearings.find((h) => h.hearingId === hearingId);
    if (!hearing) {
      throw new Error('Hearing not found');
    }

    hearing.outcome = outcome;
    this.changeStatus('HEARING_COMPLETED', `Hearing completed: ${outcome}`);
  }

  /**
   * Issues grant for the case
   */
  issueGrant(
    grantId: string,
    grantNumber: string,
    issueDate: Date,
    issuedBy: string,
    expiryDate?: Date,
  ): void {
    if (!this.canIssueGrant()) {
      throw new Error('Cannot issue grant at this stage.');
    }

    this.grantId = grantId;
    this.grantDetails = {
      grantNumber,
      issueDate,
      issuedBy,
      expiryDate: expiryDate || null,
    };

    this.changeStatus('GRANT_ISSUED', 'Grant of representation issued');

    this.apply(
      new GrantIssuedEvent(
        this.id,
        this.estateId,
        grantId,
        this.applicationType.getValue(),
        issueDate,
        issuedBy,
        grantNumber,
        expiryDate,
      ),
    );
  }

  /**
   * Schedules confirmation hearing for grant
   */
  scheduleConfirmationHearing(hearingId: string, date: Date): void {
    if (this.status !== 'GRANT_ISSUED') {
      throw new Error('Grant must be issued before scheduling confirmation.');
    }

    this.scheduleHearing(hearingId, date, 'CONFIRMATION_OF_GRANT');
    this.changeStatus('CONFIRMATION_HEARING', 'Confirmation hearing scheduled');
  }

  /**
   * Confirms the grant after successful confirmation hearing
   */
  confirmGrant(confirmationDate: Date, confirmedBy: string): void {
    this.changeStatus('CONFIRMED', 'Grant confirmed by court', confirmedBy);
  }

  /**
   * Closes the probate case
   */
  closeCase(closureReason: string, closedBy: string, finalDistributionDate?: Date): void {
    if (this.status !== 'CONFIRMED') {
      throw new Error('Only confirmed cases can be closed.');
    }

    this.closureDetails = {
      closureDate: new Date(),
      closureReason,
      closedBy,
    };

    this.changeStatus('CLOSED', `Case closed: ${closureReason}`, closedBy);

    this.apply(
      new CaseClosedEvent(
        this.id,
        this.estateId,
        new Date(),
        closureReason,
        closedBy,
        finalDistributionDate,
      ),
    );
  }

  /**
   * Withdraws the case
   */
  withdrawCase(reason: string, withdrawnBy: string): void {
    this.changeStatus('WITHDRAWN', `Case withdrawn: ${reason}`, withdrawnBy);
  }

  /**
   * Updates applicant details
   */
  updateApplicantDetails(details: {
    applicantName?: string;
    relationship?: string;
    contactInfo?: string;
  }): void {
    if (this.status !== 'DRAFT_FILING') {
      throw new Error('Cannot update applicant details after filing.');
    }

    this.applicantDetails = { ...this.applicantDetails, ...details };
    this.updatedAt = new Date();
  }

  /**
   * Assigns legal representation
   */
  assignLegalRepresentation(representation: {
    lawyerName: string;
    lawyerFirm: string;
    contactInfo: string;
  }): void {
    this.legalRepresentation = { ...representation };
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // VALIDATION & HELPER METHODS
  // --------------------------------------------------------------------------

  /**
   * Checks if we can proceed to extract the Grant
   */
  canIssueGrant(): boolean {
    // Must have gazette notice
    if (!this.gazetteNotice) return false;

    // Must be past objection period
    if (!this.gazetteNotice.hasMatured()) return false;

    // Must not have pending objections
    const pendingObjections = this.objections.filter((obj) => obj.status === 'PENDING');
    if (pendingObjections.length > 0) return false;

    return true;
  }

  /**
   * Checks if objection period is active
   */
  isObjectionPeriodActive(): boolean {
    if (!this.gazetteNotice) return false;
    return this.gazetteNotice.isObjectionPeriodActive();
  }

  /**
   * Gets days remaining in objection period
   */
  getObjectionDaysRemaining(): number {
    if (!this.gazetteNotice) return 0;
    return this.gazetteNotice.getDaysRemaining();
  }

  /**
   * Checks if case is overdue (stuck in a state for too long)
   */
  isOverdue(): boolean {
    const overdueThreshold = 365; // 1 year
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - this.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    return (
      daysSinceUpdate > overdueThreshold &&
      !['CLOSED', 'WITHDRAWN', 'CONFIRMED'].includes(this.status)
    );
  }

  /**
   * Gets the next required action for the case
   */
  getNextRequiredAction(): string {
    switch (this.status) {
      case 'DRAFT_FILING':
        return 'File case with court';
      case 'FILED':
        return 'Publish gazette notice';
      case 'OBJECTION_PERIOD':
        return 'Wait for objection period to end';
      case 'OBJECTION_RECEIVED':
        return 'Schedule hearing for objections';
      case 'HEARING_SCHEDULED':
        return 'Conduct hearing';
      case 'HEARING_COMPLETED':
        return 'Issue grant';
      case 'GRANT_ISSUED':
        return 'Schedule confirmation hearing';
      case 'CONFIRMATION_HEARING':
        return 'Conduct confirmation hearing';
      case 'CONFIRMED':
        return 'Close case after distribution';
      default:
        return 'No action required';
    }
  }

  // --------------------------------------------------------------------------
  // PRIVATE METHODS
  // --------------------------------------------------------------------------

  private changeStatus(newStatus: CaseStatus, reason?: string, changedBy?: string): void {
    const old = this.status;
    this.status = newStatus;
    this.updatedAt = new Date();

    this.apply(
      new ProbateStatusChangedEvent(this.id, this.estateId, old, newStatus, reason, changedBy),
    );
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getEstateId(): string {
    return this.estateId;
  }
  getCaseNumber(): string | null {
    return this.caseNumber?.getValue() || null;
  }
  getStatus(): CaseStatus {
    return this.status;
  }
  getApplicationType(): GrantApplicationType {
    return this.applicationType;
  }
  getCourt(): KenyanCourtJurisdiction {
    return this.court;
  }
  getFilingDate(): Date | null {
    return this.filingDate;
  }
  getGazetteNotice(): GazetteNotice | null {
    return this.gazetteNotice;
  }
  getGrantId(): string | null {
    return this.grantId;
  }
  getPriority(): CasePriority {
    return this.priority;
  }
  getApplicantDetails() {
    return { ...this.applicantDetails };
  }
  getLegalRepresentation() {
    return { ...this.legalRepresentation };
  }
  getObjections() {
    return [...this.objections];
  }
  getHearings() {
    return [...this.hearings];
  }
  getGrantDetails() {
    return { ...this.grantDetails };
  }
  getClosureDetails() {
    return { ...this.closureDetails };
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Method to get all properties for persistence
  getProps(): ProbateCaseProps {
    return {
      id: this.id,
      estateId: this.estateId,
      caseNumber: this.caseNumber?.getValue() || null,
      court: this.court,
      applicationType: this.applicationType,
      status: this.status,
      gazetteNotice: this.gazetteNotice
        ? {
            noticeNumber: this.gazetteNotice.getNoticeNumber(),
            publicationDate: this.gazetteNotice.getPublicationDate(),
            objectionPeriodDays: 30, // Default from GazetteNotice
            noticeType: this.applicationType.getValue().includes('PROBATE')
              ? 'PROBATE'
              : 'LETTERS_OF_ADMINISTRATION',
          }
        : null,
      filingDate: this.filingDate,
      grantId: this.grantId,
      inventoryId: this.inventoryId,
      applicantDetails: this.applicantDetails,
      priority: this.priority,
      objections: this.objections,
      hearings: this.hearings,
      grantDetails: this.grantDetails,
      closureDetails: this.closureDetails,
      legalRepresentation: this.legalRepresentation,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
