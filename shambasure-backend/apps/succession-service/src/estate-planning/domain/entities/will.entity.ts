import { AggregateRoot } from '@nestjs/cqrs';
import { WillStatus } from '@prisma/client';
import { LegalCapacity } from '../value-objects/legal-capacity.vo';
import { WillCreatedEvent } from '../events/will-created.event';
import { WillWitnessedEvent } from '../events/will-witnessed.event';
import { WillActivatedEvent } from '../events/will-activated.event';
import { WillRevokedEvent } from '../events/will-revoked.event';

export interface FuneralWishes {
  burialLocation?: string;
  funeralType?: string; // 'Christian', 'Traditional', 'Cremation', etc.
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
  private activatedAt: Date | null;
  private activatedBy: string | null;
  private executedAt: Date | null;
  private executedBy: string | null;
  private revokedAt: Date | null;
  private revokedBy: string | null;
  private revocationReason: string | null;
  private funeralWishes: FuneralWishes | null;
  private burialLocation: string | null;
  private residuaryClause: string | null;
  private requiresWitnesses: boolean;
  private witnessCount: number;
  private hasAllWitnesses: boolean;
  private digitalAssetInstructions: DigitalAssetInstructions | null;
  private specialInstructions: string | null;
  private isActive: boolean;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  // Domain relationships (not stored, managed by repositories)
  private assets: any[] = [];
  private beneficiaries: any[] = [];
  private executors: any[] = [];
  private witnesses: any[] = [];
  private legalCapacity: LegalCapacity | null = null;

  constructor(
    id: string,
    title: string,
    testatorId: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    super();

    if (!title?.trim()) {
      throw new Error('Will title is required');
    }

    if (!testatorId) {
      throw new Error('Testator ID is required');
    }

    this.id = id;
    this.title = title.trim();
    this.testatorId = testatorId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    // Default values
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
    this.requiresWitnesses = true;
    this.witnessCount = 0;
    this.hasAllWitnesses = false;
    this.digitalAssetInstructions = null;
    this.specialInstructions = null;
    this.isActive = true;
    this.deletedAt = null;
  }

