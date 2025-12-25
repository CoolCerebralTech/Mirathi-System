// domain/aggregates/will.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import { AssignmentStatus, BeneficiaryAssignment } from '../entities/beneficiary-assignment.entity';
import { Codicil } from '../entities/codicil.entity';
import { DisinheritanceRecord } from '../entities/disinheritance-record.entity';
import { ExecutorNomination } from '../entities/executor-nomination.entity';
// Entities
import { WillWitness } from '../entities/will-witness.entity';
import {
  BeneficiaryAssignedEvent,
  BeneficiaryRemovedEvent,
  CodicilAddedEvent,
  ExecutorNominatedEvent,
  ExecutorRemovedEvent,
  PersonDisinheritedEvent,
  TestamentaryCapacityAssessedEvent,
  TestamentaryCapacityChallengedEvent,
  WillActivatedEvent,
  WillContestedEvent,
  WillCreatedEvent,
  WillEnteredProbateEvent,
  WillExecutedEvent,
  WillPreparedForWitnessingEvent,
  WillRevokedEvent,
  WillSupersededEvent,
  WillWitnessedEvent,
  WitnessAddedEvent,
  WitnessRemovedEvent,
} from '../events/will.events';
import { RevocationMethod } from '../value-objects/revocation-method.vo';
// Value Objects
import { WillStatus } from '../value-objects/will-status.vo';
import { WillType } from '../value-objects/will-type.vo';

/**
 * Will Aggregate Root
 *
 * Kenyan Legal Context - Section 11 LSA:
 * "Every will shall be in writing and shall be signed by the testator
 * or by some other person in his presence and by his direction, and
 * such signature shall be made or acknowledged by the testator in the
 * presence of two or more witnesses present at the same time, and
 * such witnesses shall subscribe the will in the presence of the testator."
 *
 * AGGREGATE RESPONSIBILITIES:
 * - Enforce testamentary capacity requirements
 * - Ensure proper witnessing (Section 11 LSA)
 * - Validate executors and beneficiaries
 * - Manage will lifecycle (Draft → Active → Executed)
 * - Prevent conflicting bequests
 * - Handle revocation and supersession
 *
 * INVARIANTS (MUST ALWAYS BE TRUE):
 * 1. Only ONE will can be ACTIVE per testator
 * 2. Will must have AT LEAST 2 witnesses (Section 11 LSA)
 * 3. Witnesses CANNOT be beneficiaries
 * 4. Total percentage bequests cannot exceed 100%
 * 5. Only ONE residuary beneficiary (or multiple with specified %)
 * 6. Executor must be eligible and accept role
 * 7. Once EXECUTED, will cannot be modified
 * 8. ACTIVE will must be properly witnessed
 *
 * Owned Entities:
 * - WillWitness (2+)
 * - ExecutorNomination (1+)
 * - BeneficiaryAssignment (0+)
 * - Codicil (0+)
 * - DisinheritanceRecord (0+)
 */

interface WillProps {
  // Identity
  testatorId: string; // User ID from auth service
  testatorFullName: string; // Denormalized for readability

  // Will metadata
  status: WillStatus;
  type: WillType;
  versionNumber: number;
  title: string; // e.g., "Last Will and Testament of John Doe"

  // Testamentary capacity
  hasTestamentaryCapacity: boolean;
  capacityAssessmentDate?: Date;
  capacityAssessedBy?: string;

  // Revocation
  isRevoked: boolean;
  revocationMethod?: RevocationMethod;
  revokedAt?: Date;
  revokedReason?: string;

  // Supersession
  supersedesWillId?: string; // Previous will ID
  supersededByWillId?: string; // Newer will ID

  // Instructions
  funeralWishes?: string;
  burialLocation?: string;
  residuaryClause?: string; // "Everything else goes to..."
  specialInstructions?: string;

  // Execution (when testator died)
  executedAt?: Date;
  dateOfDeath?: Date;

  // Court process (informational only - succession-service owns this)
  probateCaseNumber?: string;
  probateGrantedAt?: Date;

  // Storage
  originalDocumentId?: string; // Link to document service
  storageLocation?: string;

