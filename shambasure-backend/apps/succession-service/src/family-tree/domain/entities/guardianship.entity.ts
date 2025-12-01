import { GuardianType, Prisma } from '@prisma/client';

/**
 * Kenyan Court Order Value Object
 *
 * Immutable representation of a court order appointing a guardian.
 * Reference: Children Act (2022), High Court Rules.
 */
export class KenyanCourtOrder {
  constructor(
    public readonly courtOrderNumber: string,
    public readonly courtName: string,
    public readonly caseNumber: string,
    public readonly issuingJudge: string,
    public readonly courtStation: string,
  ) {
    if (!courtOrderNumber?.trim()) throw new Error('Court order number is required');
    if (!courtName?.trim()) throw new Error('Court name is required');
    if (!courtStation?.trim()) throw new Error('Court station is required');
  }

  equals(other: KenyanCourtOrder): boolean {
    return this.courtOrderNumber === other.courtOrderNumber;
  }
}

/**
 * Guardianship Conditions Value Object
 *
 * Immutable representation of conditions, powers, and reporting requirements
 * attached to a guardianship by court order or will.
 */
export class GuardianshipConditions {
  constructor(
    public readonly conditions: readonly string[],
    public readonly reportingRequirements: readonly string[],
    public readonly restrictedPowers: readonly string[],
    public readonly specialInstructions: readonly string[],
  ) {}

  hasConditions(): boolean {
    return this.conditions.length > 0;
  }

  hasReportingRequirements(): boolean {
    return this.reportingRequirements.length > 0;
  }

  hasRestrictedPowers(): boolean {
    return this.restrictedPowers.length > 0;
  }

  hasSpecialInstructions(): boolean {
    return this.specialInstructions.length > 0;
  }
}

/**
 * Guardian Reconstitution Props
 */
export interface GuardianReconstituteProps {
  id: string;
  familyId: string;

  // Core relationships
  guardianId: string; // FamilyMember ID acting as guardian
  wardId: string; // FamilyMember ID being guarded

  // Guardian configuration
  type: GuardianType;
  appointedBy: string | null; // Reference to Will ID or Court Order
  appointmentDate: Date | string;
  validUntil: Date | string | null;

  // Kenyan Court Order Fields
  courtOrderNumber: string | null;
  courtName: string | null;
  caseNumber: string | null;
  issuingJudge: string | null;
  courtStation: string | null;

  // Guardianship Conditions (JSON arrays)
  conditions: Prisma.JsonValue;
  reportingRequirements: Prisma.JsonValue;
  restrictedPowers: Prisma.JsonValue;
  specialInstructions: Prisma.JsonValue;

  // Status & Review
  isTemporary: boolean;
  reviewDate: Date | string | null;

  // Status
  isActive: boolean;
  notes: string | null;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Guardian Entity (NOT an Aggregate Root)
 *
 * Represents a guardianship relationship between two family members.
 * This is a child entity of the Family aggregate.
 *
 * Legal Context:
 * - Children Act (2022): Guardian appointment and duties
 * - Law of Succession Act, Section 57-61: Guardianship of minors' property
 * - Kenyan High Court Rules: Court-appointed guardianship procedures
 *
 * Entity Responsibilities:
 * - Track guardian-ward relationship
 * - Store court order details (if court-appointed)
 * - Manage guardianship conditions and restrictions
 * - Validate legal compliance
 * - Track review dates and expiry
 *
 * Does NOT:
 * - Emit domain events (Family aggregate does this)
 * - Validate guardian/ward eligibility (FamilyMember validates)
 * - Create itself (Family aggregate creates via factory)
 *
 * Guardian Types (from Children Act):
 * - LEGAL_GUARDIAN: Full custody by court order
 * - FINANCIAL_GUARDIAN: Manages minor's inheritance only
 * - PROPERTY_GUARDIAN: Manages property until age of majority
 * - TESTAMENTARY: Appointed via will
 */
export class Guardian {
  // Core Identity
  private readonly _id: string;
  private readonly _familyId: string;

