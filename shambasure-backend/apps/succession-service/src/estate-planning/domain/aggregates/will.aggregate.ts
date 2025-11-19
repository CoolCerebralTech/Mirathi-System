import { AggregateRoot } from '@nestjs/cqrs';
import { WillStatus, BequestType } from '@prisma/client';
import { Will, FuneralWishes, DigitalAssetInstructions } from '../entities/will.entity';
import { Asset } from '../entities/asset.entity';
// Corrected Import: BeneficiaryAssignment
import { BeneficiaryAssignment } from '../entities/beneficiary.entity';
import { Executor } from '../entities/executor.entity';
import { Witness } from '../entities/witness.entity';
import { LegalCapacity } from '../value-objects/legal-capacity.vo';
import { SharePercentage } from '../value-objects/share-percentage.vo';
import { KENYAN_LEGAL_REQUIREMENTS } from '../../../common/constants/kenyan-law.constants';

export class WillAggregate extends AggregateRoot {
  private will: Will;
  // Maps for efficient O(1) lookup
  private assets: Map<string, Asset> = new Map();
  private beneficiaries: Map<string, BeneficiaryAssignment> = new Map();
  private executors: Map<string, Executor> = new Map();
  private witnesses: Map<string, Witness> = new Map();

  private constructor(will: Will) {
    super();
    this.will = will;
  }

  // --------------------------------------------------------------------------
  // FACTORY
  // --------------------------------------------------------------------------
  static create(
    willId: string,
    title: string,
    testatorId: string,
    legalCapacity: LegalCapacity,
  ): WillAggregate {
    const will = Will.create(willId, title, testatorId, legalCapacity);
    // In a full event sourced system, we'd capture the event from 'will' and merge it
    return new WillAggregate(will);
  }

  // Used to rehydrate from persistence
  static reconstitute(
    will: Will,
    assets: Asset[],
    beneficiaries: BeneficiaryAssignment[],
    executors: Executor[],
    witnesses: Witness[],
  ): WillAggregate {
    const aggregate = new WillAggregate(will);
    assets.forEach((a) => aggregate.assets.set(a.getId(), a));
    beneficiaries.forEach((b) => aggregate.beneficiaries.set(b.getId(), b));
    executors.forEach((e) => aggregate.executors.set(e.getId(), e));
    witnesses.forEach((w) => aggregate.witnesses.set(w.getId(), w));
    return aggregate;
  }

  // --------------------------------------------------------------------------
  // WILL ROOT METHODS
  // --------------------------------------------------------------------------
  getWill(): Will {
    return this.will;
  }

  updateWillDetails(
    title: string,
    funeralWishes?: FuneralWishes,
    burialLocation?: string,
    residuaryClause?: string,
    digitalAssetInstructions?: DigitalAssetInstructions,
    specialInstructions?: string,
  ): void {
    this.will.updateTitle(title);
    this.will.updateDetails(
      funeralWishes,
      burialLocation,
      residuaryClause,
      digitalAssetInstructions,
      specialInstructions,
    );
  }

  // --------------------------------------------------------------------------
  // ASSET MANAGEMENT
  // --------------------------------------------------------------------------
  addAsset(asset: Asset): void {
    if (this.assets.has(asset.getId())) {
      throw new Error(`Asset ${asset.getId()} already exists in this will.`);
    }
    // Ownership check
    if (asset.getOwnerId() !== this.will.getTestatorId()) {
      throw new Error('Asset owner does not match testator.');
    }

    this.assets.set(asset.getId(), asset);
  }

  removeAsset(assetId: string): void {
    if (!this.assets.has(assetId)) {
      throw new Error(`Asset ${assetId} not found in this will.`);
    }

    // Consistency check: Cannot remove asset if it has assigned beneficiaries
    const assetBeneficiaries = Array.from(this.beneficiaries.values()).filter(
      (b) => b.getAssetId() === assetId,
    );

    if (assetBeneficiaries.length > 0) {
      throw new Error(
        `Cannot remove asset ${assetId} because it has assigned beneficiaries. Remove assignments first.`,
      );
    }

    this.assets.delete(assetId);
  }

  // --------------------------------------------------------------------------
  // BENEFICIARY MANAGEMENT
  // --------------------------------------------------------------------------
  assignBeneficiary(assignment: BeneficiaryAssignment): void {
    const assetId = assignment.getAssetId();

    if (!this.assets.has(assetId)) {
      throw new Error(`Asset ${assetId} not found in this will. Cannot assign beneficiary.`);
    }

    if (this.beneficiaries.has(assignment.getId())) {
      throw new Error(`Beneficiary Assignment ${assignment.getId()} already exists.`);
    }

    // Percentage Validation
    if (assignment.getBequestType() === BequestType.PERCENTAGE && assignment.getSharePercentage()) {
      this.validateTotalPercentage(assetId, assignment.getSharePercentage()!);
    }

    this.beneficiaries.set(assignment.getId(), assignment);
  }

  removeBeneficiary(assignmentId: string): void {
    if (!this.beneficiaries.has(assignmentId)) {
      throw new Error(`Beneficiary assignment ${assignmentId} not found.`);
    }
    this.beneficiaries.delete(assignmentId);
  }

