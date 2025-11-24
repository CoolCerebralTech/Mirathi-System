import { AggregateRoot } from '@nestjs/cqrs';
import { WillStatus, BequestType } from '@prisma/client';
import { Will, FuneralWishes, DigitalAssetInstructions } from '../entities/will.entity';
import { Asset } from '../entities/asset.entity';
import { BeneficiaryAssignment } from '../entities/beneficiary.entity';
import { Executor } from '../entities/executor.entity';
import { Witness } from '../entities/witness.entity';
import { LegalCapacity } from '../value-objects/legal-capacity.vo';
import { SharePercentage } from '../value-objects/share-percentage.vo';
import { KENYAN_LEGAL_REQUIREMENTS } from '../../../common/constants/kenyan-law.constants';

/**
 * Will Aggregate Root - Main Aggregate for Kenyan Succession Law Compliance
 *
 * Orchestrates the complete will creation and management process including:
 * - Asset inventory management and validation
 * - Beneficiary assignment with percentage validation
 * - Executor nomination with Kenyan legal limits
 * - Witness management with eligibility checks
 * - Comprehensive legal compliance validation
 * - Will lifecycle state transitions
 *
 * @class WillAggregate
 * @extends {AggregateRoot}
 */
export class WillAggregate extends AggregateRoot {
  // Root Entity
  private _will: Will;

  // Aggregate Children (Entities within the Aggregate boundary)
  private _assets: Map<string, Asset> = new Map();
  private _beneficiaries: Map<string, BeneficiaryAssignment> = new Map();
  private _executors: Map<string, Executor> = new Map();
  private _witnesses: Map<string, Witness> = new Map();

