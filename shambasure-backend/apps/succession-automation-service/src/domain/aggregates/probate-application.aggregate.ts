// src/succession-automation/src/domain/aggregates/probate-application.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import { ConsentStatus, FamilyConsent } from '../entities/family-consent.entity';
import { FormStatus, GeneratedForm } from '../entities/generated-form.entity';
import {
  AllConsentsReceived,
  AllFormsGenerated,
  ApplicationFiled,
  ApplicationReadyToFile,
  ApplicationRejected,
  ConsentDeclined,
  ConsentGranted,
  ConsentRequested,
  FormGenerated,
  FormSuperseded,
  ProbateApplicationCreated,
} from '../events/probate-application.events';
import { KenyanFormType } from '../value-objects/kenyan-form-type.vo';
import { SuccessionContext } from '../value-objects/succession-context.vo';

/**
 * Probate Application Aggregate Root
 *
 * PURPOSE: The "Bundle Generator" - compiles all legal documents for court filing.
 *
 * AGGREGATE BOUNDARY:
 * - Root: ProbateApplication
 * - Entities: GeneratedForm[], FamilyConsent[]
 * - Value Objects: SuccessionContext, KenyanFormType
 *
 * INVARIANTS:
 * 1. At least one primary petition form must exist (P&A 1, P&A 5, or P&A 80)
 * 2. All required consents must be GRANTED before filing
 * 3. All forms must be APPROVED before filing
 * 4. Cannot file twice
 * 5. Cannot modify after filing
 *
 * LIFECYCLE:
 * 1. Created when user clicks "Generate Forms"
 * 2. Forms generated based on SuccessionContext
 * 3. Consent requests sent to family members
 * 4. User reviews and approves forms
 * 5. Once ready → Filed with court
 * 6. Immutable after filing (audit trail)
 */

export enum ProbateApplicationType {
  GRANT_OF_PROBATE = 'GRANT_OF_PROBATE', // P&A 1 (Testate)
  LETTERS_OF_ADMINISTRATION = 'LETTERS_OF_ADMINISTRATION', // P&A 80 (Intestate)
  SUMMARY_ADMINISTRATION = 'SUMMARY_ADMINISTRATION', // P&A 5 (Small estates)
  LIMITED_GRANT = 'LIMITED_GRANT', // Ad Litem / Collection
  ISLAMIC_GRANT = 'ISLAMIC_GRANT', // Kadhi's Court
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT', // Forms being generated
  PENDING_REVIEW = 'PENDING_REVIEW', // Forms ready for user review
  PENDING_CONSENTS = 'PENDING_CONSENTS', // Waiting for family consents
  READY_TO_FILE = 'READY_TO_FILE', // All requirements met
  FILED = 'FILED', // Submitted to court
  COURT_REVIEW = 'COURT_REVIEW', // Under court review
  GRANTED = 'GRANTED', // Court approved
  REJECTED = 'REJECTED', // Court rejected
  WITHDRAWN = 'WITHDRAWN', // User withdrew application
}

interface ProbateApplicationProps {
  // Identity & Context
  estateId: string;
  readinessAssessmentId?: string; // Link to ReadinessAssessment
  successionContext: SuccessionContext;
  applicationType: ProbateApplicationType;

  // Applicant
  applicantUserId: string;
  applicantFullName: string;
  applicantRelationship: string; // E.g., "Executor", "Spouse", "Son"

  // Court Information
  targetCourt: string; // "High Court Nairobi", "Kadhi's Court Mombasa"
  courtStation: string; // County/location
  estimatedFilingDate?: Date;

  // Status
  status: ApplicationStatus;

  // Generated Forms (Collection)
  forms: GeneratedForm[];

  // Family Consents (Collection)
  consents: FamilyConsent[];

  // Filing Information
  filedAt?: Date;
  courtCaseNumber?: string;
  courtReceiptNumber?: string;
  filingFeeAmount?: number;
  filingFeePaid: boolean;

  // Court Response
  courtReviewDate?: Date;
  grantedDate?: Date;
  grantNumber?: string;
  rejectionReason?: string;
  rejectionDate?: Date;

  // Withdrawal
  withdrawnAt?: Date;
  withdrawalReason?: string;

  // Metadata
  lastReviewedAt?: Date;
  lastReviewedBy?: string;
  notes?: string;
}

