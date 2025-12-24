// domain/entities/codicil.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';

/**
 * Codicil Entity
 *
 * Kenyan Legal Context - Section 17 LSA:
 * "A will or codicil may be revoked or altered by the maker at any time
 * before his death by a later will or codicil..."
 *
 * WHAT IS A CODICIL?
 * A codicil is an amendment to a will that changes, adds, or revokes
 * specific provisions WITHOUT rewriting the entire will.
 *
 * WHEN TO USE CODICIL vs. NEW WILL:
 * - Minor changes (e.g., change executor, update address) → Codicil
 * - Major changes (e.g., redistribute estate) → New Will
 *
 * LEGAL REQUIREMENTS:
 * - Must reference the original will (by date)
 * - Must be signed and witnessed (same as will - S.11 LSA)
 * - Can revoke or modify specific clauses
 * - Multiple codicils are valid (numbered: First Codicil, Second Codicil)
 *
 * ENTITY RESPONSIBILITIES:
 * - Record specific amendments
 * - Track which clauses are affected
 * - Maintain version control
 * - Ensure proper witnessing
 *
 * Owned by: Will Aggregate
 */

export enum CodicilType {
  AMENDMENT = 'AMENDMENT', // Modifies existing provision
  ADDITION = 'ADDITION', // Adds new provision
  REVOCATION = 'REVOCATION', // Removes provision
  CLARIFICATION = 'CLARIFICATION', // Clarifies ambiguous provision
}

export enum CodicilStatus {
  DRAFT = 'DRAFT', // Being prepared
  PENDING_WITNESS = 'PENDING_WITNESS', // Awaiting witnesses
  WITNESSED = 'WITNESSED', // Properly witnessed
  ACTIVE = 'ACTIVE', // In effect
  SUPERSEDED = 'SUPERSEDED', // Replaced by later codicil/will
  REVOKED = 'REVOKED', // Explicitly revoked
}

interface CodicilProps {
  willId: string;

  // Identification
  title: string; // e.g., "First Codicil to Will dated 2023-01-15"
  codicilNumber: number; // 1st, 2nd, 3rd codicil
  versionNumber: number; // For draft revisions

  // Type & Content
  type: CodicilType;
  content: string; // The actual amendment text
  affectedClauses: string[]; // Which parts of will are changed

  // Legal execution
  status: CodicilStatus;
  executedDate?: Date; // Date codicil was signed

  // Witnessing (S.11 LSA compliance)
  witnessCount: number;
  isProperlyWitnessed: boolean;
  witness1Name?: string;
  witness1NationalId?: string;
  witness1SignedAt?: Date;
  witness2Name?: string;
  witness2NationalId?: string;
  witness2SignedAt?: Date;

  // Revocation
  revokedAt?: Date;
  revocationReason?: string;
  supersededByWillId?: string;
  supersededByCodicilId?: string;

  // Metadata
  reason?: string; // Why this amendment was made
  legalEffect?: string; // Summary of what changes
  notes?: string;
}

