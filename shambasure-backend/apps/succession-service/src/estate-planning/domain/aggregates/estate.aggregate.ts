import { AggregateRoot } from '@nestjs/cqrs';
import { WillStatus } from '@prisma/client';
import { Will } from '../entities/will.entity';
import { Asset } from '../entities/asset.entity';
import { Debt } from '../entities/debt.entity';
import { AssetValue } from '../value-objects/asset-value.vo';
import { DEBT_PRIORITY } from '../../../common/constants/distribution-rules.constants';

interface EstateSummary {
  totalAssets: AssetValue; // Uses default currency (KES)
  totalDebts: AssetValue;
  netValue: AssetValue;
  assetCount: number;
  debtCount: number;
}

export class EstateAggregate extends AggregateRoot {
  private wills: Map<string, Will> = new Map();
  private assets: Map<string, Asset> = new Map();
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
  }

  getActiveWill(): Will | undefined {
    return Array.from(this.wills.values()).find((will) => will.getStatus() === WillStatus.ACTIVE);
  }

  // --------------------------------------------------------------------------
  // ASSET MANAGEMENT
  // --------------------------------------------------------------------------

  addAsset(asset: Asset): void {
    if (asset.getOwnerId() !== this.deceasedId) {
      throw new Error('Asset owner does not match estate deceased person.');
    }
    if (this.assets.has(asset.getId())) {
      throw new Error(`Asset ${asset.getId()} already exists in estate.`);
    }
    this.assets.set(asset.getId(), asset);
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

  /**
   * Returns estate financial summary.
   * NOTE: Basic implementation assumes Single Currency (KES).
   * In a real multi-currency scenario, we would need a CurrencyConverter service here.
   */
  getEstateSummary(defaultCurrency: string = 'KES'): EstateSummary {
    const allAssets = this.getAllAssets();
    const allDebts = this.getAllDebts();

    let totalAssetsAmount = 0;
    let totalDebtsAmount = 0;

    // 1. Sum Assets
    for (const asset of allAssets) {
      const val = asset.getCurrentValue();
      // If currency mismatch, we skip or log warning.
      // Ideally, inject a converter, but for Entity logic keep it simple.
      if (val.getCurrency() === defaultCurrency) {
        totalAssetsAmount += val.getAmount();
      }
    }

    // 2. Sum Debts
    for (const debt of allDebts) {
      const val = debt.getOutstandingBalance();
      if (val.getCurrency() === defaultCurrency) {
        totalDebtsAmount += val.getAmount();
      }
    }

    const totalAssets = new AssetValue(totalAssetsAmount, defaultCurrency);
    const totalDebts = new AssetValue(totalDebtsAmount, defaultCurrency);
    const netValue = totalAssets.subtract(totalDebts); // AssetValue handles negative check internally

    return {
      totalAssets,
      totalDebts,
      netValue,
      assetCount: allAssets.length,
      debtCount: allDebts.length,
    };
  }

  /**
   * Sorts debts according to legal priority (Funeral > Taxes > Secured > Unsecured)
   */
  getPrioritizedDebts(): Debt[] {
    const outstandingDebts = this.getOutstandingDebts();
    const priorityMap = new Map<string, number>();
    DEBT_PRIORITY.ORDER.forEach((item) => priorityMap.set(item.category, item.priority));

    return outstandingDebts.sort((a, b) => {
      // Map DebtType (Prisma Enum) to DebtCategory (Our Constant)
      // This mapping logic might need adjustment based on exact string matches
      const priorityA = priorityMap.get(this.mapDebtTypeToCategory(a.getType())) || 99;
      const priorityB = priorityMap.get(this.mapDebtTypeToCategory(b.getType())) || 99;
      return priorityA - priorityB;
    });
  }

  private mapDebtTypeToCategory(type: string): string {
    // Simple mapping helper
    if (type === 'FUNERAL_EXPENSE') return 'FUNERAL_EXPENSES';
    if (type === 'TAX_OBLIGATION') return 'TAXES';
    if (type === 'MORTGAGE') return 'SECURED_CREDITORS';
    return 'UNSECURED_CREDITORS';
  }

  validateEstateSolvency(): { isSolvent: boolean; shortfall?: AssetValue } {
    const summary = this.getEstateSummary(); // Default KES

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