  // Entities (aggregated)
  witnesses: WillWitness[];
  executors: ExecutorNomination[];
  beneficiaryAssignments: BeneficiaryAssignment[];
  codicils: Codicil[];
  disinheritanceRecords: DisinheritanceRecord[];
}

export class Will extends AggregateRoot<WillProps> {
  private constructor(id: UniqueEntityID, props: WillProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // =========================================================================
  // FACTORY METHODS
  // =========================================================================

  /**
   * Create new will (DRAFT status)
   */
  public static create(
    testatorId: string,
    testatorFullName: string,
    type: WillType = WillType.standard(),
    title?: string,
  ): Will {
    const id = new UniqueEntityID();

    const props: WillProps = {
      testatorId,
      testatorFullName,
      status: WillStatus.draft(),
      type,
      versionNumber: 1,
      title: title ?? `Last Will and Testament of ${testatorFullName}`,
      hasTestamentaryCapacity: true, // Assumed until proven otherwise
      isRevoked: false,
      witnesses: [],
      executors: [],
      beneficiaryAssignments: [],
      codicils: [],
      disinheritanceRecords: [],
    };

    const will = new Will(id, props);

    // Emit domain event
    will.addDomainEvent(
      new WillCreatedEvent(will.id.toString(), will.getAggregateType(), will.version, {
        testatorId,
        testatorFullName,
        willType: type.value,
        title: props.title,
      }),
    );

    return will;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    props: WillProps,
    createdAt: Date,
    updatedAt: Date,
    version: number,
  ): Will {
    const will = new Will(new UniqueEntityID(id), props, createdAt);
    (will as any)._updatedAt = updatedAt;
    (will as any)._version = version;
    return will;
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get testatorId(): string {
    return this.props.testatorId;
  }

  get testatorFullName(): string {
    return this.props.testatorFullName;
  }

  get status(): WillStatus {
    return this.props.status;
  }

  get type(): WillType {
    return this.props.type;
  }

  get versionNumber(): number {
    return this.props.versionNumber;
  }

  get title(): string {
    return this.props.title;
  }

  get witnesses(): ReadonlyArray<WillWitness> {
    return Object.freeze([...this.props.witnesses]);
  }

  get executors(): ReadonlyArray<ExecutorNomination> {
    return Object.freeze([...this.props.executors]);
  }

  get beneficiaryAssignments(): ReadonlyArray<BeneficiaryAssignment> {
    return Object.freeze([...this.props.beneficiaryAssignments]);
  }

  get codicils(): ReadonlyArray<Codicil> {
    return Object.freeze([...this.props.codicils]);
  }

  get disinheritanceRecords(): ReadonlyArray<DisinheritanceRecord> {
    return Object.freeze([...this.props.disinheritanceRecords]);
  }

  get isRevoked(): boolean {
    return this.props.isRevoked;
  }

  get hasTestamentaryCapacity(): boolean {
    return this.props.hasTestamentaryCapacity;
  }

  // =========================================================================
  // BUSINESS LOGIC - TESTAMENTARY CAPACITY
  // =========================================================================

  /**
   * Assess testamentary capacity (Section 9 LSA)
   *
   * Requirements:
   * - Testator must be 18+ years old
   * - Must be of sound mind
   * - Must understand nature of making a will
   * - Must understand extent of property
   * - Must understand claims of potential beneficiaries
   */
  public assessTestamentaryCapacity(
    hasCapacity: boolean,
    assessedBy: string,
    reason?: string,
  ): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    (this.props as any).hasTestamentaryCapacity = hasCapacity;
    (this.props as any).capacityAssessmentDate = new Date();
    (this.props as any).capacityAssessedBy = assessedBy;

    this.addDomainEvent(
      new TestamentaryCapacityAssessedEvent(
        this.id.toString(),
        this.getAggregateType(),
        this.version,
        {
          testatorId: this.props.testatorId,
          hasCapacity,
          assessedBy,
          reason,
        },
      ),
    );
  }

  /**
   * Challenge testamentary capacity (for legal disputes)
   */
  public challengeCapacity(challenger: string, grounds: string): void {
    this.ensureNotDeleted();

    this.addDomainEvent(
      new TestamentaryCapacityChallengedEvent(
        this.id.toString(),
        this.getAggregateType(),
        this.version,
        {
          testatorId: this.props.testatorId,
          challenger,
          grounds,
        },
      ),
    );
  }

  // =========================================================================
  // BUSINESS LOGIC - WITNESSES (Section 11 LSA)
  // =========================================================================

  /**
   * Add witness (enforce Section 11 LSA requirements)
   */
  public addWitness(witness: WillWitness): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    // Validate witness eligibility
    if (!witness.isEligible()) {
      throw new Error(`Witness is not eligible: ${witness.eligibility.getIneligibilityReason()}`);
    }

    // Check if witness is also a beneficiary (ILLEGAL per Section 11)
    const witnessUserId = witness.userId;
    const witnessNationalId = witness.nationalId;

    if (witnessUserId) {
      const isBeneficiary = this.props.beneficiaryAssignments.some(
        (assignment) => assignment.userId === witnessUserId,
      );

      if (isBeneficiary) {
        throw new Error('Witness cannot be a beneficiary (Section 11 LSA violation)');
      }
    }

    // Check if already added
    const exists = this.props.witnesses.some((w) => w.id.equals(witness.id));
    if (exists) {
      throw new Error('Witness already added to this will');
    }

    this.props.witnesses.push(witness);

    this.addDomainEvent(
      new WitnessAddedEvent(this.id.toString(), this.getAggregateType(), this.version, {
        witnessId: witness.id.toString(),
        witnessName: witness.fullName,
        witnessType: witness.witnessType,
      }),
    );
  }

