import { GuardianType } from '@prisma/client';

import { AggregateRoot } from '../base/aggregate-root';
import { AnnualReportFiledEvent } from '../events/guardianship-events/annual-report-filed.event';
import { GuardianAppointedEvent } from '../events/guardianship-events/guardian-appointed.event';
import { GuardianBondPostedEvent } from '../events/guardianship-events/guardian-bond-posted.event';
import { GuardianshipTerminatedEvent } from '../events/guardianship-events/guardianship-terminated.event';
import {
  GuardianDomainException,
  InvalidGuardianshipException,
} from '../exceptions/guardianship.exception';

export interface GuardianshipProps {
  id: string;
  wardId: string;
  guardianId: string;
  type: GuardianType;

  // Kenyan Legal Requirements
  courtOrderNumber?: string;
  courtStation?: string;
  appointmentDate: Date;
  validUntil?: Date;

  // Powers & Restrictions
  hasPropertyManagementPowers: boolean;
  canConsentToMedical: boolean;
  canConsentToMarriage: boolean;
  restrictions?: unknown; // JSON
  specialInstructions?: string;

  // Kenyan Court Requirements
  guardianIdNumber?: string;
  courtCaseNumber?: string;
  interimOrderId?: string;

  // Guardian Bond (S. 72 LSA)
  bondRequired: boolean;
  bondAmountKES?: number;
  bondProvider?: string;
  bondPolicyNumber?: string;
  bondExpiry?: Date;

  // Annual Reporting (S. 73 LSA)
  lastReportDate?: Date;
  nextReportDue?: Date;
  reportStatus: string;

  // Allowances
  annualAllowanceKES?: number;
  allowanceApprovedBy?: string;

  // Status
  isActive: boolean;
  terminationDate?: Date;
  terminationReason?: string;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGuardianshipProps {
  wardId: string;
  guardianId: string;
  type: GuardianType;
  appointmentDate: Date;

  // Legal details
  courtOrderNumber?: string;
  courtStation?: string;
  validUntil?: Date;
  guardianIdNumber?: string;
  courtCaseNumber?: string;
  interimOrderId?: string;

  // Powers
  hasPropertyManagementPowers?: boolean;
  canConsentToMedical?: boolean;
  canConsentToMarriage?: boolean;
  restrictions?: unknown;
  specialInstructions?: string;

  // Bond
  bondRequired?: boolean;
  bondAmountKES?: number;

  // Allowances
  annualAllowanceKES?: number;
}

export class GuardianshipAggregate extends AggregateRoot<GuardianshipProps> {
  private constructor(props: GuardianshipProps) {
    super(props.id, props);
    this.validate();
  }

  // --- Factory Methods ---

  static create(props: CreateGuardianshipProps): GuardianshipAggregate {
    const id = this.generateId();
    const now = new Date();

    // Calculate next report due (1 year from appointment)
    const nextReportDue = new Date(props.appointmentDate);
    nextReportDue.setFullYear(nextReportDue.getFullYear() + 1);

    const guardianshipProps: GuardianshipProps = {
      id,
      wardId: props.wardId,
      guardianId: props.guardianId,
      type: props.type,
      courtOrderNumber: props.courtOrderNumber,
      courtStation: props.courtStation,
      appointmentDate: props.appointmentDate,
      validUntil: props.validUntil,
      guardianIdNumber: props.guardianIdNumber,
      courtCaseNumber: props.courtCaseNumber,
      interimOrderId: props.interimOrderId,
      hasPropertyManagementPowers: props.hasPropertyManagementPowers ?? false,
      canConsentToMedical: props.canConsentToMedical ?? true,
      canConsentToMarriage: props.canConsentToMarriage ?? false,
      restrictions: props.restrictions,
      specialInstructions: props.specialInstructions,
      bondRequired: props.bondRequired ?? false,
      bondAmountKES: props.bondAmountKES,
      reportStatus: 'PENDING',
      nextReportDue,
      annualAllowanceKES: props.annualAllowanceKES,
      isActive: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const guardianship = new GuardianshipAggregate(guardianshipProps);

    guardianship.addDomainEvent(
      new GuardianAppointedEvent({
        guardianshipId: id,
        wardId: props.wardId,
        guardianId: props.guardianId,
        type: props.type,
        courtOrderNumber: props.courtOrderNumber,
        courtStation: props.courtStation,
        appointmentDate: props.appointmentDate,
      }),
    );

    return guardianship;
  }

  static createFromProps(props: GuardianshipProps): GuardianshipAggregate {
    return new GuardianshipAggregate(props);
  }

  // --- Domain Logic ---

  postBond(params: { provider: string; policyNumber: string; expiryDate: Date }): void {
    if (!this.props.bondRequired) {
      throw new InvalidGuardianshipException('Bond is not required for this guardianship.');
    }

    if (!this.props.bondAmountKES) {
      throw new InvalidGuardianshipException('Bond amount must be set before posting bond.');
    }

    if (this.props.bondProvider && this.props.bondPolicyNumber) {
      // Already posted, consider idempotency
      if (
        this.props.bondProvider === params.provider &&
        this.props.bondPolicyNumber === params.policyNumber
      ) {
        return;
      }
      throw new InvalidGuardianshipException('Bond has already been posted.');
    }

    this.props.bondProvider = params.provider;
    this.props.bondPolicyNumber = params.policyNumber;
    this.props.bondExpiry = params.expiryDate;
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new GuardianBondPostedEvent({
        guardianshipId: this.id,
        amount: this.props.bondAmountKES,
        provider: params.provider,
        policyNumber: params.policyNumber,
        expiryDate: params.expiryDate,
      }),
    );
  }

