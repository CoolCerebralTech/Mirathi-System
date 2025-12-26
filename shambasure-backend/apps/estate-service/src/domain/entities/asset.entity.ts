// src/estate-service/src/domain/entities/asset.entity.ts
import { UniqueEntityID } from '../../base/unique-entity-id';
import { Entity } from '../base/entity';
import { AssetStatus } from '../enums/asset-status.enum';
import { AssetStatusHelper } from '../enums/asset-status.enum';
import { CoOwnershipType } from '../enums/co-ownership-type.enum';
import { CoOwnershipTypeHelper } from '../enums/co-ownership-type.enum';
import {
  AssetCoOwnerAddedEvent,
  AssetCoOwnerRemovedEvent,
  AssetCoOwnerShareUpdatedEvent,
  AssetDeletedEvent,
  AssetEncumberedEvent,
  AssetOwnershipTypeChangedEvent,
  AssetStatusChangedEvent,
  AssetValueUpdatedEvent,
} from '../events/asset.event';
import {
  AssetCannotBeModifiedException,
  AssetDeletedException,
  AssetEncumberedException,
  AssetValueInvalidException,
} from '../exceptions/asset.exception';
import {
  FinancialAssetDetailsVO,
  LandAssetDetailsVO,
  VehicleAssetDetailsVO,
} from '../value-objects/asset-details';
import { AssetTypeVO } from '../value-objects/asset-type.vo';
import { MoneyVO } from '../value-objects/money.vo';
import { AssetCoOwner } from './asset-co-owner.entity';
import { AssetLiquidation } from './asset-liquidation.entity';
import { AssetValuation } from './asset-valuation.entity';

/**
 * Asset Co-Ownership Management Interface
 */
interface AssetCoOwnership {
  coOwners: Map<string, AssetCoOwner>; // key: coOwnerId
  ownershipType: CoOwnershipType;
  totalSharePercentage: number; // Sum of all co-owner shares
}

/**
 * Asset Entity Properties Interface (Updated)
 */
export interface AssetProps {
  estateId: string;
  ownerId: string; // Primary owner (deceased)
  name: string;
  type: AssetTypeVO;
  currentValue: MoneyVO;
  description?: string;
  status: AssetStatus;
  isEncumbered: boolean;
  encumbranceDetails?: string;
  isActive: boolean;

  // Co-Ownership Management (Embedded)
  coOwnership?: AssetCoOwnership;
  valuations?: AssetValuation[];
  liquidation?: AssetLiquidation;

