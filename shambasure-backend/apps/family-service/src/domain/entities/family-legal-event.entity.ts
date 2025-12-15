import { Entity } from '../base/entity';

export enum LegalEventType {
  MARRIAGE_REGISTERED = 'MARRIAGE_REGISTERED',
  MARRIAGE_DISSOLVED = 'MARRIAGE_DISSOLVED',
  POLYGAMOUS_HOUSE_CREATED = 'POLYGAMOUS_HOUSE_CREATED',
  HOUSE_HEAD_CHANGED = 'HOUSE_HEAD_CHANGED',
  DEPENDANT_ADDED = 'DEPENDANT_ADDED',
  DEPENDANT_PROVISION_ORDERED = 'DEPENDANT_PROVISION_ORDERED',
  GUARDIAN_APPOINTED = 'GUARDIAN_APPOINTED',
  GUARDIANSHIP_TERMINATED = 'GUARDIANSHIP_TERMINATED',
  ADOPTION_FINALIZED = 'ADOPTION_FINALIZED',
  COHABITATION_RECOGNIZED = 'COHABITATION_RECOGNIZED',
  MEMBER_DECEASED = 'MEMBER_DECEASED',
  NEXT_OF_KIN_DESIGNATED = 'NEXT_OF_KIN_DESIGNATED',
}

export interface FamilyLegalEventProps {
  id: string;
  familyId: string;

  eventType: LegalEventType;
  description: string;

  // Snapshot of data at the time of the event (Immutable Proof)
  metadata: Record<string, any>;

  // Cross-Service References
  relatedUserId?: string; // e.g., The person who married/died
  relatedEstateId?: string; // If event triggered by estate planning
  relatedCaseId?: string; // If event came from a court case

  // Legal Timing
  occurredAt: Date; // When the event legally happened (e.g., Wedding Date)
  recordedAt: Date; // When it was entered into the system
  recordedBy?: string; // User ID of clerk/admin

  version: number;
}

export interface CreateLegalEventProps {
  familyId: string;
  eventType: LegalEventType;
  description: string;
  metadata: Record<string, any>;
  occurredAt: Date;

  // Optional relations
  relatedUserId?: string;
  relatedEstateId?: string;
  relatedCaseId?: string;
  recordedBy?: string;
}

export class FamilyLegalEvent extends Entity<FamilyLegalEventProps> {
  private constructor(props: FamilyLegalEventProps) {
    super(props.id, props);
    // No validation needed for immutable history logs
  }

  static create(props: CreateLegalEventProps): FamilyLegalEvent {
    const id = this.generateId();
    const now = new Date();

    return new FamilyLegalEvent({
      id,
      familyId: props.familyId,
      eventType: props.eventType,
      description: props.description,
      metadata: props.metadata,
      occurredAt: props.occurredAt,
      recordedAt: now,
      relatedUserId: props.relatedUserId,
      relatedEstateId: props.relatedEstateId,
      relatedCaseId: props.relatedCaseId,
      recordedBy: props.recordedBy,
      version: 1,
    });
  }

  static createFromProps(props: FamilyLegalEventProps): FamilyLegalEvent {
    return new FamilyLegalEvent(props);
  }

  // --- Domain Logic ---

  // Legal events are immutable by definition.
  // There are no update methods here.
  // If an event was recorded in error, a "Compensating Event" (e.g., MARRIAGE_REGISTRATION_VOIDED)
  // should be created instead of editing the log.

  private static generateId(): string {
    return `lev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }
  get eventType(): LegalEventType {
    return this.props.eventType;
  }
  get metadata(): Record<string, any> {
    return this.props.metadata;
  }
  get occurredAt(): Date {
    return this.props.occurredAt;
  }
  get relatedUserId(): string | undefined {
    return this.props.relatedUserId;
  }
  get relatedEstateId(): string | undefined {
    return this.props.relatedEstateId;
  }
  get relatedCaseId(): string | undefined {
    return this.props.relatedCaseId;
  }

  toJSON() {
    return {
      id: this.id,
      familyId: this.props.familyId,
      eventType: this.props.eventType,
      description: this.props.description,
      metadata: this.props.metadata,
      relatedUserId: this.props.relatedUserId,
      relatedEstateId: this.props.relatedEstateId,
      relatedCaseId: this.props.relatedCaseId,
      occurredAt: this.props.occurredAt,
      recordedAt: this.props.recordedAt,
      recordedBy: this.props.recordedBy,
      version: this.props.version,
    };
  }
}
