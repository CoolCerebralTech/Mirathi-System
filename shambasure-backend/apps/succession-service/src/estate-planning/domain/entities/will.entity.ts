import { AggregateRoot } from '@nestjs/cqrs';
import { WillStatus } from '@prisma/client';
import { LegalCapacity } from '../value-objects/legal-capacity.vo';
import { KENYAN_LEGAL_REQUIREMENTS } from '../../../common/constants/kenyan-law.constants';
import { WILL_STATUS } from '../../../common/constants/will-status.constants';
import { WillCreatedEvent } from '../events/will-created.event';
import { WillWitnessedEvent } from '../events/will-witnessed.event';
import { WillActivatedEvent } from '../events/will-activated.event';
import { WillRevokedEvent } from '../events/will-revoked.event';
import { WillSupersededEvent } from '../events/will-superseded.event';
import { WillContestedEvent } from '../events/will-contested.event';

export interface FuneralWishes {
  burialLocation?: string;
  funeralType?: string;
  specificInstructions?: string;
  preferredOfficiant?: string;
}

export interface DigitalAssetInstructions {
  socialMediaHandling?: string;
  emailAccountHandling?: string;
  cryptocurrencyInstructions?: string;
  onlineAccountClosure?: string;
}

// Interface for reconstitute method to fix TypeScript errors
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
  funeralWishes: FuneralWishes | null;
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

// Interface for LegalCapacity data structure
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

export class Will extends AggregateRoot {
  // Domain Properties
  private id: string;
  private title: string;
  private status: WillStatus;
  private testatorId: string;
  private willDate: Date;
  private lastModified: Date;
  private versionNumber: number;
  private supersedes: string | null;

  // Activation & Execution
  private activatedAt: Date | null;
  private activatedBy: string | null;
  private executedAt: Date | null;
  private executedBy: string | null;

  // Revocation
  private revokedAt: Date | null;
  private revokedBy: string | null;
  private revocationReason: string | null;

  // Content
  private funeralWishes: FuneralWishes | null;
  private burialLocation: string | null;
  private residuaryClause: string | null;
  private digitalAssetInstructions: DigitalAssetInstructions | null;
  private specialInstructions: string | null;

  // Witnesses
  private requiresWitnesses: boolean;
  private witnessCount: number;
  private hasAllWitnesses: boolean;

  // Metadata
  private isActiveRecord: boolean;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  // Relationships (IDs only for DDD)
  private _assetIds: string[] = [];
  private _beneficiaryIds: string[] = [];
  private _witnessIds: string[] = [];

  // Value Objects
  private legalCapacity: LegalCapacity | null = null;

  // Private constructor for internal use
  private constructor(
    id: string,
    title: string,
    testatorId: string,
    legalCapacity: LegalCapacity | null,
  ) {
    super();
    this.id = id;
    this.title = title.trim();
    this.testatorId = testatorId;
    this.legalCapacity = legalCapacity;

    // Defaults
    this.status = WillStatus.DRAFT;
    this.willDate = new Date();
    this.lastModified = new Date();
    this.versionNumber = 1;
    this.supersedes = null;

    this.activatedAt = null;
    this.activatedBy = null;
    this.executedAt = null;
    this.executedBy = null;
    this.revokedAt = null;
    this.revokedBy = null;
    this.revocationReason = null;

    this.funeralWishes = null;
    this.burialLocation = null;
    this.residuaryClause = null;
    this.digitalAssetInstructions = null;
    this.specialInstructions = null;

    this.requiresWitnesses = true;
    this.witnessCount = 0;
    this.hasAllWitnesses = false;

    this.isActiveRecord = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;
  }

  // --------------------------------------------------------------------------
  // 1. FACTORY METHODS
  // --------------------------------------------------------------------------

  /**
   * Create a NEW Will (Starts lifecycle)
   */
  static create(
    id: string,
    title: string,
    testatorId: string,
    legalCapacity: LegalCapacity,
    version: number = 1,
  ): Will {
    if (!title?.trim()) throw new Error('Will title is required');
    if (!testatorId) throw new Error('Testator ID is required');

    if (!legalCapacity.hasLegalCapacity()) {
      throw new Error('Testator must have legal capacity to create a will (Section 7).');
    }

    const will = new Will(id, title, testatorId, legalCapacity);
    will.versionNumber = version;
    will.apply(new WillCreatedEvent(id, testatorId, title, version));
    return will;
  }

