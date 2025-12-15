// domain/aggregates/guardianship.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import {
  CreateGuardianProps,
  Guardian,
  GuardianProps,
  GuardianReportStatus,
  GuardianType,
} from '../entities/guardian.entity';
import { AnnualReportFiledEvent } from '../events/guardianship-events/annual-report-filed.event';
import { GuardianAppointedEvent } from '../events/guardianship-events/guardian-appointed.event';
import { GuardianBondPostedEvent } from '../events/guardianship-events/guardian-bond-posted.event';
import { GuardianshipTerminatedEvent } from '../events/guardianship-events/guardianship-terminated.event';
import { InvalidGuardianshipException } from '../exceptions/guardianship.exception';

/**
 * GuardianshipAggregate
 *
 * Roots the S.70-73 Guardianship lifecycle.
 * Invariants enforced:
 * 1. A guardian cannot be appointed for themselves.
 * 2. Property powers (S.72) require a valid Bond unless exempted.
 * 3. Annual reports (S.73) must be tracked and flagged if overdue.
 */
export class GuardianshipAggregate extends AggregateRoot<GuardianProps> {
  private constructor(props: GuardianProps) {
    super(props, props.id);
  }

  // --- Factory Methods ---

  static create(props: CreateGuardianProps): GuardianshipAggregate {
    // We delegate the internal creation logic to the Entity static factory
    // to reuse the robust initialization logic (Dates, defaults) defined there.
    const guardianEntity = Guardian.create(props);

    // We lift the entity props into the Aggregate
    const aggregate = new GuardianshipAggregate(guardianEntity.getProps());

    // The Entity factory added the creation event to the entity instance,
    // but since we are wrapping it, we need to ensure the event propagates
    // or is re-added to this Aggregate Root.
    // In this pattern, we usually re-emit the event from the Aggregate.
    aggregate.addDomainEvent(
      new GuardianAppointedEvent({
        guardianshipId: aggregate.id,
        wardId: props.wardId,
        guardianId: props.guardianId,
        type: props.type,
        timestamp: new Date(),
      }),
    );

    return aggregate;
  }

  static createFromProps(props: GuardianProps): GuardianshipAggregate {
    return new GuardianshipAggregate(props);
  }

  // --- Business Logic / Domain Actions ---

  /**
   * S.72 LSA: Posts the security bond.
   * This is a prerequisite for managing estate property.
   */
  postSecurityBond(provider: string, policyNumber: string, expiryDate: Date): void {
    if (!this.props.bondRequired) {
      throw new InvalidGuardianshipException(
        'Security bond is not required for this guardianship.',
      );
    }

    if (!this.props.bond) {
      throw new InvalidGuardianshipException('Bond structure was not initialized correctly.');
    }

    // Logic for updating the Value Object is delegated to the entity logic
    // We assume the entity logic is available or we replicate the state change here.
    // Since we are operating on Props, we update the state directly.

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
   * S.73 LSA: Files the annual inventory/accounts.
   */
  fileAnnualReport(reportDate: Date, summary: string, documents: string[]): void {
    if (!this.props.isActive) {
      throw new InvalidGuardianshipException('Cannot file report for an inactive guardianship.');
    }

    this.props.lastReportDate = reportDate;
    this.props.reportStatus = GuardianReportStatus.SUBMITTED;

    // Calculate Next Due Date (1 Year later)
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
        documentIds: documents, // Track which docs were filed
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Validates the Bond status before allowing property transactions.
   * This method should be called by the Estate Service before approving withdrawals.
   */
  validatePropertyAccess(): void {
    if (!this.props.hasPropertyManagementPowers) {
      throw new InvalidGuardianshipException('Guardian does not have property management powers.');
    }

    if (this.props.bondRequired) {
      if (!this.props.bond || !this.props.bond.isPosted) {
        throw new InvalidGuardianshipException(
          'Section 72 Bond must be posted before accessing property.',
        );
      }

      if (this.props.bond.isExpired()) {
        throw new InvalidGuardianshipException(
          'Section 72 Bond has expired. Please renew security.',
        );
      }
    }
  }

  /**
   * Approves/Verifies the Annual Report (Court/Auditor Action).
   */
  approveAnnualReport(auditorId: string): void {
    if (this.props.reportStatus !== GuardianReportStatus.SUBMITTED) {
      throw new InvalidGuardianshipException('No submitted report pending approval.');
    }

    this.props.reportStatus = GuardianReportStatus.APPROVED;
    this.props.updatedAt = new Date();
    this.props.version++;

    // Could emit GuardianReportApprovedEvent here
  }

  /**
   * Terminates the guardianship (e.g. Ward turns 18).
   */
  terminate(reason: string): void {
    if (!this.props.isActive) return;

    const now = new Date();

    this.props.isActive = false;
    this.props.term = this.props.term.terminate(now, reason);

    this.props.updatedAt = now;
    this.props.version++;

    this.addDomainEvent(
      new GuardianshipTerminatedEvent({
        guardianshipId: this.id,
        wardId: this.props.wardId,
        reason,
        date: now,
        timestamp: now,
      }),
    );
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
  get nextReportDue(): Date | undefined {
    return this.props.nextReportDue;
  }

  /**
   * Domain Check: Is this guardian compliant with Kenyan Law?
   */
  get isCompliant(): boolean {
    const isBondOk = this.props.bondRequired
      ? !!this.props.bond?.isPosted && !this.props.bond.isExpired()
      : true;

    const isReportOk =
      !this.props.nextReportDue ||
      this.props.nextReportDue > new Date() ||
      this.props.reportStatus === GuardianReportStatus.SUBMITTED;

    return isBondOk && isReportOk;
  }

  /**
   * Expose props for persistence (Repository use)
   */
  getProps(): GuardianProps {
    // Return a copy or readonly view to prevent mutation outside aggregate methods
    return { ...this.props };
  }
}