export class Codicil extends Entity<CodicilProps> {
  private constructor(id: UniqueEntityID, props: CodicilProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // Factory: Create new codicil (draft)
  public static create(
    willId: string,
    title: string,
    codicilNumber: number,
    type: CodicilType,
    content: string,
    affectedClauses: string[],
    reason?: string,
  ): Codicil {
    const id = new UniqueEntityID();

    const props: CodicilProps = {
      willId,
      title,
      codicilNumber,
      versionNumber: 1,
      type,
      content,
      affectedClauses,
      status: CodicilStatus.DRAFT,
      witnessCount: 0,
      isProperlyWitnessed: false,
      reason,
    };

    return new Codicil(id, props);
  }

  // Factory: Reconstitute
  public static reconstitute(
    id: string,
    props: CodicilProps,
    createdAt: Date,
    updatedAt: Date,
  ): Codicil {
    const codicil = new Codicil(new UniqueEntityID(id), props, createdAt);
    (codicil as any)._updatedAt = updatedAt;
    return codicil;
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get willId(): string {
    return this.props.willId;
  }

  get title(): string {
    return this.props.title;
  }

  get codicilNumber(): number {
    return this.props.codicilNumber;
  }

  get type(): CodicilType {
    return this.props.type;
  }

  get content(): string {
    return this.props.content;
  }

  get affectedClauses(): string[] {
    return [...this.props.affectedClauses];
  }

  get status(): CodicilStatus {
    return this.props.status;
  }

  get executedDate(): Date | undefined {
    return this.props.executedDate;
  }

  get isProperlyWitnessed(): boolean {
    return this.props.isProperlyWitnessed;
  }

  // =========================================================================
  // BUSINESS LOGIC - CONTENT MANAGEMENT
  // =========================================================================

  /**
   * Update codicil content (only in draft)
   */
  public updateContent(content: string, affectedClauses?: string[]): void {
    this.ensureNotDeleted();

    if (this.status !== CodicilStatus.DRAFT) {
      throw new Error('Can only update content in DRAFT status');
    }

    (this.props as any).content = content;

    if (affectedClauses) {
      (this.props as any).affectedClauses = affectedClauses;
    }

    (this.props as any).versionNumber = this.props.versionNumber + 1;
    this.incrementVersion();
  }

  /**
   * Add affected clause
   */
  public addAffectedClause(clause: string): void {
    this.ensureNotDeleted();

    if (this.status !== CodicilStatus.DRAFT) {
      throw new Error('Can only modify affected clauses in DRAFT');
    }

    if (this.props.affectedClauses.includes(clause)) {
      throw new Error('Clause already in affected list');
    }

    this.props.affectedClauses.push(clause);
    this.incrementVersion();
  }

  /**
   * Set legal effect summary
   */
  public setLegalEffect(effect: string): void {
    this.ensureNotDeleted();
    (this.props as any).legalEffect = effect;
    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - WITNESSING (S.11 LSA)
  // =========================================================================

  /**
   * Prepare for witnessing
   */
  public prepareForWitnessing(): void {
    this.ensureNotDeleted();

    if (this.status !== CodicilStatus.DRAFT) {
      throw new Error('Can only prepare DRAFT codicils for witnessing');
    }

    this.validate();

    (this.props as any).status = CodicilStatus.PENDING_WITNESS;
    this.incrementVersion();
  }

  /**
   * Record first witness signature
   */
  public recordFirstWitness(name: string, nationalId: string, signedAt?: Date): void {
    this.ensureNotDeleted();

    if (this.status !== CodicilStatus.PENDING_WITNESS) {
      throw new Error('Must be in PENDING_WITNESS status');
    }

    (this.props as any).witness1Name = name;
    (this.props as any).witness1NationalId = nationalId;
    (this.props as any).witness1SignedAt = signedAt ?? new Date();
    (this.props as any).witnessCount = 1;
    this.incrementVersion();
  }

  /**
   * Record second witness signature
   * Section 11 LSA: Two witnesses required
   */
  public recordSecondWitness(name: string, nationalId: string, signedAt?: Date): void {
    this.ensureNotDeleted();

    if (this.status !== CodicilStatus.PENDING_WITNESS) {
      throw new Error('Must be in PENDING_WITNESS status');
    }

    if (this.props.witnessCount < 1) {
      throw new Error('First witness must sign before second witness');
    }

    (this.props as any).witness2Name = name;
    (this.props as any).witness2NationalId = nationalId;
    (this.props as any).witness2SignedAt = signedAt ?? new Date();
    (this.props as any).witnessCount = 2;
    (this.props as any).isProperlyWitnessed = true;
    (this.props as any).status = CodicilStatus.WITNESSED;
    this.incrementVersion();
  }

  /**
   * Check if witnesses signed simultaneously (S.11 requirement)
   */
  public areWitnessesSimultaneous(): boolean {
    if (!this.props.witness1SignedAt || !this.props.witness2SignedAt) {
      return false;
    }

    const timeDiffMinutes =
      Math.abs(this.props.witness1SignedAt.getTime() - this.props.witness2SignedAt.getTime()) /
      (1000 * 60);

    // Allow 30 minutes window for simultaneity
    return timeDiffMinutes <= 30;
  }

  // =========================================================================
  // BUSINESS LOGIC - ACTIVATION
  // =========================================================================

  /**
   * Activate codicil (make it legally effective)
   */
  public activate(executedDate?: Date): void {
    this.ensureNotDeleted();

    if (this.status !== CodicilStatus.WITNESSED) {
      throw new Error('Codicil must be WITNESSED before activation');
    }

    if (!this.props.isProperlyWitnessed) {
      throw new Error('Codicil not properly witnessed');
    }

    if (!this.areWitnessesSimultaneous()) {
      throw new Error('Witnesses must sign simultaneously (S.11 LSA)');
    }

    (this.props as any).status = CodicilStatus.ACTIVE;
    (this.props as any).executedDate = executedDate ?? new Date();
    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - REVOCATION
  // =========================================================================

  /**
   * Revoke codicil explicitly
   */
  public revoke(reason?: string): void {
    this.ensureNotDeleted();

    if (this.status === CodicilStatus.REVOKED) {
      throw new Error('Codicil already revoked');
    }

    (this.props as any).status = CodicilStatus.REVOKED;
    (this.props as any).revokedAt = new Date();
    (this.props as any).revocationReason = reason;
    this.incrementVersion();
  }

  /**
   * Mark as superseded by new will
   */
  public supersedeBywill(willId: string): void {
    this.ensureNotDeleted();

    (this.props as any).status = CodicilStatus.SUPERSEDED;
    (this.props as any).supersededByWillId = willId;
    this.incrementVersion();
  }

  /**
   * Mark as superseded by later codicil
   */
  public supersedeByCodicil(codicilId: string): void {
    this.ensureNotDeleted();

    (this.props as any).status = CodicilStatus.SUPERSEDED;
    (this.props as any).supersededByCodicilId = codicilId;
    this.incrementVersion();
  }

  // =========================================================================
  // QUERY METHODS
  // =========================================================================

  public isDraft(): boolean {
    return this.status === CodicilStatus.DRAFT;
  }

  public isPendingWitness(): boolean {
    return this.status === CodicilStatus.PENDING_WITNESS;
  }

  public isWitnessed(): boolean {
    return this.status === CodicilStatus.WITNESSED;
  }

  public isActive(): boolean {
    return this.status === CodicilStatus.ACTIVE;
  }

  public isSuperseded(): boolean {
    return this.status === CodicilStatus.SUPERSEDED;
  }

  public isRevoked(): boolean {
    return this.status === CodicilStatus.REVOKED;
  }

  public isInEffect(): boolean {
    return this.isActive();
  }

  public isAmendment(): boolean {
    return this.type === CodicilType.AMENDMENT;
  }

  public isAddition(): boolean {
    return this.type === CodicilType.ADDITION;
  }

  public isRevocation(): boolean {
    return this.type === CodicilType.REVOCATION;
  }

  public isClarification(): boolean {
    return this.type === CodicilType.CLARIFICATION;
  }

  public hasMinimumWitnesses(): boolean {
    return this.props.witnessCount >= 2;
  }

  // =========================================================================
  // BUSINESS LOGIC - VALIDATION
  // =========================================================================

  /**
   * Validate codicil completeness
   */
  public validate(): void {
    const errors: string[] = [];

    if (!this.props.title || this.props.title.trim().length === 0) {
      errors.push('Codicil title is required');
    }

    if (!this.props.content || this.props.content.trim().length < 10) {
      errors.push('Codicil content must be at least 10 characters');
    }

    if (this.props.affectedClauses.length === 0) {
      errors.push('At least one affected clause must be specified');
    }

    if (this.props.codicilNumber < 1) {
      errors.push('Codicil number must be positive');
    }

    if (errors.length > 0) {
      throw new Error(`Codicil validation failed: ${errors.join('; ')}`);
    }
  }

  /**
   * Check S.11 LSA compliance
   */
  public meetsLegalRequirements(): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    if (!this.hasMinimumWitnesses()) {
      violations.push('Section 11 LSA requires two witnesses');
    }

    if (!this.props.isProperlyWitnessed) {
      violations.push('Codicil not properly witnessed');
    }

    if (this.props.witness1SignedAt && this.props.witness2SignedAt) {
      if (!this.areWitnessesSimultaneous()) {
        violations.push('Witnesses must be present at same time (S.11 LSA)');
      }
    }

    if (!this.props.executedDate && this.isActive()) {
      violations.push('Active codicil must have execution date');
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toJSON() {
    return {
      id: this.id.toString(),
      willId: this.props.willId,
      title: this.props.title,
      codicilNumber: this.props.codicilNumber,
      versionNumber: this.props.versionNumber,
      type: this.props.type,
      content: this.props.content,
      affectedClauses: this.props.affectedClauses,
      status: this.props.status,
      executedDate: this.props.executedDate?.toISOString(),
      witnessCount: this.props.witnessCount,
      isProperlyWitnessed: this.props.isProperlyWitnessed,
      witness1: this.props.witness1Name
        ? {
            name: this.props.witness1Name,
            nationalId: this.props.witness1NationalId,
            signedAt: this.props.witness1SignedAt?.toISOString(),
          }
        : undefined,
      witness2: this.props.witness2Name
        ? {
            name: this.props.witness2Name,
            nationalId: this.props.witness2NationalId,
            signedAt: this.props.witness2SignedAt?.toISOString(),
          }
        : undefined,
      areWitnessesSimultaneous: this.areWitnessesSimultaneous(),
      revokedAt: this.props.revokedAt?.toISOString(),
      revocationReason: this.props.revocationReason,
      supersededByWillId: this.props.supersededByWillId,
      supersededByCodicilId: this.props.supersededByCodicilId,
      reason: this.props.reason,
      legalEffect: this.props.legalEffect,
      notes: this.props.notes,
      isInEffect: this.isInEffect(),
      meetsLegalRequirements: this.meetsLegalRequirements(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version,
    };
  }
}