  // Guardian-Ward Relationship
  private readonly _guardianId: string; // FamilyMember acting as guardian
  private readonly _wardId: string; // FamilyMember being guarded (minor/dependent)

  // Guardian Configuration
  private readonly _type: GuardianType;
  private _appointedBy: string | null; // Will ID, Court Order number, or User ID
  private readonly _appointmentDate: Date;
  private _validUntil: Date | null;

  // Kenyan Court Order Details (for court-appointed guardians)
  private _courtOrder: KenyanCourtOrder | null;

  // Guardianship Conditions (immutable value object)
  private _guardianshipConditions: GuardianshipConditions;

  // Review & Status
  private _isTemporary: boolean;
  private _reviewDate: Date | null;
  private _isActive: boolean;
  private _notes: string | null;

  // Timestamps
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(
    id: string,
    familyId: string,
    guardianId: string,
    wardId: string,
    type: GuardianType,
    appointmentDate: Date,
  ) {
    if (!id?.trim()) throw new Error('Guardian ID is required');
    if (!familyId?.trim()) throw new Error('Family ID is required');
    if (!guardianId?.trim()) throw new Error('Guardian member ID is required');
    if (!wardId?.trim()) throw new Error('Ward member ID is required');

    if (guardianId === wardId) {
      throw new Error('A person cannot be their own guardian');
    }

    this._id = id;
    this._familyId = familyId;
    this._guardianId = guardianId;
    this._wardId = wardId;
    this._type = type;
    this._appointmentDate = appointmentDate;

    // Defaults
    this._appointedBy = null;
    this._validUntil = null;
    this._courtOrder = null;
    this._guardianshipConditions = new GuardianshipConditions([], [], [], []);
    this._isTemporary = false;
    this._reviewDate = null;
    this._isActive = true;
    this._notes = null;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  /**
   * Creates a court-appointed guardian.
   * Reference: Children Act (2022) - Court appointment procedures.
   */
  static createCourtAppointed(
    id: string,
    familyId: string,
    guardianId: string,
    wardId: string,
    type: GuardianType,
    courtOrder: KenyanCourtOrder,
    appointmentDate: Date,
    validUntil?: Date,
    isTemporary: boolean = false,
  ): Guardian {
    const guardian = new Guardian(id, familyId, guardianId, wardId, type, appointmentDate);

    guardian._courtOrder = courtOrder;
    guardian._appointedBy = courtOrder.courtOrderNumber; // Reference to court order
    guardian._validUntil = validUntil || null;
    guardian._isTemporary = isTemporary;

    return guardian;
  }

  /**
   * Creates a testamentary guardian (appointed via will).
   * Reference: Law of Succession Act, Section 58.
   */
  static createTestamentary(
    id: string,
    familyId: string,
    guardianId: string,
    wardId: string,
    willId: string,
    appointmentDate: Date,
    validUntil?: Date,
  ): Guardian {
    const guardian = new Guardian(
      id,
      familyId,
      guardianId,
      wardId,
      GuardianType.TESTAMENTARY,
      appointmentDate,
    );

    guardian._appointedBy = willId; // Reference to will
    guardian._validUntil = validUntil || null;

    return guardian;
  }

  /**
   * Creates a family-appointed guardian (informal/customary).
   * Reference: Customary law practices.
   */
  static createFamilyAppointed(
    id: string,
    familyId: string,
    guardianId: string,
    wardId: string,
    type: GuardianType,
    appointedByUserId: string,
    appointmentDate: Date,
    validUntil?: Date,
  ): Guardian {
    const guardian = new Guardian(id, familyId, guardianId, wardId, type, appointmentDate);

    guardian._appointedBy = appointedByUserId; // User who designated guardian
    guardian._validUntil = validUntil || null;

    return guardian;
  }

  static reconstitute(props: GuardianReconstituteProps): Guardian {
    const guardian = new Guardian(
      props.id,
      props.familyId,
      props.guardianId,
      props.wardId,
      props.type,
      new Date(props.appointmentDate),
    );

    guardian._appointedBy = props.appointedBy;
    guardian._validUntil = props.validUntil ? new Date(props.validUntil) : null;

    // Reconstitute court order if present
    if (
      props.courtOrderNumber &&
      props.courtName &&
      props.caseNumber &&
      props.issuingJudge &&
      props.courtStation
    ) {
      guardian._courtOrder = new KenyanCourtOrder(
        props.courtOrderNumber,
        props.courtName,
        props.caseNumber,
        props.issuingJudge,
        props.courtStation,
      );
    }

    // Reconstitute conditions (safe JSON parsing)
    const conditions = Array.isArray(props.conditions) ? (props.conditions as string[]) : [];
    const reportingReqs = Array.isArray(props.reportingRequirements)
      ? (props.reportingRequirements as string[])
      : [];
    const restrictedPowers = Array.isArray(props.restrictedPowers)
      ? (props.restrictedPowers as string[])
      : [];
    const specialInstructions = Array.isArray(props.specialInstructions)
      ? (props.specialInstructions as string[])
      : [];

    guardian._guardianshipConditions = new GuardianshipConditions(
      conditions,
      reportingReqs,
      restrictedPowers,
      specialInstructions,
    );

    guardian._isTemporary = props.isTemporary;
    guardian._reviewDate = props.reviewDate ? new Date(props.reviewDate) : null;
    guardian._isActive = props.isActive;
    guardian._notes = props.notes;

    // Override constructor dates
    (guardian as any)._createdAt = new Date(props.createdAt);
    guardian._updatedAt = new Date(props.updatedAt);

    return guardian;
  }

  // --------------------------------------------------------------------------
  // DOMAIN OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Revokes the guardianship.
   * Legal guardians can only be revoked by court order.
   */
  revoke(reason: string, courtOrderNumber?: string): void {
    if (!this._isActive) {
      throw new Error('Guardianship already inactive');
    }

    // Children Act: Legal guardians must be removed by court
    if (this._type === GuardianType.LEGAL_GUARDIAN && !courtOrderNumber) {
      throw new Error('Legal guardian revocation requires court order (Children Act, 2022)');
    }

    this._isActive = false;

    // Store revocation details in notes
    const revocationNote = `Revoked: ${reason}${courtOrderNumber ? ` (Court Order: ${courtOrderNumber})` : ''} on ${new Date().toISOString()}`;
    this._notes = this._notes ? `${this._notes}\n${revocationNote}` : revocationNote;

    this.markAsUpdated();
  }

  /**
   * Restores a revoked guardianship.
   * Legal guardians require court order for restoration.
   *
   * Reference: Children Act (2022) - Court can reinstate guardians
   */
  restore(reason: string, courtOrderNumber?: string): void {
    if (this._isActive) {
      throw new Error('Guardianship is already active');
    }

    // Legal guardians require court order for restoration
    if (this._type === GuardianType.LEGAL_GUARDIAN && !courtOrderNumber) {
      throw new Error('Legal guardian restoration requires court order (Children Act, 2022)');
    }

    // Cannot restore if expired
    if (this._validUntil && new Date() > this._validUntil) {
      throw new Error('Cannot restore expired guardianship. Extend validity first.');
    }

    this._isActive = true;

    // Store restoration details in notes
    const restorationNote = `Restored: ${reason}${courtOrderNumber ? ` (Court Order: ${courtOrderNumber})` : ''} on ${new Date().toISOString()}`;
    this._notes = this._notes ? `${this._notes}\n${restorationNote}` : restorationNote;

    this.markAsUpdated();
  }

  /**
   * Extends the guardianship validity period.
   * Requires court order for legal guardians.
   */
  extendValidity(newExpiryDate: Date, reason: string, courtOrderNumber?: string): void {
    if (!this._isActive) {
      throw new Error('Cannot extend inactive guardianship. Restore it first.');
    }

    const currentExpiry = this._validUntil || new Date();
    if (newExpiryDate <= currentExpiry) {
      throw new Error('New expiry must be after current expiry');
    }

    if (this._type === GuardianType.LEGAL_GUARDIAN && !courtOrderNumber) {
      throw new Error('Legal guardian extension requires court order');
    }

    this._validUntil = newExpiryDate;

    // Store extension details in notes
    const extensionNote = `Extended until ${newExpiryDate.toISOString()}: ${reason}${courtOrderNumber ? ` (Court Order: ${courtOrderNumber})` : ''} on ${new Date().toISOString()}`;
    this._notes = this._notes ? `${this._notes}\n${extensionNote}` : extensionNote;

    this.markAsUpdated();
  }

  /**
   * Updates court order details (for amended court orders).
   * Reference: High Court Rules - Court orders can be amended.
   */
  updateCourtOrder(courtOrder: KenyanCourtOrder, reason: string): void {
    if (this._type !== GuardianType.LEGAL_GUARDIAN) {
      throw new Error('Only legal guardians have court orders');
    }

    if (!this._isActive) {
      throw new Error('Cannot update court order for inactive guardianship');
    }

    const previousOrderNumber = this._courtOrder?.courtOrderNumber || 'None';
    this._courtOrder = courtOrder;
    this._appointedBy = courtOrder.courtOrderNumber;

    // Store court order update in notes
    const updateNote = `Court order updated from ${previousOrderNumber} to ${courtOrder.courtOrderNumber}: ${reason} on ${new Date().toISOString()}`;
    this._notes = this._notes ? `${this._notes}\n${updateNote}` : updateNote;

    this.markAsUpdated();
  }

  /**
   * Checks and auto-expires guardianship if past validity date.
   * Should be called periodically via scheduled jobs.
   *
   * Returns true if guardianship was expired, false otherwise.
   */
  checkAndAutoExpire(): boolean {
    if (!this._isActive) return false;
    if (!this._validUntil) return false;

    if (new Date() > this._validUntil) {
      this._isActive = false;

      // Store auto-expiry note
      const expiryNote = `Auto-expired on ${new Date().toISOString()} (validity ended ${this._validUntil.toISOString()})`;
      this._notes = this._notes ? `${this._notes}\n${expiryNote}` : expiryNote;

      this.markAsUpdated();
      return true;
    }

    return false;
  }

  /**
   * Sets guardianship conditions.
   * Validates conditions don't violate inheritance rights.
   */
  setConditions(
    conditions: string[],
    reportingRequirements: string[],
    restrictedPowers: string[],
    specialInstructions: string[],
  ): void {
    // Validate conditions don't restrict inheritance rights
    this.validateConditions(conditions);

    this._guardianshipConditions = new GuardianshipConditions(
      conditions,
      reportingRequirements,
      restrictedPowers,
      specialInstructions,
    );

    this.markAsUpdated();
  }

  /**
   * Adds a single condition to existing conditions.
   */
  addCondition(condition: string): void {
    if (!condition?.trim()) throw new Error('Condition cannot be empty');

    this.validateConditions([condition]);

    const currentConditions = this._guardianshipConditions.conditions;
    const newConditions = [...currentConditions, condition.trim()];

    this._guardianshipConditions = new GuardianshipConditions(
      newConditions,
      this._guardianshipConditions.reportingRequirements,
      this._guardianshipConditions.restrictedPowers,
      this._guardianshipConditions.specialInstructions,
    );

    this.markAsUpdated();
  }

  /**
   * Schedules a review date for temporary guardianships.
   */
  scheduleReview(reviewDate: Date): void {
    if (!this._isTemporary) {
      throw new Error('Review dates only apply to temporary guardianships');
    }

    if (reviewDate <= new Date()) {
      throw new Error('Review date must be in the future');
    }

    this._reviewDate = reviewDate;
    this.markAsUpdated();
  }

  /**
   * Updates guardian notes.
   */
  updateNotes(notes: string): void {
    this._notes = notes?.trim() || null;
    this.markAsUpdated();
  }

  // --------------------------------------------------------------------------
  // VALIDATION & BUSINESS RULES
  // --------------------------------------------------------------------------

  /**
   * Validates guardianship legal compliance.
   * Reference: Children Act (2022), Law of Succession Act.
   */
  validateLegalCompliance(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this._isActive) {
      issues.push('Guardianship is not active');
    }

    // Check expiry
    if (this._validUntil && new Date() > this._validUntil) {
      issues.push('Guardianship has expired');
    }

    // Legal guardian requires court order
    if (this._type === GuardianType.LEGAL_GUARDIAN && !this._courtOrder) {
      issues.push('Legal guardianship requires court order (Children Act)');
    }

    // Testamentary guardian requires will reference
    if (this._type === GuardianType.TESTAMENTARY && !this._appointedBy) {
      issues.push('Testamentary guardianship requires will reference (Section 58)');
    }

    // Temporary guardianship requires review date
    if (this._isTemporary && !this._reviewDate) {
      issues.push('Temporary guardianship requires review date');
    }

    // Review overdue warning
    if (this._reviewDate && new Date() > this._reviewDate) {
      issues.push('Guardianship review is overdue');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Checks if guardianship is currently valid and active.
   */
  isCurrentlyValid(): boolean {
    if (!this._isActive) return false;
    if (this._validUntil && new Date() > this._validUntil) return false;

    return true;
  }

  /**
   * Checks if review is overdue.
   */
  isReviewOverdue(): boolean {
    if (!this._isTemporary || !this._reviewDate) return false;
    return new Date() > this._reviewDate;
  }

  /**
   * Checks if guardianship is approaching expiry (within specified days).
   * Useful for sending expiry notifications.
   */
  isApproachingExpiry(daysThreshold: number = 30): boolean {
    if (!this._validUntil || !this._isActive) return false;

    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

    return this._validUntil <= thresholdDate && this._validUntil > now;
  }

  /**
   * Calculates days until expiry.
   * Returns null if no expiry date or already expired.
   */
  getDaysUntilExpiry(): number | null {
    if (!this._validUntil || !this._isActive) return null;

    const now = new Date();
    if (this._validUntil <= now) return 0;

    const diffMs = this._validUntil.getTime() - now.getTime();
    const days = diffMs / (1000 * 60 * 60 * 24);

    return Math.ceil(days);
  }

  /**
   * Calculates remaining duration in months.
   */
  getRemainingMonths(): number | null {
    if (!this._validUntil || !this._isActive) return null;

    const now = new Date();
    if (this._validUntil <= now) return 0;

    const diffMs = this._validUntil.getTime() - now.getTime();
    const months = diffMs / (1000 * 60 * 60 * 24 * 30);

    return Math.ceil(months);
  }

  /**
   * Validates conditions don't violate Kenyan inheritance law.
   */
  private validateConditions(conditions: string[]): void {
    // Kenyan Law: Guardianship conditions cannot restrict inheritance rights
    const prohibitedTerms = [
      'disinherit',
      'prevent inheritance',
      'deny inheritance',
      'forfeit inheritance',
      'waive inheritance',
    ];

    for (const condition of conditions) {
      const lowerCondition = condition.toLowerCase();
      for (const term of prohibitedTerms) {
        if (lowerCondition.includes(term)) {
          throw new Error(
            `Guardianship condition cannot restrict inheritance rights: "${condition}" (Law of Succession Act)`,
          );
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }

  get familyId(): string {
    return this._familyId;
  }

  get guardianId(): string {
    return this._guardianId;
  }

  get wardId(): string {
    return this._wardId;
  }

  get type(): GuardianType {
    return this._type;
  }

  get appointedBy(): string | null {
    return this._appointedBy;
  }

  get appointmentDate(): Date {
    return new Date(this._appointmentDate);
  }

  get validUntil(): Date | null {
    return this._validUntil ? new Date(this._validUntil) : null;
  }

  get courtOrder(): KenyanCourtOrder | null {
    return this._courtOrder;
  }

  get guardianshipConditions(): GuardianshipConditions {
    return this._guardianshipConditions;
  }

  get isTemporary(): boolean {
    return this._isTemporary;
  }

  get reviewDate(): Date | null {
    return this._reviewDate ? new Date(this._reviewDate) : null;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get notes(): string | null {
    return this._notes;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
}
