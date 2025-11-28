import { AggregateRoot } from '@nestjs/cqrs';
import { WillStatus } from '@prisma/client';

import { KENYAN_LEGAL_REQUIREMENTS } from '../../../common/constants/kenyan-law.constants';
import { WILL_STATUS } from '../../../common/constants/will-status.constants';
import { WillActivatedEvent } from '../events/will-activated.event';
import { WillContestedEvent } from '../events/will-contested.event';
import { WillCreatedEvent } from '../events/will-created.event';
import { WillRevokedEvent } from '../events/will-revoked.event';
import { WillSupersededEvent } from '../events/will-superseded.event';
import { WillWitnessedEvent } from '../events/will-witnessed.event';
import { LegalCapacity } from '../value-objects/legal-capacity.vo';

/**
 * Funeral and burial wishes for the testator
 * @interface FuneralWishes
 */
export interface FuneralWishes {
  burialLocation?: string;
  funeralType?: string;
  specificInstructions?: string;
  preferredOfficiant?: string;
}

/**
 * Digital asset management instructions
 * @interface DigitalAssetInstructions
 */
export interface DigitalAssetInstructions {
  socialMediaHandling?: string;
  emailAccountHandling?: string;
  cryptocurrencyInstructions?: string;
  onlineAccountClosure?: string;
}

/**
 * Data structure for legal capacity assessment
 * @interface LegalCapacityData
 */
export interface LegalCapacityData {
  assessment: {
    isOfAge: boolean;
    isSoundMind: boolean;
    understandsWillNature: boolean;
    understandsAssetExtent: boolean;
    understandsBeneficiaryClaims: boolean;
    freeFromUndueInfluence: boolean;
    assessmentDate: Date | string;
    assessedBy?: string;
  };
  notes?: string;
}

/**
 * Properties required for entity reconstitution from persistence
 * @interface WillReconstituteProps
 */
export interface WillReconstituteProps {
  id: string;
  title: string;
  testatorId: string;
  status: WillStatus;
  willDate: Date | string;
  lastModified: Date | string;
  versionNumber: number;
  supersedes: string | null;
  activatedAt: Date | string | null;
  activatedBy: string | null;
  executedAt: Date | string | null;
  executedBy: string | null;
  revokedAt: Date | string | null;
  revokedBy: string | null;
  revocationReason: string | null;
  funeralWishes: FuneralWishes | string | null;
  burialLocation: string | null;
  residuaryClause: string | null;
  digitalAssetInstructions: DigitalAssetInstructions | null;
  specialInstructions: string | null;
  requiresWitnesses: boolean;
  witnessCount: number;
  hasAllWitnesses: boolean;
  isActiveRecord: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  _assetIds: string[];
  _beneficiaryIds: string[];
  _witnessIds: string[];
  legalCapacity?: LegalCapacityData | null;
}

/**
 * Will Entity representing testamentary document under Kenyan succession law
 *
 * Core Domain Entity for managing:
 * - Will creation with legal capacity validation (Section 7)
 * - Witness requirements (minimum 2 witnesses)
 * - Will lifecycle (draft → witnessed → active → executed/revoked)
 * - Revocation procedures (Section 16)
 * - Funeral wishes and digital asset instructions
 *
 * @class Will
 * @extends {AggregateRoot}
 */
export class Will extends AggregateRoot {
  // Core Will Properties
  private readonly _id: string;
  private _title: string;
  private _status: WillStatus;
  private readonly _testatorId: string;
  private _willDate: Date;
  private _lastModified: Date;
  private _versionNumber: number;
  private _supersedes: string | null;

  // Activation & Execution
  private _activatedAt: Date | null;
  private _activatedBy: string | null;
  private _executedAt: Date | null;
  private _executedBy: string | null;

  // Revocation (Section 16 Law of Succession)
  private _revokedAt: Date | null;
  private _revokedBy: string | null;
  private _revocationReason: string | null;