  // --------------------------------------------------------------------------
  // EXECUTOR MANAGEMENT
  // --------------------------------------------------------------------------
  nominateExecutor(executor: Executor): void {
    if (this.executors.has(executor.getId())) {
      throw new Error(`Executor ${executor.getId()} already nominated.`);
    }

    // Business Rule: Max Executors
    if (this.executors.size >= KENYAN_LEGAL_REQUIREMENTS.EXECUTOR_REQUIREMENTS.MAX_EXECUTORS) {
      throw new Error(
        `Cannot nominate more than ${KENYAN_LEGAL_REQUIREMENTS.EXECUTOR_REQUIREMENTS.MAX_EXECUTORS} executors.`,
      );
    }

    // Business Rule: Single Primary
    if (executor.getIsPrimary()) {
      const existingPrimary = Array.from(this.executors.values()).find((exec) =>
        exec.getIsPrimary(),
      );
      if (existingPrimary) {
        throw new Error('There can only be one primary executor.');
      }
    }

    this.executors.set(executor.getId(), executor);
  }

  // --------------------------------------------------------------------------
  // WITNESS MANAGEMENT
  // --------------------------------------------------------------------------
  addWitness(witness: Witness): void {
    if (this.witnesses.has(witness.getId())) {
      throw new Error(`Witness ${witness.getId()} already added.`);
    }

    // Internal consistency check
    const validation = witness.validateForKenyanLaw();
    if (!validation.isValid) {
      throw new Error(`Witness is not eligible: ${validation.issues.join(', ')}`);
    }

    this.witnesses.set(witness.getId(), witness);
    // Update root entity state
    this.will.addWitness(witness.getId());
  }

  removeWitness(witnessId: string): void {
    if (!this.witnesses.has(witnessId)) {
      throw new Error(`Witness ${witnessId} not found.`);
    }

    const witness = this.witnesses.get(witnessId);
    if (witness?.hasSigned()) {
      throw new Error('Cannot remove a witness who has already signed.');
    }

    this.witnesses.delete(witnessId);
    this.will.removeWitness(witnessId);
  }

  // --------------------------------------------------------------------------
  // DOMAIN VALIDATION LOGIC
  // --------------------------------------------------------------------------

  private validateTotalPercentage(
    assetId: string,
    newShare: SharePercentage,
    excludeAssignmentId?: string,
  ): void {
    const assetAssignments = Array.from(this.beneficiaries.values()).filter(
      (b) => b.getAssetId() === assetId && b.getId() !== excludeAssignmentId,
    );

    const existingShares = assetAssignments
      .filter((b) => b.getBequestType() === BequestType.PERCENTAGE && b.getSharePercentage())
      .map((b) => b.getSharePercentage()!);

    const allShares = [...existingShares, newShare];

    // Using our Value Object's static method
    if (!SharePercentage.totalIsValid(allShares)) {
      // We check if it EXCEEDS 100. Being less than 100 is fine during drafting.
      const total = allShares.reduce((sum, s) => sum + s.getValue(), 0);
      if (total > 100) {
        throw new Error(
          `Total percentage allocation for asset ${assetId} exceeds 100% (Current: ${total}%).`,
        );
      }
    }
  }

  /**
   * Comprehensive validation before activation
   */
  validateWillCompleteness(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // 1. Testator Capacity
    if (!this.will.getLegalCapacity()?.hasLegalCapacity()) {
      issues.push('Testator does not have verified legal capacity.');
    }

    // 2. Core Content
    if (this.assets.size === 0) issues.push('Will has no assets assigned.');
    if (this.beneficiaries.size === 0) issues.push('Will has no beneficiaries assigned.');
    if (this.executors.size === 0) issues.push('Will has no executors nominated.');
    if (!this.will.getResiduaryClause()) issues.push('Residuary clause is required.');

    // 3. Witness Requirements
    if (this.will.getStatus() === WillStatus.WITNESSED) {
      // Only check signed witnesses if we are trying to activate
      const signedCount = Array.from(this.witnesses.values()).filter((w) => w.hasSigned()).length;
      if (signedCount < KENYAN_LEGAL_REQUIREMENTS.MINIMUM_WITNESSES) {
        issues.push(
          `Kenyan law requires at least ${KENYAN_LEGAL_REQUIREMENTS.MINIMUM_WITNESSES} signed witnesses.`,
        );
      }
    }

    // 4. Asset Allocation Integrity
    for (const asset of this.assets.values()) {
      const assignments = Array.from(this.beneficiaries.values()).filter(
        (b) => b.getAssetId() === asset.getId(),
      );

      if (assignments.length === 0) {
        issues.push(`Asset '${asset.getName()}' has no beneficiaries assigned.`);
      }

      // Check percentages match 100% exactly for finalized wills
      const percentageAssignments = assignments.filter(
        (b) => b.getBequestType() === BequestType.PERCENTAGE,
      );
      if (percentageAssignments.length > 0) {
        const total = percentageAssignments.reduce(
          (sum, b) => sum + (b.getSharePercentage()?.getValue() || 0),
          0,
        );
        // Allow small floating point error
        if (Math.abs(total - 100) > 0.01) {
          issues.push(
            `Asset '${asset.getName()}' percentage allocation is ${total}%, expected 100%.`,
          );
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // --------------------------------------------------------------------------
  // AGGREGATE STATE TRANSITIONS
  // --------------------------------------------------------------------------

  activate(activatedBy: string): void {
    const check = this.validateWillCompleteness();
    if (!check.isValid) {
      throw new Error(`Cannot activate will. Issues: ${check.issues.join('; ')}`);
    }
    this.will.activate(activatedBy);
  }
}
