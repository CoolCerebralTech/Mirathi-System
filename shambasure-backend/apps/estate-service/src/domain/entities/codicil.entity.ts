// domain/entities/codicil.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';

/**
 * Codicil Entity - Strictly Lawful Implementation
 *
 * Kenyan Legal Context (Law of Succession Act, Cap 160):
 * - S.11 LSA: Formal validity (writing, signature, two witnesses)
 * - S.17 LSA: Effect (alters, explains, or revokes part of will)
 * - Treated as part of will, same formal requirements
 *
 * Entity Scope:
 * 1. Text and intent of amendment
 * 2. What clause(s) it modifies
 * 3. Legal lifecycle (state machine)
 * 4. Witness attestation rules
 * 5. Determining if legally executable
 *
 * NOT Responsible For:
 * - Ordering codicils (Will aggregate)
 * - Applying to clauses (Will aggregate)
 * - Conflict resolution (Will aggregate)
 * - Estate distribution (Estate aggregate)
 * - Any AI/tax/compliance engines
 */

// =========================================================================
// VALUE OBJECTS (Within same file for cohesion)
// =========================================================================

/**
 * Codicil Content Value Object
 * S.11 LSA: Must be "in writing"
 */
export class CodicilContent {
  constructor(readonly text: string) {
    if (!text || text.trim().length < 20) {
      throw new Error('Codicil text must be meaningful (at least 20 characters)');
    }
  }

  equals(other: CodicilContent): boolean {
    return this.text === other.text;
  }

  toString(): string {
    return this.text;
  }
}

/**
 * Witness Signature Value Object
 * S.11 LSA: Two competent witnesses, present simultaneously
 */
export class WitnessSignature {
  constructor(
    readonly name: string,
    readonly nationalId: string,
    readonly signedAt: Date,
    readonly location?: string, // Optional but good for audit
  ) {
    if (!name || name.trim().length < 2) {
      throw new Error('Witness name is required');
    }
    if (!nationalId || !this.isValidKenyanId(nationalId)) {
      throw new Error('Valid Kenyan National ID is required');
    }
    if (!signedAt || !(signedAt instanceof Date)) {
      throw new Error('Valid signature date is required');
    }
    // Witnesses cannot be beneficiaries (S.11 interpretation)
    // Note: Actual beneficiary check done at Will aggregate level
  }

  private isValidKenyanId(id: string): boolean {
    // Kenyan ID: 8 digits (old) or 8 digits + 1 letter + 3 digits (new)
    const oldFormat = /^\d{8}$/;
    const newFormat = /^\d{8}[A-Z]\d{3}$/;
    return oldFormat.test(id) || newFormat.test(id);
  }

  equals(other: WitnessSignature): boolean {
    return (
      this.nationalId === other.nationalId && this.signedAt.getTime() === other.signedAt.getTime()
    );
  }

  static fromNameAndId(name: string, nationalId: string): WitnessSignature {
    return new WitnessSignature(name, nationalId, new Date());
  }
}

/**
 * Clause Reference Value Object
 * Identifies which will clause the codicil affects
 */
export class ClauseReference {
  constructor(
    readonly clauseId: string,
    readonly clauseType: string, // e.g., "BENEFICIARY", "EXECUTOR", "GUARDIAN"
    readonly clauseNumber?: number,
  ) {
    if (!clauseId) {
      throw new Error('Clause ID is required');
    }
    if (!clauseType) {
      throw new Error('Clause type is required');
    }
  }

  equals(other: ClauseReference): boolean {
    return this.clauseId === other.clauseId;
  }

  toString(): string {
    return `Clause ${this.clauseType} (${this.clauseId})`;
  }
}

// =========================================================================
// ENUMS
// =========================================================================

export enum CodicilStatus {
  DRAFT = 'DRAFT',
  SIGNED_BY_TESTATOR = 'SIGNED_BY_TESTATOR',
  WITNESSED = 'WITNESSED',
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  SUPERSEDED = 'SUPERSEDED',
}

export enum CodicilType {
  AMENDMENT = 'AMENDMENT', // Changes existing clause
  ADDITION = 'ADDITION', // Adds new clause
  REVOCATION = 'REVOCATION', // Revokes existing clause
  EXPLANATION = 'EXPLANATION', // Clarifies ambiguous clause
}

// =========================================================================
// CODICIL ENTITY
// =========================================================================

interface CodicilProps {
  willId: string; // Reference to parent Will aggregate
  type: CodicilType;
  content: CodicilContent;
  affectsClauses: ClauseReference[]; // Which clauses this codicil modifies

  // Legal State
  status: CodicilStatus;
  witnesses: WitnessSignature[];
  testatorSignedAt?: Date; // When testator signed (S.11 LSA)
  executedAt?: Date; // When codicil became active

