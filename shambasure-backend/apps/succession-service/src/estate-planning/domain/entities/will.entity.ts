import { AggregateRoot } from '@nestjs/cqrs';
import { WillStatus } from '@prisma/client';
import { LegalCapacity } from '../value-objects/legal-capacity.vo';
import { KENYAN_LEGAL_REQUIREMENTS } from '../../../common/constants/kenyan-law.constants';
import { WILL_STATUS } from '../../../common/constants/will-status.constants';
import { WillCreatedEvent } from '../events/will-created.event';
import { WillWitnessedEvent } from '../events/will-witnessed.event';
import { WillActivatedEvent } from '../events/will-activated.event';
import { WillRevokedEvent } from '../events/will-revoked.event';

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

export class Will extends AggregateRoot {
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
  private isActiveRecord: boolean; // Renamed from isActive to avoid conflict
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  // Domain relationships (Managed via Aggregate roots or services, not direct refs)
  // In DDD, we typically store IDs, but keeping these arrays for logic is acceptable
  // if they are loaded by the repository.
  private _assetIds: string[] = [];
  private _beneficiaryIds: string[] = [];
  private _witnessIds: string[] = [];

  // Value Object
  private legalCapacity: LegalCapacity | null = null;

  private constructor(id: string, title: string, testatorId: string, legalCapacity: LegalCapacity) {
    super();
    this.id = id;
    this.title = title.trim();
    this.testatorId = testatorId;
    this.legalCapacity = legalCapacity;

    // Default State
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

    this.requiresWitnesses = true; // Default for Kenyan wills
    this.witnessCount = 0;
    this.hasAllWitnesses = false;

    this.isActiveRecord = true; // Renamed
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHOD
  // --------------------------------------------------------------------------
  static create(id: string, title: string, testatorId: string, legalCapacity: LegalCapacity): Will {
    if (!title?.trim()) throw new Error('Will title is required');
    if (!testatorId) throw new Error('Testator ID is required');

    if (!legalCapacity.hasLegalCapacity()) {
      throw new Error('Testator must have legal capacity to create a will (Section 7).');
    }

    const will = new Will(id, title, testatorId, legalCapacity);
    will.apply(new WillCreatedEvent(id, testatorId, title));
    return will;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC & STATE TRANSITIONS
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

  // Witness Management
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
    // Consume Single Source of Truth
    this.hasAllWitnesses = this.witnessCount >= KENYAN_LEGAL_REQUIREMENTS.MINIMUM_WITNESSES;
  }

  // Lifecycle Transitions

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

    // Re-verify capacity at activation time is a good practice
    if (!this.legalCapacity?.hasLegalCapacity()) {
      throw new Error('Cannot activate will: Testator lacks legal capacity.');
    }

    this.status = WillStatus.ACTIVE;
    this.activatedAt = new Date();
    this.activatedBy = activatedBy;
    this.markAsModified();
    this.apply(new WillActivatedEvent(this.id, this.testatorId));
  }

  revoke(revokedBy: string, reason?: string): void {
    this.validateTransition(WillStatus.REVOKED);

    this.status = WillStatus.REVOKED;
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    this.revocationReason = reason || null;
    this.markAsModified();
    this.apply(new WillRevokedEvent(this.id, this.testatorId, reason || null)); // Fixed: convert undefined to null
  }

  markAsExecuted(executedBy: string): void {
    this.validateTransition(WillStatus.EXECUTED);

    this.status = WillStatus.EXECUTED;
    this.executedAt = new Date();
    this.executedBy = executedBy;
    this.markAsModified();
  }

  // --------------------------------------------------------------------------
  // HELPERS & VALIDATION
  // --------------------------------------------------------------------------

  private validateModificationAllowed(): void {
    const definition = WILL_STATUS[this.status];
    if (!definition.editable) {
      throw new Error(`Cannot modify will in status ${this.status}.`);
    }
  }

  private validateTransition(targetStatus: WillStatus): void {
    const definition = WILL_STATUS[this.status];
    // Use a safe cast or check because Prisma enum might be slightly different string type
    // In a real app, ensure types align perfectly.
    const allowedNext = definition.nextStatus as readonly string[];

    if (!allowedNext.includes(targetStatus)) {
      throw new Error(`Invalid status transition from ${this.status} to ${targetStatus}.`);
    }
  }

  private markAsModified(): void {
    this.lastModified = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

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

  getRevokedAt(): Date | null {
    return this.revokedAt;
  }

  getRevokedBy(): string | null {
    return this.revokedBy;
  }

  getRevocationReason(): string | null {
    return this.revocationReason;
  }

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

  getRequiresWitnesses(): boolean {
    return this.requiresWitnesses;
  }

  getWitnessCount(): number {
    return this.witnessCount;
  }

  getHasAllWitnesses(): boolean {
    return this.hasAllWitnesses;
  }

  getIsActiveRecord(): boolean {
    // Renamed getter
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

  getLegalCapacity(): LegalCapacity | null {
    return this.legalCapacity;
  }

  // Domain relationships getters (return copies to maintain encapsulation)
  getAssetIds(): string[] {
    return [...this._assetIds];
  }

  getBeneficiaryIds(): string[] {
    return [...this._beneficiaryIds];
  }

  getWitnessIds(): string[] {
    return [...this._witnessIds];
  }

  // Derived properties / computed getters
  isEditable(): boolean {
    return WILL_STATUS[this.status].editable;
  }

  canBeActivated(): boolean {
    const definition = WILL_STATUS[this.status];
    return definition.nextStatus.includes(WillStatus.ACTIVE);
  }

  isRevocable(): boolean {
    const definition = WILL_STATUS[this.status];
    return definition.nextStatus.includes(WillStatus.REVOKED);
  }

  hasMinimumWitnesses(): boolean {
    return this.witnessCount >= KENYAN_LEGAL_REQUIREMENTS.MINIMUM_WITNESSES;
  }

  isFullyExecuted(): boolean {
    return this.status === WillStatus.EXECUTED;
  }

  isActiveStatus(): boolean {
    // Renamed from isActive()
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
      this.legalCapacity?.hasLegalCapacity() === true
    );
  }
}