  // Getters
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
    return new Date(this.willDate);
  }
  getLastModified(): Date {
    return new Date(this.lastModified);
  }
  getVersionNumber(): number {
    return this.versionNumber;
  }
  getSupersedes(): string | null {
    return this.supersedes;
  }
  getActivatedAt(): Date | null {
    return this.activatedAt ? new Date(this.activatedAt) : null;
  }
  getActivatedBy(): string | null {
    return this.activatedBy;
  }
  getExecutedAt(): Date | null {
    return this.executedAt ? new Date(this.executedAt) : null;
  }
  getExecutedBy(): string | null {
    return this.executedBy;
  }
  getRevokedAt(): Date | null {
    return this.revokedAt ? new Date(this.revokedAt) : null;
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
  getRequiresWitnesses(): boolean {
    return this.requiresWitnesses;
  }
  getWitnessCount(): number {
    return this.witnessCount;
  }
  getHasAllWitnesses(): boolean {
    return this.hasAllWitnesses;
  }
  getDigitalAssetInstructions(): DigitalAssetInstructions | null {
    return this.digitalAssetInstructions ? { ...this.digitalAssetInstructions } : null;
  }
  getSpecialInstructions(): string | null {
    return this.specialInstructions;
  }
  getIsActive(): boolean {
    return this.isActive;
  }
  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }
  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }
  getDeletedAt(): Date | null {
    return this.deletedAt ? new Date(this.deletedAt) : null;
  }

  // Domain relationship getters
  getAssets(): any[] {
    return [...this.assets];
  }
  getBeneficiaries(): any[] {
    return [...this.beneficiaries];
  }
  getExecutors(): any[] {
    return [...this.executors];
  }
  getWitnesses(): any[] {
    return [...this.witnesses];
  }
  getLegalCapacity(): LegalCapacity | null {
    return this.legalCapacity;
  }

  // Business methods
  updateTitle(title: string): void {
    if (!title?.trim()) {
      throw new Error('Will title cannot be empty');
    }

    this.title = title.trim();
    this.lastModified = new Date();
    this.updatedAt = new Date();
  }

  updateDetails(
    funeralWishes?: FuneralWishes,
    burialLocation?: string,
    residuaryClause?: string,
    digitalAssetInstructions?: DigitalAssetInstructions,
    specialInstructions?: string,
  ): void {
    if (this.status !== WillStatus.DRAFT) {
      throw new Error('Can only update details of a draft will');
    }

    if (funeralWishes) this.funeralWishes = { ...funeralWishes };
    if (burialLocation) this.burialLocation = burialLocation;
    if (residuaryClause) this.residuaryClause = residuaryClause;
    if (digitalAssetInstructions) this.digitalAssetInstructions = { ...digitalAssetInstructions };
    if (specialInstructions) this.specialInstructions = specialInstructions;

    this.lastModified = new Date();
    this.updatedAt = new Date();
  }

  setLegalCapacity(legalCapacity: LegalCapacity): void {
    if (!legalCapacity.hasLegalCapacity()) {
      throw new Error('Testator must have legal capacity to create or modify a will');
    }

    this.legalCapacity = legalCapacity;
    this.updatedAt = new Date();
  }

  // Witness management
  addWitness(): void {
    if (!this.requiresWitnesses) return;

    this.witnessCount++;
    this.checkWitnessCompletion();
    this.updatedAt = new Date();
  }

  removeWitness(): void {
    if (this.witnessCount > 0) {
      this.witnessCount--;
      this.checkWitnessCompletion();
      this.updatedAt = new Date();
    }
  }

  private checkWitnessCompletion(): void {
    // Kenyan law requires at least 2 witnesses
    this.hasAllWitnesses = this.witnessCount >= 2;
  }

  // Status transitions
  markAsPendingWitness(): void {
    if (this.status !== WillStatus.DRAFT) {
      throw new Error('Only draft wills can be marked as pending witness');
    }

    this.status = WillStatus.PENDING_WITNESS;
    this.lastModified = new Date();
    this.updatedAt = new Date();
  }

  markAsWitnessed(): void {
    if (this.status !== WillStatus.PENDING_WITNESS) {
      throw new Error('Only wills pending witness can be marked as witnessed');
    }

    if (this.requiresWitnesses && !this.hasAllWitnesses) {
      throw new Error('Cannot mark as witnessed without required number of witnesses');
    }

    this.status = WillStatus.WITNESSED;
    this.lastModified = new Date();
    this.updatedAt = new Date();

    this.apply(new WillWitnessedEvent(this.id, this.testatorId));
  }

  activate(activatedBy: string): void {
    if (this.status !== WillStatus.WITNESSED) {
      throw new Error('Only witnessed wills can be activated');
    }

    if (!this.legalCapacity?.hasLegalCapacity()) {
      throw new Error('Cannot activate will without valid legal capacity assessment');
    }

    this.status = WillStatus.ACTIVE;
    this.activatedAt = new Date();
    this.activatedBy = activatedBy;
    this.lastModified = new Date();
    this.updatedAt = new Date();

    this.apply(new WillActivatedEvent(this.id, this.testatorId));
  }

  revoke(revokedBy: string, reason?: string): void {
    if (this.status === WillStatus.REVOKED || this.status === WillStatus.EXECUTED) {
      throw new Error('Cannot revoke an already revoked or executed will');
    }

    this.status = WillStatus.REVOKED;
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    this.revocationReason = reason || null;
    this.lastModified = new Date();
    this.updatedAt = new Date();

    this.apply(new WillRevokedEvent(this.id, this.testatorId, reason));
  }

  markAsExecuted(executedBy: string): void {
    if (this.status !== WillStatus.ACTIVE) {
      throw new Error('Only active wills can be marked as executed');
    }

    this.status = WillStatus.EXECUTED;
    this.executedAt = new Date();
    this.executedBy = executedBy;
    this.lastModified = new Date();
    this.updatedAt = new Date();
  }

  markAsContested(): void {
    if (this.status !== WillStatus.ACTIVE) {
      throw new Error('Only active wills can be contested');
    }

    this.status = WillStatus.CONTESTED;
    this.lastModified = new Date();
    this.updatedAt = new Date();
  }

  markAsProbate(): void {
    this.status = WillStatus.PROBATE;
    this.lastModified = new Date();
    this.updatedAt = new Date();
  }

  supersede(newWillId: string): void {
    if (this.status === WillStatus.REVOKED || this.status === WillStatus.SUPERSEDED) {
      throw new Error('Cannot supersede an already revoked or superseded will');
    }

    this.status = WillStatus.SUPERSEDED;
    this.supersedes = newWillId;
    this.lastModified = new Date();
    this.updatedAt = new Date();
  }

  // Version management
  createNewVersion(): void {
    this.versionNumber++;
    this.lastModified = new Date();
    this.updatedAt = new Date();
  }

  // Soft delete
  softDelete(): void {
    this.isActive = false;
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  restore(): void {
    this.isActive = true;
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  // Business rules and validations
  canBeModified(): boolean {
    return this.status === WillStatus.DRAFT || this.status === WillStatus.PENDING_WITNESS;
  }

  isActiveWill(): boolean {
    return this.status === WillStatus.ACTIVE;
  }

  isRevocable(): boolean {
    return [
      WillStatus.DRAFT,
      WillStatus.PENDING_WITNESS,
      WillStatus.WITNESSED,
      WillStatus.ACTIVE,
    ].includes(this.status);
  }

  meetsKenyanLegalRequirements(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Testator must have legal capacity
    if (!this.legalCapacity?.hasLegalCapacity()) {
      issues.push('Testator does not have legal capacity');
    }

    // Must have at least 2 witnesses for Kenyan law
    if (this.requiresWitnesses && this.witnessCount < 2) {
      issues.push('Kenyan law requires at least 2 witnesses');
    }

    // Will must be in writing
    if (!this.title || !this.residuaryClause) {
      issues.push('Will must be properly documented with title and residuary clause');
    }

    // Testator must be at least 18 years old (simplified check)
    // In reality, we'd check testator's age from profile

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  getTotalEstateValue(): number {
    return this.assets.reduce((total, asset) => {
      return total + (asset.getCurrentValue()?.getAmount() || 0);
    }, 0);
  }

  // Static factory method
  static create(id: string, title: string, testatorId: string, legalCapacity: LegalCapacity): Will {
    if (!legalCapacity.hasLegalCapacity()) {
      throw new Error('Testator must have legal capacity to create a will');
    }

    const will = new Will(id, title, testatorId);
    will.legalCapacity = legalCapacity;

    will.apply(new WillCreatedEvent(id, testatorId, title));

    return will;
  }
}