  /**
   * Reconstitute a Will from Database (Does NOT trigger events)
   * Usage: Repository.findOne()
   */
  static reconstitute(props: WillReconstituteProps): Will {
    const will = new Will(props.id, props.title, props.testatorId, null);

    // Hydrate properties safely with proper typing
    will.status = props.status;
    will.versionNumber = props.versionNumber;
    will.supersedes = props.supersedes;
    will.activatedAt = props.activatedAt ? new Date(props.activatedAt) : null;
    will.activatedBy = props.activatedBy;
    will.executedAt = props.executedAt ? new Date(props.executedAt) : null;
    will.executedBy = props.executedBy;
    will.revokedAt = props.revokedAt ? new Date(props.revokedAt) : null;
    will.revokedBy = props.revokedBy;
    will.revocationReason = props.revocationReason;
    will.funeralWishes = props.funeralWishes;
    will.burialLocation = props.burialLocation;
    will.residuaryClause = props.residuaryClause;
    will.digitalAssetInstructions = props.digitalAssetInstructions;
    will.specialInstructions = props.specialInstructions;
    will.requiresWitnesses = props.requiresWitnesses;
    will.witnessCount = props.witnessCount;
    will.hasAllWitnesses = props.hasAllWitnesses;
    will.isActiveRecord = props.isActiveRecord;
    will._assetIds = [...props._assetIds];
    will._beneficiaryIds = [...props._beneficiaryIds];
    will._witnessIds = [...props._witnessIds];

    // Handle date conversions safely
    will.willDate = new Date(props.willDate);
    will.lastModified = new Date(props.lastModified);
    will.createdAt = new Date(props.createdAt);
    will.updatedAt = new Date(props.updatedAt);
    will.deletedAt = props.deletedAt ? new Date(props.deletedAt) : null;

    // Handle LegalCapacity reconstruction if provided
    if (props.legalCapacity) {
      will.legalCapacity = Will.reconstructLegalCapacity(props.legalCapacity);
    }

    return will;
  }

  /**
   * Helper method to reconstruct LegalCapacity from raw data
   */
  private static reconstructLegalCapacity(data: LegalCapacityData): LegalCapacity {
    // Convert assessmentDate to Date object if it's a string
    const assessmentDate =
      typeof data.assessment.assessmentDate === 'string'
        ? new Date(data.assessment.assessmentDate)
        : data.assessment.assessmentDate;

    const assessment = {
      ...data.assessment,
      assessmentDate,
    };

    return new LegalCapacity(assessment, data.notes);
  }

  // ... rest of the methods remain the same (updateTitle, updateDetails, witness methods, lifecycle transitions, etc.)

  // --------------------------------------------------------------------------
  // 2. BUSINESS LOGIC & STATE TRANSITIONS
  // --------------------------------------------------------------------------

  updateTitle(title: string): void {
    this.validateModificationAllowed();
    if (!title?.trim()) throw new Error('Will title cannot be empty');
    this.title = title.trim();
    this.markAsModified();
  }

  updateDetails(
    funeralWishes?: FuneralWishes,
    burialLocation?: string,
    residuaryClause?: string,
    digitalAssetInstructions?: DigitalAssetInstructions,
    specialInstructions?: string,
  ): void {
    this.validateModificationAllowed();

    if (funeralWishes) this.funeralWishes = { ...funeralWishes };
    if (burialLocation) this.burialLocation = burialLocation;
    if (residuaryClause) this.residuaryClause = residuaryClause;
    if (digitalAssetInstructions) this.digitalAssetInstructions = { ...digitalAssetInstructions };
    if (specialInstructions) this.specialInstructions = specialInstructions;

    this.markAsModified();
  }

  // --- Witness Management ---
  addWitness(witnessId: string): void {
    this.validateModificationAllowed();
    if (!this._witnessIds.includes(witnessId)) {
      this._witnessIds.push(witnessId);
      this.witnessCount = this._witnessIds.length;
      this.checkWitnessCompletion();
      this.markAsModified();
    }
  }

  removeWitness(witnessId: string): void {
    this.validateModificationAllowed();
    this._witnessIds = this._witnessIds.filter((id) => id !== witnessId);
    this.witnessCount = this._witnessIds.length;
    this.checkWitnessCompletion();
    this.markAsModified();
  }

