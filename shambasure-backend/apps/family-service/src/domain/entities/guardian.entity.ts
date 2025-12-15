import { GuardianType } from '@prisma/client';

import { Entity } from '../base/entity';
import { AnnualReportFiledEvent } from '../events/guardianship-events/annual-report-filed.event';
import { GuardianAppointedEvent } from '../events/guardianship-events/guardian-appointed.event';
import { GuardianBondPostedEvent } from '../events/guardianship-events/guardian-bond-posted.event';
import { GuardianshipTerminatedEvent } from '../events/guardianship-events/guardianship-terminated.event';
import { InvalidGuardianshipException } from '../exceptions/guardianship.exception';

export enum GuardianReportStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  OVERDUE = 'OVERDUE',
}

export interface GuardianProps {
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

export interface CreateGuardianProps {
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

export class Guardian extends Entity<GuardianProps> {
  private constructor(props: GuardianProps) {
    super(props.id, props);
    this.validate();
  }

  static create(props: CreateGuardianProps): Guardian {
    const id = this.generateId();
    const now = new Date();

    // Calculate next report due (1 year from appointment)
    const nextReportDue = new Date(props.appointmentDate);
    nextReportDue.setFullYear(nextReportDue.getFullYear() + 1);

    const guardian = new Guardian({
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
    });

    guardian.addDomainEvent(
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

    return guardian;
  }

  static createFromProps(props: GuardianProps): Guardian {
    return new Guardian(props);
  }

  // --- Domain Logic ---

  postBond(params: { provider: string; policyNumber: string; expiryDate: Date }): void {
    if (!this.props.bondRequired) {
      throw new InvalidGuardianshipException('Bond is not required for this guardianship.');
    }

    if (!this.props.bondAmountKES) {
      throw new InvalidGuardianshipException('Bond amount must be set before posting bond.');
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
    if (this.props.bondRequired && (!this.props.bondProvider || !this.props.bondPolicyNumber)) {
      throw new InvalidGuardianshipException(
        'Cannot grant property management powers until S.72 Bond is posted.',
      );
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

  private validate(): void {
    if (this.props.wardId === this.props.guardianId) {
      throw new InvalidGuardianshipException('A person cannot be their own guardian.');
    }

    if (this.props.type === GuardianType.COURT_APPOINTED && !this.props.courtOrderNumber) {
      console.warn('Court-appointed guardian should have a court order number.');
    }

    if (this.props.bondRequired && !this.props.bondAmountKES) {
      throw new InvalidGuardianshipException('Bond amount is required when bond is required.');
    }

    if (this.props.validUntil && this.props.validUntil <= this.props.appointmentDate) {
      throw new InvalidGuardianshipException('Valid until date must be after appointment date.');
    }

    if (this.props.annualAllowanceKES && this.props.annualAllowanceKES < 0) {
      throw new InvalidGuardianshipException('Annual allowance cannot be negative.');
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

  // Computed property for S.73 compliance
  get s73ComplianceStatus(): 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_REQUIRED' {
    if (!this.requiresAnnualReport) return 'NOT_REQUIRED';
    if (this.isReportOverdue) return 'NON_COMPLIANT';
    if (this.props.reportStatus === 'SUBMITTED' || this.props.reportStatus === 'APPROVED') {
      return 'COMPLIANT';
    }
    return 'NON_COMPLIANT';
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
      version: this.props.version,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
