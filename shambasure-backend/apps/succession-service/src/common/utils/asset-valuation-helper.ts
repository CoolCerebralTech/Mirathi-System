import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

// --- IMPROVEMENT 1: Using the Single Source of Truth ---
// We import the official data models directly from the Prisma Client and our new config.
// This ensures our logic is always synchronized with our database schema and configuration.
import { Asset, AssetType } from '@prisma/client';
import valuationConfig from '../config/valuation.config';

/**
 * A richer Asset type for valuation purposes.
 * Our Prisma `Asset` model might store complex data in a `metadata` JSON field.
 * This type represents the structured data we need for our calculations.
 */
type ValuationAsset = Asset & {
  // These properties would typically be parsed from the Asset's `metadata` field
  location?: string;
  size?: number;
  infrastructure?: string[];
  propertyType?: 'residential' | 'commercial';
  condition?: 'EXCELLENT' | 'GOOD' | 'POOR';
  age?: number;
  purchasePrice?: number;
  livestockType?: 'cattle' | 'goats';
  quantity?: number;
};

// These interfaces define the clear output "shape" of our helper's methods.
export interface AssetValuation {
  assetId: string;
  assetType: AssetType;
  estimatedValue: number;
  currency: 'KES';
  valuationDate: Date;
  valuationMethod: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string;
}

export interface ValuationHistory {
  assetId: string;
  valuations: AssetValuation[];
  averageValue: number;
  valueTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
}

@Injectable()
export class AssetValuationHelper {
  // --- IMPROVEMENT 2: Dependency Injection ---
  // The helper no longer contains hardcoded data. It receives its configuration
  // via the constructor, making it flexible and easy to manage.
  constructor(
    @Inject(valuationConfig.KEY)
    private readonly config: ConfigType<typeof valuationConfig>,
  ) {}

  /**
   * Estimates the market value of a given asset based on configured rates and asset metadata.
   * @param asset The official Prisma Asset object.
   * @returns An AssetValuation object with the estimated value and details.
   */
  public estimateAssetValue(asset: Asset): AssetValuation {
    let estimatedValue = 0;
    let valuationMethod = 'MARKET_COMPARISON';
    let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    const valuationAsset = asset as ValuationAsset;

    // --- IMPROVEMENT 3: Type Safety ---
    // The switch statement now uses the official `AssetType` enum imported from Prisma.
    // This prevents typos and ensures we handle every possible asset category.
    switch (asset.type) {
      case AssetType.LAND_PARCEL:
        estimatedValue = this.estimateLandValue(valuationAsset);
        valuationMethod = 'LAND_REGISTRY_COMPARISON';
        confidence = valuationAsset.location ? 'HIGH' : 'LOW';
        break;
      case AssetType.PROPERTY:
        estimatedValue = this.estimatePropertyValue(valuationAsset);
        valuationMethod = 'PROPERTY_APPRAISAL';
        confidence = 'MEDIUM';
        break;
      case AssetType.VEHICLE:
        estimatedValue = this.estimateVehicleValue(valuationAsset);
        valuationMethod = 'DEPRECIATION';
        confidence = 'MEDIUM';
        break;
      case AssetType.LIVESTOCK:
        estimatedValue = this.estimateLivestockValue(valuationAsset);
        valuationMethod = 'MARKET_RATE';
        confidence = 'HIGH';
        break;
      case AssetType.FINANCIAL_ASSET:
        estimatedValue = asset.estimatedValue?.toNumber() || 0;
        valuationMethod = 'ACCOUNT_STATEMENT';
        confidence = 'HIGH';
        break;
      default:
        // Safely convert Prisma's Decimal type to a number for calculations.
        estimatedValue = asset.estimatedValue?.toNumber() || 0;
        valuationMethod = 'MANUAL_ESTIMATE';
        confidence = 'LOW';
    }

    return {
      assetId: asset.id,
      assetType: asset.type,
      estimatedValue,
      currency: 'KES',
      valuationDate: new Date(),
      valuationMethod,
      confidence,
      notes: this.generateValuationNotes(valuationAsset, estimatedValue),
    };
  }

