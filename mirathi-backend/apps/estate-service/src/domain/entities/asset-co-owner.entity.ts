// src/estate-service/src/domain/entities/asset-co-owner.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { CoOwnershipType } from '../enums/co-ownership-type.enum';
import {
  AssetCoOwnerRemovedEvent,
  AssetCoOwnerShareUpdatedEvent,
} from '../events/asset-co-owner.event';
import { AssetCoOwnerException } from '../exceptions/asset-co-owner.exception';

export interface AssetCoOwnerProps {
  assetId: string;

  // Identity - Must reference a FamilyMember (not just userId)
  familyMemberId: string;

  // Co-ownership details
  sharePercentage: number;
  ownershipType: CoOwnershipType;

  // Legal Evidence (for disputed claims)
  evidenceOfOwnership?: string; // Document reference/URL
  ownershipDate?: Date; // When co-ownership was established
  purchasePrice?: number; // If purchased from deceased

  // Status
  isActive: boolean;
  isVerified: boolean;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Asset Co-Owner Entity
 *
 * Represents a third party who owns a slice of an asset.
 *
 * BUSINESS RULES:
 * 1. Each co-owner must be a verified FamilyMember
 * 2. Total co-owner shares cannot exceed 100% (enforced by Asset aggregate)
 * 3. Joint tenancy co-owners get right of survivorship
 * 4. Evidence required for high-value co-ownership claims
 * 5. Active co-owners reduce the estate's distributable share
 *
 * LEGAL CONTEXT:
 * - Section 35(3) Hotchpot may consider transfers to co-owners
 * - Co-ownership evidence may be required in court disputes
 * - Joint tenancy bypasses probate process
 */
export class AssetCoOwner extends Entity<AssetCoOwnerProps> {
  private constructor(props: AssetCoOwnerProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
    this.validate();
  }

