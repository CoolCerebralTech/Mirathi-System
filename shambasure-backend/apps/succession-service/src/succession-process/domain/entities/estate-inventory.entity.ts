// succession-service/src/succession-process/domain/entities/estate-inventory.entity.ts

import { AggregateRoot } from '@nestjs/cqrs';
import { AssetValue } from '../../../estate-planning/domain/value-objects/asset-value.vo';
import { InventoryItemAddedEvent } from '../events/inventory-item-added.event';
import { InventoryItemVerifiedEvent } from '../events/inventory-item-verified.event';

export class EstateInventory extends AggregateRoot {
  private id: string;
  private estateId: string;

  // Link to physical asset module
  private assetId: string | null;

  // Description for Form P&A 5
  private description: string;
  private estimatedValue: AssetValue;

  // Ownership Status
  private ownedByDeceased: boolean; // True = Free Property, False = Held in Trust/Joint

  // Process Status
  private isVerified: boolean;
  private verifiedAt: Date | null;

  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    estateId: string,
    description: string,
    estimatedValue: AssetValue,
    ownedByDeceased: boolean,
  ) {
    super();
    this.id = id;
    this.estateId = estateId;
    this.description = description;
    this.estimatedValue = estimatedValue;
    this.ownedByDeceased = ownedByDeceased;

    this.assetId = null;
    this.isVerified = false;
    this.verifiedAt = null;

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    estateId: string,
    description: string,
    estimatedValue: AssetValue,
    assetId?: string,
    ownedByDeceased: boolean = true,
  ): EstateInventory {
    // Logic: Negative values handled by VO, but inventory shouldn't accept 0
    // unless specific exemption (e.g. sentimental item).

    const item = new EstateInventory(id, estateId, description, estimatedValue, ownedByDeceased);

    if (assetId) item.assetId = assetId;

    item.apply(new InventoryItemAddedEvent(id, estateId, description, estimatedValue, assetId));

    return item;
  }

  static reconstitute(props: any): EstateInventory {
    // Reconstruct AssetValue from flat DB props
    const val = new AssetValue(Number(props.estimatedValue), props.currency || 'KES');

    const item = new EstateInventory(
      props.id,
      props.estateId,
      props.description,
      val,
      props.ownedByDeceased,
    );

    item.assetId = props.assetId || null;
    item.isVerified = false; // Logic to infer from props or add column if needed
    // If DB has verified flag, load it:
    // item.isVerified = props.isVerified;

    item.createdAt = new Date(props.createdAt);
    item.updatedAt = new Date(props.updatedAt);

    return item;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Confirms that this item exists and belongs to the estate.
   * Usually done after Cross-Checking with Lands Office search.
   */
  verify(verifiedBy: string): void {
    if (this.isVerified) return;

    this.isVerified = true;
    this.verifiedAt = new Date();
    this.updatedAt = new Date();

    this.apply(new InventoryItemVerifiedEvent(this.id, this.estateId, verifiedBy));
  }

  /**
   * Updates valuation (e.g. after professional valuer report).
   */
  updateValuation(newValue: AssetValue): void {
    // If already verified/filed in court, updating this might require
    // an "Amended Inventory" filing.

    this.estimatedValue = newValue;
    this.updatedAt = new Date();
    // Trigger event if needed for audit
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId() {
    return this.id;
  }
  getEstateId() {
    return this.estateId;
  }
  getDescription() {
    return this.description;
  }
  getValue() {
    return this.estimatedValue;
  }
  getAssetId() {
    return this.assetId;
  }
  getIsVerified() {
    return this.isVerified;
  }
}
