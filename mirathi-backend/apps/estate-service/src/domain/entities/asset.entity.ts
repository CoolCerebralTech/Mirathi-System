// src/estate-service/src/domain/entities/asset.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { AssetStatus, AssetStatusHelper } from '../enums/asset-status.enum';
import { CoOwnershipType } from '../enums/co-ownership-type.enum';
import { ValuationSource } from '../enums/valuation-source.enum';
import {
  AssetCoOwnerAddedEvent,
  AssetCreatedEvent,
  AssetEncumberedEvent,
  AssetLiquidationCompletedEvent,
  AssetLiquidationInitiatedEvent,
  AssetStatusChangedEvent,
  AssetValueUpdatedEvent,
} from '../events/asset.event';
import { AssetCannotBeModifiedException, AssetLogicException } from '../exceptions/asset.exception';
import {
  BusinessAssetDetailsVO,
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
 * Co-Ownership Structure for Asset Entity
 *
 * Kenyan Legal Context:
 * - JOINT_TENANCY: Right of survivorship (property passes to survivors)
 * - TENANCY_IN_COMMON: Fixed shares that form part of estate
 */
export interface AssetCoOwnership {
  coOwners: AssetCoOwner[];
  ownershipType: CoOwnershipType;
  totalSharePercentage: number;
}

export interface AssetProps {
  estateId: string;
  name: string;
  type: AssetTypeVO;
  currentValue: MoneyVO;
  description?: string;
  status: AssetStatus;

  // Encumbrance (Blocks Physical Distribution)
  isEncumbered: boolean;
  encumbranceDetails?: string;

  // Strategy Pattern Details (Exactly ONE must exist based on type)
  landDetails?: LandAssetDetailsVO;
  vehicleDetails?: VehicleAssetDetailsVO;
  financialDetails?: FinancialAssetDetailsVO;
  businessDetails?: BusinessAssetDetailsVO;

  // Child Entities
  coOwnership?: AssetCoOwnership;
  valuations: AssetValuation[]; // History of all valuations
  liquidation?: AssetLiquidation; // Active liquidation process

  // Metadata
  location?: string; // Physical location for tangible assets
  purchaseDate?: Date;
  sourceOfFunds?: string; // For AML compliance
  isVerified: boolean;
}

/**
 * Asset Entity
 *
 * The "Inventory Item" of the Estate Aggregate.
 *
 * BUSINESS RULES:
 * 1. Only one asset details type allowed per asset (Strategy Pattern)
 * 2. Encumbered assets cannot be physically transferred
 * 3. Joint tenancy assets pass to survivors, not estate
 * 4. Professional valuations required for tax purposes on high-value assets
 * 5. Liquidated assets are removed from inventory
 */
export class Asset extends Entity<AssetProps> {
  private constructor(props: AssetProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
    this.validateInvariants();
    this.ensureOneDetailsOnly();

    // Emit creation event
    if (!id) {
      this.addDomainEvent(
        new AssetCreatedEvent(
          this.id.toString(),
          props.estateId,
          props.type.value,
          props.currentValue.getValue().amount,
          this.version,
        ),
      );
    }
  }

  // ===========================================================================
  // FACTORY METHODS
  // ===========================================================================

  /**
   * Factory method to create a new Asset
   */
  public static create(props: AssetProps, id?: UniqueEntityID): Asset {
    return new Asset(props, id);
  }

  /**
   * Factory method to create a Land Asset
   */
  public static createLandAsset(
    estateId: string,
    name: string,
    currentValue: MoneyVO,
    landDetails: LandAssetDetailsVO,
    options?: {
      description?: string;
      coOwnership?: AssetCoOwnership;
      location?: string;
      purchaseDate?: Date;
    },
  ): Asset {
    const props: AssetProps = {
      estateId,
      name,
      type: AssetTypeVO.createLand(),
      currentValue,
      landDetails,
      description: options?.description,
      status: AssetStatus.ACTIVE,
      isEncumbered: false,
      valuations: [],
      isVerified: false,
      location: options?.location,
      purchaseDate: options?.purchaseDate,
      coOwnership: options?.coOwnership,
    };

    return Asset.create(props);
  }

  /**
   * Factory method to create a Vehicle Asset
   */
  public static createVehicleAsset(
    estateId: string,
    name: string,
    currentValue: MoneyVO,
    vehicleDetails: VehicleAssetDetailsVO,
    options?: {
      description?: string;
      coOwnership?: AssetCoOwnership;
      location?: string;
      purchaseDate?: Date;
    },
  ): Asset {
    const props: AssetProps = {
      estateId,
      name,
      type: AssetTypeVO.createVehicle(),
      currentValue,
      vehicleDetails,
      description: options?.description,
      status: AssetStatus.ACTIVE,
      isEncumbered: false,
      valuations: [],
      isVerified: false,
      location: options?.location,
      purchaseDate: options?.purchaseDate,
      coOwnership: options?.coOwnership,
    };

    return Asset.create(props);
  }

  // ===========================================================================
  // INVARIANTS & VALIDATION
  // ===========================================================================

  /**
   * Enforces Strategy Pattern: Only one asset details type allowed
   */
  private ensureOneDetailsOnly(): void {
    const detailsCount = [
      this.props.landDetails,
      this.props.vehicleDetails,
      this.props.financialDetails,
      this.props.businessDetails,
    ].filter(Boolean).length;

    if (detailsCount > 1) {
      throw new AssetLogicException('Asset can only have one type of asset details');
    }
  }

  /**
   * Enforces mapping between AssetType and Details as per specification
   */
  private validateInvariants(): void {
    // Validate required details based on type
    const type = this.props.type.value;

    switch (type) {
      case AssetTypeVO.LAND:
        if (!this.props.landDetails) {
          throw new AssetLogicException('Land Asset must have LandDetails');
        }
        break;
      case AssetTypeVO.VEHICLE:
        if (!this.props.vehicleDetails) {
          throw new AssetLogicException('Vehicle Asset must have VehicleDetails');
        }
        break;
      case AssetTypeVO.FINANCIAL:
        if (!this.props.financialDetails) {
          throw new AssetLogicException('Financial Asset must have FinancialDetails');
        }
        break;
      case AssetTypeVO.BUSINESS:
        if (!this.props.businessDetails) {
          throw new AssetLogicException('Business Asset must have BusinessDetails');
        }
        break;
    }

    // Validate co-ownership total doesn't exceed 100%
    if (this.props.coOwnership && this.props.coOwnership.totalSharePercentage > 100) {
      throw new AssetLogicException('Total co-ownership share cannot exceed 100%');
    }

    // Validate active asset has positive value
    if (this.props.status === AssetStatus.ACTIVE && this.props.currentValue.isZero()) {
      throw new AssetLogicException('Active asset must have non-zero value');
    }
  }

  // ===========================================================================
  // CORE BUSINESS LOGIC - DISTRIBUTABLE VALUE (The "Estate's Slice")
  // ===========================================================================

  /**
   * Calculates the value belonging to the Estate
   *
   * BUSINESS LOGIC (From Specification):
   * - If Joint Tenancy with surviving co-owners: Value = 0 (survivors take all)
   * - If Tenancy in Common: Value = CurrentValue * (100% - CoOwnerShare)
   * - If liquidated: Value = 0 (value now in Estate.CashOnHand)
   */
  public getDistributableValue(): MoneyVO {
    // Rule 1: Liquidated assets have no value here
    if (this.props.status === AssetStatus.LIQUIDATED) {
      return MoneyVO.zero(this.props.currentValue.currency);
    }

    const coOwnership = this.props.coOwnership;

    // Case A: Sole Ownership or no co-ownership
    if (!coOwnership || coOwnership.coOwners.length === 0) {
      return this.props.currentValue;
    }

    // Case B: Joint Tenancy (Right of Survivorship)
    // Check if there are surviving co-owners who are active AND verified
    if (coOwnership.ownershipType === CoOwnershipType.JOINT_TENANCY) {
      const survivingOwners = coOwnership.coOwners.filter((co) => co.isActive && co.isVerified);
      if (survivingOwners.length > 0) {
        // Asset passes to survivors, not estate (Law of Succession Act)
        return MoneyVO.zero(this.props.currentValue.currency);
      }
    }

    // Case C: Tenancy in Common or other types
    // Only include shares from verified co-owners in the calculation
    const verifiedCoOwnerShares = coOwnership.coOwners
      .filter((co) => co.isVerified && co.isActive)
      .reduce((total, co) => total + co.sharePercentage, 0);

    const deceasedSharePercent = 100 - verifiedCoOwnerShares;
    const factor = deceasedSharePercent / 100;

    return this.props.currentValue.multiply(factor);
  }

  /**
   * Check if asset can be physically transferred to heirs
   *
   * CRITERIA:
   * 1. Must be active and not liquidated
   * 2. Must not be encumbered (secured debts)
   * 3. Must not be under legal dispute
   * 4. Must be verified (for high-value assets)
   */
  public isTransferable(): boolean {
    if (![AssetStatus.ACTIVE, AssetStatus.VERIFIED].includes(this.props.status)) {
      return false;
    }

    if (this.props.isEncumbered) {
      return false;
    }

    if (AssetStatusHelper.isInDispute(this.props.status)) {
      return false;
    }

    // High-value assets require verification
    if (this.props.currentValue.isGreaterThan(MoneyVO.createKES(1000000))) {
      // 1M KES
      return this.props.isVerified;
    }

    return true;
  }

  // ===========================================================================
  // CO-OWNERSHIP MANAGEMENT
  // ===========================================================================
  public addCoOwner(coOwner: AssetCoOwner, addedBy: string): void {
    this.ensureCanBeModified();

    let coOwnership = this.props.coOwnership;

    // Initialize if empty
    if (!coOwnership) {
      coOwnership = {
        coOwners: [],
        ownershipType: coOwner.ownershipType,
        totalSharePercentage: 0,
      };
    }

    // Validate no duplicate co-owners
    if (coOwnership.coOwners.some((c) => c.familyMemberId === coOwner.familyMemberId)) {
      throw new AssetLogicException(`Co-owner ${coOwner.familyMemberId} already exists`);
    }

    // Validate total share doesn't exceed 100%
    if (coOwnership.totalSharePercentage + coOwner.sharePercentage > 100) {
      throw new AssetLogicException(
        `Total share would be ${coOwnership.totalSharePercentage + coOwner.sharePercentage}%, cannot exceed 100%`,
      );
    }

    // Validate ownership types match (if not initializing)
    if (coOwnership.coOwners.length > 0 && coOwnership.ownershipType !== coOwner.ownershipType) {
      throw new AssetLogicException(
        `Cannot add co-owner with ownership type ${coOwner.ownershipType} to asset with ownership type ${coOwnership.ownershipType}`,
      );
    }

    // Update co-ownership
    const updatedCoOwners = [...coOwnership.coOwners, coOwner];
    const updatedTotal = coOwnership.totalSharePercentage + coOwner.sharePercentage;

    this.updateState({
      coOwnership: {
        ...coOwnership,
        coOwners: updatedCoOwners,
        totalSharePercentage: updatedTotal,
        ownershipType: coOwnership.ownershipType || coOwner.ownershipType,
      },
    });

    this.addDomainEvent(
      new AssetCoOwnerAddedEvent(
        this.id.toString(),
        coOwner.familyMemberId,
        coOwner.sharePercentage,
        coOwner.ownershipType,
        addedBy,
        this.version,
      ),
    );
  }

  // ===========================================================================
  // VALUATION MANAGEMENT
  // ===========================================================================

  /**
   * Update asset value with proper audit trail
   *
   * BUSINESS RULES:
   * 1. Professional valuation required for high-value assets (>5M KES)
   * 2. Tax-acceptable valuation required for tax compliance
   * 3. All value changes must be recorded for audit
   */
  public updateValue(
    newValue: MoneyVO,
    source: ValuationSource,
    reason: string,
    updatedBy: string,
  ): void {
    this.ensureCanBeModified();

    // Validate professional valuation for high-value assets
    if (newValue.isGreaterThan(MoneyVO.createKES(5000000))) {
      // 5M KES
      const isProfessional = [
        ValuationSource.REGISTERED_VALUER,
        ValuationSource.CHARTERED_SURVEYOR,
        ValuationSource.GOVERNMENT_VALUER,
      ].includes(source);

      if (!isProfessional) {
        throw new AssetLogicException('High-value assets (>5M KES) require professional valuation');
      }
    }

    // Create valuation record
    const valuation = AssetValuation.create({
      assetId: this.id.toString(),
      value: newValue,
      valuationDate: new Date(),
      source,
      reason,
      conductedBy: updatedBy,
    });

    // Update state with new value and add to history
    this.updateState({
      currentValue: newValue,
      valuations: [...this.props.valuations, valuation],
    });

    this.addDomainEvent(
      new AssetValueUpdatedEvent(
        this.id.toString(),
        this.props.currentValue.amount,
        newValue.amount,
        source,
        reason,
        updatedBy,
        this.version,
      ),
    );
  }
  // ===========================================================================
  // LIQUIDATION MANAGEMENT
  // ===========================================================================

  public initiateLiquidation(liquidation: AssetLiquidation, initiatedBy: string): void {
    this.ensureCanBeModified();

    if (this.props.liquidation) {
      throw new AssetLogicException('Liquidation already in progress');
    }

    if (!AssetStatusHelper.canBeLiquidated(this.props.status)) {
      throw new AssetLogicException(`Cannot liquidate asset in status: ${this.props.status}`);
    }

    // Validate liquidation amount is reasonable
    const minAcceptableAmount = this.props.currentValue.multiply(0.7); // Minimum 70% of value

    if (liquidation.targetAmount.isLessThan(minAcceptableAmount)) {
      throw new AssetLogicException(
        `Liquidation target amount ${liquidation.targetAmount.toString()} is too low. Minimum: ${minAcceptableAmount.toString()}`,
      );
    }

    this.updateState({
      liquidation,
      status: AssetStatus.LIQUIDATING,
    });

    this.addDomainEvent(
      new AssetLiquidationInitiatedEvent(
        this.id.toString(),
        liquidation.targetAmount.amount,
        liquidation.liquidationType,
        initiatedBy,
        this.version,
      ),
    );
  }

  public completeLiquidation(
    actualAmount: MoneyVO,
    buyerName?: string,
    buyerIdNumber?: string,
    completedBy?: string,
  ): void {
    if (!this.props.liquidation) {
      throw new AssetLogicException('No active liquidation found');
    }

    // Update liquidation entity
    this.props.liquidation.markSaleCompleted(actualAmount, buyerName, buyerIdNumber, completedBy);

    // Update asset state
    this.updateState({
      status: AssetStatus.LIQUIDATED,
    });

    this.addDomainEvent(
      new AssetLiquidationCompletedEvent(
        this.id.toString(),
        actualAmount.amount,
        this.props.currentValue.amount,
        completedBy || 'system',
        this.version,
      ),
    );
  }

  // ===========================================================================
  // ENCUMBRANCE & STATUS MANAGEMENT
  // ===========================================================================

  public markAsEncumbered(
    details: string,
    encumbranceType: string,
    encumbranceAmount?: MoneyVO,
    markedBy: string = 'system',
  ): void {
    this.ensureCanBeModified();

    this.updateState({
      isEncumbered: true,
      encumbranceDetails: `${encumbranceType}: ${details}`,
    });

    this.addDomainEvent(
      new AssetEncumberedEvent(
        this.id.toString(),
        encumbranceType,
        details,
        encumbranceAmount?.amount,
        markedBy,
        this.version,
      ),
    );
  }

  public clearEncumbrance(reason: string, clearedBy: string): void {
    if (!this.props.isEncumbered) {
      throw new AssetLogicException('Asset is not encumbered');
    }

    this.updateState({
      isEncumbered: false,
      encumbranceDetails: undefined,
    });

    this.addDomainEvent(
      new AssetEncumberedEvent(
        this.id.toString(),
        'CLEARED',
        `Encumbrance cleared: ${reason}`,
        0,
        clearedBy,
        this.version,
      ),
    );
  }

  public updateStatus(newStatus: AssetStatus, reason: string, updatedBy: string): void {
    if (!AssetStatusHelper.isValidTransition(this.props.status, newStatus)) {
      throw new AssetLogicException(
        `Invalid status transition: ${this.props.status} -> ${newStatus}`,
      );
    }

    const oldStatus = this.props.status;
    this.updateState({ status: newStatus });

    this.addDomainEvent(
      new AssetStatusChangedEvent(
        this.id.toString(),
        oldStatus,
        newStatus,
        reason,
        updatedBy,
        this.version,
      ),
    );
  }
  public removeCoOwner(familyMemberId: string, reason: string, removedBy: string): void {
    this.ensureCanBeModified();

    if (!this.props.coOwnership) {
      throw new AssetLogicException('No co-ownership structure exists');
    }

    const coOwnerIndex = this.props.coOwnership.coOwners.findIndex(
      (co) => co.familyMemberId === familyMemberId,
    );

    if (coOwnerIndex === -1) {
      throw new AssetLogicException(`Co-owner ${familyMemberId} not found`);
    }

    const coOwner = this.props.coOwnership.coOwners[coOwnerIndex];

    // Update co-ownership
    const updatedCoOwners = this.props.coOwnership.coOwners.filter(
      (co) => co.familyMemberId !== familyMemberId,
    );

    const updatedTotal = this.props.coOwnership.totalSharePercentage - coOwner.sharePercentage;

    this.updateState({
      coOwnership: {
        ...this.props.coOwnership,
        coOwners: updatedCoOwners,
        totalSharePercentage: updatedTotal,
      },
    });

    // Deactivate the co-owner entity
    coOwner.deactivate(reason, removedBy);

    // Could emit an AssetCoOwnerRemovedEvent here
  }

  // ===========================================================================
  // VALIDATION & VERIFICATION
  // ===========================================================================

  public markAsVerified(_verifiedBy: string, _verificationNotes?: string): void {
    this.updateState({
      isVerified: true,
    });

    // Could emit verification event here
  }

  // ===========================================================================
  // HELPER METHODS & GETTERS
  // ===========================================================================

  private ensureCanBeModified(): void {
    this.ensureNotDeleted();

    if (this.props.status === AssetStatus.LIQUIDATED) {
      throw new AssetCannotBeModifiedException(this.id.toString(), 'Asset is Liquidated');
    }

    if (AssetStatusHelper.isInDispute(this.props.status)) {
      throw new AssetCannotBeModifiedException(this.id.toString(), 'Asset is under legal dispute');
    }

    if (this.props.status === AssetStatus.FROZEN) {
      throw new AssetCannotBeModifiedException(
        this.id.toString(),
        'Asset is frozen by court order',
      );
    }
  }

  // Read-only getters for domain logic
  get estateId(): string {
    return this.props.estateId;
  }
  get name(): string {
    return this.props.name;
  }
  get currentValue(): MoneyVO {
    return this.props.currentValue;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get type(): AssetTypeVO {
    return this.props.type;
  }

  get isEncumbered(): boolean {
    return this.props.isEncumbered;
  }
  get encumbranceDetails(): string | undefined {
    return this.props.encumbranceDetails;
  }
  get status(): AssetStatus {
    return this.props.status;
  }
  get location(): string | undefined {
    return this.props.location;
  }

  get purchaseDate(): Date | undefined {
    return this.props.purchaseDate;
  }
  get sourceOfFunds(): string | undefined {
    return this.props.sourceOfFunds;
  }
  get isVerified(): boolean {
    return this.props.isVerified;
  }
  // Strategy Pattern accessors (read-only)
  get landDetails(): LandAssetDetailsVO | undefined {
    return this.props.landDetails;
  }

  get vehicleDetails(): VehicleAssetDetailsVO | undefined {
    return this.props.vehicleDetails;
  }

  get financialDetails(): FinancialAssetDetailsVO | undefined {
    return this.props.financialDetails;
  }

  get businessDetails(): BusinessAssetDetailsVO | undefined {
    return this.props.businessDetails;
  }
  get coOwnership(): AssetCoOwnership | undefined {
    return this.props.coOwnership;
  }
  get valuations(): AssetValuation[] {
    return [...this.props.valuations];
  }
  get liquidation(): AssetLiquidation | undefined {
    return this.props.liquidation;
  }
  /**
   * Get the most recent professional valuation
   */
  get latestProfessionalValuation(): AssetValuation | undefined {
    return this.props.valuations
      .filter((v) => v.isProfessionalValuation)
      .sort((a, b) => b.valuationDate.getTime() - a.valuationDate.getTime())[0];
  }

  /**
   * Check if asset requires registry transfer (lands, vehicles, businesses)
   */
  requiresRegistryTransfer(): boolean {
    return this.props.type.requiresRegistryTransfer();
  }
}
