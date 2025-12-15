import { Entity } from '../base/entity';
import { CohabitationEndedEvent } from '../events/relationship-events/cohabitation-ended.event';
import { CohabitationRecognizedEvent } from '../events/relationship-events/cohabitation-recognized.event';
import { CohabitationStartedEvent } from '../events/relationship-events/cohabitation-started.event';
import { InvalidCohabitationException } from '../exceptions/relationship.exception';

export interface CohabitationRecordProps {
  id: string;
  familyId: string;
  partner1Id: string;
  partner2Id: string;

  // Timing
  startDate: Date;
  endDate?: Date;

  // S. 29(5) Kenyan criteria
  durationYears: number; // Must be ≥5 years for dependancy claims
  isAcknowledged: boolean; // Family/community recognition
  hasChildren: boolean;
  childrenCount: number;
  isRegistered: boolean; // Some counties have registries

  // Rejection tracking
  rejectionReason?: string;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCohabitationProps {
  familyId: string;
  partner1Id: string;
  partner2Id: string;
  startDate: Date;
  hasChildren?: boolean;
  childrenCount?: number;
  isAcknowledged?: boolean;
  isRegistered?: boolean;
  rejectionReason?: string;
}

export class CohabitationRecord extends Entity<CohabitationRecordProps> {
  private constructor(props: CohabitationRecordProps) {
    super(props.id, props);
    this.validate();
  }

