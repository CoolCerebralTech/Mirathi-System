// src/estate-service/src/domain/entities/asset-co-owner.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { CoOwnershipType } from '../enums/co-ownership-type.enum';
import { CoOwnershipTypeHelper } from '../enums/co-ownership-type.enum';
import {
  CoOwnerShareUpdatedEvent,
  CoOwnershipTypeChangedEvent,
} from '../events/asset-co-owner.event';
import {
  CoOwnerNotFoundException,
  CoOwnershipCannotBeModifiedException,
  DuplicateCoOwnerException,
  InvalidSharePercentageException,
  TotalSharePercentageExceededException,
} from '../exceptions/asset-co-owner.exception';

/**
 * Asset Co-Owner Entity Properties Interface
 */
export interface AssetCoOwnerProps {
  assetId: string;
  userId?: string; // If co-owner is a registered user
  externalName?: string; // If co-owner is not a system user
  sharePercentage: number; // Percentage ownership (0-100)
  ownershipType: CoOwnershipType;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Asset Co-Owner Entity
 *
 * Represents a co-ownership relationship between an asset and an owner.
 * Critical for calculating distributable estate value.
 *
 * Legal Context:
 * - Share percentage determines inheritance portion
 * - Ownership type affects survivorship rights
 * - Kenyan Law of Property Act governs co-ownership rules
 */
export class AssetCoOwner extends Entity<AssetCoOwnerProps> {
  // Getters
  get assetId(): string {
    return this.props.assetId;
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  get externalName(): string | undefined {
    return this.props.externalName;
  }

  get sharePercentage(): number {
    return this.props.sharePercentage;
  }

  get ownershipType(): CoOwnershipType {
    return this.props.ownershipType;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  /**
   * Get co-owner display name
   */
  get displayName(): string {
    if (this.props.userId) {
      return `User: ${this.props.userId}`;
    }
    if (this.props.externalName) {
      return `External: ${this.props.externalName}`;
    }
    return 'Unknown Co-Owner';
  }

  /**
   * Check if this co-owner is a registered user
   */
  get isRegisteredUser(): boolean {
    return !!this.props.userId;
  }

  /**
   * Check if this co-owner is external (not a system user)
   */
  get isExternal(): boolean {
    return !!this.props.externalName;
  }

  /**
   * Private constructor - use factory methods
   */
  private constructor(id: UniqueEntityID, props: AssetCoOwnerProps) {
    super(id, props, props.createdAt);
    this.validateCoOwner();
  }

  /**
   * Validate co-owner invariants
   */
  private validateCoOwner(): void {
    // Share percentage validation
    if (
      this.props.sharePercentage <= 0 ||
      this.props.sharePercentage > 100 ||
      isNaN(this.props.sharePercentage)
    ) {
      throw new InvalidSharePercentageException(
        this.props.assetId,
        this.id.toString(),
        this.props.sharePercentage,
      );
    }

    // Must have either userId or externalName
    if (!this.props.userId && !this.props.externalName) {
      throw new CoOwnershipCannotBeModifiedException(
        this.props.assetId,
        'Co-owner must have either userId or externalName',
      );
    }

    // Cannot have both userId and externalName
    if (this.props.userId && this.props.externalName) {
      throw new CoOwnershipCannotBeModifiedException(
        this.props.assetId,
        'Co-owner cannot have both userId and externalName',
      );
    }

    // Validate ownership type constraints
    this.validateOwnershipTypeConstraints();
  }

  /**
   * Validate ownership type constraints
   */
  private validateOwnershipTypeConstraints(): void {
    const { ownershipType, sharePercentage } = this.props;

    // Joint tenancy and community property require specific share percentages
    if (
      ownershipType === CoOwnershipType.JOINT_TENANCY &&
      sharePercentage !== 50 // This might vary based on number of joint tenants
    ) {
      // Note: Actual validation depends on total number of joint tenants
      // This is checked at the aggregate level
    }

    if (ownershipType === CoOwnershipType.COMMUNITY_PROPERTY && sharePercentage !== 50) {
      throw new CoOwnershipCannotBeModifiedException(
        this.props.assetId,
        'Community property must have 50% share',
      );
    }
  }

  /**
   * Update share percentage
   */
  updateSharePercentage(newSharePercentage: number, updatedBy: string): void {
    this.ensureCanBeModified();

    if (newSharePercentage <= 0 || newSharePercentage > 100 || isNaN(newSharePercentage)) {
      throw new InvalidSharePercentageException(
        this.props.assetId,
        this.id.toString(),
        newSharePercentage,
      );
    }

    const oldSharePercentage = this.props.sharePercentage;

    this.updateState({
      sharePercentage: newSharePercentage,
      updatedAt: new Date(),
    });

    // Add domain event
    this.addDomainEvent(
      new CoOwnerShareUpdatedEvent(
        this.props.assetId,
        this.id.toString(),
        oldSharePercentage,
        newSharePercentage,
        updatedBy,
        this.props.version,
      ),
    );
  }

  /**
   * Change ownership type
   */
  changeOwnershipType(newOwnershipType: CoOwnershipType, changedBy: string): void {
    this.ensureCanBeModified();

    const oldOwnershipType = this.props.ownershipType;

    this.updateState({
      ownershipType: newOwnershipType,
      updatedAt: new Date(),
    });

    // Get legal implications
    const legalImplications = CoOwnershipTypeHelper.getInheritanceImplications(newOwnershipType);

    // Add domain event
    this.addDomainEvent(
      new CoOwnershipTypeChangedEvent(
        this.props.assetId,
        oldOwnershipType,
        newOwnershipType,
        changedBy,
        legalImplications,
        this.props.version,
      ),
    );

    // Validate new ownership type constraints
    this.validateOwnershipTypeConstraints();
  }

  /**
   * Activate co-owner relationship
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
   * Deactivate co-owner relationship
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
   * Check if this co-owner has right of survivorship
   */
  hasRightOfSurvivorship(): boolean {
    return CoOwnershipTypeHelper.hasRightOfSurvivorship(this.props.ownershipType);
  }

  /**
   * Check if this co-ownership affects distributable share
   */
  affectsDistributableShare(): boolean {
    return CoOwnershipTypeHelper.affectsDistributableShare(this.props.ownershipType);
  }

  /**
   * Get the distributable share value
   */
  getDistributableValue(assetTotalValue: number): number {
    if (!this.affectsDistributableShare()) {
      // Joint tenancy shares don't go through estate
      return 0;
    }

    return (assetTotalValue * this.props.sharePercentage) / 100;
  }

  /**
   * Check if co-owner can be included in estate distribution
   */
  canBeIncludedInDistribution(): boolean {
    return this.props.isActive && this.affectsDistributableShare();
  }

  /**
   * Get summary for reporting
   */
  getSummary(): {
    id: string;
    assetId: string;
    userId?: string;
    externalName?: string;
    sharePercentage: number;
    ownershipType: string;
    hasSurvivorship: boolean;
    affectsDistribution: boolean;
  } {
    return {
      id: this.id.toString(),
      assetId: this.props.assetId,
      userId: this.props.userId,
      externalName: this.props.externalName,
      sharePercentage: this.props.sharePercentage,
      ownershipType: this.props.ownershipType,
      hasSurvivorship: this.hasRightOfSurvivorship(),
      affectsDistribution: this.affectsDistributableShare(),
    };
  }

  /**
   * Ensure co-owner can be modified
   */
  private ensureCanBeModified(): void {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      throw new CoOwnershipCannotBeModifiedException(
        this.props.assetId,
        'Co-owner relationship is not active',
      );
    }
  }

  /**
   * Clone co-owner properties for snapshot
   */
  protected cloneProps(): AssetCoOwnerProps {
    return { ...this.props };
  }
}