  fileAnnualReport(reportDate: Date, summary: string, approvedBy?: string): void {
    if (!this.props.isActive) {
      throw new InvalidGuardianshipException('Cannot file report for inactive guardianship.');
    }

    if (!this.props.hasPropertyManagementPowers) {
      console.warn('Filing annual report for guardianship without property management powers.');
    }

    this.props.lastReportDate = reportDate;
    this.props.reportStatus = 'SUBMITTED';

    // Set next due date to 1 year from report date
    const nextDue = new Date(reportDate);
    nextDue.setFullYear(nextDue.getFullYear() + 1);
    this.props.nextReportDue = nextDue;

    if (approvedBy) {
      this.props.reportStatus = 'APPROVED';
      this.props.allowanceApprovedBy = approvedBy;
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new AnnualReportFiledEvent({
        guardianshipId: this.id,
        reportDate,
        summary,
        nextReportDue: nextDue,
        approvedBy,
      }),
    );
  }

  terminate(reason: string, terminationDate: Date): void {
    if (!this.props.isActive) {
      throw new InvalidGuardianshipException('Guardianship is already terminated.');
    }

    this.props.isActive = false;
    this.props.terminationDate = terminationDate;
    this.props.terminationReason = reason;

    // Clear future reporting obligations
    this.props.nextReportDue = undefined;
    this.props.reportStatus = 'APPROVED';

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new GuardianshipTerminatedEvent({
        guardianshipId: this.id,
        wardId: this.props.wardId,
        guardianId: this.props.guardianId,
        reason,
        terminationDate,
      }),
    );
  }