export class ProbateApplication extends AggregateRoot<ProbateApplicationProps> {
  private constructor(id: UniqueEntityID, props: ProbateApplicationProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // ==================== GETTERS ====================

  get estateId(): string {
    return this.props.estateId;
  }

  get successionContext(): SuccessionContext {
    return this.props.successionContext;
  }

  get applicationType(): ProbateApplicationType {
    return this.props.applicationType;
  }

  get applicantUserId(): string {
    return this.props.applicantUserId;
  }

  get targetCourt(): string {
    return this.props.targetCourt;
  }

  get courtStation(): string {
    return this.props.courtStation;
  }

  get status(): ApplicationStatus {
    return this.props.status;
  }

  get forms(): ReadonlyArray<GeneratedForm> {
    return Object.freeze([...this.props.forms]);
  }

  get consents(): ReadonlyArray<FamilyConsent> {
    return Object.freeze([...this.props.consents]);
  }

  get filedAt(): Date | undefined {
    return this.props.filedAt;
  }

  get courtCaseNumber(): string | undefined {
    return this.props.courtCaseNumber;
  }

  get filingFeePaid(): boolean {
    return this.props.filingFeePaid;
  }

  get grantNumber(): string | undefined {
    return this.props.grantNumber;
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Get all approved forms
   */
  public getApprovedForms(): GeneratedForm[] {
    return this.props.forms.filter((f) => f.status === FormStatus.APPROVED);
  }

  /**
   * Get all pending forms
   */
  public getPendingForms(): GeneratedForm[] {
    return this.props.forms.filter(
      (f) => f.status === FormStatus.DRAFT || f.status === FormStatus.AWAITING_REVIEW,
    );
  }

  /**
   * Get granted consents
   */
  public getGrantedConsents(): FamilyConsent[] {
    return this.props.consents.filter((c) => c.isGranted());
  }

  /**
   * Get pending consents
   */
  public getPendingConsents(): FamilyConsent[] {
    return this.props.consents.filter((c) => c.isPending());
  }

  /**
   * Get declined consents
   */
  public getDeclinedConsents(): FamilyConsent[] {
    return this.props.consents.filter((c) => c.isDeclined());
  }

  /**
   * Get required consents (excluding NOT_REQUIRED)
   */
  public getRequiredConsents(): FamilyConsent[] {
    return this.props.consents.filter((c) => c.isRequired());
  }

  /**
   * Are all forms approved?
   */
  public areAllFormsApproved(): boolean {
    if (this.props.forms.length === 0) return false;
    return this.props.forms.every(
      (f) => f.status === FormStatus.APPROVED || f.status === FormStatus.FILED,
    );
  }

  /**
   * Are all required consents received?
   */
  public areAllConsentsReceived(): boolean {
    const requiredConsents = this.getRequiredConsents();
    if (requiredConsents.length === 0) return true;
    return requiredConsents.every((c) => c.isGranted());
  }

  /**
   * Has any consent been declined?
   */
  public hasDeclinedConsent(): boolean {
    return this.props.consents.some((c) => c.isDeclined());
  }

  /**
   * Can this application be filed?
   */
  public canFile(): boolean {
    return (
      this.props.status === ApplicationStatus.READY_TO_FILE &&
      this.areAllFormsApproved() &&
      this.areAllConsentsReceived() &&
      !this.hasDeclinedConsent() &&
      this.props.filingFeePaid &&
      this.props.forms.length > 0
    );
  }

  /**
   * Has this application been filed?
   */
  public isFiled(): boolean {
    return this.props.status === ApplicationStatus.FILED;
  }

  /**
   * Is this application editable?
   */
  public isEditable(): boolean {
    return ![
      ApplicationStatus.FILED,
      ApplicationStatus.GRANTED,
      ApplicationStatus.WITHDRAWN,
    ].includes(this.props.status);
  }

  /**
   * Get total forms count
   */
  public getTotalFormsCount(): number {
    return this.props.forms.length;
  }

  /**
   * Get progress percentage (for UI)
   */
  public getProgressPercentage(): number {
    let completed = 0;
    const total = 3; // Forms, Consents, Filing Fee

    // Forms progress
    if (this.areAllFormsApproved()) completed++;

    // Consents progress
    if (this.areAllConsentsReceived()) completed++;

    // Filing fee progress
    if (this.props.filingFeePaid) completed++;

    return Math.round((completed / total) * 100);
  }

  // ==================== BUSINESS LOGIC - FORMS ====================

  /**
   * Add a generated form
   * BUSINESS RULE: Cannot add forms after filing
   */
  public addGeneratedForm(form: GeneratedForm): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    // Check for duplicate form type
    const existingForm = this.props.forms.find(
      (f) => f.formType.formType === form.formType.formType && f.status !== FormStatus.SUPERSEDED,
    );

    if (existingForm) {
      throw new Error(
        `Form type ${form.formType.getFormCode()} already exists. ` +
          `Use supersede() to replace it.`,
      );
    }

    const updatedForms = [...this.props.forms, form];
    this.updateState({ forms: updatedForms });

    // Emit event
    this.addDomainEvent(
      new FormGenerated(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        applicationId: this.id.toString(),
        estateId: this.props.estateId,
        formId: form.id.toString(),
        formType: form.formType.formType,
        formCode: form.formType.getFormCode(),
      }),
    );

    // Check if all forms are generated
    if (this.hasAllRequiredForms()) {
      this.addDomainEvent(
        new AllFormsGenerated(this.id.toString(), this.getAggregateType(), this.getVersion(), {
          applicationId: this.id.toString(),
          estateId: this.props.estateId,
          totalForms: updatedForms.length,
        }),
      );

      // Transition to PENDING_REVIEW
      this.updateState({ status: ApplicationStatus.PENDING_REVIEW });
    }
  }