  /**
   * Factory Method to create a new Co-Owner
   */
  public static create(
    props: Omit<AssetCoOwnerProps, 'isActive' | 'isVerified' | 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): AssetCoOwner {
    const now = new Date();

    return new AssetCoOwner(
      {
        ...props,
        isActive: true,
        isVerified: false,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  /**
   * Factory for Joint Tenancy co-owner (common for spouses)
   */
  public static createJointTenancy(
    assetId: string,
    familyMemberId: string,
    sharePercentage: number,
    createdBy: string,
    ownershipDate?: Date,
  ): AssetCoOwner {
    return AssetCoOwner.create({
      assetId,
      familyMemberId,
      sharePercentage,
      ownershipType: CoOwnershipType.JOINT_TENANCY,
      createdBy,
      ownershipDate: ownershipDate || new Date(),
    });
  }

  /**
   * Factory for Tenancy in Common co-owner
   */
  public static createTenancyInCommon(
    assetId: string,
    familyMemberId: string,
    sharePercentage: number,
    createdBy: string,
    purchasePrice?: number,
  ): AssetCoOwner {
    return AssetCoOwner.create({
      assetId,
      familyMemberId,
      sharePercentage,
      ownershipType: CoOwnershipType.TENANCY_IN_COMMON,
      createdBy,
      purchasePrice,
      ownershipDate: new Date(),
    });
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  private validate(): void {
    // Share must be between 0.01% and 100%
    if (this.props.sharePercentage <= 0 || this.props.sharePercentage > 100) {
      throw new AssetCoOwnerException('Share percentage must be between 0.01 and 100');
    }

    // Must have at least 0.01% share (minimum)
    if (this.props.sharePercentage < 0.01) {
      throw new AssetCoOwnerException('Share percentage must be at least 0.01%');
    }

    // Must have family member reference
    if (!this.props.familyMemberId) {
      throw new AssetCoOwnerException('Co-owner must be linked to a family member');
    }

    // High-value shares (>10%) require evidence
    if (this.props.sharePercentage > 10 && !this.props.evidenceOfOwnership) {
      console.warn(`Warning: Co-owner with ${this.props.sharePercentage}% share lacks evidence`);
      // Not throwing, but logging for audit
    }

    // Validate ownership date is not in the future
    if (this.props.ownershipDate && this.props.ownershipDate > new Date()) {
      throw new AssetCoOwnerException('Ownership date cannot be in the future');
    }
    // Validate share percentage precision (max 2 decimal places)
    const rounded = Math.round(this.props.sharePercentage * 100) / 100;
    if (Math.abs(this.props.sharePercentage - rounded) > 0.001) {
      throw new AssetCoOwnerException('Share percentage must have maximum 2 decimal places');
    }
    // Validate purchase price if provided
    if (this.props.purchasePrice !== undefined && this.props.purchasePrice < 0) {
      throw new AssetCoOwnerException('Purchase price cannot be negative');
    }
  }

  // ===========================================================================
  // BUSINESS LOGIC
  // ===========================================================================

  /**
   * Updates the share percentage
   *
   * NOTE: The Asset Aggregate must validate that total shares don't exceed 100%
   */
  public updateSharePercentage(newPercentage: number, reason: string, updatedBy: string): void {
    if (newPercentage <= 0 || newPercentage > 100) {
      throw new AssetCoOwnerException('Share percentage must be between 0.01 and 100');
    }

    const oldPercentage = this.props.sharePercentage;

    this.updateState({
      sharePercentage: newPercentage,
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new AssetCoOwnerShareUpdatedEvent(
        this.id.toString(),
        this.props.assetId,
        this.props.familyMemberId,
        oldPercentage,
        newPercentage,
        reason,
        updatedBy,
        this.version,
      ),
    );
  }

  /**
   * Verifies the co-ownership claim
   *
   * Requires evidence and verification by authorized person
   */
  public verify(verifiedBy: string, verificationNotes?: string, evidenceUrl?: string): void {
    if (this.props.isVerified) {
      throw new AssetCoOwnerException('Co-owner is already verified');
    }

    // For high-value shares, evidence is mandatory
    if (this.props.sharePercentage > 25 && !evidenceUrl) {
      throw new AssetCoOwnerException(
        `High-value co-ownership (${this.props.sharePercentage}%) requires evidence`,
      );
    }

    this.updateState({
      isVerified: true,
      verificationNotes,
      verifiedBy,
      verifiedAt: new Date(),
      ...(evidenceUrl && { evidenceOfOwnership: evidenceUrl }),
      updatedAt: new Date(),
    });
  }

  /**
   * Revokes verification (e.g., if evidence is disputed)
   */
  public revokeVerification(reason: string, _revokedBy: string): void {
    this.updateState({
      isVerified: false,
      verificationNotes: `Verification revoked: ${reason}. Previous notes: ${this.props.verificationNotes}`,
      verifiedBy: undefined,
      verifiedAt: undefined,
      updatedAt: new Date(),
    });
  }

  /**
   * Deactivates co-owner (e.g., transfer of share, dispute)
   */
  public deactivate(reason: string, deactivatedBy: string): void {
    if (!this.props.isActive) {
      throw new AssetCoOwnerException('Co-owner is already inactive');
    }

    this.updateState({
      isActive: false,
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new AssetCoOwnerRemovedEvent(
        this.id.toString(),
        this.props.assetId,
        this.props.familyMemberId,
        this.props.sharePercentage,
        reason,
        deactivatedBy,
        this.version,
      ),
    );
  }

  /**
   * Reactivates co-owner (e.g., after dispute resolution)
   */
  public reactivate(_reason: string, _reactivatedBy: string): void {
    if (this.props.isActive) {
      throw new AssetCoOwnerException('Co-owner is already active');
    }

    this.updateState({
      isActive: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Updates evidence for co-ownership claim
   */
  public updateEvidence(evidenceUrl: string, notes: string, _updatedBy: string): void {
    this.updateState({
      evidenceOfOwnership: evidenceUrl,
      verificationNotes: `Evidence updated: ${notes}. ${this.props.verificationNotes || ''}`,
      isVerified: false, // Require reverification after evidence change
      verifiedBy: undefined,
      verifiedAt: undefined,
      updatedAt: new Date(),
    });
  }

  // ===========================================================================
  // QUERIES & VALIDATION
  // ===========================================================================
  /**
   * Calculate the estate's share after this co-owner's claim
   */
  public getEstateShare(): number {
    if (!this.isReadyForInclusion()) {
      return 100; // Co-owner not verified, estate retains full share
    }
    return 100 - this.props.sharePercentage;
  }
  /**
   * Check if co-owner has right of survivorship
   */
  public hasRightOfSurvivorship(): boolean {
    return this.props.ownershipType === CoOwnershipType.JOINT_TENANCY;
  }

  /**
   * Check if co-owner's share is significant (>10%)
   */
  public hasSignificantShare(): boolean {
    return this.props.sharePercentage > 10;
  }

  /**
   * Check if co-owner is ready for estate calculation
   */
  public isReadyForInclusion(): boolean {
    return this.props.isActive && this.props.isVerified;
  }
  /**
   * Check if evidence is required for this co-ownership
   */
  public requiresEvidence(): boolean {
    return (
      this.props.sharePercentage > 25 ||
      this.props.ownershipType === CoOwnershipType.TENANCY_IN_COMMON
    );
  }
  // ===========================================================================
  // GETTERS
  // ===========================================================================

  get assetId(): string {
    return this.props.assetId;
  }

  get familyMemberId(): string {
    return this.props.familyMemberId;
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

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get evidenceOfOwnership(): string | undefined {
    return this.props.evidenceOfOwnership;
  }

  get verificationNotes(): string | undefined {
    return this.props.verificationNotes;
  }

  get ownershipDate(): Date | undefined {
    return this.props.ownershipDate;
  }

  get purchasePrice(): number | undefined {
    return this.props.purchasePrice;
  }
}
