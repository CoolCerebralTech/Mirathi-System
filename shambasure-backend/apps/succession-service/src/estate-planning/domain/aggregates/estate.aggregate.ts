import { AggregateRoot } from '@nestjs/cqrs';
import { WillStatus } from '@prisma/client';
import { Will } from '../entities/will.entity'; // Changed from WillAggregate to Will Entity for simplicity if Will is the root
import { Asset } from '../entities/asset.entity';
import { Debt } from '../entities/debt.entity';
import { AssetValue } from '../value-objects/asset-value.vo';
import { DEBT_PRIORITY } from '../../../common/constants/distribution-rules.constants';

// Events (We will need to create these later)
// import { EstateDebtAddedEvent } from '../events/estate-debt-added.event';
// import { EstateAssetAddedEvent } from '../events/estate-asset-added.event';

interface EstateSummary {
  totalAssets: AssetValue;
  totalDebts: AssetValue;
  netValue: AssetValue;
  assetCount: number;
  debtCount: number;
}

export class EstateAggregate extends AggregateRoot {
  private wills: Map<string, Will> = new Map();
  private assets: Map<string, Asset> = new Map(); // Combined storage for simplicity
  private debts: Map<string, Debt> = new Map();

  // Metadata
  private deceasedId: string;

  constructor(id: string, deceasedId: string) {
    super();
    this.deceasedId = deceasedId;
  }

  // --------------------------------------------------------------------------
  // WILL MANAGEMENT
  // --------------------------------------------------------------------------

  addWill(will: Will): void {
    if (will.getTestatorId() !== this.deceasedId) {
      throw new Error('Will testator does not match estate deceased person.');
    }
    if (this.wills.has(will.getId())) {
      throw new Error(`Will ${will.getId()} already exists in estate.`);
    }
    this.wills.set(will.getId(), will);
    // this.apply(new EstateWillAddedEvent(...));
  }

  getActiveWill(): Will | undefined {
    return Array.from(this.wills.values()).find((will) => will.getStatus() === WillStatus.ACTIVE);
  }

  // --------------------------------------------------------------------------
  // ASSET MANAGEMENT
  // --------------------------------------------------------------------------

  addAsset(asset: Asset): void {
    if (asset.getOwnerId() !== this.deceasedId) {
      // In a real scenario, we might handle joint assets, but for now, strict ownership
      throw new Error('Asset owner does not match estate deceased person.');
    }
    if (this.assets.has(asset.getId())) {
      throw new Error(`Asset ${asset.getId()} already exists in estate.`);
    }
    this.assets.set(asset.getId(), asset);
    // this.apply(new EstateAssetAddedEvent(...));
  }

  removeAsset(assetId: string): void {
    if (!this.assets.has(assetId)) {
      throw new Error(`Asset ${assetId} not found in estate.`);
    }
    this.assets.delete(assetId);
  }

  getAllAssets(): Asset[] {
    return Array.from(this.assets.values());
  }

  getTransferableAssets(): Asset[] {
    return this.getAllAssets().filter((asset) => asset.canBeTransferred());
  }

  // --------------------------------------------------------------------------
  // DEBT MANAGEMENT
  // --------------------------------------------------------------------------

  addDebt(debt: Debt): void {
    if (this.debts.has(debt.getId())) {
      throw new Error(`Debt ${debt.getId()} already exists in estate.`);
    }
    this.debts.set(debt.getId(), debt);
    // this.apply(new EstateDebtAddedEvent(...));
  }

  getAllDebts(): Debt[] {
    return Array.from(this.debts.values());
  }

  getOutstandingDebts(): Debt[] {
    return Array.from(this.debts.values()).filter((debt) => !debt.getIsPaid());
  }

  // --------------------------------------------------------------------------
  // DOMAIN LOGIC & CALCULATIONS
  // --------------------------------------------------------------------------

  getEstateSummary(): EstateSummary {
    const allAssets = this.getAllAssets();
    const allDebts = this.getAllDebts();

    const totalAssets = allAssets.reduce(
      (sum, asset) => {
        // We use our AssetValue VO's add method for safe currency math
        return sum.add(asset.getCurrentValue());
      },
      new AssetValue(0, 'KES'),
    ); // Assuming default currency

    const totalDebts = allDebts.reduce(
      (sum, debt) => {
        return sum.add(debt.getOutstandingBalance());
      },
      new AssetValue(0, 'KES'),
    );

    const netValue = totalAssets.subtract(totalDebts);

    return {
      totalAssets,
      totalDebts,
      netValue,
      assetCount: allAssets.length,
      debtCount: allDebts.length,
    };
  }

  /**
   * Sorts debts according to the legal priority defined in our constants.
   * Consumes Single Source of Truth: DEBT_PRIORITY
   */
  getPrioritizedDebts(): Debt[] {
    const outstandingDebts = this.getOutstandingDebts();

    // Create a lookup map for priority: { 'FUNERAL_EXPENSES': 1, 'TAXES': 2 ... }
    const priorityMap = new Map<string, number>();
    DEBT_PRIORITY.ORDER.forEach((item) => priorityMap.set(item.category, item.priority));

    return outstandingDebts.sort((a, b) => {
      const priorityA = priorityMap.get(a.getType()) || 99;
      const priorityB = priorityMap.get(b.getType()) || 99;
      return priorityA - priorityB;
    });
  }

  validateEstateSolvency(): { isSolvent: boolean; shortfall?: AssetValue } {
    const summary = this.getEstateSummary();

    if (summary.netValue.getAmount() >= 0) {
      return { isSolvent: true };
    } else {
      return {
        isSolvent: false,
        shortfall: new AssetValue(
          Math.abs(summary.netValue.getAmount()),
          summary.netValue.getCurrency(),
        ),
      };
    }
  }

  // --------------------------------------------------------------------------
  // FACTORY
  // --------------------------------------------------------------------------

  static create(id: string, deceasedId: string): EstateAggregate {
    return new EstateAggregate(id, deceasedId);
  }
}