  // --------------------------------------------------------------------------
  // PRIVATE CONSTRUCTOR - Enforces use of factory methods
  // --------------------------------------------------------------------------
  private constructor(will: Will) {
    super();
    this._will = will;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS - Aggregate Lifecycle Management
  // --------------------------------------------------------------------------

  /**
   * Creates a new Will Aggregate with legal capacity validation
   *
   * @static
   * @param {string} willId - Unique will identifier
   * @param {string} title - Descriptive title of the will
   * @param {string} testatorId - ID of the testator (will creator)
   * @param {LegalCapacity} legalCapacity - Legal capacity assessment
   * @returns {WillAggregate} Newly created will aggregate
   */
  static create(
    willId: string,
    title: string,
    testatorId: string,
    legalCapacity: LegalCapacity,
  ): WillAggregate {
    const will = Will.create(willId, title, testatorId, legalCapacity);
    return new WillAggregate(will);
  }

  /**
   * Reconstructs Will Aggregate from persistence layer data
   *
   * @static
   * @param {Will} will - Root will entity
   * @param {Asset[]} assets - Associated assets
   * @param {BeneficiaryAssignment[]} beneficiaries - Beneficiary assignments
   * @param {Executor[]} executors - Nominated executors
   * @param {Witness[]} witnesses - Will witnesses
   * @returns {WillAggregate} Rehydrated will aggregate
   */
  static reconstitute(
    will: Will,
    assets: Asset[],
    beneficiaries: BeneficiaryAssignment[],
    executors: Executor[],
    witnesses: Witness[],
  ): WillAggregate {
    const aggregate = new WillAggregate(will);

    // Hydrate aggregate children with validation
    assets.forEach((asset) => aggregate._assets.set(asset.id, asset));
    beneficiaries.forEach((beneficiary) =>
      aggregate._beneficiaries.set(beneficiary.id, beneficiary),
    );
    executors.forEach((executor) => aggregate._executors.set(executor.id, executor));
    witnesses.forEach((witness) => aggregate._witnesses.set(witness.id, witness));

    return aggregate;
  }

  // --------------------------------------------------------------------------
  // ROOT ENTITY ACCESS & MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Gets the root Will entity (read-only)
   *
   * @returns {Will} Root will entity
   */
  getWill(): Will {
    return this._will;
  }

  /**
   * Updates will details with comprehensive validation
   *
   * @param {string} title - Updated will title
   * @param {FuneralWishes} [funeralWishes] - Funeral and burial instructions
   * @param {string} [burialLocation] - Preferred burial location
   * @param {string} [residuaryClause] - Residuary estate instructions
   * @param {DigitalAssetInstructions} [digitalAssetInstructions] - Digital asset handling
   * @param {string} [specialInstructions] - Special testamentary instructions
   * @throws {Error} When will is not in editable state
   */
  updateWillDetails(
    title: string,
    funeralWishes?: FuneralWishes,
    burialLocation?: string,
    residuaryClause?: string,
    digitalAssetInstructions?: DigitalAssetInstructions,
    specialInstructions?: string,
  ): void {
    this.validateAggregateModificationAllowed();

    this._will.updateTitle(title);
    this._will.updateDetails(
      funeralWishes,
      burialLocation,
      residuaryClause,
      digitalAssetInstructions,
      specialInstructions,
    );
  }

  // --------------------------------------------------------------------------
  // AGGREGATE CHILDREN ACCESSORS (Read-Only)
  // --------------------------------------------------------------------------

  /**
   * Gets all assets in the will (read-only)
   *
   * @returns {Asset[]} Array of asset entities
   */
  getAssets(): Asset[] {
    return Array.from(this._assets.values());
  }

  /**
   * Gets all beneficiary assignments (read-only)
   *
   * @returns {BeneficiaryAssignment[]} Array of beneficiary assignment entities
   */
  getBeneficiaries(): BeneficiaryAssignment[] {
    return Array.from(this._beneficiaries.values());
  }

  /**
   * Gets all nominated executors (read-only)
   *
   * @returns {Executor[]} Array of executor entities
   */
  getExecutors(): Executor[] {
    return Array.from(this._executors.values());
  }

  /**
   * Gets all witnesses (read-only)
   *
   * @returns {Witness[]} Array of witness entities
   */
  getWitnesses(): Witness[] {
    return Array.from(this._witnesses.values());
  }

  // --------------------------------------------------------------------------
  // ASSET MANAGEMENT - Domain Logic
  // --------------------------------------------------------------------------

  /**
   * Adds asset to will with ownership validation
   *
   * @param {Asset} asset - Asset entity to add
   * @throws {Error} When asset already exists or ownership doesn't match testator
   */
  addAsset(asset: Asset): void {
    this.validateAggregateModificationAllowed();

    if (this._assets.has(asset.id)) {
      throw new Error(`Asset ${asset.id} already exists in this will`);
    }

    // Ownership consistency validation
    if (asset.ownerId !== this._will.testatorId) {
      throw new Error('Asset owner does not match testator');
    }

    this._assets.set(asset.id, asset);
  }

  /**
   * Removes asset from will with dependency validation
   *
   * @param {string} assetId - Unique identifier of asset to remove
   * @throws {Error} When asset not found or has beneficiary assignments
   */
  removeAsset(assetId: string): void {
    this.validateAggregateModificationAllowed();

    if (!this._assets.has(assetId)) {
      throw new Error(`Asset ${assetId} not found in this will`);
    }

    // Consistency validation: Cannot remove asset with beneficiary assignments
    const assetBeneficiaries = Array.from(this._beneficiaries.values()).filter(
      (beneficiary) => beneficiary.assetId === assetId,
    );

    if (assetBeneficiaries.length > 0) {
      throw new Error(
        `Cannot remove asset ${assetId} because it has ${assetBeneficiaries.length} beneficiary assignments. Remove assignments first.`,
      );
    }

    this._assets.delete(assetId);
  }

  // --------------------------------------------------------------------------
  // BENEFICIARY MANAGEMENT - Domain Logic
  // --------------------------------------------------------------------------

  /**
   * Assigns beneficiary to asset with comprehensive validation
   *
   * @param {BeneficiaryAssignment} assignment - Beneficiary assignment to add
   * @throws {Error} When asset not found, assignment exists, or percentage invalid
   */
  assignBeneficiary(assignment: BeneficiaryAssignment): void {
    this.validateAggregateModificationAllowed();

    const assetId = assignment.assetId;

    if (!this._assets.has(assetId)) {
      throw new Error(`Asset ${assetId} not found in this will. Cannot assign beneficiary`);
    }

    if (this._beneficiaries.has(assignment.id)) {
      throw new Error(`Beneficiary Assignment ${assignment.id} already exists`);
    }

    // Percentage allocation validation for percentage-based bequests
    const sharePercentage = assignment.sharePercentage;
    if (assignment.bequestType === BequestType.PERCENTAGE && sharePercentage) {
      this.validateTotalPercentageAllocation(assetId, sharePercentage);
    }

    this._beneficiaries.set(assignment.id, assignment);
  }

  /**
   * Removes beneficiary assignment from will
   *
   * @param {string} assignmentId - Unique identifier of assignment to remove
   * @throws {Error} When assignment not found
   */
  removeBeneficiary(assignmentId: string): void {
    this.validateAggregateModificationAllowed();

    if (!this._beneficiaries.has(assignmentId)) {
      throw new Error(`Beneficiary assignment ${assignmentId} not found`);
    }

    this._beneficiaries.delete(assignmentId);
  }

  /**
   * Updates beneficiary share percentage with validation
   *
   * @param {string} assignmentId - Unique identifier of beneficiary assignment
   * @param {SharePercentage} newShare - New share percentage value
   * @throws {Error} When assignment not found or validation fails
   */
  updateBeneficiaryShare(assignmentId: string, newShare: SharePercentage): void {
    this.validateAggregateModificationAllowed();

    const assignment = this._beneficiaries.get(assignmentId);
    if (!assignment) {
      throw new Error(`Beneficiary assignment ${assignmentId} not found`);
    }

    if (assignment.bequestType !== BequestType.PERCENTAGE) {
      throw new Error('Cannot update share percentage for non-percentage bequest type');
    }

    // Validate total percentage doesn't exceed 100%
    this.validateTotalPercentageAllocation(assignment.assetId, newShare, assignmentId);

    // Update the assignment
    assignment.updateShare(newShare);
  }

  // --------------------------------------------------------------------------
  // EXECUTOR MANAGEMENT - Domain Logic
  // --------------------------------------------------------------------------

  /**
   * Nominates executor with Kenyan legal compliance validation
   *
   * @param {Executor} executor - Executor entity to nominate
   * @throws {Error} When executor limit exceeded or primary executor conflict
   */
  nominateExecutor(executor: Executor): void {
    this.validateAggregateModificationAllowed();

    if (this._executors.has(executor.id)) {
      throw new Error(`Executor ${executor.id} already nominated`);
    }

    // Kenyan legal requirement: Maximum executor limit
    if (this._executors.size >= KENYAN_LEGAL_REQUIREMENTS.EXECUTOR_REQUIREMENTS.MAX_EXECUTORS) {
      throw new Error(
        `Cannot nominate more than ${KENYAN_LEGAL_REQUIREMENTS.EXECUTOR_REQUIREMENTS.MAX_EXECUTORS} executors under Kenyan law`,
      );
    }

    // Business Rule: Single primary executor
    if (executor.isPrimary) {
      const existingPrimary = Array.from(this._executors.values()).find((exec) => exec.isPrimary);
      if (existingPrimary) {
        throw new Error('There can only be one primary executor per will');
      }
    }

    this._executors.set(executor.id, executor);
  }

  // --------------------------------------------------------------------------
  // WITNESS MANAGEMENT - Domain Logic
  // --------------------------------------------------------------------------

  /**
   * Adds witness to will with basic validation
   *
   * @param {Witness} witness - Witness entity to add
   * @throws {Error} When witness already exists or validation fails
   */
  addWitness(witness: Witness): void {
    this.validateAggregateModificationAllowed();

    if (this._witnesses.has(witness.id)) {
      throw new Error(`Witness ${witness.id} already added`);
    }

    // Basic witness validation
    if (!witness.witnessInfo.fullName?.trim()) {
      throw new Error('Witness must have a valid full name');
    }

    this._witnesses.set(witness.id, witness);

    // Update root entity state
    this._will.addWitness(witness.id);
  }

  /**
   * Removes witness from will with signing validation
   *
   * @param {string} witnessId - Unique identifier of witness to remove
   * @throws {Error} When witness not found or has already signed
   */
  removeWitness(witnessId: string): void {
    this.validateAggregateModificationAllowed();

    if (!this._witnesses.has(witnessId)) {
      throw new Error(`Witness ${witnessId} not found`);
    }

    const witness = this._witnesses.get(witnessId);
    if (witness?.hasSigned()) {
      throw new Error('Cannot remove a witness who has already signed the will');
    }

    this._witnesses.delete(witnessId);
    this._will.removeWitness(witnessId);
  }

  // --------------------------------------------------------------------------
  // DOMAIN VALIDATION & BUSINESS RULES
  // --------------------------------------------------------------------------

  /**
   * Validates total percentage allocation for an asset
   *
   * @private
   * @param {string} assetId - Asset identifier to validate
   * @param {SharePercentage} newShare - New share percentage being added
   * @param {string} [excludeAssignmentId] - Assignment ID to exclude from calculation
   * @throws {Error} When total percentage exceeds 100%
   */
  private validateTotalPercentageAllocation(
    assetId: string,
    newShare: SharePercentage,
    excludeAssignmentId?: string,
  ): void {
    const assetAssignments = Array.from(this._beneficiaries.values()).filter(
      (assignment) => assignment.assetId === assetId && assignment.id !== excludeAssignmentId,
    );

    const existingShares = assetAssignments
      .filter(
        (assignment) =>
          assignment.bequestType === BequestType.PERCENTAGE && assignment.sharePercentage,
      )
      .map((assignment) => assignment.sharePercentage!);

    const allShares = [...existingShares, newShare];

    // Use Value Object's static validation method
    if (!SharePercentage.totalIsValid(allShares)) {
      const total = allShares.reduce((sum, share) => sum + share.getValue(), 0);
      throw new Error(
        `Total percentage allocation for asset ${assetId} exceeds 100% (Current: ${total.toFixed(2)}%)`,
      );
    }
  }

  /**
   * Validates that aggregate modification is allowed in current state
   *
   * @private
   * @throws {Error} When aggregate is not in modifiable state
   */
  private validateAggregateModificationAllowed(): void {
    if (!this._will.isEditable()) {
      throw new Error(`Cannot modify will aggregate in current status: ${this._will.status}`);
    }
  }

  /**
   * Comprehensive validation of will completeness for activation
   *
   * @returns {{ isValid: boolean; issues: string[] }} Validation result with detailed issues
   */
  validateWillCompleteness(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // 1. Testator Legal Capacity Validation (Section 7)
    if (!this._will.legalCapacity?.hasLegalCapacity()) {
      issues.push('Testator does not have verified legal capacity to create a valid will');
    }

    // 2. Core Content Validation
    if (this._assets.size === 0) {
      issues.push('Will has no assets assigned for distribution');
    }

    if (this._beneficiaries.size === 0) {
      issues.push('Will has no beneficiaries assigned to receive assets');
    }

    if (this._executors.size === 0) {
      issues.push('Will has no executors nominated to administer the estate');
    }

    // 3. Kenyan Witness Requirements Validation
    if (this._will.status === WillStatus.WITNESSED || this._will.status === WillStatus.ACTIVE) {
      const signedWitnessCount = Array.from(this._witnesses.values()).filter((witness) =>
        witness.hasSigned(),
      ).length;

      if (signedWitnessCount < KENYAN_LEGAL_REQUIREMENTS.MINIMUM_WITNESSES) {
        issues.push(
          `Kenyan law requires at least ${KENYAN_LEGAL_REQUIREMENTS.MINIMUM_WITNESSES} signed witnesses, but only ${signedWitnessCount} have signed`,
        );
      }
    }

    // 4. Asset Allocation Integrity Validation
    for (const asset of this._assets.values()) {
      const assetAssignments = Array.from(this._beneficiaries.values()).filter(
        (assignment) => assignment.assetId === asset.id,
      );

      if (assetAssignments.length === 0) {
        issues.push(`Asset '${asset.name}' has no beneficiaries assigned`);
        continue;
      }

      // Percentage allocation validation
      const percentageAssignments = assetAssignments.filter(
        (assignment) => assignment.bequestType === BequestType.PERCENTAGE,
      );

      if (percentageAssignments.length > 0) {
        const totalPercentage = percentageAssignments.reduce(
          (sum, assignment) => sum + (assignment.sharePercentage?.getValue() || 0),
          0,
        );

        // Allow for small floating-point precision differences
        if (Math.abs(totalPercentage - 100) > 0.01) {
          issues.push(
            `Asset '${asset.name}' percentage allocation is ${totalPercentage.toFixed(2)}%, but must total exactly 100%`,
          );
        }
      }
    }

    // 5. Witness-Beneficiary Conflict Validation
    if (this.hasWitnessBeneficiaryConflicts()) {
      issues.push(
        'Witnesses cannot also be beneficiaries due to conflict of interest under Kenyan law',
      );
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // --------------------------------------------------------------------------
  // AGGREGATE STATE TRANSITIONS & LIFECYCLE MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Activates the will making it the current valid will
   *
   * @param {string} activatedBy - ID of user/admin activating the will
   * @throws {Error} When will completeness validation fails
   */
  activate(activatedBy: string): void {
    const validationResult = this.validateWillCompleteness();
    if (!validationResult.isValid) {
      throw new Error(
        `Cannot activate will. Validation issues: ${validationResult.issues.join('; ')}`,
      );
    }

    this._will.activate(activatedBy);
  }

  // --------------------------------------------------------------------------
  // DOMAIN CALCULATIONS & BUSINESS LOGIC QUERIES
  // --------------------------------------------------------------------------

  /**
   * Calculates total estate value across all assets
   *
   * @returns {number} Total estate value in default currency
   */
  getTotalEstateValue(): number {
    return Array.from(this._assets.values()).reduce((total, asset) => {
      return total + asset.currentValue.getAmount();
    }, 0);
  }

  /**
   * Determines if will is ready for witnessing process
   *
   * @returns {boolean} True if ready for witnessing
   */
  isReadyForWitnessing(): boolean {
    const validation = this.validateWillCompleteness();
    return validation.isValid && this._will.isDraft();
  }

  /**
   * Determines if will is ready for activation
   *
   * @returns {boolean} True if ready for activation
   */
  isReadyForActivation(): boolean {
    const validation = this.validateWillCompleteness();
    return validation.isValid && this._will.isWitnessed() && this._will.canBeActivated();
  }

  /**
   * Finds the primary executor for the will
   *
   * @returns {Executor | null} Primary executor or null if not found
   */
  getPrimaryExecutor(): Executor | null {
    return Array.from(this._executors.values()).find((executor) => executor.isPrimary) || null;
  }

  /**
   * Gets all witnesses who have signed the will
   *
   * @returns {Witness[]} Array of signed witness entities
   */
  getSignedWitnesses(): Witness[] {
    return Array.from(this._witnesses.values()).filter((witness) => witness.hasSigned());
  }

  /**
   * Checks for witness-beneficiary conflicts under Kenyan law
   *
   * @returns {boolean} True if conflicts exist
   */
  hasWitnessBeneficiaryConflicts(): boolean {
    const witnesses = Array.from(this._witnesses.values());
    const beneficiaries = Array.from(this._beneficiaries.values());

    for (const witness of witnesses) {
      const witnessInfo = witness.witnessInfo;

      for (const beneficiary of beneficiaries) {
        const beneficiaryIdentity = beneficiary.beneficiaryIdentity;

        // Check for user ID match
        if (
          witnessInfo.userId &&
          beneficiaryIdentity.userId &&
          witnessInfo.userId === beneficiaryIdentity.userId
        ) {
          return true;
        }

        // Check for family member ID match
        if (
          witnessInfo.userId &&
          beneficiaryIdentity.familyMemberId &&
          witnessInfo.userId === beneficiaryIdentity.familyMemberId
        )
          return true;

        // Check for external name match (case-insensitive)
        if (
          witnessInfo.fullName &&
          beneficiaryIdentity.externalName &&
          witnessInfo.fullName.toLowerCase() === beneficiaryIdentity.externalName.toLowerCase()
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Gets specific asset by ID
   *
   * @param {string} assetId - Unique asset identifier
   * @returns {Asset | null} Asset entity or null if not found
   */
  getAsset(assetId: string): Asset | null {
    return this._assets.get(assetId) || null;
  }

  /**
   * Gets all beneficiary assignments for a specific asset
   *
   * @param {string} assetId - Unique asset identifier
   * @returns {BeneficiaryAssignment[]} Array of beneficiary assignments
   */
  getBeneficiariesForAsset(assetId: string): BeneficiaryAssignment[] {
    return Array.from(this._beneficiaries.values()).filter(
      (beneficiary) => beneficiary.assetId === assetId,
    );
  }
}