  // Testamentary Content
  private _funeralWishes: FuneralWishes | null;
  private _burialLocation: string | null;
  private _residuaryClause: string | null;
  private _digitalAssetInstructions: DigitalAssetInstructions | null;
  private _specialInstructions: string | null;

  // Witness Management (Kenyan Legal Requirements)
  private _requiresWitnesses: boolean;
  private _witnessCount: number;
  private _hasAllWitnesses: boolean;

  // Record Management
  private _isActiveRecord: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // Domain Relationships (IDs for DDD Aggregates)
  private _assetIds: string[] = [];
  private _beneficiaryIds: string[] = [];
  private _witnessIds: string[] = [];

  // Value Objects
  private _legalCapacity: LegalCapacity | null = null;

  // --------------------------------------------------------------------------
  // PRIVATE CONSTRUCTOR - Enforces use of factory methods
  // --------------------------------------------------------------------------
  private constructor(
    id: string,
    title: string,
    testatorId: string,
    legalCapacity: LegalCapacity | null,
  ) {
    super();

    // Validate required parameters
    if (!id?.trim()) throw new Error('Will ID is required');
    if (!title?.trim()) throw new Error('Will title is required');
    if (!testatorId?.trim()) throw new Error('Testator ID is required');

    this._id = id;
    this._title = title.trim();
    this._testatorId = testatorId;
    this._legalCapacity = legalCapacity;

    // Initialize default values
    this._status = WillStatus.DRAFT;
    this._willDate = new Date();
    this._lastModified = new Date();
    this._versionNumber = 1;
    this._supersedes = null;

    this._activatedAt = null;
    this._activatedBy = null;
    this._executedAt = null;
    this._executedBy = null;
    this._revokedAt = null;
    this._revokedBy = null;
    this._revocationReason = null;

    this._funeralWishes = null;
    this._burialLocation = null;
    this._residuaryClause = null;
    this._digitalAssetInstructions = null;
    this._specialInstructions = null;

    this._requiresWitnesses = true;
    this._witnessCount = 0;
    this._hasAllWitnesses = false;

    this._isActiveRecord = true;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._deletedAt = null;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS - Domain Lifecycle Management
  // --------------------------------------------------------------------------

  /**
   * Creates a new Will entity with legal capacity validation (Section 7)
   *
   * @static
   * @param {string} id - Unique will identifier
   * @param {string} title - Descriptive title of the will
   * @param {string} testatorId - ID of the testator (will creator)
   * @param {LegalCapacity} legalCapacity - Legal capacity assessment
   * @param {number} [version=1] - Version number of the will
   * @returns {Will} Newly created will entity
   * @throws {Error} When validation fails or legal capacity insufficient
   */
  static create(
    id: string,
    title: string,
    testatorId: string,
    legalCapacity: LegalCapacity,
    version: number = 1,
  ): Will {
    // Validate business rules
    if (!legalCapacity.hasLegalCapacity()) {
      throw new Error(
        'Testator must have legal capacity to create a will (Section 7 Law of Succession Act)',
      );
    }

    const will = new Will(id, title, testatorId, legalCapacity);
    will._versionNumber = version;

    will.apply(new WillCreatedEvent(will._id, will._testatorId, will._title, will._versionNumber));

    return will;
  }

  /**
   * Reconstructs Will entity from persistence layer data
   *
   * @static
   * @param {WillReconstituteProps} props - Data from database
   * @returns {Will} Rehydrated will entity
   * @throws {Error} When data validation fails during reconstruction
   */
  static reconstitute(props: WillReconstituteProps): Will {
    if (!props.id || !props.title || !props.testatorId) {
      throw new Error('Invalid reconstruction data: missing required fields');
    }

    const will = new Will(props.id, props.title, props.testatorId, null);

    will._status = props.status;
    will._versionNumber = props.versionNumber;
    will._supersedes = props.supersedes || null;

    will._activatedAt = props.activatedAt
      ? Will.safeDateConversion(props.activatedAt, 'activatedAt')
      : null;
    will._activatedBy = props.activatedBy || null;
    will._executedAt = props.executedAt
      ? Will.safeDateConversion(props.executedAt, 'executedAt')
      : null;
    will._executedBy = props.executedBy || null;
    will._revokedAt = props.revokedAt
      ? Will.safeDateConversion(props.revokedAt, 'revokedAt')
      : null;
    will._revokedBy = props.revokedBy || null;
    will._revocationReason = props.revocationReason || null;

    // Handle JSON parsing for flexible fields
    will._funeralWishes = Will.parseJsonField<FuneralWishes>(props.funeralWishes);
    will._digitalAssetInstructions = Will.parseJsonField<DigitalAssetInstructions>(
      props.digitalAssetInstructions,
    );

    will._burialLocation = props.burialLocation || null;
    will._residuaryClause = props.residuaryClause || null;
    will._specialInstructions = props.specialInstructions || null;

    will._requiresWitnesses = Boolean(props.requiresWitnesses);
    will._witnessCount = Number(props.witnessCount) || 0;
    will._hasAllWitnesses = Boolean(props.hasAllWitnesses);
    will._isActiveRecord = Boolean(props.isActiveRecord);

    will._assetIds = [...(props._assetIds || [])];
    will._beneficiaryIds = [...(props._beneficiaryIds || [])];
    will._witnessIds = [...(props._witnessIds || [])];

    will._willDate = Will.safeDateConversion(props.willDate, 'willDate');
    will._lastModified = Will.safeDateConversion(props.lastModified, 'lastModified');
    will._createdAt = Will.safeDateConversion(props.createdAt, 'createdAt');
    will._updatedAt = Will.safeDateConversion(props.updatedAt, 'updatedAt');
    will._deletedAt = props.deletedAt
      ? Will.safeDateConversion(props.deletedAt, 'deletedAt')
      : null;

    if (props.legalCapacity) {
      will._legalCapacity = Will.reconstructLegalCapacity(props.legalCapacity);
    }

    return will;
  }

  /**
   * Safely converts date strings to Date objects with validation
   *
   * @private
   * @static
   * @param {Date | string} dateInput - Date to convert
   * @param {string} fieldName - Field name for error reporting
   * @returns {Date} Valid Date object
   * @throws {Error} When date conversion fails
   */
  private static safeDateConversion(dateInput: Date | string, fieldName: string): Date {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date value for ${fieldName}`);
      }
      return date;
    } catch (error) {
      throw new Error(
        `Failed to convert ${fieldName} to valid Date: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Safely parses JSON fields that might come as strings or already parsed objects
   */
  private static parseJsonField<T>(field: unknown): T | null {
    if (!field) return null;

    // If Prisma already returned an object, return it directly
    if (typeof field === 'object') {
      return field as T;
    }

    // Only attempt to parse if it is strictly a string
    if (typeof field === 'string') {
      try {
        return JSON.parse(field) as T;
      } catch {
        return null; // Handle invalid JSON strings gracefully
      }
    }

    // If it's neither an object nor a string (e.g. unexpected number), return null
    return null;
  }

  /**
   * Reconstructs LegalCapacity from raw data
   *
   * @private
   * @static
   * @param {LegalCapacityData} data - Legal capacity data to reconstruct
   * @returns {LegalCapacity} Reconstructed LegalCapacity instance
   * @throws {Error} When legal capacity data is invalid
   */
  private static reconstructLegalCapacity(data: LegalCapacityData): LegalCapacity {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid legal capacity data: must be object');
    }

    if (typeof data.assessment !== 'object' || data.assessment === null) {
      throw new Error('Invalid legal capacity assessment: must be object');
    }

    // Validate assessment properties
    const assessment = data.assessment;
    const requiredProps = [
      'isOfAge',
      'isSoundMind',
      'understandsWillNature',
      'understandsAssetExtent',
      'understandsBeneficiaryClaims',
      'freeFromUndueInfluence',
      'assessmentDate',
    ];

    for (const prop of requiredProps) {
      if (!(prop in assessment)) {
        throw new Error(`Invalid legal capacity assessment: missing required property ${prop}`);
      }
    }

    // Convert assessmentDate to Date object
    const assessmentDate = Will.safeDateConversion(assessment.assessmentDate, 'assessmentDate');

    const validatedAssessment = {
      ...assessment,
      assessmentDate,
    };

    return new LegalCapacity(validatedAssessment, data.notes || undefined);
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC & DOMAIN OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Updates will title with validation
   *
   * @param {string} title - New will title
   * @throws {Error} When will is not editable or title is empty
   */
  updateTitle(title: string): void {
    this.validateModificationAllowed();

    if (!title?.trim()) {
      throw new Error('Will title cannot be empty');
    }

    this._title = title.trim();
    this.markAsModified();
  }

  /**
   * Updates will details and instructions
   *
   * @param {FuneralWishes} [funeralWishes] - Funeral and burial instructions
   * @param {string} [burialLocation] - Preferred burial location
   * @param {string} [residuaryClause] - Residuary estate instructions
   * @param {DigitalAssetInstructions} [digitalAssetInstructions] - Digital asset handling
   * @param {string} [specialInstructions] - Special testamentary instructions
   * @throws {Error} When will is not editable
   */
  updateDetails(
    funeralWishes?: FuneralWishes,
    burialLocation?: string,
    residuaryClause?: string,
    digitalAssetInstructions?: DigitalAssetInstructions,
    specialInstructions?: string,
  ): void {
    this.validateModificationAllowed();

    if (funeralWishes) this._funeralWishes = { ...funeralWishes };
    if (burialLocation) this._burialLocation = burialLocation.trim();
    if (residuaryClause) this._residuaryClause = residuaryClause.trim();
    if (digitalAssetInstructions) this._digitalAssetInstructions = { ...digitalAssetInstructions };
    if (specialInstructions) this._specialInstructions = specialInstructions.trim();

    this.markAsModified();
  }

  // --------------------------------------------------------------------------
  // WITNESS MANAGEMENT (Kenyan Legal Requirements)
  // --------------------------------------------------------------------------

  /**
   * Adds witness to will with validation
   *
   * @param {string} witnessId - ID of the witness
   * @throws {Error} When will cannot accept witnesses or witness ID is invalid
   */
  addWitness(witnessId: string): void {
    this.validateModificationAllowed();

    if (!witnessId?.trim()) {
      throw new Error('Witness ID is required');
    }

    if (!this.canAddWitnesses()) {
      throw new Error('Cannot add witnesses to will in current status');
    }

    if (!this._witnessIds.includes(witnessId)) {
      this._witnessIds.push(witnessId);
      this._witnessCount = this._witnessIds.length;
      this.checkWitnessCompletion();
      this.markAsModified();
    }
  }

  /**
   * Removes witness from will
   *
   * @param {string} witnessId - ID of the witness to remove
   * @throws {Error} When will is not editable
   */
  removeWitness(witnessId: string): void {
    this.validateModificationAllowed();

    this._witnessIds = this._witnessIds.filter((id) => id !== witnessId);
    this._witnessCount = this._witnessIds.length;
    this.checkWitnessCompletion();
    this.markAsModified();
  }

  /**
   * Checks if will meets minimum witness requirements under Kenyan law
   *
   * @private
   */
  private checkWitnessCompletion(): void {
    this._hasAllWitnesses = this._witnessCount >= KENYAN_LEGAL_REQUIREMENTS.MINIMUM_WITNESSES;
  }

  // --------------------------------------------------------------------------
  // LIFECYCLE TRANSITIONS & STATE MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Transitions will to pending witness status
   *
   * @throws {Error} When transition is not allowed
   */
  markAsPendingWitness(): void {
    this.validateTransition(WillStatus.PENDING_WITNESS);
    this._status = WillStatus.PENDING_WITNESS;
    this.markAsModified();
  }

  /**
   * Marks will as legally witnessed (emits domain event)
   *
   * @throws {Error} When witness requirements not met or transition invalid
   */
  markAsWitnessed(): void {
    this.validateTransition(WillStatus.WITNESSED);

    if (this._requiresWitnesses && !this._hasAllWitnesses) {
      throw new Error(
        `Cannot mark as witnessed. Requires at least ${KENYAN_LEGAL_REQUIREMENTS.MINIMUM_WITNESSES} witnesses.`,
      );
    }

    this._status = WillStatus.WITNESSED;
    this.markAsModified();

    this.apply(new WillWitnessedEvent(this._id, this._testatorId));
  }

  /**
   * Activates will making it the current valid will
   *
   * @param {string} activatedBy - ID of user/admin activating the will
   * @throws {Error} When legal capacity insufficient or transition invalid
   */
  activate(activatedBy: string): void {
    this.validateTransition(WillStatus.ACTIVE);

    if (!activatedBy?.trim()) {
      throw new Error('Activator ID is required');
    }

    // Final legal capacity verification
    if (this._legalCapacity && !this._legalCapacity.hasLegalCapacity()) {
      throw new Error('Cannot activate will: Testator lacks legal capacity');
    }

    this._status = WillStatus.ACTIVE;
    this._activatedAt = new Date();
    this._activatedBy = activatedBy.trim();
    this.markAsModified();

    this.apply(new WillActivatedEvent(this._id, this._testatorId));
  }

  /**
   * Revokes will under Section 16 of Law of Succession Act
   *
   * @param {string} revokedBy - ID of user/admin revoking the will
   * @param {string} reason - Reason for revocation
   * @param {'NEW_WILL' | 'CODICIL' | 'DESTRUCTION' | 'COURT_ORDER'} method - Revocation method
   * @throws {Error} When transition invalid or parameters missing
   */
  revoke(
    revokedBy: string,
    reason: string,
    method: 'NEW_WILL' | 'CODICIL' | 'DESTRUCTION' | 'COURT_ORDER',
  ): void {
    this.validateTransition(WillStatus.REVOKED);

    if (!revokedBy?.trim()) {
      throw new Error('Revoker ID is required');
    }

    if (!reason?.trim()) {
      throw new Error('Revocation reason is required');
    }

    this._status = WillStatus.REVOKED;
    this._revokedAt = new Date();
    this._revokedBy = revokedBy.trim();
    this._revocationReason = reason.trim();
    this.markAsModified();

    this.apply(
      new WillRevokedEvent(
        this._id,
        this._testatorId,
        this._revocationReason,
        this._revokedBy,
        method,
      ),
    );
  }

  /**
   * Marks will as superseded by newer version
   *
   * @param {string} newWillId - ID of the new will replacing this one
   * @throws {Error} When transition invalid or new will ID missing
   */
  supersede(newWillId: string): void {
    this.validateTransition(WillStatus.SUPERSEDED);

    if (!newWillId?.trim()) {
      throw new Error('New will ID is required for supersession');
    }

    this._status = WillStatus.SUPERSEDED;
    this._supersedes = newWillId.trim();
    this.markAsModified();

    this.apply(new WillSupersededEvent(this._id, newWillId.trim(), this._testatorId));
  }

  /**
   * Marks will as contested due to legal dispute
   *
   * @param {string} disputeId - ID of the legal dispute
   * @param {string} reason - Reason for contestation
   * @throws {Error} When transition invalid or parameters missing
   */
  contest(disputeId: string, reason: string): void {
    this.validateTransition(WillStatus.CONTESTED);

    if (!disputeId?.trim()) {
      throw new Error('Dispute ID is required');
    }

    if (!reason?.trim()) {
      throw new Error('Contestation reason is required');
    }

    this._status = WillStatus.CONTESTED;
    this.markAsModified();

    this.apply(new WillContestedEvent(this._id, disputeId.trim(), reason.trim()));
  }

  /**
   * Marks will as executed (distribution complete)
   *
   * @param {string} executedBy - ID of executor/admin marking as executed
   * @throws {Error} When transition invalid or parameters missing
   */
  markAsExecuted(executedBy: string): void {
    this.validateTransition(WillStatus.EXECUTED);

    if (!executedBy?.trim()) {
      throw new Error('Executor ID is required');
    }

    this._status = WillStatus.EXECUTED;
    this._executedAt = new Date();
    this._executedBy = executedBy.trim();
    this.markAsModified();
  }

  // --------------------------------------------------------------------------
  // VALIDATION & BUSINESS RULE ENFORCEMENT
  // --------------------------------------------------------------------------

  /**
   * Validates that will can be modified in current status
   *
   * @private
   * @throws {Error} When modification is not allowed
   */
  private validateModificationAllowed(): void {
    const definition = WILL_STATUS[this._status];
    if (!definition || !definition.editable) {
      throw new Error(`Cannot modify will in status ${this._status}`);
    }
  }

  /**
   * Validates state transition is allowed
   *
   * @private
   * @param {WillStatus} targetStatus - Target status for transition
   * @throws {Error} When transition is not allowed
   */
  private validateTransition(targetStatus: WillStatus): void {
    const definition = WILL_STATUS[this._status];
    if (!definition) {
      throw new Error(`Invalid current status: ${this._status}`);
    }

    const allowedNext = definition.nextStatus as readonly WillStatus[];

    if (!allowedNext.includes(targetStatus)) {
      throw new Error(`Invalid status transition from ${this._status} to ${targetStatus}`);
    }
  }

  /**
   * Updates modification timestamps
   *
   * @private
   */
  private markAsModified(): void {
    this._lastModified = new Date();
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // DOMAIN CALCULATIONS & BUSINESS RULES
  // --------------------------------------------------------------------------

  /**
   * Determines if will can be modified in current status
   *
   * @returns {boolean} True if will is editable
   */
  isEditable(): boolean {
    const definition = WILL_STATUS[this._status];
    return definition?.editable || false;
  }

  /**
   * Determines if will can be activated from current status
   *
   * @returns {boolean} True if activation is possible
   */
  canBeActivated(): boolean {
    const definition = WILL_STATUS[this._status];
    return definition?.nextStatus.includes(WillStatus.ACTIVE) || false;
  }

  /**
   * Determines if will can be revoked from current status
   *
   * @returns {boolean} True if revocation is possible
   */
  isRevocable(): boolean {
    const definition = WILL_STATUS[this._status];
    return definition?.nextStatus.includes(WillStatus.REVOKED) || false;
  }

  /**
   * Checks if will meets minimum witness requirements under Kenyan law
   *
   * @returns {boolean} True if minimum witnesses requirement met
   */
  hasMinimumWitnesses(): boolean {
    return this._witnessCount >= KENYAN_LEGAL_REQUIREMENTS.MINIMUM_WITNESSES;
  }

  /**
   * Determines if will has been fully executed
   *
   * @returns {boolean} True if will execution completed
   */
  isFullyExecuted(): boolean {
    return this._status === WillStatus.EXECUTED;
  }

  /**
   * Determines if will is currently active
   *
   * @returns {boolean} True if will is active
   */
  isActiveStatus(): boolean {
    return this._status === WillStatus.ACTIVE;
  }

  /**
   * Determines if will is in draft status
   *
   * @returns {boolean} True if will is draft
   */
  isDraft(): boolean {
    return this._status === WillStatus.DRAFT;
  }

  /**
   * Determines if will has been witnessed
   *
   * @returns {boolean} True if will is witnessed
   */
  isWitnessed(): boolean {
    return this._status === WillStatus.WITNESSED;
  }

  /**
   * Determines if will has been revoked
   *
   * @returns {boolean} True if will is revoked
   */
  isRevoked(): boolean {
    return this._status === WillStatus.REVOKED;
  }

  /**
   * Determines if will can accept witness additions
   *
   * @returns {boolean} True if witnesses can be added
   */
  canAddWitnesses(): boolean {
    return this._status === WillStatus.DRAFT || this._status === WillStatus.PENDING_WITNESS;
  }

  /**
   * Determines if will is ready for activation
   *
   * @returns {boolean} True if ready for activation
   */
  isReadyForActivation(): boolean {
    return (
      this._status === WillStatus.WITNESSED &&
      this.hasMinimumWitnesses() &&
      (this._legalCapacity?.hasLegalCapacity() ?? false)
    );
  }

  /**
   * Determines if will has been superseded
   *
   * @returns {boolean} True if will is superseded
   */
  isSuperseded(): boolean {
    return this._status === WillStatus.SUPERSEDED;
  }

  /**
   * Determines if will is contested
   *
   * @returns {boolean} True if will is contested
   */
  isContested(): boolean {
    return this._status === WillStatus.CONTESTED;
  }

  /**
   * Validates if will is ready for execution
   *
   * @returns {boolean} True if valid for execution
   */
  isValidForExecution(): boolean {
    return (
      this._status === WillStatus.ACTIVE &&
      this.hasMinimumWitnesses() &&
      (this._legalCapacity?.hasLegalCapacity() ?? false)
    );
  }

  /**
   * Determines if will can be superseded
   *
   * @returns {boolean} True if can be superseded
   */
  canBeSuperseded(): boolean {
    return this._status === WillStatus.ACTIVE || this._status === WillStatus.WITNESSED;
  }

  // --------------------------------------------------------------------------
  // IMMUTABLE GETTERS - Provide read-only access to entity state
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }
  get title(): string {
    return this._title;
  }
  get status(): WillStatus {
    return this._status;
  }
  get testatorId(): string {
    return this._testatorId;
  }
  get willDate(): Date {
    return new Date(this._willDate);
  }
  get lastModified(): Date {
    return new Date(this._lastModified);
  }
  get versionNumber(): number {
    return this._versionNumber;
  }
  get supersedes(): string | null {
    return this._supersedes;
  }
  get activatedAt(): Date | null {
    return this._activatedAt ? new Date(this._activatedAt) : null;
  }
  get activatedBy(): string | null {
    return this._activatedBy;
  }
  get executedAt(): Date | null {
    return this._executedAt ? new Date(this._executedAt) : null;
  }
  get executedBy(): string | null {
    return this._executedBy;
  }
  get revokedAt(): Date | null {
    return this._revokedAt ? new Date(this._revokedAt) : null;
  }
  get revokedBy(): string | null {
    return this._revokedBy;
  }
  get revocationReason(): string | null {
    return this._revocationReason;
  }
  get funeralWishes(): FuneralWishes | null {
    return this._funeralWishes ? { ...this._funeralWishes } : null;
  }
  get burialLocation(): string | null {
    return this._burialLocation;
  }
  get residuaryClause(): string | null {
    return this._residuaryClause;
  }
  get digitalAssetInstructions(): DigitalAssetInstructions | null {
    return this._digitalAssetInstructions ? { ...this._digitalAssetInstructions } : null;
  }
  get specialInstructions(): string | null {
    return this._specialInstructions;
  }
  get requiresWitnesses(): boolean {
    return this._requiresWitnesses;
  }
  get witnessCount(): number {
    return this._witnessCount;
  }
  get hasAllWitnesses(): boolean {
    return this._hasAllWitnesses;
  }
  get isActiveRecord(): boolean {
    return this._isActiveRecord;
  }
  get createdAt(): Date {
    return new Date(this._createdAt);
  }
  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
  get deletedAt(): Date | null {
    return this._deletedAt ? new Date(this._deletedAt) : null;
  }
  get legalCapacity(): LegalCapacity | null {
    return this._legalCapacity;
  }
  get assetIds(): string[] {
    return [...this._assetIds];
  }
  get beneficiaryIds(): string[] {
    return [...this._beneficiaryIds];
  }
  get witnessIds(): string[] {
    return [...this._witnessIds];
  }
}
