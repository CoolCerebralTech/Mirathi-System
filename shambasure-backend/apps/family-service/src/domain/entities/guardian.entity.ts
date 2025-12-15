// domain/entities/guardian.entity.ts
import { Entity } from '../base/entity';
import { AnnualReportFiledEvent } from '../events/guardianship-events/annual-report-filed.event';
import { GuardianAppointedEvent } from '../events/guardianship-events/guardian-appointed.event';
import { GuardianBondPostedEvent } from '../events/guardianship-events/guardian-bond-posted.event';
import { GuardianshipTerminatedEvent } from '../events/guardianship-events/guardianship-terminated.event';
import { InvalidGuardianshipException } from '../exceptions/guardianship.exception';
import { GuardianBond } from '../value-objects/financial/guardian-bond.vo';
import { GuardianshipTerm } from '../value-objects/temporal/guardianship-term.vo';

// Enums matching Prisma Schema
export enum GuardianType {
  TESTAMENTARY = 'TESTAMENTARY', // Appointed by Will (S. 70 LSA)
  COURT_APPOINTED = 'COURT_APPOINTED', // Appointed by Court (S. 71 LSA)
  NATURAL_PARENT = 'NATURAL_PARENT', // Surviving parent
  DE_FACTO = 'DE_FACTO', // Acting pending formalization
}

export enum GuardianReportStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  OVERDUE = 'OVERDUE',
}

export interface GuardianProps {
  id: string;
  wardId: string; // The Minor or Person with Disability
  guardianId: string; // The Appointee

  type: GuardianType;

  // Legal Authority
  courtOrderNumber?: string;
  courtStation?: string;
  appointmentDate: Date;

  // Duration & Validity
  term: GuardianshipTerm; // validUntil, terminationReason

  // Powers
  hasPropertyManagementPowers: boolean;
  canConsentToMedical: boolean;
  canConsentToMarriage: boolean; // Specific to certain customary laws

  // S. 72 LSA - Security/Bond
  bondRequired: boolean;
  bond?: GuardianBond;

  // S. 73 LSA - Accounting
  lastReportDate?: Date;
  nextReportDue?: Date;
  reportStatus: GuardianReportStatus;

  // Allowances (Maintenance)
  annualAllowance?: number;

  // State
  isActive: boolean;

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
  validUntil?: Date; // e.g., until 18th birthday
  courtOrderNumber?: string;
  courtStation?: string;
  hasPropertyManagementPowers?: boolean;
  bondRequired?: boolean;
  bondAmount?: number;
}

export class Guardian extends Entity<GuardianProps> {
  private constructor(props: GuardianProps) {
    super(props);
    this.validate();
  }

  static create(props: CreateGuardianProps): Guardian {
    const id = this.generateId();
    const now = new Date();

    // Calculate initial term (default to age 18 if not specified, managed by VO)
    const term = GuardianshipTerm.create({
      startDate: props.appointmentDate,
      endDate: props.validUntil,
    });

    // Handle Bond Creation (S.72)
    let bond: GuardianBond | undefined;
    if (props.bondRequired && props.bondAmount) {
      bond = GuardianBond.create({
        amount: props.bondAmount,
        currency: 'KES',
        isPosted: false, // Initially not posted
      });
    }

    // Determine reporting schedule (Annual by default under S.73)
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
      term,
      hasPropertyManagementPowers: props.hasPropertyManagementPowers ?? false,
      canConsentToMedical: true, // Default power
      canConsentToMarriage: false, // Restricted by default
      bondRequired: props.bondRequired ?? false,
      bond,
      reportStatus: GuardianReportStatus.PENDING,
      nextReportDue,
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
        timestamp: now,
      }),
    );

    return guardian;
  }

  static createFromProps(props: GuardianProps): Guardian {
    return new Guardian(props);
  }

  // --- Domain Logic ---

  /**
   * Posts the security bond required by S.72 LSA.
   * Without this, property management powers are often suspended by the court.
   */
  postBond(provider: string, policyNumber: string, expiryDate: Date): void {
    if (!this.props.bondRequired) {
      throw new InvalidGuardianshipException('Bond is not required for this guardianship.');
    }

    if (!this.props.bond) {
      // Should not happen if bondRequired is true, but safe guard
      throw new InvalidGuardianshipException('Bond structure was not initialized.');
    }

    this.props.bond = this.props.bond.markAsPosted(provider, policyNumber, expiryDate);
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new GuardianBondPostedEvent({
        guardianshipId: this.id,
        amount: this.props.bond.amount,
        provider,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Records the filing of annual accounts/inventory as per S.73 LSA.
   */
  fileAnnualReport(reportDate: Date, summary: string): void {
    if (!this.props.isActive) {
      throw new InvalidGuardianshipException('Cannot file report for inactive guardianship.');
    }

    this.props.lastReportDate = reportDate;
    this.props.reportStatus = GuardianReportStatus.SUBMITTED;

    // Set next due date to 1 year from now
    const nextDue = new Date(reportDate);
    nextDue.setFullYear(nextDue.getFullYear() + 1);
    this.props.nextReportDue = nextDue;

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new AnnualReportFiledEvent({
        guardianshipId: this.id,
        reportDate,
        summary,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Terminates the guardianship (e.g., Ward turns 18, death, or removal).
   */
  terminate(reason: string, date: Date): void {
    if (!this.props.isActive) return;

    this.props.isActive = false;
    this.props.term = this.props.term.terminate(date, reason);
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new GuardianshipTerminatedEvent({
        guardianshipId: this.id,
        wardId: this.props.wardId,
        reason,
        date,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Grants specific permission to manage estate property.
   * Usually requires a confirmed Grant or specific Court Order.
   */
  grantPropertyPowers(courtOrderNumber: string): void {
    if (this.props.bondRequired && (!this.props.bond || !this.props.bond.isPosted)) {
      throw new InvalidGuardianshipException(
        'Cannot grant property powers until S.72 Bond is posted.',
      );
    }

    this.props.hasPropertyManagementPowers = true;
    // Update court order if new one issued specifically for powers
    if (courtOrderNumber !== this.props.courtOrderNumber) {
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
      // Ideally we require it, but sometimes the system entry happens before the number is typed.
      // For domain strictness, let's warn or enforce based on business rule.
      // Here we allow creation but it might limit functionality.
    }
  }

  private static generateId(): string {
    return `grd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
  get isBondCompliant(): boolean {
    if (!this.props.bondRequired) return true;
    return !!this.props.bond?.isPosted;
  }
  get isReportOverdue(): boolean {
    if (!this.props.nextReportDue) return false;
    return (
      new Date() > this.props.nextReportDue &&
      this.props.reportStatus !== GuardianReportStatus.SUBMITTED
    );
  }

  toJSON() {
    return {
      id: this.id,
      wardId: this.props.wardId,
      guardianId: this.props.guardianId,
      type: this.props.type,
      courtOrderNumber: this.props.courtOrderNumber,
      appointmentDate: this.props.appointmentDate,
      term: this.props.term.toJSON(),
      hasPropertyManagementPowers: this.props.hasPropertyManagementPowers,
      bondRequired: this.props.bondRequired,
      bond: this.props.bond?.toJSON(),
      reportStatus: this.props.reportStatus,
      nextReportDue: this.props.nextReportDue,
      isActive: this.props.isActive,
      isBondCompliant: this.isBondCompliant,
      isReportOverdue: this.isReportOverdue,
      version: this.props.version,
      createdAt: this.props.createdAt,
    };
  }
}