  private checkWitnessCompletion(): void {
    this.hasAllWitnesses = this.witnessCount >= KENYAN_LEGAL_REQUIREMENTS.MINIMUM_WITNESSES;
  }

  // --------------------------------------------------------------------------
  // 3. LIFECYCLE TRANSITIONS
  // --------------------------------------------------------------------------

  markAsPendingWitness(): void {
    this.validateTransition(WillStatus.PENDING_WITNESS);
    this.status = WillStatus.PENDING_WITNESS;
    this.markAsModified();
  }

  markAsWitnessed(): void {
    this.validateTransition(WillStatus.WITNESSED);

    if (this.requiresWitnesses && !this.hasAllWitnesses) {
      throw new Error(
        `Cannot mark as witnessed. Requires at least ${KENYAN_LEGAL_REQUIREMENTS.MINIMUM_WITNESSES} witnesses.`,
      );
    }

    this.status = WillStatus.WITNESSED;
    this.markAsModified();
    this.apply(new WillWitnessedEvent(this.id, this.testatorId));
  }

  activate(activatedBy: string): void {
    this.validateTransition(WillStatus.ACTIVE);

    // Verify capacity one last time (optional but recommended)
    if (this.legalCapacity && !this.legalCapacity.hasLegalCapacity()) {
      throw new Error('Cannot activate will: Testator lacks legal capacity.');
    }

    this.status = WillStatus.ACTIVE;
    this.activatedAt = new Date();
    this.activatedBy = activatedBy;
    this.markAsModified();
    this.apply(new WillActivatedEvent(this.id, this.testatorId));
  }

  /**
   * Revoke the will (Section 16 Law of Succession)
   */
  revoke(
    revokedBy: string,
    reason: string,
    method: 'NEW_WILL' | 'CODICIL' | 'DESTRUCTION' | 'COURT_ORDER',
  ): void {
    this.validateTransition(WillStatus.REVOKED);

    this.status = WillStatus.REVOKED;
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    this.revocationReason = reason;
    this.markAsModified();

    this.apply(new WillRevokedEvent(this.id, this.testatorId, reason, revokedBy, method));
  }

  /**
   * Supersede this will with a newer version
   */
  supersede(newWillId: string): void {
    this.validateTransition(WillStatus.SUPERSEDED);

    this.status = WillStatus.SUPERSEDED;
    this.markAsModified();

    this.apply(new WillSupersededEvent(this.id, newWillId, this.testatorId));
  }

  /**
   * Mark as Contested (Court Dispute Filed)
   */
  contest(disputeId: string, reason: string): void {
    this.validateTransition(WillStatus.CONTESTED);

    this.status = WillStatus.CONTESTED;
    this.markAsModified();

    this.apply(new WillContestedEvent(this.id, disputeId, reason));
  }

  markAsExecuted(executedBy: string): void {
    this.validateTransition(WillStatus.EXECUTED);

    this.status = WillStatus.EXECUTED;
    this.executedAt = new Date();
    this.executedBy = executedBy;
    this.markAsModified();
  }

  // --------------------------------------------------------------------------
  // 4. HELPERS & VALIDATION
  // --------------------------------------------------------------------------

  private validateModificationAllowed(): void {
    const definition = WILL_STATUS[this.status];
    if (!definition || !definition.editable) {
      throw new Error(`Cannot modify will in status ${this.status}.`);
    }
  }

  private validateTransition(targetStatus: WillStatus): void {
    const definition = WILL_STATUS[this.status];
    if (!definition) {
      throw new Error(`Invalid current status: ${this.status}`);
    }

    const allowedNext = definition.nextStatus as readonly WillStatus[];

    // Check if targetStatus is in the allowed next statuses
    if (!allowedNext.includes(targetStatus)) {
      throw new Error(`Invalid status transition from ${this.status} to ${targetStatus}.`);
    }
  }