  /**
   * Supersede a form with a newer version
   */
  public supersedeForm(oldFormId: string, newForm: GeneratedForm): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    const oldForm = this.props.forms.find((f) => f.id.equals(oldFormId));
    if (!oldForm) {
      throw new Error(`Form ${oldFormId} not found`);
    }

    // Supersede old form
    oldForm.supersede(newForm.id.toString(), 'Replaced with updated version');

    // Add new form
    const updatedForms = [...this.props.forms, newForm];
    this.updateState({ forms: updatedForms });

    // Emit event
    this.addDomainEvent(
      new FormSuperseded(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        applicationId: this.id.toString(),
        oldFormId: oldFormId,
        newFormId: newForm.id.toString(),
        formType: newForm.formType.formType,
      }),
    );
  }

  /**
   * Approve all forms
   * BUSINESS RULE: All forms must be in AWAITING_REVIEW status
   */
  public approveAllForms(approvedBy: string): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    const pendingForms = this.getPendingForms();
    if (pendingForms.length === 0) {
      throw new Error('No forms to approve');
    }

    // Approve each form
    pendingForms.forEach((form) => form.approve(approvedBy));

    // Check if ready to move to next stage
    if (this.areAllFormsApproved()) {
      this.updateState({
        status: ApplicationStatus.PENDING_CONSENTS,
        lastReviewedAt: new Date(),
        lastReviewedBy: approvedBy,
      });
    }
  }

  // ==================== BUSINESS LOGIC - CONSENTS ====================

  /**
   * Add a consent request
   * BUSINESS RULE: Cannot add consents after filing
   */
  public addConsentRequest(consent: FamilyConsent): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    // Check for duplicate family member
    const existingConsent = this.props.consents.find(
      (c) => c.familyMemberId === consent.familyMemberId,
    );

    if (existingConsent) {
      throw new Error(`Consent already exists for family member ${consent.familyMemberId}`);
    }

    const updatedConsents = [...this.props.consents, consent];
    this.updateState({ consents: updatedConsents });
  }

  /**
   * Send consent request to family member
   */
  public sendConsentRequest(consentId: string, method: 'SMS' | 'EMAIL' | 'BOTH'): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    const consent = this.props.consents.find((c) => c.id.equals(consentId));
    if (!consent) {
      throw new Error(`Consent ${consentId} not found`);
    }

    consent.sendConsentRequest(method);

    // Emit event
    this.addDomainEvent(
      new ConsentRequested(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        applicationId: this.id.toString(),
        consentId: consent.id.toString(),
        familyMemberId: consent.familyMemberId,
        familyMemberName: consent.fullName,
        method,
      }),
    );
  }

  /**
   * Record consent granted
   */
  public recordConsentGranted(consentId: string): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    const consent = this.props.consents.find((c) => c.id.equals(consentId));
    if (!consent) {
      throw new Error(`Consent ${consentId} not found`);
    }

    // Emit event
    this.addDomainEvent(
      new ConsentGranted(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        applicationId: this.id.toString(),
        consentId: consent.id.toString(),
        familyMemberId: consent.familyMemberId,
        familyMemberName: consent.fullName,
      }),
    );

    // Check if all consents received
    if (this.areAllConsentsReceived()) {
      this.addDomainEvent(
        new AllConsentsReceived(this.id.toString(), this.getAggregateType(), this.getVersion(), {
          applicationId: this.id.toString(),
          estateId: this.props.estateId,
          totalConsents: this.getRequiredConsents().length,
        }),
      );

      // Check if ready to file
      this.checkAndTransitionToReadyToFile();
    }
  }

  /**
   * Record consent declined
   */
  public recordConsentDeclined(consentId: string, reason: string): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    const consent = this.props.consents.find((c) => c.id.equals(consentId));
    if (!consent) {
      throw new Error(`Consent ${consentId} not found`);
    }

    // Emit event
    this.addDomainEvent(
      new ConsentDeclined(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        applicationId: this.id.toString(),
        consentId: consent.id.toString(),
        familyMemberId: consent.familyMemberId,
        familyMemberName: consent.fullName,
        reason,
      }),
    );
  }

  // ==================== BUSINESS LOGIC - FILING ====================

  /**
   * Mark filing fee as paid
   */
  public markFilingFeePaid(amount: number): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    this.updateState({
      filingFeePaid: true,
      filingFeeAmount: amount,
    });

    // Check if ready to file
    this.checkAndTransitionToReadyToFile();
  }

  /**
   * File application with court
   * BUSINESS RULE: Must pass all validations
   */
  public fileWithCourt(courtCaseNumber?: string, courtReceiptNumber?: string): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    if (!this.canFile()) {
      throw new Error(
        'Cannot file application. Requirements not met:\n' +
          `- All forms approved: ${this.areAllFormsApproved()}\n` +
          `- All consents received: ${this.areAllConsentsReceived()}\n` +
          `- No declined consents: ${!this.hasDeclinedConsent()}\n` +
          `- Filing fee paid: ${this.props.filingFeePaid}`,
      );
    }

    // Mark all forms as filed
    this.props.forms.forEach((form) => {
      if (form.status === FormStatus.APPROVED) {
        form.markAsFiled(courtCaseNumber, courtReceiptNumber);
      }
    });

    this.updateState({
      status: ApplicationStatus.FILED,
      filedAt: new Date(),
      courtCaseNumber,
      courtReceiptNumber,
    });

    // Emit event
    this.addDomainEvent(
      new ApplicationFiled(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        applicationId: this.id.toString(),
        estateId: this.props.estateId,
        courtCaseNumber,
        courtStation: this.props.courtStation,
        filedAt: new Date(),
      }),
    );
  }

  /**
   * Record court rejection
   */
  public recordCourtRejection(reason: string): void {
    this.ensureNotDeleted();

    if (this.props.status !== ApplicationStatus.FILED) {
      throw new Error('Can only reject filed applications');
    }

    this.updateState({
      status: ApplicationStatus.REJECTED,
      rejectionReason: reason,
      rejectionDate: new Date(),
    });

    // Emit event
    this.addDomainEvent(
      new ApplicationRejected(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        applicationId: this.id.toString(),
        estateId: this.props.estateId,
        reason,
        rejectedAt: new Date(),
      }),
    );
  }

  /**
   * Record grant approval
   */
  public recordGrantApproved(grantNumber: string): void {
    this.ensureNotDeleted();

    if (this.props.status !== ApplicationStatus.FILED) {
      throw new Error('Can only grant filed applications');
    }

    this.updateState({
      status: ApplicationStatus.GRANTED,
      grantedDate: new Date(),
      grantNumber,
    });
  }

  /**
   * Withdraw application
   */
  public withdraw(reason: string): void {
    this.ensureNotDeleted();

    if (this.props.status === ApplicationStatus.GRANTED) {
      throw new Error('Cannot withdraw granted application');
    }

    this.updateState({
      status: ApplicationStatus.WITHDRAWN,
      withdrawnAt: new Date(),
      withdrawalReason: reason,
    });
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Check if all required forms exist
   */
  private hasAllRequiredForms(): boolean {
    // At minimum, must have one primary petition
    const hasPrimaryPetition = this.props.forms.some(
      (f) => f.formType.isPrimaryPetition() && f.status !== FormStatus.SUPERSEDED,
    );

    return hasPrimaryPetition;
  }

  /**
   * Check conditions and transition to READY_TO_FILE
   */
  private checkAndTransitionToReadyToFile(): void {
    if (
      this.areAllFormsApproved() &&
      this.areAllConsentsReceived() &&
      !this.hasDeclinedConsent() &&
      this.props.filingFeePaid
    ) {
      this.updateState({ status: ApplicationStatus.READY_TO_FILE });

      // Emit event
      this.addDomainEvent(
        new ApplicationReadyToFile(this.id.toString(), this.getAggregateType(), this.getVersion(), {
          applicationId: this.id.toString(),
          estateId: this.props.estateId,
        }),
      );
    }
  }

  /**
   * Ensure application is editable
   */
  private ensureEditable(): void {
    if (!this.isEditable()) {
      throw new Error(`Cannot modify application with status ${this.props.status}`);
    }
  }

  // ==================== VALIDATION ====================

  public validate(): void {
    // INVARIANT 1: Must have at least one form
    if (this.props.forms.length === 0 && this.props.status !== ApplicationStatus.DRAFT) {
      throw new Error('Application must have at least one form');
    }

    // INVARIANT 2: All required consents must be granted if status is READY_TO_FILE
    if (this.props.status === ApplicationStatus.READY_TO_FILE) {
      if (!this.areAllConsentsReceived()) {
        throw new Error('All required consents must be granted');
      }
      if (!this.areAllFormsApproved()) {
        throw new Error('All forms must be approved');
      }
      if (!this.props.filingFeePaid) {
        throw new Error('Filing fee must be paid');
      }
    }

    // INVARIANT 3: Cannot have declined consent if status is READY_TO_FILE
    if (this.props.status === ApplicationStatus.READY_TO_FILE && this.hasDeclinedConsent()) {
      throw new Error('Cannot file with declined consents');
    }

    // INVARIANT 4: Filed applications must be immutable
    if (this.props.status === ApplicationStatus.FILED && !this.props.filedAt) {
      throw new Error('Filed application must have filedAt timestamp');
    }
  }

  // ==================== EVENT SOURCING ====================

  protected applyEvent(event: DomainEvent): void {
    // Event replay logic
    switch (event.getEventType()) {
      case 'ProbateApplicationCreated':
        // Initial state set in factory
        break;
      case 'FormGenerated':
      case 'ConsentRequested':
      case 'ConsentGranted':
        // State already updated via business logic
        break;
      default:
        // Unknown event - ignore
        break;
    }
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create a new probate application
   */
  public static create(
    estateId: string,
    successionContext: SuccessionContext,
    applicationType: ProbateApplicationType,
    applicantUserId: string,
    applicantFullName: string,
    applicantRelationship: string,
    targetCourt: string,
    courtStation: string,
  ): ProbateApplication {
    const id = UniqueEntityID.newID();

    const application = new ProbateApplication(id, {
      estateId,
      successionContext,
      applicationType,
      applicantUserId,
      applicantFullName,
      applicantRelationship,
      targetCourt,
      courtStation,
      status: ApplicationStatus.DRAFT,
      forms: [],
      consents: [],
      filingFeePaid: false,
    });

    // Emit creation event
    application.addDomainEvent(
      new ProbateApplicationCreated(id.toString(), application.getAggregateType(), 1, {
        applicationId: id.toString(),
        estateId,
        applicationType,
        targetCourt,
        courtStation,
      }),
    );

    return application;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    props: ProbateApplicationProps,
    createdAt: Date,
    updatedAt: Date,
    version: number,
  ): ProbateApplication {
    const aggregate = new ProbateApplication(new UniqueEntityID(id), props, createdAt);
    (aggregate as any)._updatedAt = updatedAt;
    (aggregate as any)._version = version;
    return aggregate;
  }
}
