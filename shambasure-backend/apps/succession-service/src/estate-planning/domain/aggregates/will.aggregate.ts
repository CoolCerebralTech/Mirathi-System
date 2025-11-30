import { AggregateRoot } from '@nestjs/cqrs';
import { WillStatus } from '@prisma/client';

import { DigitalAssetInstructions, FuneralWishes, Will } from '../entities/will.entity';

/**
 * Will Aggregate Root (Estate Planning - Pre-Death)
 *
 * Manages the lifecycle of a Will and its components during the planning phase.
 * This aggregate is active while the testator is ALIVE and planning their estate.
 *
 * Legal Context:
 * - Law of Succession Act (Cap 160)
 * - Section 5: Testamentary Capacity
 * - Section 11: Formalities of Execution
 * - Section 13: Witness Requirements & Conflicts
 * - Section 26-29: Dependants' Provision
 *
 * Lifecycle: DRAFT → PENDING_WITNESS → WITNESSED → ACTIVE
 *
 * Once testator dies, this Will becomes input to EstateAggregate.
 */
export class WillAggregate extends AggregateRoot {
  // Root Entity
  private _will: Will;

  // Aggregate Children (NOT the actual entities, just their IDs for consistency boundary)
  // The actual entities are managed separately but validated here
  private _assetIds: Set<string> = new Set();
  private _beneficiaryIds: Set<string> = new Set();
  private _executorIds: Set<string> = new Set();
  private _witnessIds: Set<string> = new Set();

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(will: Will) {
    super();
    if (!will) throw new Error('Will entity is required');
    this._will = will;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(willId: string, title: string, testatorId: string): WillAggregate {
    const will = Will.create(willId, title, testatorId);
    const aggregate = new WillAggregate(will);

    // Events are emitted by the Will entity itself
    return aggregate;
  }

  static reconstitute(
    will: Will,
    assetIds: string[],
    beneficiaryIds: string[],
    executorIds: string[],
    witnessIds: string[],
  ): WillAggregate {
    const aggregate = new WillAggregate(will);

    aggregate._assetIds = new Set(assetIds);
    aggregate._beneficiaryIds = new Set(beneficiaryIds);
    aggregate._executorIds = new Set(executorIds);
    aggregate._witnessIds = new Set(witnessIds);

    return aggregate;
  }

  // --------------------------------------------------------------------------
  // ROOT ENTITY ACCESS
  // --------------------------------------------------------------------------

  getWill(): Will {
    return this._will;
  }

  get willId(): string {
    return this._will.id;
  }

  get testatorId(): string {
    return this._will.testatorId;
  }

  get status(): WillStatus {
    return this._will.status;
  }

  // --------------------------------------------------------------------------
  // WILL METADATA OPERATIONS
  // --------------------------------------------------------------------------

  updateTitle(title: string): void {
    this._will.updateTitle(title);
  }

  updateWillDetails(
    funeralWishes?: FuneralWishes,
    burialLocation?: string,
    cremationInstructions?: string,
    organDonation?: boolean,
    organDonationDetails?: string,
    residuaryClause?: string,
    digitalAssetInstructions?: DigitalAssetInstructions,
    specialInstructions?: string,
  ): void {
    this._will.updateDetails(
      funeralWishes,
      burialLocation,
      cremationInstructions,
      organDonation,
      organDonationDetails,
      residuaryClause,
      digitalAssetInstructions,
      specialInstructions,
    );
  }

  // --------------------------------------------------------------------------
  // ASSET ASSIGNMENT (Aggregate Consistency Boundary)
  // --------------------------------------------------------------------------

  /**
   * Links an asset to this will for distribution planning.
   * Note: Asset entity itself is managed by EstatePlanningAggregate.
   * This aggregate just tracks which assets are referenced in the will.
   */
  addAssetReference(assetId: string, assetOwnerId: string): void {
    if (!this._will.isEditable()) {
      throw new Error('Will is not editable in current status');
    }

    if (assetOwnerId !== this.testatorId) {
      throw new Error('Cannot reference asset not owned by testator');
    }

    if (this._assetIds.has(assetId)) {
      return; // Idempotent
    }

    this._assetIds.add(assetId);
    this._will.addAsset(assetId); // Sync with root entity
  }

  removeAssetReference(assetId: string): void {
    if (!this._will.isEditable()) {
      throw new Error('Will is not editable in current status');
    }

    // Prevent removal if beneficiaries depend on this asset
    const dependentBeneficiaries = Array.from(this._beneficiaryIds);
    if (dependentBeneficiaries.length > 0) {
      // Note: We can't check BeneficiaryAssignment entities here without loading them
      // This validation should happen at application service level
      throw new Error(
        'Cannot remove asset reference with existing beneficiary assignments. Remove beneficiaries first.',
      );
    }

    this._assetIds.delete(assetId);
    this._will.removeAsset(assetId);
  }

  hasAssetReference(assetId: string): boolean {
    return this._assetIds.has(assetId);
  }

  getAssetReferences(): string[] {
    return Array.from(this._assetIds);
  }

  getAssetCount(): number {
    return this._assetIds.size;
  }

  // --------------------------------------------------------------------------
  // BENEFICIARY ASSIGNMENT (Aggregate Consistency)
  // --------------------------------------------------------------------------

  /**
   * Registers a beneficiary assignment.
   * Actual BeneficiaryAssignment entity is managed separately.
   */
  addBeneficiaryAssignment(assignmentId: string, assetId: string): void {
    if (!this._will.isEditable()) {
      throw new Error('Will is not editable in current status');
    }

    if (!this._assetIds.has(assetId)) {
      throw new Error('Asset not referenced in will. Add asset reference first.');
    }

    if (this._beneficiaryIds.has(assignmentId)) {
      return; // Idempotent
    }

    this._beneficiaryIds.add(assignmentId);
    this._will.addBeneficiary(assignmentId);
  }

  removeBeneficiaryAssignment(assignmentId: string): void {
    if (!this._will.isEditable()) {
      throw new Error('Will is not editable in current status');
    }

    this._beneficiaryIds.delete(assignmentId);
    this._will.removeBeneficiary(assignmentId);
  }

  getBeneficiaryAssignmentIds(): string[] {
    return Array.from(this._beneficiaryIds);
  }

  getBeneficiaryCount(): number {
    return this._beneficiaryIds.size;
  }

  // --------------------------------------------------------------------------
  // EXECUTOR NOMINATION (Kenyan Law - Section 51)
  // --------------------------------------------------------------------------

  nominateExecutor(executorId: string): void {
    if (!this._will.isEditable()) {
      throw new Error('Will is not editable in current status');
    }

    if (this._executorIds.has(executorId)) {
      return; // Idempotent
    }

    // Kenyan Law: Maximum 4 executors (Section 51(1))
    if (this._executorIds.size >= 4) {
      throw new Error('Maximum 4 executors allowed (Law of Succession Act, Section 51)');
    }

    // Primary executor validation happens at Executor entity level
    this._executorIds.add(executorId);
    this._will.addExecutor(executorId);
  }

  removeExecutor(executorId: string): void {
    if (!this._will.isEditable()) {
      throw new Error('Will is not editable in current status');
    }

    this._executorIds.delete(executorId);
    this._will.removeExecutor(executorId);
  }

  getExecutorIds(): string[] {
    return Array.from(this._executorIds);
  }

  getExecutorCount(): number {
    return this._executorIds.size;
  }

  hasMinimumExecutors(): boolean {
    return this._executorIds.size >= 1;
  }

  // --------------------------------------------------------------------------
  // WITNESS MANAGEMENT (Kenyan Law - Section 13)
  // --------------------------------------------------------------------------

  addWitness(witnessId: string): void {
    if (!this._will.canAddWitnesses()) {
      throw new Error('Cannot add witnesses in current will status');
    }

    if (this._witnessIds.has(witnessId)) {
      return; // Idempotent
    }

    this._witnessIds.add(witnessId);
    this._will.addWitness(witnessId);
  }

  removeWitness(witnessId: string): void {
    if (!this._will.isEditable()) {
      throw new Error('Will is not editable in current status');
    }

    this._witnessIds.delete(witnessId);
    this._will.removeWitness(witnessId);
  }

  getWitnessIds(): string[] {
    return Array.from(this._witnessIds);
  }

  getWitnessCount(): number {
    return this._witnessIds.size;
  }

  hasMinimumWitnesses(): boolean {
    return this._will.hasMinimumWitnesses();
  }

  // --------------------------------------------------------------------------
  // VALIDATION & BUSINESS RULES
  // --------------------------------------------------------------------------

  /**
   * Validates will completeness for activation.
   * This is the aggregate-level validation that checks ALL components.
   */
  validateForActivation(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // 1. Legal Capacity (Section 5)
    if (!this._will.hasLegalCapacity()) {
      issues.push('Testator legal capacity not assessed as competent (Section 5)');
    }

    // 2. Formalities (Section 11)
    if (!this._will.meetsKenyanLegalRequirements()) {
      issues.push('Will does not meet Kenyan legal formalities (Section 11)');
    }

    // 3. Content Requirements
    if (this._assetIds.size === 0) {
      issues.push('No assets assigned to will');
    }

    if (this._beneficiaryIds.size === 0) {
      issues.push('No beneficiaries assigned');
    }

    if (this._executorIds.size === 0) {
      issues.push('At least one executor required');
    }

    // 4. Witness Requirements (Section 13)
    if (!this.hasMinimumWitnesses()) {
      issues.push('Minimum 2 witnesses required (Section 13)');
    }

    // 5. Status Check
    if (this._will.status !== WillStatus.WITNESSED) {
      issues.push(`Will must be in WITNESSED status to activate (current: ${this._will.status})`);
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Validates will completeness for witnessing.
   */
  validateForWitnessing(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this._assetIds.size === 0) {
      issues.push('No assets assigned');
    }

    if (this._beneficiaryIds.size === 0) {
      issues.push('No beneficiaries assigned');
    }

    if (this._executorIds.size === 0) {
      issues.push('No executors nominated');
    }

    if (!this.hasMinimumWitnesses()) {
      issues.push('Minimum 2 witnesses required');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Marks will as witnessed after all witnesses have signed.
   * Section 13(c): Witnesses must attest in presence of testator.
   */
  markAsWitnessed(): void {
    const validation = this.validateForWitnessing();
    if (!validation.isValid) {
      throw new Error(`Cannot mark as witnessed: ${validation.issues.join(', ')}`);
    }

    this._will.markAsWitnessed();
  }

  /**
   * Activates the will, making it the current valid will.
   * Section 11: Will must be properly executed to be valid.
   */
  activate(activatedBy: string): void {
    const validation = this.validateForActivation();
    if (!validation.isValid) {
      throw new Error(`Cannot activate will: ${validation.issues.join(', ')}`);
    }

    this._will.activate(activatedBy);
  }

  /**
   * Revokes the will per Section 16.
   */
  revoke(revokedBy: string, reason: string, method: any): void {
    this._will.revoke(revokedBy, reason, method);
  }

  /**
   * Supersedes this will with a newer one.
   */
  supersede(newWillId: string): void {
    this._will.supersede(newWillId);
  }

  // --------------------------------------------------------------------------
  // AGGREGATE STATE QUERIES
  // --------------------------------------------------------------------------

  isEditable(): boolean {
    return this._will.isEditable();
  }

  isActive(): boolean {
    return this._will.status === WillStatus.ACTIVE;
  }

  isRevoked(): boolean {
    return this._will.isRevoked;
  }

  canBeExecuted(): boolean {
    return this._will.status === WillStatus.ACTIVE && !this._will.isRevoked;
  }

  /**
   * Summary for display purposes.
   */
  getSummary(): {
    willId: string;
    title: string;
    status: WillStatus;
    testatorId: string;
    assetCount: number;
    beneficiaryCount: number;
    executorCount: number;
    witnessCount: number;
    isComplete: boolean;
    canActivate: boolean;
  } {
    const validation = this.validateForActivation();

    return {
      willId: this._will.id,
      title: this._will.title,
      status: this._will.status,
      testatorId: this._will.testatorId,
      assetCount: this._assetIds.size,
      beneficiaryCount: this._beneficiaryIds.size,
      executorCount: this._executorIds.size,
      witnessCount: this._witnessIds.size,
      isComplete: validation.isValid,
      canActivate: validation.isValid && this._will.status === WillStatus.WITNESSED,
    };
  }
}
