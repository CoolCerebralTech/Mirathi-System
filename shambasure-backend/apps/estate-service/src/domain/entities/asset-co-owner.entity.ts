// src/estate-service/src/domain/entities/asset-co-owner.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { CoOwnershipType } from '../enums/co-ownership-type.enum';
import { AssetLogicException } from '../exceptions/asset.exception';

export interface AssetCoOwnerProps {
  assetId: string;
  userId?: string; // If system user
  externalName?: string; // If external party
  sharePercentage: number;
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
 * Represents a third party who owns a slice of an asset.
 * The Estate's value is reduced by this person's share.
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
    props: Omit<AssetCoOwnerProps, 'createdAt' | 'updatedAt' | 'version' | 'isActive'>,
    id?: UniqueEntityID,
  ): AssetCoOwner {
    return new AssetCoOwner(
      {
        ...props,
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  protected validate(): void {
    if (this.props.sharePercentage <= 0 || this.props.sharePercentage > 100) {
      throw new AssetLogicException('Share percentage must be between 0 and 100');
    }
    if (!this.props.userId && !this.props.externalName) {
      throw new AssetLogicException('Co-Owner must have a name or User ID');
    }
  }

  // Getters
  get sharePercentage(): number {
    return this.props.sharePercentage;
  }
  get ownershipType(): CoOwnershipType {
    return this.props.ownershipType;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get userId(): string | undefined {
    return this.props.userId;
  }
  get externalName(): string | undefined {
    return this.props.externalName;
  }

  /**
   * Updates the share percentage.
   * NOTE: The Asset Aggregate calls this. It does not emit events directly;
   * the Asset Aggregate emits the event to keep the transaction boundary clean.
   */
  public updateSharePercentage(newPercentage: number, _updatedBy: string): void {
    if (newPercentage <= 0 || newPercentage > 100) {
      throw new AssetLogicException('Invalid share percentage');
    }

    this.updateState({
      sharePercentage: newPercentage,
      updatedAt: new Date(),
    });
    // Event is emitted by the Root Aggregate (Asset)
  }

  public deactivate(): void {
    this.updateState({ isActive: false });
  }
}
