// domain/entities/cohabitation-record.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { InvalidRelationshipException } from '../exceptions/family.exception';

/**
 * CohabitationRecord Entity Props (Immutable)
 *
 * Design: Tracks long-term cohabitation relationships
 * - Not legally married but living as partners
 * - Critical for S. 29(5) LSA "woman living as wife" claims
 *
 * Kenyan Law Context (S. 29(5) LSA):
 * - Woman living with deceased as wife ≥ 5 years
 * - Family/community must recognize relationship
 * - Children from relationship strengthen claim
 * - Can qualify as dependant for succession purposes
 *
 * Requirements for Legal Recognition:
 * 1. Duration: Minimum 5 years continuous cohabitation
 * 2. Acknowledgment: Family/community recognition
 * 3. Children: Biological children strengthen claim
 * 4. Exclusivity: Must be primary relationship
 */
export interface CohabitationRecordProps {
  // References
  familyId: UniqueEntityID;
  partner1Id: UniqueEntityID;
  partner2Id: UniqueEntityID;

  // Timeline
  startDate: Date;
  endDate?: Date;
  durationYears: number; // Calculated duration

  // S. 29(5) LSA Requirements
  isAcknowledged: boolean; // Family/community recognition
  acknowledgmentEvidence?: string[]; // Document IDs

  // Children
  hasChildren: boolean;
  childrenCount: number;
  childrenIds?: UniqueEntityID[];

  // Registration (some counties have registries)
  isRegistered: boolean;
  registrationNumber?: string;
  registrationAuthority?: string;
  registrationDate?: Date;

  // Legal Status
  qualifiesForDependantClaim: boolean; // Meets S. 29(5) criteria
  rejectionReason?: string; // Why doesn't qualify

  // Cohabitation Evidence
  sharedResidence: boolean;
  jointFinances: boolean;
  socialRecognition: boolean;
  evidenceDocuments?: string[]; // Document IDs

  // Termination
  terminationReason?: string;
  mutualConsent?: boolean;
}

/**
 * Factory Props
 */
export interface CreateCohabitationRecordProps {
  familyId: string;
  partner1Id: string;
  partner2Id: string;
  startDate: Date;
  endDate?: Date;

  // Recognition
  isAcknowledged?: boolean;
  acknowledgmentEvidence?: string[];

  // Children
  hasChildren?: boolean;
  childrenCount?: number;
  childrenIds?: string[];

  // Registration
  isRegistered?: boolean;
  registrationNumber?: string;
  registrationAuthority?: string;
  registrationDate?: Date;

  // Evidence
  sharedResidence?: boolean;
  jointFinances?: boolean;
  socialRecognition?: boolean;
  evidenceDocuments?: string[];
}

/**
 * CohabitationRecord Entity
 *
 * Tracks long-term partnerships not recognized as marriage.
 * Critical for S. 29(5) LSA dependant claims.
 *
 * S. 29(5) LSA: "woman living with the deceased immediately before his death
 * as his wife for not less than five years"
 *
 * Qualification Criteria:
 * 1. Duration ≥ 5 years (mandatory)
 * 2. Lived as wife (community recognition)
 * 3. Immediate before death (ongoing at death)
 * 4. Children strengthen claim (not mandatory)
 *
 * Examples:
 * - Come-we-stay relationships
 * - Traditional unions without formal registration
 * - Long-term partnerships in urban areas
 */