  // Polymorphic details
  landDetails?: LandAssetDetailsVO;
  vehicleDetails?: VehicleAssetDetailsVO;
  financialDetails?: FinancialAssetDetailsVO;
  businessDetails?: any;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Asset Entity (Updated with Embedded Co-Ownership)
 *
 * Now manages co-owners directly as part of the asset's state.
 * Estate aggregate remains the transactional boundary for solvency.
 */
export class Asset extends Entity<AssetProps> {
  // Getters
  get estateId(): string {
    return this.props.estateId;
  }
  get ownerId(): string {
    return this.props.ownerId;
  }
  get name(): string {
    return this.props.name;
  }
  get type(): AssetTypeVO {
    return this.props.type;
  }
  get currentValue(): MoneyVO {
    return this.props.currentValue;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get status(): AssetStatus {
    return this.props.status;
  }
  get isEncumbered(): boolean {
    return this.props.isEncumbered;
  }
  get encumbranceDetails(): string | undefined {
    return this.props.encumbranceDetails;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get coOwnership(): AssetCoOwnership | undefined {
    return this.props.coOwnership;
  }
  get landDetails(): LandAssetDetailsVO | undefined {
    return this.props.landDetails;
  }
  get vehicleDetails(): VehicleAssetDetailsVO | undefined {
    return this.props.vehicleDetails;
  }
  get financialDetails(): FinancialAssetDetailsVO | undefined {
    return this.props.financialDetails;
  }
  get businessDetails(): any | undefined {
    return this.props.businessDetails;
  }
  get valuations(): AssetValuation[] {
    return this.props.valuations || [];
  }
  get liquidation(): AssetLiquidation | undefined {
    return this.props.liquidation;
  }

  /**
   * Get co-owner by ID
   */
  getCoOwner(coOwnerId: string): AssetCoOwner | undefined {
    return this.props.coOwnership?.coOwners.get(coOwnerId);
  }

  /**
   * Get co-owner by user ID
   */
  getCoOwnerByUserId(userId: string): AssetCoOwner | undefined {
    if (!this.props.coOwnership) return undefined;

    return Array.from(this.props.coOwnership.coOwners.values()).find(
      (coOwner) => coOwner.userId === userId,
    );
  }

  /**
   * Get all active co-owners
   */
  getActiveCoOwners(): AssetCoOwner[] {
    if (!this.props.coOwnership) return [];

    return Array.from(this.props.coOwnership.coOwners.values()).filter(
      (coOwner) => coOwner.isActive,
    );
  }

  /**
   * Get total co-owner share percentage
   */
  getCoOwnerTotalShare(): number {
    if (!this.props.coOwnership) return 0;

    return this.props.coOwnership.totalSharePercentage;
  }

  /**
   * Get deceased's share percentage
   */
  getDeceasedSharePercentage(): number {
    // If no co-owners, deceased owns 100%
    if (!this.props.coOwnership) return 100;

    const totalCoOwnerShare = this.props.coOwnership.totalSharePercentage;
    return Math.max(0, 100 - totalCoOwnerShare);
  }

  /**
   * Calculate distributable value
   * This is the value that goes through the estate
   */
  getDistributableValue(): MoneyVO {
    const deceasedShare = this.getDeceasedSharePercentage();

    // If joint tenancy and there are surviving co-owners, deceased share is 0
    if (
      this.props.coOwnership?.ownershipType === CoOwnershipType.JOINT_TENANCY &&
      this.getActiveCoOwners().length > 0
    ) {
      return MoneyVO.createKES(0);
    }

    // Calculate deceased's portion of the value
    const distributableAmount = (this.props.currentValue.amount * deceasedShare) / 100;

    return new MoneyVO({
      amount: distributableAmount,
      currency: this.props.currentValue.currency,
    });
  }

  /**
   * Add a co-owner to the asset
   */
  addCoOwner(coOwner: AssetCoOwner, addedBy: string): void {
    this.ensureCanBeModified();

    if (!this.props.coOwnership) {
      // Initialize co-ownership structure
      this.props.coOwnership = {
        coOwners: new Map(),
        ownershipType: coOwner.ownershipType,
        totalSharePercentage: 0,
      };
    }

    // Check for duplicate
    if (this.props.coOwnership.coOwners.has(coOwner.id.toString())) {
      throw new Error(`Co-owner ${coOwner.id.toString()} already exists`);
    }

    // Validate total share
    const newTotal = this.props.coOwnership.totalSharePercentage + coOwner.sharePercentage;
    if (newTotal > 100) {
      throw new Error(
        `Adding co-owner would exceed 100% total share. Current: ${this.props.coOwnership.totalSharePercentage}%, New: ${coOwner.sharePercentage}%`,
      );
    }

    // Add co-owner
    this.props.coOwnership.coOwners.set(coOwner.id.toString(), coOwner);
    this.props.coOwnership.totalSharePercentage = newTotal;

    // Update asset value
    this.updateState({
      coOwnership: this.props.coOwnership,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new AssetCoOwnerAddedEvent(
        this.id.toString(),
        coOwner.id.toString(),
        coOwner.userId,
        coOwner.externalName,
        coOwner.sharePercentage,
        coOwner.ownershipType,
        addedBy,
        this.props.version,
      ),
    );
  }

  /**
   * Remove a co-owner from the asset
   */
  removeCoOwner(coOwnerId: string, removedBy: string, reason?: string): void {
    this.ensureCanBeModified();

    if (!this.props.coOwnership) {
      throw new Error('No co-ownership structure found');
    }

    const coOwner = this.props.coOwnership.coOwners.get(coOwnerId);
    if (!coOwner) {
      throw new Error(`Co-owner ${coOwnerId} not found`);
    }

    // Update total share
    this.props.coOwnership.totalSharePercentage -= coOwner.sharePercentage;

    // Remove co-owner
    this.props.coOwnership.coOwners.delete(coOwnerId);

    // If no more co-owners, remove co-ownership structure
    if (this.props.coOwnership.coOwners.size === 0) {
      this.props.coOwnership = undefined;
    }

    this.updateState({
      coOwnership: this.props.coOwnership,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new AssetCoOwnerRemovedEvent(
        this.id.toString(),
        coOwnerId,
        coOwner.sharePercentage,
        removedBy,
        reason,
        this.props.version,
      ),
    );
  }

  /**
   * Update co-owner share percentage
   */
  updateCoOwnerShare(coOwnerId: string, newSharePercentage: number, updatedBy: string): void {
    this.ensureCanBeModified();

    if (!this.props.coOwnership) {
      throw new Error('No co-ownership structure found');
    }

    const coOwner = this.props.coOwnership.coOwners.get(coOwnerId);
    if (!coOwner) {
      throw new Error(`Co-owner ${coOwnerId} not found`);
    }

    const oldSharePercentage = coOwner.sharePercentage;
    const shareDifference = newSharePercentage - oldSharePercentage;
    const newTotal = this.props.coOwnership.totalSharePercentage + shareDifference;

    // Validate total share
    if (newTotal > 100) {
      throw new Error(
        `Updating co-owner share would exceed 100% total. Current total: ${this.props.coOwnership.totalSharePercentage}%, Change: ${shareDifference}%`,
      );
    }

    // Update co-owner share
    coOwner.updateSharePercentage(newSharePercentage, updatedBy);
    this.props.coOwnership.totalSharePercentage = newTotal;

    this.updateState({
      coOwnership: this.props.coOwnership,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new AssetCoOwnerShareUpdatedEvent(
        this.id.toString(),
        coOwnerId,
        oldSharePercentage,
        newSharePercentage,
        updatedBy,
        this.props.version,
      ),
    );
  }

  /**
   * Change asset ownership type
   */
  changeOwnershipType(newOwnershipType: CoOwnershipType, changedBy: string): void {
    this.ensureCanBeModified();

    const oldOwnershipType = this.props.coOwnership?.ownershipType || CoOwnershipType.SOLE;

    if (!this.props.coOwnership) {
      // Initialize co-ownership structure if changing from SOLE
      this.props.coOwnership = {
        coOwners: new Map(),
        ownershipType: newOwnershipType,
        totalSharePercentage: 0,
      };
    } else {
      // Update existing co-ownership structure
      this.props.coOwnership.ownershipType = newOwnershipType;
    }

    this.updateState({
      coOwnership: this.props.coOwnership,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new AssetOwnershipTypeChangedEvent(
        this.id.toString(),
        oldOwnershipType,
        newOwnershipType,
        changedBy,
        CoOwnershipTypeHelper.getInheritanceImplications(newOwnershipType),
        this.props.version,
      ),
    );
  }

  /**
   * Check if asset has co-owners
   */
  hasCoOwners(): boolean {
    return this.props.coOwnership !== undefined && this.props.coOwnership.coOwners.size > 0;
  }

  /**
   * Get asset summary including co-ownership info
   */
  getSummary(): {
    id: string;
    name: string;
    type: string;
    value: number;
    currency: string;
    status: string;
    canDistribute: boolean;
    complexity: number;
    hasCoOwners: boolean;
    deceasedSharePercentage: number;
    distributableValue: number;
  } {
    const distributableValue = this.getDistributableValue();

    return {
      id: this.id.toString(),
      name: this.props.name,
      type: this.props.type.toString(),
      value: this.props.currentValue.amount,
      currency: this.props.currentValue.currency,
      status: this.props.status,
      canDistribute: this.canBeDistributed(),
      complexity: this.getTransferComplexity(),
      hasCoOwners: this.hasCoOwners(),
      deceasedSharePercentage: this.getDeceasedSharePercentage(),
      distributableValue: distributableValue.amount,
    };
  }
  /**
   * Add a valuation record
   */
  addValuation(valuation: AssetValuation, updatedBy: string): void {
    this.ensureCanBeModified();

    // Ensure valuations array exists
    if (!this.props.valuations) {
      this.props.valuations = [];
    }

    // Check for duplicate valuation on same date from same source
    const duplicate = this.props.valuations.find(
      (v) =>
        v.valuationDate.getTime() === valuation.valuationDate.getTime() &&
        v.source === valuation.source,
    );

    if (duplicate) {
      throw new Error(
        `Valuation from ${valuation.source} on ${valuation.valuationDate.toISOString()} already exists`,
      );
    }

    // Add valuation
    this.props.valuations.push(valuation);

    // Update asset value with new valuation
    this.updateValue(valuation.value, valuation.source, updatedBy);

    this.updateState({
      valuations: this.props.valuations,
      updatedAt: new Date(),
    });
  }

  /**
   * Get latest valuation
   */
  getLatestValuation(): AssetValuation | undefined {
    if (!this.props.valuations || this.props.valuations.length === 0) {
      return undefined;
    }

    return [...this.props.valuations]
      .filter((v) => v.isActive)
      .sort((a, b) => b.valuationDate.getTime() - a.valuationDate.getTime())[0];
  }

  /**
   * Get professional valuations
   */
  getProfessionalValuations(): AssetValuation[] {
    if (!this.props.valuations) return [];

    return this.props.valuations
      .filter((v) => v.isActive && v.isProfessionalValuation)
      .sort((a, b) => b.valuationDate.getTime() - a.valuationDate.getTime());
  }

  /**
   * Get tax-acceptable valuations
   */
  getTaxAcceptableValuations(): AssetValuation[] {
    if (!this.props.valuations) return [];

    return this.props.valuations
      .filter((v) => v.isActive && v.isTaxAcceptable)
      .sort((a, b) => b.valuationDate.getTime() - a.valuationDate.getTime());
  }

  /**
   * Get valuation history (sorted by date)
   */
  getValuationHistory(): Array<{
    date: Date;
    value: number;
    source: string;
    credibility: number;
    percentageChange?: number;
  }> {
    if (!this.props.valuations || this.props.valuations.length === 0) {
      return [];
    }

    const sortedValuations = [...this.props.valuations]
      .filter((v) => v.isActive)
      .sort((a, b) => a.valuationDate.getTime() - b.valuationDate.getTime());

    const history = sortedValuations.map((valuation, index) => {
      const record: any = {
        date: valuation.valuationDate,
        value: valuation.value.amount,
        source: valuation.source,
        credibility: valuation.credibilityScore,
      };

      // Calculate percentage change from previous valuation
      if (index > 0) {
        const previousValue = sortedValuations[index - 1].value.amount;
        const currentValue = valuation.value.amount;
        const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
        record.percentageChange = percentageChange;
      }

      return record;
    });

    return history;
  }

  /**
   * Calculate asset appreciation/depreciation
   */
  getAppreciationRate(periodMonths: number = 12): number | undefined {
    const sortedValuations = this.getValuationHistory();
    if (sortedValuations.length < 2) return undefined;

    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setMonth(now.getMonth() - periodMonths);

    const valuationsInPeriod = sortedValuations.filter((v) => v.date >= cutoffDate);
    if (valuationsInPeriod.length < 2) return undefined;

    const oldestValue = valuationsInPeriod[0].value;
    const newestValue = valuationsInPeriod[valuationsInPeriod.length - 1].value;

    const appreciationRate = ((newestValue - oldestValue) / oldestValue) * 100;
    return appreciationRate;
  }
  Summ;
  /**
   * Check if asset can be liquidated
   */
  canBeLiquidated(): boolean {
    return (
      this.props.isActive &&
      !this.props.isEncumbered &&
      AssetStatusHelper.canBeLiquidated(this.props.status) &&
      !this.props.liquidation // No active liquidation
    );
  }

  /**
   * Initiate liquidation
   */
  initiateLiquidation(liquidation: AssetLiquidation, initiatedBy: string): void {
    if (!this.canBeLiquidated()) {
      throw new AssetCannotBeLiquidatedException(
        this.id.toString(),
        'Asset cannot be liquidated in current state',
      );
    }

    if (this.props.liquidation) {
      throw new LiquidationAlreadyExistsException(this.id.toString());
    }

    // Update asset status to indicate liquidation in progress
    this.changeStatus(AssetStatus.LIQUIDATED, 'Liquidation initiated', initiatedBy);

    this.updateState({
      liquidation,
      updatedAt: new Date(),
    });

    // The AssetLiquidatedEvent is already emitted by the liquidation entity
  }

  /**
   * Complete liquidation and update asset value
   */
  completeLiquidation(
    completedBy: string,
    actualAmount: number,
    buyerName?: string,
    buyerIdNumber?: string,
  ): void {
    if (!this.props.liquidation) {
      throw new LiquidationNotFoundException('', this.id.toString());
    }

    // Record sale completion
    this.props.liquidation.recordSaleCompletion(
      actualAmount,
      buyerName || 'Unknown',
      buyerIdNumber,
      completedBy,
    );

    // Update asset status
    this.changeStatus(AssetStatus.LIQUIDATED, 'Liquidation completed', completedBy);

    this.updateState({
      updatedAt: new Date(),
    });
  }

  /**
   * Cancel liquidation
   */
  cancelLiquidation(cancelledBy: string, reason: string): void {
    if (!this.props.liquidation) {
      throw new LiquidationNotFoundException('', this.id.toString());
    }

    // Cancel the liquidation
    this.props.liquidation.cancel(cancelledBy, reason);

    // Reactivate asset if cancellation was before sale
    if (this.props.liquidation.status !== LiquidationStatus.SALE_COMPLETED) {
      this.changeStatus(AssetStatus.ACTIVE, 'Liquidation cancelled', cancelledBy);
    }

    this.updateState({
      liquidation: undefined, // Remove liquidation reference
      updatedAt: new Date(),
    });
  }

  /**
   * Get liquidation progress
   */
  getLiquidationProgress(): {
    isBeingLiquidated: boolean;
    status?: string;
    targetAmount?: number;
    actualAmount?: number;
    netProceeds?: number;
    daysRemaining?: number;
  } {
    if (!this.props.liquidation) {
      return { isBeingLiquidated: false };
    }

    return {
      isBeingLiquidated: true,
      status: this.props.liquidation.status,
      targetAmount: this.props.liquidation.targetAmount,
      actualAmount: this.props.liquidation.actualAmount,
      netProceeds: this.props.liquidation.netProceeds,
      daysRemaining: this.props.liquidation.getDaysRemaining(),
    };
  }
  /**
   * Update asset value
   */
  updateValue(newValue: MoneyVO, source: string, updatedBy: string): void {
    this.ensureCanBeModified();

    const oldValue = this.props.currentValue;

    this.updateState({
      currentValue: newValue,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new AssetValueUpdatedEvent(
        this.id.toString(),
        oldValue,
        newValue,
        new Date(),
        source,
        updatedBy,
        this.props.version,
      ),
    );
  }

  /**
   * Change asset status
   */
  changeStatus(newStatus: AssetStatus, reason?: string, changedBy?: string): void {
    if (!AssetStatusHelper.isValidTransition(this.props.status, newStatus)) {
      throw new AssetCannotBeModifiedException(
        this.id.toString(),
        `Cannot transition from ${this.props.status} to ${newStatus}`,
      );
    }

    const oldStatus = this.props.status;

    this.updateState({
      status: newStatus,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new AssetStatusChangedEvent(
        this.id.toString(),
        oldStatus,
        newStatus,
        reason,
        changedBy || 'system',
        this.props.version,
      ),
    );

    // Auto-activate/deactivate based on status
    if (AssetStatusHelper.canBeValued(newStatus)) {
      this.activate();
    } else if (newStatus === AssetStatus.DELETED) {
      this.deactivate();
    }
  }

  /**
   * Mark asset as encumbered
   */
  markAsEncumbered(
    encumbranceType: string,
    encumbranceDetails: string,
    securedAmount: number,
    creditorName: string,
    encumberedBy: string,
  ): void {
    this.ensureCanBeModified();

    this.updateState({
      isEncumbered: true,
      encumbranceDetails,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new AssetEncumberedEvent(
        this.id.toString(),
        encumbranceType,
        encumbranceDetails,
        securedAmount,
        creditorName,
        encumberedBy,
        this.props.version,
      ),
    );
  }

  /**
   * Clear encumbrance
   */
  clearEncumbrance(clearedBy: string): void {
    if (!this.props.isEncumbered) {
      throw new AssetCannotBeModifiedException(this.id.toString(), 'Asset is not encumbered');
    }

    this.updateState({
      isEncumbered: false,
      encumbranceDetails: undefined,
      updatedAt: new Date(),
    });
  }

  /**
   * Activate asset
   */
  activate(): void {
    if (this.props.isActive) {
      return;
    }

    this.updateState({
      isActive: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Deactivate asset
   */
  deactivate(): void {
    if (!this.props.isActive) {
      return;
    }

    this.updateState({
      isActive: false,
      updatedAt: new Date(),
    });
  }

  /**
   * Soft delete asset
   */
  softDelete(reason?: string, deletedBy?: string): void {
    if (this.isDeleted) {
      throw new AssetDeletedException(this.id.toString());
    }

    this.markAsDeleted();
    this.deactivate();

    // Add domain event
    this.addDomainEvent(
      new AssetDeletedEvent(this.id.toString(), deletedBy || 'system', reason, this.props.version),
    );
  }

  /**
   * Check if asset can be distributed
   */
  canBeDistributed(): boolean {
    return (
      this.props.isActive &&
      AssetStatusHelper.canBeDistributed(this.props.status) &&
      !this.props.isEncumbered
    );
  }

  /**
   * Check if asset can be liquidated
   */
  canBeLiquidated(): boolean {
    return this.props.isActive && AssetStatusHelper.canBeLiquidated(this.props.status);
  }

  /**
   * Get distributable value (considering co-ownership)
   * This will be implemented when we add co-owners
   */
  getDistributableValue(): MoneyVO {
    // For now, return full value
    // TODO: Implement co-owner percentage calculation
    return this.props.currentValue;
  }

  /**
   * Get transfer complexity based on type
   */
  getTransferComplexity(): number {
    let complexity = this.props.type.getTransferComplexity();

    if (this.props.isEncumbered) complexity += 3;
    if (this.props.status === AssetStatus.DISPUTED) complexity += 5;
    if (!this.canBeDistributed()) complexity += 2;

    return Math.min(complexity, 10);
  }

  /**
   * Check if asset requires court order for transfer
   */
  requiresCourtOrder(): boolean {
    if (this.props.isEncumbered) return true;
    if (this.props.status === AssetStatus.DISPUTED) return true;
    if (this.props.type.value === AssetTypeVO.LAND) return true;

    return false;
  }

  /**
   * Ensure asset can be modified
   */
  private ensureCanBeModified(): void {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      throw new AssetCannotBeModifiedException(this.id.toString(), 'Asset is not active');
    }

    if (this.props.isEncumbered) {
      throw new AssetEncumberedException(
        this.id.toString(),
        this.props.encumbranceDetails || 'unknown encumbrance',
      );
    }

    if (!AssetStatusHelper.canBeValued(this.props.status)) {
      throw new AssetCannotBeModifiedException(
        this.id.toString(),
        `Asset is in ${this.props.status} status`,
      );
    }
  }

  /**
   * Get asset summary for reporting
   */
  getSummary(): {
    id: string;
    name: string;
    type: string;
    value: number;
    currency: string;
    status: string;
    canDistribute: boolean;
    complexity: number;
  } {
    return {
      id: this.id.toString(),
      name: this.props.name,
      type: this.props.type.toString(),
      value: this.props.currentValue.amount,
      currency: this.props.currentValue.currency,
      status: this.props.status,
      canDistribute: this.canBeDistributed(),
      complexity: this.getTransferComplexity(),
    };
  }

  /**
   * Clone asset properties for snapshot
   */
  protected cloneProps(): AssetProps {
    return {
      ...this.props,
      type: this.props.type.clone(),
      currentValue: this.props.currentValue.clone(),
      landDetails: this.props.landDetails?.clone(),
      vehicleDetails: this.props.vehicleDetails?.clone(),
      financialDetails: this.props.financialDetails?.clone(),
    };
  }
}