  private estimateLandValue(asset: ValuationAsset): number {
    const baseRate = (asset.location || '').toLowerCase().includes('nairobi')
      ? this.config.marketRates.LAND_PARCEL.urban
      : this.config.marketRates.LAND_PARCEL.rural;

    let value = baseRate * (asset.size || 1);

    if (asset.infrastructure) {
      if (asset.infrastructure.includes('WATER')) value *= 1.2;
      if (asset.infrastructure.includes('ROAD')) value *= 1.3;
      if (asset.infrastructure.includes('ELECTRICITY')) value *= 1.15;
    }
    return Math.round(value);
  }

  private estimatePropertyValue(asset: ValuationAsset): number {
    const baseRate =
      asset.propertyType === 'commercial'
        ? this.config.marketRates.PROPERTY.commercial
        : this.config.marketRates.PROPERTY.residential;

    let value = baseRate * (asset.size || 100);

    if (asset.condition === 'EXCELLENT') value *= 1.2;
    if (asset.condition === 'POOR') value *= 0.8;
    if (asset.age) value *= 1 - Math.min(asset.age * 0.02, 0.3);

    return Math.round(value);
  }

  private estimateVehicleValue(asset: ValuationAsset): number {
    const purchasePrice = asset.purchasePrice || 0;
    const age = asset.age || 0;
    const { depreciationRate } = this.config.marketRates.VEHICLE;
    const value = purchasePrice * Math.pow(1 - depreciationRate, age);
    // A vehicle always has some scrap value.
    return Math.max(value, purchasePrice * 0.1);
  }

  private estimateLivestockValue(asset: ValuationAsset): number {
    const baseRate =
      asset.livestockType === 'goats'
        ? this.config.marketRates.LIVESTOCK.goats
        : this.config.marketRates.LIVESTOCK.cattle;
    return baseRate * (asset.quantity || 1);
  }

  private generateValuationNotes(asset: ValuationAsset, value: number): string {
    const notes: string[] = [`Estimated value: KES ${value.toLocaleString()}`];
    if (asset.location) notes.push(`Location: ${asset.location}`);
    if (asset.size) {
      const unit = asset.type === AssetType.LAND_PARCEL ? 'acres' : 'sqm';
      notes.push(`Size: ${asset.size} ${unit}`);
    }
    if (asset.condition) notes.push(`Condition: ${asset.condition}`);
    return notes.join(' | ');
  }

  public analyzeValuationHistory(valuations: AssetValuation[]): ValuationHistory {
    if (!valuations || valuations.length === 0) {
      throw new Error('No valuation history provided to analyze.');
    }

    const sorted = [...valuations].sort(
      (a, b) => a.valuationDate.getTime() - b.valuationDate.getTime(),
    );

    const averageValue = sorted.reduce((sum, v) => sum + v.estimatedValue, 0) / sorted.length;

    const firstValue = sorted[0].estimatedValue;
    const lastValue = sorted[sorted.length - 1].estimatedValue;

    // Avoid division by zero if the initial value was 0
    const change = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    const valueTrend: 'INCREASING' | 'DECREASING' | 'STABLE' =
      change > 5 ? 'INCREASING' : change < -5 ? 'DECREASING' : 'STABLE';

    return {
      assetId: sorted[0].assetId,
      valuations: sorted,
      averageValue,
      valueTrend,
    };
  }

  public validateValuation(
    asset: Asset,
    valuation: AssetValuation,
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const range = this.getExpectedValueRange(asset.type);

    if (valuation.estimatedValue < range.min) {
      issues.push(`Value is below the expected minimum of KES ${range.min.toLocaleString()}`);
    }
    if (valuation.estimatedValue > range.max) {
      issues.push(`Value is above the expected maximum of KES ${range.max.toLocaleString()}`);
    }
    if (valuation.valuationDate > new Date()) {
      issues.push('Valuation date cannot be in the future.');
    }
    if (valuation.confidence === 'LOW' && valuation.estimatedValue > 1_000_000) {
      issues.push('High-value assets require at least medium-confidence valuation.');
    }

    return { isValid: issues.length === 0, issues };
  }

  private getExpectedValueRange(assetType: AssetType): { min: number; max: number } {
    const ranges = this.config.expectedValueRanges;
    return ranges[assetType] ?? { min: 0, max: 1_000_000_000 };
  }
}