export class CohabitationRecord extends Entity<CohabitationRecordProps> {
  private constructor(id: UniqueEntityID, props: CohabitationRecordProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  // =========================================================================
  // FACTORY METHODS
  // =========================================================================

  public static create(props: CreateCohabitationRecordProps): CohabitationRecord {
    const id = new UniqueEntityID();
    const now = new Date();

    // Calculate duration
    const endDate = props.endDate || now;
    const durationYears = CohabitationRecord.calculateDuration(props.startDate, endDate);

    // Determine if qualifies for S. 29(5) claim
    const qualifiesForDependantClaim = CohabitationRecord.assessQualification(
      durationYears,
      props.isAcknowledged ?? false,
      props.hasChildren ?? false,
      !props.endDate, // Still ongoing
    );

    const recordProps: CohabitationRecordProps = {
      familyId: new UniqueEntityID(props.familyId),
      partner1Id: new UniqueEntityID(props.partner1Id),
      partner2Id: new UniqueEntityID(props.partner2Id),

      // Timeline
      startDate: props.startDate,
      endDate: props.endDate,
      durationYears,

      // Recognition
      isAcknowledged: props.isAcknowledged ?? false,
      acknowledgmentEvidence: props.acknowledgmentEvidence,

      // Children
      hasChildren: props.hasChildren ?? false,
      childrenCount: props.childrenCount ?? 0,
      childrenIds: props.childrenIds?.map((id) => new UniqueEntityID(id)),

      // Registration
      isRegistered: props.isRegistered ?? false,
      registrationNumber: props.registrationNumber,
      registrationAuthority: props.registrationAuthority,
      registrationDate: props.registrationDate,

      // Evidence
      sharedResidence: props.sharedResidence ?? true,
      jointFinances: props.jointFinances ?? false,
      socialRecognition: props.socialRecognition ?? false,
      evidenceDocuments: props.evidenceDocuments,

      // Legal Status
      qualifiesForDependantClaim,
      rejectionReason: qualifiesForDependantClaim
        ? undefined
        : CohabitationRecord.getRejectionReason(durationYears, props.isAcknowledged ?? false),
    };

    return new CohabitationRecord(id, recordProps, now);
  }

  public static fromPersistence(
    id: string,
    props: CohabitationRecordProps,
    createdAt: Date,
    updatedAt?: Date,
  ): CohabitationRecord {
    const entityId = new UniqueEntityID(id);
    const record = new CohabitationRecord(entityId, props, createdAt);

    if (updatedAt) {
      (record as any)._updatedAt = updatedAt;
    }

    return record;
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  private static calculateDuration(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
    return Math.floor(diffYears * 10) / 10; // Round to 1 decimal
  }

  private static assessQualification(
    durationYears: number,
    isAcknowledged: boolean,
    hasChildren: boolean,
    isOngoing: boolean,
  ): boolean {
    // S. 29(5) LSA: Must be ≥ 5 years
    if (durationYears < 5) return false;

    // Must be acknowledged by family/community
    if (!isAcknowledged) return false;

    // Must be ongoing at time of death (for dependant claim)
    if (!isOngoing) return false;

    return true;
  }

  private static getRejectionReason(durationYears: number, isAcknowledged: boolean): string {
    if (durationYears < 5) {
      return `Duration ${durationYears} years is less than 5 years required by S. 29(5) LSA`;
    }

    if (!isAcknowledged) {
      return 'Relationship not acknowledged by family/community as required by S. 29(5) LSA';
    }

    return 'Relationship ended before death - not ongoing as required by S. 29(5) LSA';
  }

  // =========================================================================
  // VALIDATION
  // =========================================================================

  public validate(): void {
    // Cannot cohabit with self
    if (this.props.partner1Id.equals(this.props.partner2Id)) {
      throw new InvalidRelationshipException('Partners cannot be the same person');
    }

    // Start date cannot be future
    if (this.props.startDate > new Date()) {
      throw new InvalidRelationshipException('Start date cannot be in the future');
    }

    // End date must be after start
    if (this.props.endDate && this.props.endDate < this.props.startDate) {
      throw new InvalidRelationshipException('End date cannot be before start date');
    }

    // Children count must match children IDs
    if (this.props.childrenIds && this.props.childrenIds.length !== this.props.childrenCount) {
      console.warn('Children count does not match children IDs length');
    }

    // Duration must be non-negative
    if (this.props.durationYears < 0) {
      throw new InvalidRelationshipException('Duration cannot be negative');
    }
  }

  // =========================================================================
  // BUSINESS LOGIC
  // =========================================================================

  public updateRecognition(
    isAcknowledged: boolean,
    evidenceDocuments?: string[],
  ): CohabitationRecord {
    this.ensureNotDeleted();

    // Recalculate qualification
    const qualifiesForDependantClaim = CohabitationRecord.assessQualification(
      this.props.durationYears,
      isAcknowledged,
      this.props.hasChildren,
      !this.props.endDate,
    );

    const newProps: CohabitationRecordProps = {
      ...this.props,
      isAcknowledged,
      acknowledgmentEvidence: evidenceDocuments || this.props.acknowledgmentEvidence,
      qualifiesForDependantClaim,
      rejectionReason: qualifiesForDependantClaim
        ? undefined
        : CohabitationRecord.getRejectionReason(this.props.durationYears, isAcknowledged),
    };

    return new CohabitationRecord(this._id, newProps, this._createdAt);
  }

  public addChild(childId: string): CohabitationRecord {
    this.ensureNotDeleted();

    const childrenIds = this.props.childrenIds || [];
    const childEntityId = new UniqueEntityID(childId);

    // Check if already added
    if (childrenIds.some((id) => id.equals(childEntityId))) {
      return this;
    }

    const newProps: CohabitationRecordProps = {
      ...this.props,
      hasChildren: true,
      childrenCount: this.props.childrenCount + 1,
      childrenIds: [...childrenIds, childEntityId],
    };

    return new CohabitationRecord(this._id, newProps, this._createdAt);
  }

  public register(
    registrationNumber: string,
    authority: string,
    registrationDate?: Date,
  ): CohabitationRecord {
    this.ensureNotDeleted();

    if (this.props.isRegistered) {
      throw new InvalidRelationshipException('Cohabitation already registered');
    }

    const newProps: CohabitationRecordProps = {
      ...this.props,
      isRegistered: true,
      registrationNumber,
      registrationAuthority: authority,
      registrationDate: registrationDate || new Date(),
    };

    return new CohabitationRecord(this._id, newProps, this._createdAt);
  }

  public terminate(endDate: Date, reason: string, mutualConsent: boolean): CohabitationRecord {
    this.ensureNotDeleted();

    if (this.props.endDate) {
      throw new InvalidRelationshipException('Cohabitation already terminated');
    }

    if (endDate < this.props.startDate) {
      throw new InvalidRelationshipException('End date cannot be before start date');
    }

    // Recalculate duration
    const durationYears = CohabitationRecord.calculateDuration(this.props.startDate, endDate);

    // Recalculate qualification (will fail since not ongoing)
    const qualifiesForDependantClaim = false;

    const newProps: CohabitationRecordProps = {
      ...this.props,
      endDate,
      durationYears,
      terminationReason: reason,
      mutualConsent,
      qualifiesForDependantClaim,
      rejectionReason: 'Relationship ended before death - not ongoing as required by S. 29(5) LSA',
    };

    return new CohabitationRecord(this._id, newProps, this._createdAt);
  }

  public addEvidence(documentIds: string[]): CohabitationRecord {
    this.ensureNotDeleted();

    const existingDocs = this.props.evidenceDocuments || [];
    const newDocs = [...existingDocs, ...documentIds];

    const newProps: CohabitationRecordProps = {
      ...this.props,
      evidenceDocuments: newDocs,
    };

    return new CohabitationRecord(this._id, newProps, this._createdAt);
  }

  public updateEvidenceFlags(flags: {
    sharedResidence?: boolean;
    jointFinances?: boolean;
    socialRecognition?: boolean;
  }): CohabitationRecord {
    this.ensureNotDeleted();

    const newProps: CohabitationRecordProps = {
      ...this.props,
      sharedResidence: flags.sharedResidence ?? this.props.sharedResidence,
      jointFinances: flags.jointFinances ?? this.props.jointFinances,
      socialRecognition: flags.socialRecognition ?? this.props.socialRecognition,
    };

    return new CohabitationRecord(this._id, newProps, this._createdAt);
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get familyId(): UniqueEntityID {
    return this.props.familyId;
  }

  get partner1Id(): UniqueEntityID {
    return this.props.partner1Id;
  }

  get partner2Id(): UniqueEntityID {
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

  get qualifiesForDependantClaim(): boolean {
    return this.props.qualifiesForDependantClaim;
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  get isOngoing(): boolean {
    return !this.props.endDate;
  }

  get meetsMinimumDuration(): boolean {
    return this.props.durationYears >= 5;
  }

  get hasStrongEvidence(): boolean {
    return (
      this.props.sharedResidence &&
      this.props.hasChildren &&
      this.props.isAcknowledged &&
      (this.props.evidenceDocuments?.length ?? 0) >= 3
    );
  }

  get evidenceStrength(): 'STRONG' | 'MODERATE' | 'WEAK' {
    const score =
      (this.props.sharedResidence ? 2 : 0) +
      (this.props.jointFinances ? 1 : 0) +
      (this.props.socialRecognition ? 1 : 0) +
      (this.props.hasChildren ? 2 : 0) +
      (this.props.isAcknowledged ? 2 : 0) +
      ((this.props.evidenceDocuments?.length ?? 0) > 0 ? 1 : 0);

    if (score >= 7) return 'STRONG';
    if (score >= 4) return 'MODERATE';
    return 'WEAK';
  }

  public getPartner(fromPartnerId: string | UniqueEntityID): UniqueEntityID {
    const id =
      typeof fromPartnerId === 'string' ? new UniqueEntityID(fromPartnerId) : fromPartnerId;

    if (this.props.partner1Id.equals(id)) {
      return this.props.partner2Id;
    }

    if (this.props.partner2Id.equals(id)) {
      return this.props.partner1Id;
    }

    throw new InvalidRelationshipException('Provided ID is not a partner in this cohabitation');
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toPlainObject(): Record<string, any> {
    return {
      id: this._id.toString(),
      familyId: this.props.familyId.toString(),
      partner1Id: this.props.partner1Id.toString(),
      partner2Id: this.props.partner2Id.toString(),
      startDate: this.props.startDate,
      endDate: this.props.endDate,
      durationYears: this.props.durationYears,
      isAcknowledged: this.props.isAcknowledged,
      acknowledgmentEvidence: this.props.acknowledgmentEvidence,
      hasChildren: this.props.hasChildren,
      childrenCount: this.props.childrenCount,
      childrenIds: this.props.childrenIds?.map((id) => id.toString()),
      isRegistered: this.props.isRegistered,
      registrationNumber: this.props.registrationNumber,
      registrationAuthority: this.props.registrationAuthority,
      registrationDate: this.props.registrationDate,
      qualifiesForDependantClaim: this.props.qualifiesForDependantClaim,
      rejectionReason: this.props.rejectionReason,
      sharedResidence: this.props.sharedResidence,
      jointFinances: this.props.jointFinances,
      socialRecognition: this.props.socialRecognition,
      evidenceDocuments: this.props.evidenceDocuments,
      terminationReason: this.props.terminationReason,
      mutualConsent: this.props.mutualConsent,
      isOngoing: this.isOngoing,
      meetsMinimumDuration: this.meetsMinimumDuration,
      hasStrongEvidence: this.hasStrongEvidence,
      evidenceStrength: this.evidenceStrength,
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
