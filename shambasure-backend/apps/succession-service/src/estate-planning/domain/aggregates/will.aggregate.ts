import { AggregateRoot } from '@nestjs/cqrs';
import { WillStatus, BequestType } from '@prisma/client';
import { Will } from '../entities/will.entity';
import { Asset } from '../entities/asset.entity';
import { Beneficiary } from '../entities/beneficiary.entity';
import { Executor } from '../entities/executor.entity';
import { Witness } from '../entities/witness.entity';
import { LegalCapacity } from '../value-objects/legal-capacity.vo';
import { SharePercentage } from '../value-objects/share-percentage.vo';
import { AssetValue } from '../value-objects/asset-value.vo';

export class WillAggregate extends AggregateRoot {
  private will: Will;
  private assets: Map<string, Asset> = new Map();
  private beneficiaries: Map<string, Beneficiary> = new Map();
  private executors: Map<string, Executor> = new Map();
  private witnesses: Map<string, Witness> = new Map();

  constructor(will: Will) {
    super();
    this.will = will;
  }

  // Will methods
  getWill(): Will {
    return this.will;
  }

  updateWillDetails(
    title: string,
    funeralWishes?: any,
    burialLocation?: string,
    residuaryClause?: string,
    digitalAssetInstructions?: any,
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

  setLegalCapacity(legalCapacity: LegalCapacity): void {
    this.will.setLegalCapacity(legalCapacity);
  }

  // Asset management
  addAsset(asset: Asset): void {
    if (this.assets.has(asset.getId())) {
      throw new Error(`Asset ${asset.getId()} already exists in this will`);
    }

    this.assets.set(asset.getId(), asset);
  }

  removeAsset(assetId: string): void {
    if (!this.assets.has(assetId)) {
      throw new Error(`Asset ${assetId} not found in this will`);
    }

    // Check if asset has beneficiaries assigned
    const assetBeneficiaries = Array.from(this.beneficiaries.values()).filter(
      (beneficiary) => beneficiary.getAssetId() === assetId,
    );

    if (assetBeneficiaries.length > 0) {
      throw new Error(`Cannot remove asset with assigned beneficiaries`);
    }

    this.assets.delete(assetId);
  }

  getAsset(assetId: string): Asset | undefined {
    return this.assets.get(assetId);
  }

  getAllAssets(): Asset[] {
    return Array.from(this.assets.values());
  }

  // Beneficiary management
  assignBeneficiary(beneficiary: Beneficiary): void {
    const assetId = beneficiary.getAssetId();

    if (!this.assets.has(assetId)) {
      throw new Error(`Asset ${assetId} not found in this will`);
    }

    if (this.beneficiaries.has(beneficiary.getId())) {
      throw new Error(`Beneficiary ${beneficiary.getId()} already exists`);
    }

    // Validate beneficiary assignment doesn't exceed 100%
    if (beneficiary.getBequestType() === BequestType.PERCENTAGE) {
      this.validateTotalPercentage(assetId, beneficiary.getSharePercentage());
    }

    this.beneficiaries.set(beneficiary.getId(), beneficiary);
  }

  updateBeneficiaryAssignment(beneficiaryId: string, updates: Partial<Beneficiary>): void {
    const beneficiary = this.beneficiaries.get(beneficiaryId);
    if (!beneficiary) {
      throw new Error(`Beneficiary ${beneficiaryId} not found`);
    }

    // Apply updates (simplified - in reality, we'd use proper methods)
    if (updates.getSharePercentage && beneficiary.getBequestType() === BequestType.PERCENTAGE) {
      this.validateTotalPercentage(
        beneficiary.getAssetId(),
        updates.getSharePercentage,
        beneficiaryId,
      );
    }

    // Note: In a real implementation, we'd have proper update methods on Beneficiary
    // For now, we'll just replace the beneficiary
    this.beneficiaries.set(beneficiaryId, { ...beneficiary, ...updates } as Beneficiary);
  }

  removeBeneficiary(beneficiaryId: string): void {
    if (!this.beneficiaries.has(beneficiaryId)) {
      throw new Error(`Beneficiary ${beneficiaryId} not found`);
    }

    this.beneficiaries.delete(beneficiaryId);
  }

  getBeneficiary(beneficiaryId: string): Beneficiary | undefined {
    return this.beneficiaries.get(beneficiaryId);
  }

  getBeneficiariesForAsset(assetId: string): Beneficiary[] {
    return Array.from(this.beneficiaries.values()).filter(
      (beneficiary) => beneficiary.getAssetId() === assetId,
    );
  }

  getAllBeneficiaries(): Beneficiary[] {
    return Array.from(this.beneficiaries.values());
  }

  // Executor management
  nominateExecutor(executor: Executor): void {
    if (this.executors.has(executor.getId())) {
      throw new Error(`Executor ${executor.getId()} already nominated`);
    }

    // Validate only one primary executor
    if (executor.getIsPrimary()) {
      const existingPrimary = Array.from(this.executors.values()).find((exec) =>
        exec.getIsPrimary(),
      );
      if (existingPrimary) {
        throw new Error('There can only be one primary executor');
      }
    }

    this.executors.set(executor.getId(), executor);
  }

  updateExecutorPriority(executorId: string, priority: number): void {
    const executor = this.executors.get(executorId);
    if (!executor) {
      throw new Error(`Executor ${executorId} not found`);
    }

    executor.updatePriority(priority);
  }

  removeExecutor(executorId: string): void {
    if (!this.executors.has(executorId)) {
      throw new Error(`Executor ${executorId} not found`);
    }

    this.executors.delete(executorId);
  }

  getExecutor(executorId: string): Executor | undefined {
    return this.executors.get(executorId);
  }

  getAllExecutors(): Executor[] {
    return Array.from(this.executors.values());
  }

  getPrimaryExecutor(): Executor | undefined {
    return Array.from(this.executors.values()).find((executor) => executor.getIsPrimary());
  }

  // Witness management
  addWitness(witness: Witness): void {
    if (this.witnesses.has(witness.getId())) {
      throw new Error(`Witness ${witness.getId()} already added`);
    }

    // Validate witness eligibility under Kenyan law
    const validation = witness.validateForKenyanLaw();
    if (!validation.isValid) {
      throw new Error(`Witness is not eligible: ${validation.issues.join(', ')}`);
    }

    this.witnesses.set(witness.getId(), witness);
    this.will.addWitness();
  }

  removeWitness(witnessId: string): void {
    if (!this.witnesses.has(witnessId)) {
      throw new Error(`Witness ${witnessId} not found`);
    }

    const witness = this.witnesses.get(witnessId);
    if (witness?.hasSigned()) {
      throw new Error('Cannot remove a witness who has already signed');
    }

    this.witnesses.delete(witnessId);
    this.will.removeWitness();
  }

  getWitness(witnessId: string): Witness | undefined {
    return this.witnesses.get(witnessId);
  }

  getAllWitnesses(): Witness[] {
    return Array.from(this.witnesses.values());
  }

  getSignedWitnesses(): Witness[] {
    return Array.from(this.witnesses.values()).filter((witness) => witness.hasSigned());
  }

  // Business logic and validations
  private validateTotalPercentage(
    assetId: string,
    newShare: SharePercentage,
    excludeBeneficiaryId?: string,
  ): void {
    const assetBeneficiaries = this.getBeneficiariesForAsset(assetId).filter(
      (beneficiary) => beneficiary.getId() !== excludeBeneficiaryId,
    );

    const percentageShares = assetBeneficiaries
      .filter((beneficiary) => beneficiary.getBequestType() === BequestType.PERCENTAGE)
      .map((beneficiary) => beneficiary.getSharePercentage());

    percentageShares.push(newShare);

    if (!SharePercentage.totalIsValid(percentageShares)) {
      throw new Error('Total percentage allocation for asset exceeds 100%');
    }
  }

  validateWillCompleteness(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check legal capacity
    if (!this.will.getLegalCapacity()?.hasLegalCapacity()) {
      issues.push('Testator does not have legal capacity');
    }

    // Check assets
    if (this.assets.size === 0) {
      issues.push('Will has no assets assigned');
    }

    // Check beneficiaries
    if (this.beneficiaries.size === 0) {
      issues.push('Will has no beneficiaries assigned');
    }

    // Check executors
    if (this.executors.size === 0) {
      issues.push('Will has no executors nominated');
    }

    // Check witnesses for Kenyan law
    if (this.will.getRequiresWitnesses() && this.getSignedWitnesses().length < 2) {
      issues.push('Kenyan law requires at least 2 signed witnesses');
    }

    // Check residuary clause
    if (!this.will.getResiduaryClause()) {
      issues.push('Residuary clause is required');
    }

    // Validate asset-beneficiary assignments
    for (const asset of this.assets.values()) {
      const assetBeneficiaries = this.getBeneficiariesForAsset(asset.getId());
      if (assetBeneficiaries.length === 0) {
        issues.push(`Asset ${asset.getId()} has no beneficiaries assigned`);
      }

      // Check percentage allocation
      const percentageBeneficiaries = assetBeneficiaries.filter(
        (b) => b.getBequestType() === BequestType.PERCENTAGE,
      );

      if (percentageBeneficiaries.length > 0) {
        const totalPercentage = percentageBeneficiaries.reduce(
          (sum, beneficiary) => sum + (beneficiary.getSharePercentage()?.getValue() || 0),
          0,
        );

        if (Math.abs(totalPercentage - 100) > 0.01) {
          issues.push(
            `Asset ${asset.getId()} has invalid percentage allocation: ${totalPercentage}%`,
          );
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  getTotalEstateValue(): AssetValue {
    const totalAmount = Array.from(this.assets.values()).reduce((sum, asset) => {
      return sum + (asset.getCurrentValue()?.getAmount() || 0);
    }, 0);

    // Use the currency from the first asset, or default to KES
    const firstAsset = Array.from(this.assets.values())[0];
    const currency = firstAsset?.getCurrentValue()?.getCurrency() || 'KES';

    return new AssetValue(totalAmount, currency);
  }

  canActivate(): boolean {
    const completenessCheck = this.validateWillCompleteness();
    return completenessCheck.isValid && this.will.getStatus() === WillStatus.WITNESSED;
  }

  activate(activatedBy: string): void {
    if (!this.canActivate()) {
      const completenessCheck = this.validateWillCompleteness();
      throw new Error(`Cannot activate will: ${completenessCheck.issues.join(', ')}`);
    }

    this.will.activate(activatedBy);
  }

  // Static factory method
  static create(
    willId: string,
    title: string,
    testatorId: string,
    legalCapacity: LegalCapacity,
  ): WillAggregate {
    const will = Will.create(willId, title, testatorId, legalCapacity);
    return new WillAggregate(will);
  }
}