  // Metadata
  reason?: string; // Why this amendment was made
  supersededById?: string; // If replaced by another codicil
}

export class Codicil extends Entity<CodicilProps> {
  // =========================================================================
  // CONSTRUCTOR & FACTORY
  // =========================================================================

  private constructor(props: CodicilProps, id?: UniqueEntityID) {
    // Domain Rule: Codicil must affect at least one clause (S.17 LSA)
    if (props.affectsClauses.length === 0) {
      throw new Error('Codicil must affect at least one clause');
    }

    // Domain Rule: Only certain types can be active immediately
    if (props.status === CodicilStatus.ACTIVE && !props.executedAt) {
      throw new Error('Active codicil must have execution date');
    }

    super(id ?? new UniqueEntityID(), props);
  }

  /**
   * Factory: Create new draft codicil
   */
  public static create(
    willId: string,
    type: CodicilType,
    content: CodicilContent,
    affectsClauses: ClauseReference[],
    reason?: string,
  ): Codicil {
    const props: CodicilProps = {
      willId,
      type,
      content,
      affectsClauses,
      status: CodicilStatus.DRAFT,
      witnesses: [],
      reason,
    };

    return new Codicil(props);
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    props: CodicilProps,
    createdAt: Date,
    updatedAt: Date,
    version: number,
  ): Codicil {
    const codicil = new Codicil(props, new UniqueEntityID(id));
    (codicil as any)._createdAt = createdAt;
    (codicil as any)._updatedAt = updatedAt;
    (codicil as any)._version = version;
    return codicil;
  }

  // =========================================================================
  // BUSINESS LOGIC (MUTATIONS)
  // =========================================================================

  /**
   * Testator signs the codicil (S.11 LSA requirement)
   */
  public signByTestator(at: Date = new Date()): void {
    if (this.status !== CodicilStatus.DRAFT) {
      throw new Error('Codicil can only be signed from DRAFT state');
    }

    this.updateState({
      status: CodicilStatus.SIGNED_BY_TESTATOR,
      testatorSignedAt: at,
    });
  }

  /**
   * Add witness signature (S.11 LSA: at least two witnesses)
   */
  public addWitness(witness: WitnessSignature): void {
    // Domain Rule: Must be signed by testator first
    if (this.status !== CodicilStatus.SIGNED_BY_TESTATOR) {
      throw new Error('Testator must sign before witnesses can sign');
    }

    // Domain Rule: Maximum 2 witnesses (Kenyan law)
    if (this.witnesses.length >= 2) {
      throw new Error('Only two witnesses are allowed (S.11 LSA)');
    }

    // Domain Rule: No duplicate witnesses by national ID
    const duplicate = this.witnesses.some((w) => w.nationalId === witness.nationalId);
    if (duplicate) {
      throw new Error('Witness with this National ID has already signed');
    }

    const updatedWitnesses = [...this.witnesses, witness];
    const newStatus = updatedWitnesses.length === 2 ? CodicilStatus.WITNESSED : this.status;

    this.updateState({
      witnesses: updatedWitnesses,
      status: newStatus,
    });
  }

  /**
   * Activate codicil (make it legally effective)
   */
  public activate(): void {
    // Domain Rule: Must be properly witnessed first
    if (this.status !== CodicilStatus.WITNESSED) {
      throw new Error('Codicil must be witnessed before activation');
    }

    // Domain Rule: Must have exactly 2 witnesses (S.11 LSA)
    if (this.witnesses.length !== 2) {
      throw new Error('Exactly two witnesses required for activation (S.11 LSA)');
    }

    // Domain Rule: Witnesses must sign within reasonable time (simultaneous presence)
    if (!this.areWitnessesSimultaneous()) {
      throw new Error('Witnesses must sign simultaneously (S.11 LSA)');
    }

    this.updateState({
      status: CodicilStatus.ACTIVE,
      executedAt: this.testatorSignedAt,
    });
  }

  /**
   * Revoke codicil (S.17 LSA: revocation by subsequent instrument)
   */
  public revoke(): void {
    if (this.status !== CodicilStatus.ACTIVE) {
      throw new Error('Only active codicils can be revoked');
    }

    this.updateState({
      status: CodicilStatus.REVOKED,
    });
  }

  /**
   * Mark as superseded by later codicil or will
   */
  public supersede(supersededById: string): void {
    if (this.status !== CodicilStatus.ACTIVE) {
      throw new Error('Only active codicils can be superseded');
    }

    this.updateState({
      status: CodicilStatus.SUPERSEDED,
      supersededById,
    });
  }

