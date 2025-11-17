import { AggregateRoot } from '@nestjs/cqrs';
import { WillStatus, DebtType } from '@prisma/client';
import { WillAggregate } from './will.aggregate';
import { Asset } from '../entities/asset.entity';
import { Debt } from '../entities/debt.entity';
import { AssetValue } from '../value-objects/asset-value.vo';

interface EstateSummary {
  totalAssets: AssetValue;
  totalDebts: AssetValue;
  netValue: AssetValue;
  assetCount: number;
  debtCount: number;
}

export class EstateAggregate extends AggregateRoot {
  private wills: Map<string, WillAggregate> = new Map();
  private standaloneAssets: Map<string, Asset> = new Map();
  private debts: Map<string, Debt> = new Map();

  constructor() {
    super();
  }

  // Will management
  addWill(will: WillAggregate): void {
    if (this.wills.has(will.getWill().getId())) {
      throw new Error(`Will ${will.getWill().getId()} already exists in estate`);
    }

    this.wills.set(will.getWill().getId(), will);
  }

  removeWill(willId: string): void {
    if (!this.wills.has(willId)) {
      throw new Error(`Will ${willId} not found in estate`);
    }

    this.wills.delete(willId);
  }

  getWill(willId: string): WillAggregate | undefined {
    return this.wills.get(willId);
  }

  getAllWills(): WillAggregate[] {
    return Array.from(this.wills.values());
  }

  getActiveWill(): WillAggregate | undefined {
    return Array.from(this.wills.values()).find(
      will => will.getWill().getStatus() === WillStatus.ACTIVE
    );
  }

  // Standalone asset management (assets not in any will)
  addStandaloneAsset(asset: Asset): void {
    if (this.standaloneAssets.has(asset.getId())) {
      throw new Error(`Asset ${asset.getId()} already exists in estate`);
    }

    this.standaloneAssets.set(asset.getId(), asset);
  }

  removeStandaloneAsset(assetId: string): void {
    if (!this.standaloneAssets.has(assetId)) {
      throw new Error(`Asset ${assetId} not found in estate`);
    }

    this.standaloneAssets.delete(assetId);
  }

  getStandaloneAsset(assetId: string): Asset | undefined {
    return this.standaloneAssets.get(assetId);
  }

  getAllStandaloneAssets(): Asset[] {
    return Array.from(this.standaloneAssets.values());
  }

  // Debt management
  addDebt(debt: Debt): void {
    if (this.debts.has(debt.getId())) {
      throw new Error(`Debt ${debt.getId()} already exists in estate`);
    }

    this.debts.set(debt.getId(), debt);
  }

  removeDebt(debtId: string): void {
    if (!this.debts.has(debtId)) {
      throw new Error(`Debt ${debtId} not found in estate`);
    }

    this.debts.delete(debtId);
  }

  getDebt(debtId: string): Debt | undefined {
    return this.debts.get(debtId);
  }

  getAllDebts(): Debt[] {
    return Array.from(this.debts.values());
  }

  getOutstandingDebts(): Debt[] {
    return Array.from(this.debts.values()).filter(debt => !debt.getIsPaid());
  }

  // Estate calculations and business logic
  getEstateSummary(): EstateSummary {
    const allAssets = this.getAllAssets();
    const allDebts = this.getAllDebts();

    const totalAssets = allAssets.reduce((sum, asset) => {
      return sum.add(asset.getCurrentValue());
    }, new AssetValue(0, 'KES'));

    const totalDebts = allDebts.reduce((sum, debt) => {
      const debtValue = new AssetValue(
        debt.getOutstandingBalance(),
        debt.getCurrency()
      );
      return sum.add(debtValue);
    }, new AssetValue(0, 'KES'));

    const netValue = totalAssets.subtract(totalDebts);

    return {
      totalAssets,
      totalDebts,
      netValue,
      assetCount: allAssets.length,
      debtCount: allDebts.length
    };
  }

  getAllAssets(): Asset[] {
    const willAssets = Array.from(this.wills.values()).flatMap(
      will => will.getAllAssets()
    );
    const standaloneAssets = Array.from(this.standaloneAssets.values());
    
    return [...willAssets, ...standaloneAssets];
  }

  getTransferableAssets(): Asset[] {
    return this.getAllAssets().filter(asset => asset.canBeTransferred());
  }

  getEncumberedAssets(): Asset[] {
    return this.getAllAssets().filter(asset => asset.getIsEncumbered());
  }

  getAssetsByType(assetType: string): Asset[] {
    return this.getAllAssets().filter(asset => asset.getType() === assetType);
  }

  // Debt prioritization according to Kenyan law
  getPrioritizedDebts(): Debt[] {
    const outstandingDebts = this.getOutstandingDebts();
    
    return outstandingDebts.sort((a, b) => {
      // Priority order: Funeral expenses > Taxes > Secured debts > Unsecured debts
      const priorityOrder = {
        [DebtType.FUNERAL_EXPENSE]: 1,
        [DebtType.TAX_OBLIGATION]: 2,
        [DebtType.MORTGAGE]: 3,
        [DebtType.BUSINESS_DEBT]: 4,
        [DebtType.PERSONAL_LOAN]: 5,
        [DebtType.CREDIT_CARD]: 6,
        [DebtType.MEDICAL_BILL]: 7,
        [DebtType.OTHER]: 8
      };

      return (priorityOrder[a.getType()] || 9) - (priorityOrder[b.getType()] || 9);
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
          summary.netValue.getCurrency()
        )
      };
    }
  }

  // Distribution planning
  calculateAvailableForDistribution(): AssetValue {
    const summary = this.getEstateSummary();
    const outstandingDebts = this.getOutstandingDebts();
    
    const totalDebtAmount = outstandingDebts.reduce((sum, debt) => {
      return sum + debt.getOutstandingBalance();
    }, 0);

    const availableAmount = summary.totalAssets.getAmount() - totalDebtAmount;
    
    return new AssetValue(
      Math.max(0, availableAmount),
      summary.totalAssets.getCurrency()
    );
  }

  // Kenyan law specific validations
  validateKenyanLawCompliance(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const summary = this.getEstateSummary();

    // Check if estate has at least one valid will or should follow intestate rules
    const activeWills = Array.from(this.wills.values()).filter(
      will => will.getWill().isActiveWill()
    );

    if (activeWills.length === 0) {
      issues.push('No active will found - estate will follow intestate succession rules');
    }

    if (activeWills.length > 1) {
      issues.push('Multiple active wills found - this may cause legal conflicts');
    }

    // Check for dependents' provision (simplified)
    // In reality, we'd check family members for spouses and children
    const hasDependents = this.hasPotentialDependents();
    if (hasDependents && activeWills.length > 0) {
      // Check if will provides for dependents adequately
      // This is a complex legal check that would require more context
    }

    // Validate asset documentation
    const assetsWithoutDocs = this.getAllAssets().filter(
      asset => !asset.getHasVerifiedDocument()
    );
    if (assetsWithoutDocs.length > 0) {
      issues.push(`${assetsWithoutDocs.length} assets lack verified documentation`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  private hasPotentialDependents(): boolean {
    // Simplified check - in reality, we'd query family relationships
    // For now, assume there might be dependents if there are assets
    return this.getAllAssets().length > 0;
  }

  // Static factory method
  static create(): EstateAggregate {
    return new EstateAggregate();
  }
}