  static create(props: CreateCohabitationProps): CohabitationRecord {
    const id = this.generateId();
    const now = new Date();

    // Calculate initial duration in years
    const durationYears = this.calculateYearsBetween(props.startDate, now);

    const record = new CohabitationRecord({
      id,
      familyId: props.familyId,
      partner1Id: props.partner1Id,
      partner2Id: props.partner2Id,
      startDate: props.startDate,
      durationYears,
      isAcknowledged: props.isAcknowledged || false,
      hasChildren: props.hasChildren || false,
      childrenCount: props.childrenCount || 0,
      isRegistered: props.isRegistered || false,
      rejectionReason: props.rejectionReason,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    record.addDomainEvent(
      new CohabitationStartedEvent({
        cohabitationId: id,
        familyId: props.familyId,
        partner1Id: props.partner1Id,
        partner2Id: props.partner2Id,
        startDate: props.startDate,
      }),
    );

    return record;
  }

  static createFromProps(props: CohabitationRecordProps): CohabitationRecord {
    return new CohabitationRecord(props);
  }

  // --- Domain Logic ---

  updateRecognition(params: {
    isAcknowledged?: boolean;
    isRegistered?: boolean;
    rejectionReason?: string;
  }): void {
    if (params.isAcknowledged !== undefined) {
      this.props.isAcknowledged = params.isAcknowledged;
    }

    if (params.isRegistered !== undefined) {
      this.props.isRegistered = params.isRegistered;
    }

    if (params.rejectionReason !== undefined) {
      this.props.rejectionReason = params.rejectionReason;
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    if (params.isAcknowledged || params.isRegistered) {
      this.addDomainEvent(
        new CohabitationRecognizedEvent({
          cohabitationId: this.id,
          isAcknowledged: params.isAcknowledged,
          isRegistered: params.isRegistered,
        }),
      );
    }
  }

  updateChildrenStatus(hasChildren: boolean, count: number): void {
    this.props.hasChildren = hasChildren;
    this.props.childrenCount = count;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  endCohabitation(endDate: Date, reason?: string): void {
    if (endDate < this.props.startDate) {
      throw new InvalidCohabitationException('End date cannot be before start date.');
    }

    if (endDate > new Date()) {
      throw new InvalidCohabitationException('End date cannot be in the future.');
    }

    this.props.endDate = endDate;

    // Update duration years
    this.props.durationYears = CohabitationRecord.calculateYearsBetween(
      this.props.startDate,
      endDate,
    );

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new CohabitationEndedEvent({
        cohabitationId: this.id,
        endDate,
        reason,
        durationYears: this.props.durationYears,
      }),
    );
  }

  markAsRegistered(): void {
    if (this.props.isRegistered) {
      return;
    }

    this.props.isRegistered = true;
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new CohabitationRecognizedEvent({
        cohabitationId: this.id,
        isAcknowledged: this.props.isAcknowledged,
        isRegistered: true,
      }),
    );
  }

  updateDuration(): void {
    const endDate = this.props.endDate || new Date();
    this.props.durationYears = CohabitationRecord.calculateYearsBetween(
      this.props.startDate,
      endDate,
    );
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  private validate(): void {
    if (this.props.partner1Id === this.props.partner2Id) {
      throw new InvalidCohabitationException('Partners cannot be the same person.');
    }

    if (this.props.startDate > new Date()) {
      throw new InvalidCohabitationException('Start date cannot be in the future.');
    }

    if (this.props.endDate && this.props.endDate < this.props.startDate) {
      throw new InvalidCohabitationException('End date cannot be before start date.');
    }

    if (this.props.childrenCount < 0) {
      throw new InvalidCohabitationException('Children count cannot be negative.');
    }

    if (this.props.durationYears < 0) {
      throw new InvalidCohabitationException('Duration years cannot be negative.');
    }

    if (this.props.hasChildren && this.props.childrenCount === 0) {
      console.warn('Warning: hasChildren is true but childrenCount is 0');
    }
  }

  private static calculateYearsBetween(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate full years between dates
    const years = end.getFullYear() - start.getFullYear();

    // Adjust if end month/day is before start month/day
    const monthDiff = end.getMonth() - start.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < start.getDate())) {
      return years - 1;
    }

    return years;
  }

  private static generateId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : `coh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get partner1Id(): string {
    return this.props.partner1Id;
  }

  get partner2Id(): string {
    return this.props.partner2Id;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
  }

  get durationYears(): number {
    return this.props.durationYears;
  }

  get isAcknowledged(): boolean {
    return this.props.isAcknowledged;
  }

  get hasChildren(): boolean {
    return this.props.hasChildren;
  }

  get childrenCount(): number {
    return this.props.childrenCount;
  }

  get isRegistered(): boolean {
    return this.props.isRegistered;
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  get isActive(): boolean {
    return !this.props.endDate;
  }

  get isRejected(): boolean {
    return !!this.props.rejectionReason;
  }

  get isQualifyingForS29(): boolean {
    // S. 29(5) criteria: Must be ≥5 years for dependancy claims
    // Additional factors: community recognition, having children, registration
    if (this.props.durationYears < 5) {
      return false;
    }

    // Strong evidence if has children and community acknowledgment
    if (this.props.hasChildren && this.props.isAcknowledged) {
      return true;
    }

    // Registered cohabitations are considered valid
    if (this.props.isRegistered) {
      return true;
    }

    // For 5+ years, even without children, if acknowledged by community
    if (this.props.isAcknowledged) {
      return true;
    }

    return false;
  }

  // For S. 29(5) "woman living as wife" claims
  get qualifiesAsWomanLivingAsWife(): boolean {
    if (this.props.rejectionReason) {
      return false;
    }

    return (
      this.props.durationYears >= 5 &&
      this.props.isAcknowledged &&
      (this.props.hasChildren || this.props.isRegistered)
    );
  }

  toJSON() {
    return {
      id: this.id,
      familyId: this.props.familyId,
      partner1Id: this.props.partner1Id,
      partner2Id: this.props.partner2Id,
      startDate: this.props.startDate,
      endDate: this.props.endDate,
      durationYears: this.props.durationYears,
      isAcknowledged: this.props.isAcknowledged,
      hasChildren: this.props.hasChildren,
      childrenCount: this.props.childrenCount,
      isRegistered: this.props.isRegistered,
      rejectionReason: this.props.rejectionReason,
      isActive: this.isActive,
      isRejected: this.isRejected,
      isQualifyingForS29: this.isQualifyingForS29,
      qualifiesAsWomanLivingAsWife: this.qualifiesAsWomanLivingAsWife,
      version: this.props.version,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
