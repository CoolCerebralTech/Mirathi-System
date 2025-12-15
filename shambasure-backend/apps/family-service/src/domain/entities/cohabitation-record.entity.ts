// domain/entities/cohabitation-record.entity.ts
import { Entity } from '../base/entity';
import { CohabitationEndedEvent } from '../events/relationship-events/cohabitation-ended.event';
import { CohabitationRecognizedEvent } from '../events/relationship-events/cohabitation-recognized.event';
import { CohabitationStartedEvent } from '../events/relationship-events/cohabitation-started.event';
import { InvalidCohabitationException } from '../exceptions/relationship.exception';
import { CohabitationDuration } from '../value-objects/temporal/cohabitation-duration.vo';

export interface CohabitationRecordProps {
  id: string;
  familyId: string;
  partner1Id: string; // The Deceased (usually)
  partner2Id: string; // The Claimant

  // Timing & Duration (Critical for S.29(5))
  startDate: Date;
  endDate?: Date;
  duration: CohabitationDuration;

  // Recognition Factors
  isAcknowledgedByCommunity: boolean;
  isRegisteredWithChief: boolean; // "Chief's Letter" is standard proof in Kenya
  chiefsLetterReference?: string;

  // Family Unit
  hasChildren: boolean;
  childrenCount: number;

  // Rejection/Validation
  isRejected: boolean;
  rejectionReason?: string;

  // State
  isActive: boolean;

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
}

export class CohabitationRecord extends Entity<CohabitationRecordProps> {
  private constructor(props: CohabitationRecordProps) {
    super(props);
    this.validate();
  }

  static create(props: CreateCohabitationProps): CohabitationRecord {
    const id = this.generateId();
    const now = new Date();

    const duration = CohabitationDuration.create({
      startDate: props.startDate,
      endDate: undefined, // Ongoing
    });

    const record = new CohabitationRecord({
      id,
      familyId: props.familyId,
      partner1Id: props.partner1Id,
      partner2Id: props.partner2Id,
      startDate: props.startDate,
      duration,
      isAcknowledgedByCommunity: false, // Must be proven
      isRegisteredWithChief: false,
      hasChildren: props.hasChildren ?? false,
      childrenCount: props.childrenCount ?? 0,
      isRejected: false,
      isActive: true,
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
        timestamp: now,
      }),
    );

    return record;
  }

  static createFromProps(props: CohabitationRecordProps): CohabitationRecord {
    return new CohabitationRecord(props);
  }

  // --- Domain Logic ---

  /**
   * Officially recognizes the cohabitation (e.g., via Chief's Letter or Affidavit).
   * This is the step that typically transforms "roommates" into "Dependants".
   */
  registerRecognition(chiefsLetterRef: string): void {
    if (this.props.isRejected) {
      throw new InvalidCohabitationException('Cannot recognize a rejected cohabitation record.');
    }

    this.props.isRegisteredWithChief = true;
    this.props.chiefsLetterReference = chiefsLetterRef;
    this.props.isAcknowledgedByCommunity = true;
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new CohabitationRecognizedEvent({
        cohabitationId: this.id,
        method: 'CHIEFS_LETTER',
        reference: chiefsLetterRef,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Updates the children count.
   * The presence of children is the strongest indicator of a "system of law permitting polygamy"
   * or permanent union in Kenyan case law.
   */
  updateChildrenStatus(hasChildren: boolean, count: number): void {
    this.props.hasChildren = hasChildren;
    this.props.childrenCount = count;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  /**
   * Ends the cohabitation (Separation or Death).
   */
  endCohabitation(endDate: Date, reason: string): void {
    if (!this.props.isActive) return;

    if (endDate < this.props.startDate) {
      throw new InvalidCohabitationException('End date cannot be before start date.');
    }

    this.props.endDate = endDate;
    this.props.isActive = false;

    // Finalize duration calculation
    this.props.duration = this.props.duration.finalize(endDate);

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new CohabitationEndedEvent({
        cohabitationId: this.id,
        endDate,
        reason,
        totalDurationMonths: this.props.duration.months,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Marks the record as rejected (e.g., Court determines it was just a casual relationship).
   */
  reject(reason: string): void {
    this.props.isRejected = true;
    this.props.rejectionReason = reason;
    this.props.isActive = false;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  private validate(): void {
    if (this.props.partner1Id === this.props.partner2Id) {
      throw new InvalidCohabitationException('Partners cannot be the same person.');
    }
  }

  private static generateId(): string {
    return `coh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }
  get durationYears(): number {
    return this.props.duration.years;
  }
  get isQualifyingForS29(): boolean {
    // Heuristic: > 2 years + children OR > 5 years + Chief's letter
    // This is a domain helper, actual legal determination is in Policies.
    return (
      (this.durationYears >= 2 && this.props.hasChildren) ||
      (this.durationYears >= 3 && this.props.isAcknowledgedByCommunity)
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
      duration: this.props.duration.toJSON(),
      isAcknowledgedByCommunity: this.props.isAcknowledgedByCommunity,
      isRegisteredWithChief: this.props.isRegisteredWithChief,
      chiefsLetterReference: this.props.chiefsLetterReference,
      hasChildren: this.props.hasChildren,
      childrenCount: this.props.childrenCount,
      isRejected: this.props.isRejected,
      rejectionReason: this.props.rejectionReason,
      isActive: this.props.isActive,
      isQualifyingForS29: this.isQualifyingForS29,
      version: this.props.version,
      createdAt: this.props.createdAt,
    };
  }
}