  /**
   * Remove witness (only in draft)
   */
  public removeWitness(witnessId: string): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    const index = this.props.witnesses.findIndex((w) => w.id.toString() === witnessId);

    if (index === -1) {
      throw new Error('Witness not found');
    }

    const removed = this.props.witnesses.splice(index, 1)[0];

    this.addDomainEvent(
      new WitnessRemovedEvent(this.id.toString(), this.getAggregateType(), this.version, {
        witnessId,
        witnessName: removed.fullName,
      }),
    );
  }

  /**
   * Get verified witnesses count
   */
  public getVerifiedWitnessesCount(): number {
    return this.props.witnesses.filter((w) => w.isVerified()).length;
  }

  /**
   * Check if will has minimum witnesses (Section 11: 2 required)
   */
  public hasMinimumWitnesses(): boolean {
    const minRequired = this.props.type.getMinimumWitnessCount();
    return this.getVerifiedWitnessesCount() >= minRequired;
  }

  /**
   * Check if all witnesses are eligible (not beneficiaries)
   */
  public allWitnessesEligible(): boolean {
    return this.props.witnesses.every((w) => w.isEligible());
  }

  /**
   * Validate witness simultaneity (Section 11: "present at the same time")
   */
  public validateWitnessSimultaneity(): { valid: boolean; reason?: string } {
    if (this.props.witnesses.length < 2) {
      return { valid: false, reason: 'Need at least 2 witnesses' };
    }

    const [witness1, witness2] = this.props.witnesses;

    if (!witness1.signature || !witness2.signature) {
      return { valid: false, reason: 'Witnesses must sign' };
    }

    if (!witness1.signature.isSimultaneousWith(witness2.signature)) {
      return {
        valid: false,
        reason: 'Witnesses must sign at same time (Section 11 LSA)',
      };
    }

    return { valid: true };
  }

  // =========================================================================
  // BUSINESS LOGIC - EXECUTORS
  // =========================================================================

  /**
   * Nominate executor
   */
  public nominateExecutor(executor: ExecutorNomination): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    // Validate eligibility
    if (!executor.isLegallyEligible) {
      throw new Error(`Executor is not eligible: ${executor.ineligibilityReason}`);
    }

    // Check for duplicates
    const exists = this.props.executors.some((e) => e.id.equals(executor.id));
    if (exists) {
      throw new Error('Executor already nominated');
    }

    // Validate order number
    if (executor.isPrimary) {
      const existingPrimary = this.props.executors.find((e) => e.isPrimary);
      if (existingPrimary) {
        throw new Error(
          'Primary executor already exists. Remove existing or nominate as alternate.',
        );
      }
    }

    this.props.executors.push(executor);

    this.addDomainEvent(
      new ExecutorNominatedEvent(this.id.toString(), this.getAggregateType(), this.version, {
        executorId: executor.id.toString(),
        executorName: executor.fullName,
        priority: executor.priority,
        isPrimary: executor.isPrimary,
      }),
    );
  }

  /**
   * Remove executor nomination
   */
  public removeExecutor(executorId: string, reason?: string): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    const index = this.props.executors.findIndex((e) => e.id.toString() === executorId);

    if (index === -1) {
      throw new Error('Executor not found');
    }

    const removed = this.props.executors.splice(index, 1)[0];
    removed.remove(reason);

    this.addDomainEvent(
      new ExecutorRemovedEvent(this.id.toString(), this.getAggregateType(), this.version, {
        executorId,
        executorName: removed.fullName,
        reason,
      }),
    );
  }

  /**
   * Get primary executor
   */
  public getPrimaryExecutor(): ExecutorNomination | undefined {
    return this.props.executors.find((e) => e.isPrimary && e.canServe());
  }

  /**
   * Get alternate executors
   */
  public getAlternateExecutors(): ExecutorNomination[] {
    return this.props.executors
      .filter((e) => e.isAlternate() && e.canServe())
      .sort((a, b) => a.orderNumber - b.orderNumber);
  }

  /**
   * Check if will has at least one eligible executor
   */
  public hasEligibleExecutor(): boolean {
    return this.props.executors.some((e) => e.canServe());
  }

  // =========================================================================
  // BUSINESS LOGIC - BENEFICIARY ASSIGNMENTS
  // =========================================================================

  /**
   * Add beneficiary assignment
   */
  public assignBeneficiary(assignment: BeneficiaryAssignment): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    // Validate assignment
    const validation = assignment.validate();
    if (!validation.valid) {
      throw new Error(`Invalid beneficiary assignment: ${validation.errors.join('; ')}`);
    }

    // Check if beneficiary is also a witness (ILLEGAL)
    const beneficiaryUserId = assignment.userId;
    if (beneficiaryUserId) {
      const isWitness = this.props.witnesses.some((w) => w.userId === beneficiaryUserId);

      if (isWitness) {
        throw new Error('Beneficiary cannot be a witness (Section 11 LSA violation)');
      }
    }

    // Check residuary constraint (only one beneficiary can have residuary, unless % specified)
    if (assignment.isResiduary()) {
      const existingResiduary = this.props.beneficiaryAssignments.filter(
        (a) => a.isResiduary() && a.status !== AssignmentStatus.REVOKED,
      );

      if (existingResiduary.length > 0) {
        const totalResiduary = existingResiduary.reduce(
          (sum, a) => sum + (a.getSharePercentage() ?? 100),
          assignment.getSharePercentage() ?? 100,
        );

        if (totalResiduary > 100) {
          throw new Error('Total residuary percentages cannot exceed 100%');
        }
      }
    }

    // Check percentage constraint (total cannot exceed 100%)
    if (assignment.share.isPercentage()) {
      const totalPercentage =
        this.calculateTotalPercentageAllocated() + (assignment.getSharePercentage() ?? 0);

      if (totalPercentage > 100) {
        throw new Error(`Total percentage allocation would be ${totalPercentage}% (max 100%)`);
      }
    }

    // Check for duplicate specific asset assignment
    if (assignment.isSpecificAsset()) {
      const assetId = assignment.getAssetId();
      const duplicate = this.props.beneficiaryAssignments.find(
        (a) =>
          a.getAssetId() === assetId &&
          a.isSpecificAsset() &&
          a.status !== AssignmentStatus.REVOKED,
      );

      if (duplicate) {
        throw new Error(`Asset ${assetId} is already assigned to another beneficiary`);
      }
    }

    this.props.beneficiaryAssignments.push(assignment);

    this.addDomainEvent(
      new BeneficiaryAssignedEvent(this.id.toString(), this.getAggregateType(), this.version, {
        assignmentId: assignment.id.toString(),
        beneficiaryName: assignment.getBeneficiaryName(),
        beneficiaryType: assignment.beneficiaryType,
        shareType: assignment.share.getType(),
        percentage: assignment.getSharePercentage(),
      }),
    );
  }

  /**
   * Remove beneficiary assignment
   */
  public removeBeneficiary(assignmentId: string, reason?: string): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    const assignment = this.props.beneficiaryAssignments.find(
      (a) => a.id.toString() === assignmentId,
    );

    if (!assignment) {
      throw new Error('Beneficiary assignment not found');
    }

    assignment.revoke(reason);

    this.addDomainEvent(
      new BeneficiaryRemovedEvent(this.id.toString(), this.getAggregateType(), this.version, {
        assignmentId,
        beneficiaryName: assignment.getBeneficiaryName(),
        reason,
      }),
    );
  }

  /**
   * Calculate total percentage allocated
   */
  private calculateTotalPercentageAllocated(): number {
    return this.props.beneficiaryAssignments
      .filter(
        (a) => a.share.isPercentage() && !a.isResiduary() && a.status !== AssignmentStatus.REVOKED,
      )
      .reduce((sum, a) => sum + (a.getSharePercentage() ?? 0), 0);
  }

  /**
   * Get all active beneficiaries
   */
  public getActiveBeneficiaries(): BeneficiaryAssignment[] {
    return this.props.beneficiaryAssignments.filter((a) => a.status !== AssignmentStatus.REVOKED);
  }

  // =========================================================================
  // BUSINESS LOGIC - CODICILS
  // =========================================================================

  /**
   * Add codicil (amendment to will)
   */
  public addCodicil(codicil: Codicil): void {
    this.ensureNotDeleted();

    if (!this.status.isActive() && !this.status.isWitnessed()) {
      throw new Error('Can only add codicil to ACTIVE or WITNESSED will');
    }

    // Validate codicil
    codicil.validate();

    this.props.codicils.push(codicil);

    this.addDomainEvent(
      new CodicilAddedEvent(this.id.toString(), this.getAggregateType(), this.version, {
        codicilId: codicil.id.toString(),
        codicilNumber: codicil.codicilNumber,
        type: codicil.type,
        affectedClauses: codicil.affectedClauses,
      }),
    );
  }

  /**
   * Get active codicils
   */
  public getActiveCodicils(): Codicil[] {
    return this.props.codicils
      .filter((c) => c.isActive())
      .sort((a, b) => a.codicilNumber - b.codicilNumber);
  }

  // =========================================================================
  // BUSINESS LOGIC - DISINHERITANCE
  // =========================================================================

  /**
   * Disinherit a person
   */
  public disinherit(record: DisinheritanceRecord): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    // Validate
    const validation = record.validate();
    if (!validation.valid) {
      throw new Error(`Invalid disinheritance: ${validation.errors.join('; ')}`);
    }

    // Check for duplicate
    const exists = this.props.disinheritanceRecords.some(
      (d) => d.disinheritedMemberId === record.disinheritedMemberId && d.isActive(),
    );

    if (exists) {
      throw new Error(`${record.disinheritedName} is already disinherited in this will`);
    }

    this.props.disinheritanceRecords.push(record);

    this.addDomainEvent(
      new PersonDisinheritedEvent(this.id.toString(), this.getAggregateType(), this.version, {
        disinheritanceId: record.id.toString(),
        disinheritedMemberId: record.disinheritedMemberId,
        disinheritedName: record.disinheritedName,
        type: record.type,
        reason: record.primaryReason,
        isVulnerableToChallenge: record.isVulnerableToChallenge,
      }),
    );
  }

  /**
   * Check if person is disinherited
   */
  public isDisinherited(memberId: string): boolean {
    return this.props.disinheritanceRecords.some(
      (d) => d.disinheritedMemberId === memberId && d.isActive(),
    );
  }

  // =========================================================================
  // BUSINESS LOGIC - WILL LIFECYCLE
  // =========================================================================

  /**
   * Transition to PENDING_WITNESS status
   */
  public prepareForWitnessing(): void {
    this.ensureNotDeleted();

    if (!this.status.isDraft()) {
      throw new Error('Can only prepare DRAFT will for witnessing');
    }

    // Validate completeness before witnessing
    this.validate();

    const newStatus = WillStatus.pendingWitness();
    (this.props as any).status = newStatus;

    this.addDomainEvent(
      new WillPreparedForWitnessingEvent(
        this.id.toString(),
        this.getAggregateType(),
        this.version,
        {
          testatorId: this.props.testatorId,
        },
      ),
    );
  }

  /**
   * Transition to WITNESSED status
   */
  public markAsWitnessed(): void {
    this.ensureNotDeleted();

    if (!this.status.isPendingWitness()) {
      throw new Error('Will must be in PENDING_WITNESS status');
    }

    // Validate witnesses
    if (!this.hasMinimumWitnesses()) {
      throw new Error(
        `Section 11 LSA requires ${this.props.type.getMinimumWitnessCount()} witnesses`,
      );
    }

    if (!this.allWitnessesEligible()) {
      throw new Error('All witnesses must be eligible (not beneficiaries)');
    }

    const simultaneityCheck = this.validateWitnessSimultaneity();
    if (!simultaneityCheck.valid) {
      throw new Error(simultaneityCheck.reason);
    }

    const newStatus = WillStatus.witnessed();
    (this.props as any).status = newStatus;

    this.addDomainEvent(
      new WillWitnessedEvent(this.id.toString(), this.getAggregateType(), this.version, {
        testatorId: this.props.testatorId,
        witnessCount: this.props.witnesses.length,
        witnessedAt: new Date(),
      }),
    );
  }

  /**
   * Activate will (make it the current valid will)
   * CRITICAL: Only ONE will can be active per testator
   */
  public activate(): void {
    this.ensureNotDeleted();

    if (!this.status.isWitnessed()) {
      throw new Error('Will must be WITNESSED before activation');
    }

    // Final validation
    this.validate();

    const newStatus = WillStatus.active();
    (this.props as any).status = newStatus;

    this.addDomainEvent(
      new WillActivatedEvent(this.id.toString(), this.getAggregateType(), this.version, {
        testatorId: this.props.testatorId,
        activatedAt: new Date(),
        supersedesWillId: this.props.supersedesWillId,
      }),
    );
  }

  /**
   * Execute will (testator has died)
   */
  public execute(dateOfDeath: Date): void {
    this.ensureNotDeleted();

    if (!this.status.isActive()) {
      throw new Error('Only ACTIVE will can be executed');
    }

    const newStatus = WillStatus.executed();
    (this.props as any).status = newStatus;
    (this.props as any).executedAt = new Date();
    (this.props as any).dateOfDeath = dateOfDeath;

    // Activate all beneficiary assignments
    this.props.beneficiaryAssignments.forEach((assignment) => {
      if (assignment.isPending()) {
        assignment.activate();
      }
    });

    this.addDomainEvent(
      new WillExecutedEvent(this.id.toString(), this.getAggregateType(), this.version, {
        testatorId: this.props.testatorId,
        dateOfDeath,
        executedAt: new Date(),
        beneficiaryCount: this.getActiveBeneficiaries().length,
      }),
    );
  }

  /**
   * Enter probate process
   */
  public enterProbate(caseNumber: string): void {
    this.ensureNotDeleted();

    if (!this.status.isActive() && !this.status.isExecuted()) {
      throw new Error('Only ACTIVE or EXECUTED will can enter probate');
    }

    const newStatus = WillStatus.probate();
    (this.props as any).status = newStatus;
    (this.props as any).probateCaseNumber = caseNumber;

    this.addDomainEvent(
      new WillEnteredProbateEvent(this.id.toString(), this.getAggregateType(), this.version, {
        testatorId: this.props.testatorId,
        caseNumber,
      }),
    );
  }

  // =========================================================================
  // BUSINESS LOGIC - REVOCATION
  // =========================================================================

  /**
   * Revoke will
   */
  public revoke(method: RevocationMethod, reason?: string): void {
    this.ensureNotDeleted();

    if (this.props.isRevoked) {
      throw new Error('Will is already revoked');
    }

    if (this.status.isExecuted()) {
      throw new Error('Cannot revoke EXECUTED will');
    }

    const newStatus = WillStatus.revoked();
    (this.props as any).status = newStatus;
    (this.props as any).isRevoked = true;
    (this.props as any).revocationMethod = method;
    (this.props as any).revokedAt = new Date();
    (this.props as any).revokedReason = reason;

    this.addDomainEvent(
      new WillRevokedEvent(this.id.toString(), this.getAggregateType(), this.version, {
        testatorId: this.props.testatorId,
        revocationMethod: method.value,
        reason,
      }),
    );
  }

  /**
   * Mark as superseded by newer will
   */
  public supersede(newerWillId: string): void {
    this.ensureNotDeleted();

    if (this.status.isExecuted()) {
      throw new Error('Cannot supersede EXECUTED will');
    }

    const newStatus = WillStatus.superseded();
    (this.props as any).status = newStatus;
    (this.props as any).supersededByWillId = newerWillId;

    this.addDomainEvent(
      new WillSupersededEvent(this.id.toString(), this.getAggregateType(), this.version, {
        testatorId: this.props.testatorId,
        supersededByWillId: newerWillId,
      }),
    );
  }

  // =========================================================================
  // BUSINESS LOGIC - CONTEST
  // =========================================================================

  /**
   * Mark will as contested (Section 26 LSA dependant claim)
   */
  public contest(challenger: string, grounds: string): void {
    this.ensureNotDeleted();

    if (!this.status.isActive() && !this.status.isInProbate()) {
      throw new Error('Can only contest ACTIVE or PROBATE wills');
    }

    const newStatus = WillStatus.contested();
    (this.props as any).status = newStatus;

    this.addDomainEvent(
      new WillContestedEvent(this.id.toString(), this.getAggregateType(), this.version, {
        testatorId: this.props.testatorId,
        challenger,
        grounds,
      }),
    );
  }

  // =========================================================================
  // BUSINESS LOGIC - METADATA
  // =========================================================================

  /**
   * Update funeral wishes
   */
  public updateFuneralWishes(wishes: string): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    (this.props as any).funeralWishes = wishes;
  }

  /**
   * Update burial location
   */
  public updateBurialLocation(location: string): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    (this.props as any).burialLocation = location;
  }

  /**
   * Update residuary clause
   */
  public updateResiduaryClause(clause: string): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    (this.props as any).residuaryClause = clause;
  }

  /**
   * Set special instructions
   */
  public setSpecialInstructions(instructions: string): void {
    this.ensureNotDeleted();
    this.ensureEditable();

    (this.props as any).specialInstructions = instructions;
  }

  /**
   * Link to document
   */
  public linkDocument(documentId: string, storageLocation?: string): void {
    this.ensureNotDeleted();

    (this.props as any).originalDocumentId = documentId;
    if (storageLocation) {
      (this.props as any).storageLocation = storageLocation;
    }
  }

  // =========================================================================
  // QUERY METHODS
  // =========================================================================

  public isDraft(): boolean {
    return this.status.isDraft();
  }

  public isActive(): boolean {
    return this.status.isActive();
  }

  public isExecuted(): boolean {
    return this.status.isExecuted();
  }

  public isInProbate(): boolean {
    return this.status.isInProbate();
  }

  public isContested(): boolean {
    return this.status.isContested();
  }

  public canBeModified(): boolean {
    return this.status.isEditable();
  }

  public isFinalized(): boolean {
    return this.status.isFinalized();
  }

  /**
   * Check if will is ready for witnessing
   */
  public isReadyForWitnessing(): { ready: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.hasTestamentaryCapacity) {
      issues.push('Testator lacks testamentary capacity');
    }

    if (this.props.executors.length === 0) {
      issues.push('No executor nominated');
    }

    if (!this.hasEligibleExecutor()) {
      issues.push('No eligible executor');
    }

    if (this.props.beneficiaryAssignments.length === 0) {
      issues.push('No beneficiaries assigned');
    }

    if (!this.hasResiduary()) {
      issues.push('No residuary clause or beneficiary');
    }

    return {
      ready: issues.length === 0,
      issues,
    };
  }

  /**
   * Check if will has residuary provision
   */
  public hasResiduary(): boolean {
    return (
      !!this.props.residuaryClause || this.props.beneficiaryAssignments.some((a) => a.isResiduary())
    );
  }

  /**
   * Get will summary statistics
   */
  public getSummary() {
    return {
      status: this.status.value,
      witnessCount: this.props.witnesses.length,
      verifiedWitnessCount: this.getVerifiedWitnessesCount(),
      executorCount: this.props.executors.length,
      beneficiaryCount: this.getActiveBeneficiaries().length,
      codicilCount: this.getActiveCodicils().length,
      disinheritanceCount: this.props.disinheritanceRecords.filter((d) => d.isActive()).length,
      hasResiduary: this.hasResiduary(),
      totalPercentageAllocated: this.calculateTotalPercentageAllocated(),
      isRevoked: this.props.isRevoked,
      hasTestamentaryCapacity: this.props.hasTestamentaryCapacity,
    };
  }

  // =========================================================================
  // VALIDATION & INVARIANTS
  // =========================================================================

  /**
   * Validate will completeness and business rules
   */
  public validate(): void {
    const errors: string[] = [];

    // Testamentary capacity
    if (!this.props.hasTestamentaryCapacity) {
      errors.push('Testator lacks testamentary capacity');
    }

    // Executors
    if (this.props.executors.length === 0) {
      errors.push('At least one executor must be nominated');
    }

    if (!this.hasEligibleExecutor()) {
      errors.push('At least one eligible executor required');
    }

    // Witnesses (if not draft)
    if (!this.status.isDraft()) {
      if (!this.hasMinimumWitnesses()) {
        errors.push(
          `Section 11 LSA requires ${this.props.type.getMinimumWitnessCount()} witnesses`,
        );
      }

      if (!this.allWitnessesEligible()) {
        errors.push('All witnesses must be eligible (not beneficiaries)');
      }
    }

    // Beneficiaries
    if (this.props.beneficiaryAssignments.length === 0) {
      errors.push('At least one beneficiary must be assigned');
    }

    // Residuary
    if (!this.hasResiduary()) {
      errors.push('Residuary clause or beneficiary required');
    }

    // Percentage validation
    const totalPercentage = this.calculateTotalPercentageAllocated();
    if (totalPercentage > 100) {
      errors.push(`Total percentage allocation is ${totalPercentage}% (max 100%)`);
    }

    if (errors.length > 0) {
      throw new Error(`Will validation failed: ${errors.join('; ')}`);
    }
  }

  /**
   * Apply event (for event sourcing)
   */
  protected applyEvent(event: DomainEvent): void {
    // Event sourcing reconstruction logic
    // This is called when rebuilding aggregate from events
    // Implementation depends on your event store strategy
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  private ensureEditable(): void {
    if (!this.status.isEditable()) {
      throw new Error(
        `Cannot modify will in ${this.status.value} status. Only DRAFT wills can be modified.`,
      );
    }
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toJSON() {
    return {
      id: this.id.toString(),
      testatorId: this.props.testatorId,
      testatorFullName: this.props.testatorFullName,
      status: this.props.status.value,
      type: this.props.type.value,
      versionNumber: this.props.versionNumber,
      title: this.props.title,
      hasTestamentaryCapacity: this.props.hasTestamentaryCapacity,
      capacityAssessmentDate: this.props.capacityAssessmentDate?.toISOString(),
      capacityAssessedBy: this.props.capacityAssessedBy,
      isRevoked: this.props.isRevoked,
      revocationMethod: this.props.revocationMethod?.value,
      revokedAt: this.props.revokedAt?.toISOString(),
      revokedReason: this.props.revokedReason,
      supersedesWillId: this.props.supersedesWillId,
      supersededByWillId: this.props.supersededByWillId,
      funeralWishes: this.props.funeralWishes,
      burialLocation: this.props.burialLocation,
      residuaryClause: this.props.residuaryClause,
      specialInstructions: this.props.specialInstructions,
      executedAt: this.props.executedAt?.toISOString(),
      dateOfDeath: this.props.dateOfDeath?.toISOString(),
      probateCaseNumber: this.props.probateCaseNumber,
      probateGrantedAt: this.props.probateGrantedAt?.toISOString(),
      originalDocumentId: this.props.originalDocumentId,
      storageLocation: this.props.storageLocation,
      witnesses: this.props.witnesses.map((w) => w.toJSON()),
      executors: this.props.executors.map((e) => e.toJSON()),
      beneficiaryAssignments: this.props.beneficiaryAssignments.map((a) => a.toJSON()),
      codicils: this.props.codicils.map((c) => c.toJSON()),
      disinheritanceRecords: this.props.disinheritanceRecords.map((d) => d.toJSON()),
      summary: this.getSummary(),
      readiness: this.isReadyForWitnessing(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version,
    };
  }
}