  /**
   * Update content (only in draft state)
   */
  public updateContent(newContent: CodicilContent, reason?: string): void {
    if (this.status !== CodicilStatus.DRAFT) {
      throw new Error('Can only update content in DRAFT state');
    }

    this.updateState({
      content: newContent,
      reason: reason ?? this.reason,
    });
  }

  // =========================================================================
  // QUERY METHODS (PURE)
  // =========================================================================

  /**
   * Check if witnesses signed simultaneously (S.11 LSA requirement)
   */
  public areWitnessesSimultaneous(): boolean {
    if (this.witnesses.length < 2) return false;

    const [w1, w2] = this.witnesses;
    const timeDiff = Math.abs(w1.signedAt.getTime() - w2.signedAt.getTime());
    const timeDiffMinutes = timeDiff / (1000 * 60);

    // Legal interpretation: "at the same time" means within a short period
    // We use 30 minutes as reasonable threshold for simultaneity
    return timeDiffMinutes <= 30;
  }

  /**
   * Check if codicil is legally executable
   * S.11 LSA compliance: written, signed, witnessed simultaneously
   */
  public isLegallyExecutable(): boolean {
    return (
      this.status === CodicilStatus.ACTIVE &&
      this.witnesses.length === 2 &&
      !!this.testatorSignedAt &&
      this.areWitnessesSimultaneous()
    );
  }

  /**
   * Check if codicil affects specific clause
   */
  public affectsClause(clauseId: string): boolean {
    return this.affectsClauses.some((clause) => clause.clauseId === clauseId);
  }

  /**
   * Get witness by National ID
   */
  public getWitnessByNationalId(nationalId: string): WitnessSignature | undefined {
    return this.witnesses.find((w) => w.nationalId === nationalId);
  }

  // =========================================================================
  // PROPERTY GETTERS
  // =========================================================================

  get willId(): string {
    return this.props.willId;
  }

  get type(): CodicilType {
    return this.props.type;
  }

  get content(): CodicilContent {
    return this.props.content;
  }

  get affectsClauses(): ClauseReference[] {
    return [...this.props.affectsClauses];
  }

  get status(): CodicilStatus {
    return this.props.status;
  }

  get witnesses(): WitnessSignature[] {
    return [...this.props.witnesses];
  }

  get testatorSignedAt(): Date | undefined {
    return this.props.testatorSignedAt;
  }

  get executedAt(): Date | undefined {
    return this.props.executedAt;
  }

  get reason(): string | undefined {
    return this.props.reason;
  }

  get supersededById(): string | undefined {
    return this.props.supersededById;
  }

  // State checkers
  public isDraft(): boolean {
    return this.status === CodicilStatus.DRAFT;
  }

  public isActive(): boolean {
    return this.status === CodicilStatus.ACTIVE;
  }

  public isRevoked(): boolean {
    return this.status === CodicilStatus.REVOKED;
  }

  public isSuperseded(): boolean {
    return this.status === CodicilStatus.SUPERSEDED;
  }

  public isWitnessed(): boolean {
    return this.status === CodicilStatus.WITNESSED;
  }

  public hasMinimumWitnesses(): boolean {
    return this.witnesses.length >= 2;
  }

  // =========================================================================
  // VALIDATION (For invariant checking)
  // =========================================================================

  /**
   * Validate codicil against Kenyan legal requirements
   */
  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!this.content.text.trim()) {
      errors.push('Codicil content cannot be empty');
    }

    if (this.affectsClauses.length === 0) {
      errors.push('Codicil must affect at least one clause');
    }

    // S.11 LSA compliance
    if (this.isActive()) {
      if (this.witnesses.length !== 2) {
        errors.push('Active codicil must have exactly two witnesses (S.11 LSA)');
      }

      if (!this.testatorSignedAt) {
        errors.push('Active codicil must have testator signature');
      }

      if (!this.areWitnessesSimultaneous()) {
        errors.push('Witnesses must sign simultaneously (S.11 LSA)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toJSON() {
    return {
      id: this.id.toString(),
      willId: this.willId,
      type: this.type,
      content: this.content.text,
      affectsClauses: this.affectsClauses.map((c) => ({
        clauseId: c.clauseId,
        clauseType: c.clauseType,
        clauseNumber: c.clauseNumber,
      })),
      status: this.status,
      testatorSignedAt: this.testatorSignedAt?.toISOString(),
      executedAt: this.executedAt?.toISOString(),
      witnesses: this.witnesses.map((w) => ({
        name: w.name,
        nationalId: w.nationalId,
        signedAt: w.signedAt.toISOString(),
        location: w.location,
      })),
      areWitnessesSimultaneous: this.areWitnessesSimultaneous(),
      reason: this.reason,
      supersededById: this.supersededById,
      isLegallyExecutable: this.isLegallyExecutable(),
      validation: this.validate(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version,
    };
  }
}