  private markAsModified(): void {
    this.lastModified = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // 5. GETTERS & HELPER METHODS
  // --------------------------------------------------------------------------

  // Core Properties
  getId(): string {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getStatus(): WillStatus {
    return this.status;
  }

  getTestatorId(): string {
    return this.testatorId;
  }

  getWillDate(): Date {
    return this.willDate;
  }

  getLastModified(): Date {
    return this.lastModified;
  }

  getVersionNumber(): number {
    return this.versionNumber;
  }

  getSupersedes(): string | null {
    return this.supersedes;
  }

  // Activation & Execution
  getActivatedAt(): Date | null {
    return this.activatedAt;
  }

  getActivatedBy(): string | null {
    return this.activatedBy;
  }

  getExecutedAt(): Date | null {
    return this.executedAt;
  }

  getExecutedBy(): string | null {
    return this.executedBy;
  }

  // Revocation
  getRevokedAt(): Date | null {
    return this.revokedAt;
  }

  getRevokedBy(): string | null {
    return this.revokedBy;
  }

  getRevocationReason(): string | null {
    return this.revocationReason;
  }

  // Content
  getFuneralWishes(): FuneralWishes | null {
    return this.funeralWishes ? { ...this.funeralWishes } : null;
  }

  getBurialLocation(): string | null {
    return this.burialLocation;
  }

  getResiduaryClause(): string | null {
    return this.residuaryClause;
  }

  getDigitalAssetInstructions(): DigitalAssetInstructions | null {
    return this.digitalAssetInstructions ? { ...this.digitalAssetInstructions } : null;
  }

  getSpecialInstructions(): string | null {
    return this.specialInstructions;
  }

  // Witnesses
  getRequiresWitnesses(): boolean {
    return this.requiresWitnesses;
  }

  getWitnessCount(): number {
    return this.witnessCount;
  }

  getHasAllWitnesses(): boolean {
    return this.hasAllWitnesses;
  }

  // Metadata
  getIsActiveRecord(): boolean {
    return this.isActiveRecord;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  // Value Objects
  getLegalCapacity(): LegalCapacity | null {
    return this.legalCapacity;
  }

  // Domain Relationships
  getAssetIds(): string[] {
    return [...this._assetIds];
  }

  getBeneficiaryIds(): string[] {
    return [...this._beneficiaryIds];
  }

  getWitnessIds(): string[] {
    return [...this._witnessIds];
  }

  // Derived Properties & Business Logic Helpers
  isEditable(): boolean {
    const definition = WILL_STATUS[this.status];
    return definition?.editable || false;
  }

  canBeActivated(): boolean {
    const definition = WILL_STATUS[this.status];
    return definition?.nextStatus.includes(WillStatus.ACTIVE) || false;
  }

  isRevocable(): boolean {
    const definition = WILL_STATUS[this.status];
    return definition?.nextStatus.includes(WillStatus.REVOKED) || false;
  }

  hasMinimumWitnesses(): boolean {
    return this.witnessCount >= KENYAN_LEGAL_REQUIREMENTS.MINIMUM_WITNESSES;
  }

  isFullyExecuted(): boolean {
    return this.status === WillStatus.EXECUTED;
  }

  isActiveStatus(): boolean {
    return this.status === WillStatus.ACTIVE;
  }

  isDraft(): boolean {
    return this.status === WillStatus.DRAFT;
  }

  isWitnessed(): boolean {
    return this.status === WillStatus.WITNESSED;
  }

  isRevoked(): boolean {
    return this.status === WillStatus.REVOKED;
  }

  requiresModification(): boolean {
    return this.isDraft() || this.status === WillStatus.PENDING_WITNESS;
  }

  canAddWitnesses(): boolean {
    return this.status === WillStatus.DRAFT || this.status === WillStatus.PENDING_WITNESS;
  }

  isReadyForActivation(): boolean {
    return (
      this.status === WillStatus.WITNESSED &&
      this.hasMinimumWitnesses() &&
      (this.legalCapacity?.hasLegalCapacity() ?? false)
    );
  }

  isSuperseded(): boolean {
    return this.status === WillStatus.SUPERSEDED;
  }

  isContested(): boolean {
    return this.status === WillStatus.CONTESTED;
  }

  // Validation helpers
  isValidForExecution(): boolean {
    return (
      this.status === WillStatus.ACTIVE &&
      this.hasMinimumWitnesses() &&
      (this.legalCapacity?.hasLegalCapacity() ?? false)
    );
  }

  canBeSuperseded(): boolean {
    return this.status === WillStatus.ACTIVE || this.status === WillStatus.WITNESSED;
  }
}
