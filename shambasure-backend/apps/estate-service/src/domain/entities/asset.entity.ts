// src/estate-service/src/domain/entities/asset.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { AssetStatus, AssetStatusHelper } from '../enums/asset-status.enum';
import { CoOwnershipType } from '../enums/co-ownership-type.enum';
import {
  AssetCoOwnerAddedEvent,
  AssetEncumberedEvent,
  AssetLiquidationCompletedEvent,
  AssetLiquidationInitiatedEvent,
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
 * Co-Ownership Structure
 * Tracks shares held by others. The Estate only owns (100% - TotalCoOwnerShare).
 */
export interface AssetCoOwnership {
  coOwners: AssetCoOwner[];
  ownershipType: CoOwnershipType; // JOINT_TENANCY or TENANCY_IN_COMMON
  totalSharePercentage: number; // Cache of sum(coOwners.share)
}

export interface AssetProps {
  estateId: string;
  name: string;
  type: AssetTypeVO;
  currentValue: MoneyVO;
  description?: string;
  status: AssetStatus;

  // Encumbrance (Blocks Distribution)
  isEncumbered: boolean;
  encumbranceDetails?: string;

  // State Flags
  isActive: boolean;

  // The Strategy Pattern Details (Polymorphic)
  landDetails?: LandAssetDetailsVO;
  vehicleDetails?: VehicleAssetDetailsVO;
  financialDetails?: FinancialAssetDetailsVO;
  businessDetails?: BusinessAssetDetailsVO;

  // Children / Related Entities
  coOwnership?: AssetCoOwnership;
  valuations?: AssetValuation[];
  liquidation?: AssetLiquidation; // If set, asset is in process of conversion to cash

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Asset Entity
 *
 * The "Inventory Item" of the Estate.
 *
 * RESPONSIBILITIES:
 * 1. Hold the specific details (Land/Vehicle/etc).
 * 2. Calculate the "Estate's Slice" of the value (handling Co-Ownership).
 * 3. Manage Lifecycle (Active -> Liquidating -> Liquidated).
 */
export class Asset extends Entity<AssetProps> {
  private constructor(props: AssetProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
    this.validateInvariants();
  }

  /**
   * Factory method to create a new Asset
   */
  public static create(props: AssetProps, id?: UniqueEntityID): Asset {
    return new Asset(props, id);
  }

  // ===========================================================================
  // 1. STRATEGY PATTERN & VALIDATION
  // ===========================================================================

  /**
   * Enforces strict mapping between AssetType and Details.
   * "If Type = LAND, it must have LandDetails"
   */
  private validateInvariants(): void {
    if (this.props.type.equals(AssetTypeVO.createLand()) && !this.props.landDetails) {
      throw new AssetLogicException('Land Asset must have LandDetails');
    }
    if (this.props.type.equals(AssetTypeVO.createVehicle()) && !this.props.vehicleDetails) {
      throw new AssetLogicException('Vehicle Asset must have VehicleDetails');
    }
    if (this.props.type.equals(AssetTypeVO.createFinancial()) && !this.props.financialDetails) {
      throw new AssetLogicException('Financial Asset must have FinancialDetails');
    }
    if (this.props.type.equals(AssetTypeVO.createBusiness()) && !this.props.businessDetails) {
      throw new AssetLogicException('Business Asset must have BusinessDetails');
    }
  }

  // ===========================================================================
  // 2. FINANCIAL LOGIC (The "Estate's Slice")
  // ===========================================================================

  /**
   * Calculates the value belonging to the Estate.
   *
   * LOGIC:
   * 1. If Joint Tenancy (Survivor takes all): Value = 0 (if co-owners exist).
   * 2. If Tenancy in Common: Value = CurrentValue * (100% - CoOwnerShares).
   */
  public getDistributableValue(): MoneyVO {
    // Rule: If liquidated, the value is in CashOnHand (Estate Root), not here.
    if (this.props.status === AssetStatus.LIQUIDATED) {
      return MoneyVO.zero(this.props.currentValue.getValue().currency);
    }

    const coOwnership = this.props.coOwnership;

    // Case 1: Sole Ownership
    if (!coOwnership || coOwnership.coOwners.length === 0) {
      return this.props.currentValue;
    }

    // Case 2: Joint Tenancy (Right of Survivorship)
    // In Kenya, if a property is held jointly, it passes to the survivor, NOT the estate.
    if (coOwnership.ownershipType === CoOwnershipType.JOINT_TENANCY) {
      const survivingOwners = coOwnership.coOwners.filter((c) => c.isActive);
      if (survivingOwners.length > 0) {
        // The asset belongs to the survivors, not the estate.
        return MoneyVO.zero(this.props.currentValue.getValue().currency);
      }
    }

    // Case 3: Tenancy in Common (Percentage Split)
    // Deceased owns (100% - Sum of CoOwners)
    const deceasedSharePercent = 100 - coOwnership.totalSharePercentage;
    const factor = deceasedSharePercent / 100;

    return this.props.currentValue.multiply(factor);
  }

  // ===========================================================================
  // 3. CO-OWNERSHIP MANAGEMENT
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

    // Validation
    if (coOwnership.coOwners.some((c) => c.id.equals(coOwner.id))) {
      throw new AssetLogicException('Co-Owner already exists');
    }

    if (coOwnership.totalSharePercentage + coOwner.sharePercentage > 100) {
      throw new AssetLogicException('Total share cannot exceed 100%');
    }

    // Update State
    const updatedCoOwners = [...coOwnership.coOwners, coOwner];
    const updatedTotal = coOwnership.totalSharePercentage + coOwner.sharePercentage;

    this.updateState({
      coOwnership: {
        ...coOwnership,
        coOwners: updatedCoOwners,
        totalSharePercentage: updatedTotal,
      },
    });

    this.addDomainEvent(
      new AssetCoOwnerAddedEvent(
        this.id.toString(),
        coOwner.id.toString(),
        coOwner.sharePercentage,
        addedBy,
        this.version,
      ),
    );
  }

  // ===========================================================================
  // 4. LIQUIDATION LOGIC (The "Conversion")
  // ===========================================================================

  public initiateLiquidation(liquidation: AssetLiquidation, initiatedBy: string): void {
    this.ensureCanBeModified();

    if (this.props.liquidation) {
      throw new AssetLogicException('Liquidation already in progress');
    }

    if (!AssetStatusHelper.canBeLiquidated(this.props.status)) {
      throw new AssetLogicException(`Cannot liquidate asset in state: ${this.props.status}`);
    }

    this.updateState({
      liquidation: liquidation,
      status: AssetStatus.LIQUIDATING,
    });

    this.addDomainEvent(
      new AssetLiquidationInitiatedEvent(
        this.id.toString(),
        liquidation.targetAmount,
        initiatedBy,
        this.version,
      ),
    );
  }

  public completeLiquidation(actualAmount: MoneyVO, completedBy: string): void {
    if (!this.props.liquidation) throw new AssetLogicException('No active liquidation found');

    // Update the child entity
    this.props.liquidation.markAsCompleted(actualAmount, completedBy);

    // Update self
    this.updateState({
      status: AssetStatus.LIQUIDATED, // Asset is now "Gone" / Converted
      isActive: false, // No longer active in inventory
    });

    this.addDomainEvent(
      new AssetLiquidationCompletedEvent(
        this.id.toString(),
        actualAmount.getValue().amount,
        completedBy,
        this.version,
      ),
    );
  }

  // ===========================================================================
  // 5. ENCUMBRANCE & STATUS
  // ===========================================================================

  public markAsEncumbered(details: string, byWho: string): void {
    this.ensureCanBeModified();

    this.updateState({
      isEncumbered: true,
      encumbranceDetails: details,
    });

    this.addDomainEvent(new AssetEncumberedEvent(this.id.toString(), details, byWho, this.version));
  }

  public clearEncumbrance(_byWho: string): void {
    this.updateState({
      isEncumbered: false,
      encumbranceDetails: undefined,
    });
    // Emit cleared event...
  }

  public updateValue(newValue: MoneyVO, source: string, updatedBy: string): void {
    this.ensureCanBeModified();

    // Create history record (Valuation)
    const valuation = AssetValuation.create({
      assetId: this.id.toString(),
      value: newValue,
      valuationDate: new Date(),
      source: source,
      isTaxAcceptable: false, // Default
      isProfessionalValuation: false,
    });

    const currentValuations = this.props.valuations || [];

    this.updateState({
      currentValue: newValue,
      valuations: [...currentValuations, valuation],
    });

    this.addDomainEvent(
      new AssetValueUpdatedEvent(
        this.id.toString(),
        newValue.getValue().amount,
        source,
        updatedBy,
        this.version,
      ),
    );
  }

  // ===========================================================================
  // 6. HELPERS & INVARIANTS
  // ===========================================================================

  /**
   * The "Ready Check".
   * Can we physically transfer this asset to an heir?
   */
  public isReadyForDistribution(): boolean {
    if (this.props.status !== AssetStatus.ACTIVE) return false;
    if (this.props.isEncumbered) return false;
    if (this.props.status === AssetStatus.DISPUTED) return false;
    return true;
  }

  private ensureCanBeModified(): void {
    this.ensureNotDeleted();
    if (this.props.status === AssetStatus.LIQUIDATED) {
      throw new AssetCannotBeModifiedException(this.id.toString(), 'Asset is Liquidated');
    }
  }

  // Getters for Polymorphic Access
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
}