  grantPropertyManagementPowers(courtOrderNumber?: string, restrictions?: unknown): void {
    if (this.props.hasPropertyManagementPowers) {
      return; // Already granted
    }

    if (this.props.bondRequired && (!this.props.bondProvider || !this.props.bondPolicyNumber)) {
      throw new InvalidGuardianshipException(
        'Cannot grant property management powers until S.72 Bond is posted.',
      );
    }

    if (this.props.bondRequired && this.props.bondExpiry && new Date() > this.props.bondExpiry) {
      throw new InvalidGuardianshipException('Cannot grant property powers with expired bond.');
    }

    this.props.hasPropertyManagementPowers = true;

    if (courtOrderNumber) {
      this.props.courtOrderNumber = courtOrderNumber;
    }

    if (restrictions) {
      this.props.restrictions = restrictions;
    }

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  updateAllowance(amount: number, approvedBy: string): void {
    if (amount < 0) {
      throw new InvalidGuardianshipException('Annual allowance cannot be negative.');
    }

    this.props.annualAllowanceKES = amount;
    this.props.allowanceApprovedBy = approvedBy;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  updateRestrictions(restrictions: unknown): void {
    this.props.restrictions = restrictions;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  updateSpecialInstructions(instructions: string): void {
    this.props.specialInstructions = instructions;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  extendTerm(newValidUntil: Date, courtOrderNumber?: string): void {
    if (!this.props.isActive) {
      throw new InvalidGuardianshipException('Cannot extend term of inactive guardianship.');
    }

    if (newValidUntil <= this.props.appointmentDate) {
      throw new InvalidGuardianshipException('New term end date must be after appointment date.');
    }

    if (newValidUntil <= new Date()) {
      throw new InvalidGuardianshipException('New term end date must be in the future.');
    }

    this.props.validUntil = newValidUntil;

    if (courtOrderNumber) {
      this.props.courtOrderNumber = courtOrderNumber;
    }

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  renewBond(params: { newExpiryDate: Date; provider?: string; policyNumber?: string }): void {
    if (!this.props.bondRequired) {
      throw new InvalidGuardianshipException('Bond is not required for this guardianship.');
    }

    if (!this.props.bondProvider || !this.props.bondPolicyNumber) {
      throw new InvalidGuardianshipException('No bond has been posted to renew.');
    }

    if (params.newExpiryDate <= new Date()) {
      throw new InvalidGuardianshipException('New bond expiry must be in the future.');
    }

    this.props.bondExpiry = params.newExpiryDate;

    if (params.provider) {
      this.props.bondProvider = params.provider;
    }

    if (params.policyNumber) {
      this.props.bondPolicyNumber = params.policyNumber;
    }

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  markReportOverdue(): void {
    if (!this.props.isActive || !this.props.nextReportDue) {
      return;
    }

    if (new Date() > this.props.nextReportDue && this.props.reportStatus !== 'SUBMITTED') {
      this.props.reportStatus = 'OVERDUE';
      this.props.updatedAt = new Date();
      this.props.version++;
    }
  }

  approveAnnualReport(auditorId: string): void {
    if (this.props.reportStatus !== 'SUBMITTED') {
      throw new InvalidGuardianshipException('No submitted report pending approval.');
    }

    this.props.reportStatus = 'APPROVED';
    this.props.allowanceApprovedBy = auditorId;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  // --- S.72 LSA Bond Validation ---

  validatePropertyAccess(): void {
    if (!this.props.hasPropertyManagementPowers) {
      throw new InvalidGuardianshipException('Guardian does not have property management powers.');
    }

    if (this.props.bondRequired) {
      if (!this.props.bondProvider || !this.props.bondPolicyNumber) {
        throw new InvalidGuardianshipException(
          'Section 72 Bond must be posted before accessing property.',
        );
      }

      if (this.props.bondExpiry && new Date() > this.props.bondExpiry) {
        throw new InvalidGuardianshipException(
          'Section 72 Bond has expired. Please renew security.',
        );
      }
    }
  }

  // --- Validation & Invariants ---

  private validate(): void {
    if (!this.props.id) {
      throw new GuardianDomainException('Guardianship ID is required');
    }

    if (!this.props.wardId) {
      throw new GuardianDomainException('Ward ID is required');
    }

    if (!this.props.guardianId) {
      throw new GuardianDomainException('Guardian ID is required');
    }

    if (this.props.wardId === this.props.guardianId) {
      throw new GuardianDomainException('A person cannot be their own guardian.');
    }

    if (this.props.type === GuardianType.COURT_APPOINTED && !this.props.courtOrderNumber) {
      console.warn('Court-appointed guardian should have a court order number.');
    }

    if (this.props.bondRequired && !this.props.bondAmountKES) {
      throw new GuardianDomainException('Bond amount is required when bond is required.');
    }

    if (this.props.validUntil && this.props.validUntil <= this.props.appointmentDate) {
      throw new GuardianDomainException('Valid until date must be after appointment date.');
    }

    if (this.props.annualAllowanceKES && this.props.annualAllowanceKES < 0) {
      throw new GuardianDomainException('Annual allowance cannot be negative.');
    }

    // Ensure nextReportDue is set if guardianship is active
    if (this.props.isActive && !this.props.nextReportDue) {
      // Auto-set next report due if missing
      const nextDue = new Date(this.props.appointmentDate);
      nextDue.setFullYear(nextDue.getFullYear() + 1);
      this.props.nextReportDue = nextDue;
    }
  }

  private static generateId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : `grd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get wardId(): string {
    return this.props.wardId;
  }

  get guardianId(): string {
    return this.props.guardianId;
  }

  get type(): GuardianType {
    return this.props.type;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get appointmentDate(): Date {
    return this.props.appointmentDate;
  }

  get validUntil(): Date | undefined {
    return this.props.validUntil;
  }

  get hasPropertyManagementPowers(): boolean {
    return this.props.hasPropertyManagementPowers;
  }

  get canConsentToMedical(): boolean {
    return this.props.canConsentToMedical;
  }

  get canConsentToMarriage(): boolean {
    return this.props.canConsentToMarriage;
  }

  get bondRequired(): boolean {
    return this.props.bondRequired;
  }

  get isBondPosted(): boolean {
    return !!this.props.bondProvider && !!this.props.bondPolicyNumber;
  }

  get isBondExpired(): boolean {
    if (!this.props.bondExpiry) return false;
    return new Date() > this.props.bondExpiry;
  }

  get isReportOverdue(): boolean {
    if (!this.props.nextReportDue || !this.props.isActive) return false;

    const today = new Date();
    return (
      today > this.props.nextReportDue &&
      this.props.reportStatus !== 'SUBMITTED' &&
      this.props.reportStatus !== 'APPROVED'
    );
  }

  get requiresAnnualReport(): boolean {
    // Only active guardianships with property management powers require annual reports
    return this.props.isActive && this.props.hasPropertyManagementPowers;
  }

  get isTermExpired(): boolean {
    if (!this.props.validUntil) return false;
    return new Date() > this.props.validUntil;
  }

  get terminationDate(): Date | undefined {
    return this.props.terminationDate;
  }

  get terminationReason(): string | undefined {
    return this.props.terminationReason;
  }

  get annualAllowanceKES(): number | undefined {
    return this.props.annualAllowanceKES;
  }

  get allowanceApprovedBy(): string | undefined {
    return this.props.allowanceApprovedBy;
  }

  get restrictions(): unknown {
    return this.props.restrictions;
  }

  get specialInstructions(): string | undefined {
    return this.props.specialInstructions;
  }

  get courtOrderNumber(): string | undefined {
    return this.props.courtOrderNumber;
  }

  get courtStation(): string | undefined {
    return this.props.courtStation;
  }

  get guardianIdNumber(): string | undefined {
    return this.props.guardianIdNumber;
  }

  get courtCaseNumber(): string | undefined {
    return this.props.courtCaseNumber;
  }

  get lastReportDate(): Date | undefined {
    return this.props.lastReportDate;
  }

  get nextReportDue(): Date | undefined {
    return this.props.nextReportDue;
  }

  get reportStatus(): string {
    return this.props.reportStatus;
  }

  get bondAmountKES(): number | undefined {
    return this.props.bondAmountKES;
  }

  get bondProvider(): string | undefined {
    return this.props.bondProvider;
  }

  get bondPolicyNumber(): string | undefined {
    return this.props.bondPolicyNumber;
  }

  get bondExpiry(): Date | undefined {
    return this.props.bondExpiry;
  }

  get version(): number {
    return this.props.version;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed property for S.73 compliance
  get s73ComplianceStatus(): 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_REQUIRED' {
    if (!this.requiresAnnualReport) return 'NOT_REQUIRED';
    if (this.isReportOverdue) return 'NON_COMPLIANT';
    if (this.props.reportStatus === 'SUBMITTED' || this.props.reportStatus === 'APPROVED') {
      return 'COMPLIANT';
    }
    return 'NON_COMPLIANT';
  }

  // Computed property for S.72 compliance
  get s72ComplianceStatus(): 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_REQUIRED' {
    if (!this.props.bondRequired) return 'NOT_REQUIRED';
    if (!this.isBondPosted) return 'NON_COMPLIANT';
    if (this.isBondExpired) return 'NON_COMPLIANT';
    return 'COMPLIANT';
  }

  // Overall compliance status
  get isCompliantWithKenyanLaw(): boolean {
    return (
      this.s73ComplianceStatus !== 'NON_COMPLIANT' && this.s72ComplianceStatus !== 'NON_COMPLIANT'
    );
  }

  toJSON() {
    return {
      id: this.id,
      wardId: this.props.wardId,
      guardianId: this.props.guardianId,
      type: this.props.type,
      courtOrderNumber: this.props.courtOrderNumber,
      courtStation: this.props.courtStation,
      appointmentDate: this.props.appointmentDate,
      validUntil: this.props.validUntil,
      hasPropertyManagementPowers: this.props.hasPropertyManagementPowers,
      canConsentToMedical: this.props.canConsentToMedical,
      canConsentToMarriage: this.props.canConsentToMarriage,
      restrictions: this.props.restrictions,
      specialInstructions: this.props.specialInstructions,
      guardianIdNumber: this.props.guardianIdNumber,
      courtCaseNumber: this.props.courtCaseNumber,
      interimOrderId: this.props.interimOrderId,
      bondRequired: this.props.bondRequired,
      bondAmountKES: this.props.bondAmountKES,
      bondProvider: this.props.bondProvider,
      bondPolicyNumber: this.props.bondPolicyNumber,
      bondExpiry: this.props.bondExpiry,
      lastReportDate: this.props.lastReportDate,
      nextReportDue: this.props.nextReportDue,
      reportStatus: this.props.reportStatus,
      annualAllowanceKES: this.props.annualAllowanceKES,
      allowanceApprovedBy: this.props.allowanceApprovedBy,
      isActive: this.props.isActive,
      terminationDate: this.props.terminationDate,
      terminationReason: this.props.terminationReason,
      isBondPosted: this.isBondPosted,
      isBondExpired: this.isBondExpired,
      isReportOverdue: this.isReportOverdue,
      isTermExpired: this.isTermExpired,
      requiresAnnualReport: this.requiresAnnualReport,
      s73ComplianceStatus: this.s73ComplianceStatus,
      s72ComplianceStatus: this.s72ComplianceStatus,
      isCompliantWithKenyanLaw: this.isCompliantWithKenyanLaw,
      version: this.props.version,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
