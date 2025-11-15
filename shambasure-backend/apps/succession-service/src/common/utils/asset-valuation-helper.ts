import { Injectable } from '@nestjs/common';

export interface Asset {
  id: string;
  type: string;
  estimatedValue?: number;
  location?: string;
  size?: number;
  infrastructure?: string[];
  propertyType?: string;
  condition?: string;
  age?: number;
  purchasePrice?: number;
  livestockType?: string;
  quantity?: number;
  currentValue?: number;
  initialValue?: number;
}

export interface AssetValuation {
  assetId: string;
  assetType: string;
  estimatedValue: number;
  currency: string;
  valuationDate: Date;
  valuationMethod: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  source?: string;
  notes?: string;
}

export interface ValuationHistory {
  assetId: string;
  valuations: AssetValuation[];
  averageValue: number;
  valueTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
}

export interface MarketRates {
  LAND_PARCEL: LandRates;
  PROPERTY: PropertyRates;
  VEHICLE: VehicleRates;
  LIVESTOCK: LivestockRates;
  FINANCIAL_ASSET: FinancialAssetRates;
}

export interface LandRates {
  urban: number;
  rural: number;
  factors: string[];
}

export interface PropertyRates {
  residential: number;
  commercial: number;
  factors: string[];
}

export interface VehicleRates {
  depreciationRate: number;
  factors: string[];
}

export interface LivestockRates {
  cattle: number;
  goats: number;
  factors: string[];
}

export interface FinancialAssetRates {
  factors: string[];
}

@Injectable()
export class AssetValuationHelper {
  private readonly marketRates: MarketRates = {
    LAND_PARCEL: { urban: 50000, rural: 10000, factors: ['location', 'size', 'infrastructure'] },
    PROPERTY: {
      residential: 80000,
      commercial: 150000,
      factors: ['location', 'condition', 'size'],
    },
    VEHICLE: { depreciationRate: 0.15, factors: ['age', 'condition', 'mileage'] },
    LIVESTOCK: { cattle: 50000, goats: 8000, factors: ['breed', 'age', 'health'] },
    FINANCIAL_ASSET: { factors: ['accountValue', 'marketValue'] },
  };

  estimateAssetValue(asset: Asset): AssetValuation {
    let estimatedValue = 0;
    let valuationMethod = 'MARKET_COMPARISON';
    let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';

    switch (asset.type) {
      case 'LAND_PARCEL':
        estimatedValue = this.estimateLandValue(asset);
        valuationMethod = 'LAND_REGISTRY_COMPARISON';
        confidence = asset.location ? 'HIGH' : 'LOW';
        break;
      case 'PROPERTY':
        estimatedValue = this.estimatePropertyValue(asset);
        valuationMethod = 'PROPERTY_APPRAISAL';
        confidence = 'MEDIUM';
        break;
      case 'VEHICLE':
        estimatedValue = this.estimateVehicleValue(asset);
        valuationMethod = 'DEPRECIATION';
        confidence = 'MEDIUM';
        break;
      case 'LIVESTOCK':
        estimatedValue = this.estimateLivestockValue(asset);
        valuationMethod = 'MARKET_RATE';
        confidence = 'HIGH';
        break;
      case 'FINANCIAL_ASSET':
        estimatedValue = this.estimateFinancialAssetValue(asset);
        valuationMethod = 'ACCOUNT_STATEMENT';
        confidence = 'HIGH';
        break;
      default:
        estimatedValue = asset.estimatedValue || 0;
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
      notes: this.generateValuationNotes(asset, estimatedValue),
    };
  }

  private estimateLandValue(asset: Asset): number {
    const baseRate = asset.location?.includes('Nairobi')
      ? this.marketRates.LAND_PARCEL.urban
      : this.marketRates.LAND_PARCEL.rural;
    let value = baseRate * (asset.size || 1);

    if (asset.infrastructure) {
      if (asset.infrastructure.includes('WATER')) value *= 1.2;
      if (asset.infrastructure.includes('ROAD')) value *= 1.3;
      if (asset.infrastructure.includes('ELECTRICITY')) value *= 1.15;
    }
    return Math.round(value);
  }

  private estimatePropertyValue(asset: Asset): number {
    const propertyType = asset.propertyType || 'residential';
    const baseRate =
      propertyType === 'commercial'
        ? this.marketRates.PROPERTY.commercial
        : this.marketRates.PROPERTY.residential;

    let value = baseRate * (asset.size || 100);

    if (asset.condition === 'EXCELLENT') value *= 1.2;
    if (asset.condition === 'POOR') value *= 0.8;
    if (asset.age) value *= 1 - Math.min(asset.age * 0.02, 0.3);

    return Math.round(value);
  }

  private estimateVehicleValue(asset: Asset): number {
    const purchasePrice = asset.purchasePrice || 0;
    const age = asset.age || 0;
    const depreciationRate = this.marketRates.VEHICLE.depreciationRate;
    const value = purchasePrice * Math.pow(1 - depreciationRate, age);
    return Math.max(value, purchasePrice * 0.1);
  }

  private estimateLivestockValue(asset: Asset): number {
    const type = asset.livestockType || 'cattle';
    const baseRate =
      type === 'goats' ? this.marketRates.LIVESTOCK.goats : this.marketRates.LIVESTOCK.cattle;
    return baseRate * (asset.quantity || 1);
  }

  private estimateFinancialAssetValue(asset: Asset): number {
    return asset.currentValue || asset.initialValue || 0;
  }

  private generateValuationNotes(asset: Asset, value: number): string {
    const notes: string[] = [`Estimated value: KES ${value.toLocaleString()}`];
    if (asset.location) notes.push(`Location: ${asset.location}`);
    if (asset.size) {
      const unit = asset.type === 'LAND_PARCEL' ? 'acres' : 'sqm';
      notes.push(`Size: ${asset.size} ${unit}`);
    }
    if (asset.condition) notes.push(`Condition: ${asset.condition}`);
    return notes.join(' | ');
  }

  analyzeValuationHistory(valuations: AssetValuation[]): ValuationHistory {
    if (!valuations.length) throw new Error('No valuation history provided');

    const sorted = valuations.sort(
      (a, b) => new Date(a.valuationDate).getTime() - new Date(b.valuationDate).getTime(),
    );

    const averageValue = sorted.reduce((sum, v) => sum + v.estimatedValue, 0) / sorted.length;
    const change =
      ((sorted[sorted.length - 1].estimatedValue - sorted[0].estimatedValue) /
        sorted[0].estimatedValue) *
      100;

    const valueTrend: 'INCREASING' | 'DECREASING' | 'STABLE' =
      change > 5 ? 'INCREASING' : change < -5 ? 'DECREASING' : 'STABLE';

    return {
      assetId: sorted[0].assetId,
      valuations: sorted,
      averageValue,
      valueTrend,
    };
  }

  validateValuation(
    asset: Asset,
    valuation: AssetValuation,
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const range = this.getExpectedValueRange(asset.type); // Remove the second parameter

    if (valuation.estimatedValue < range.min) {
      issues.push(`Value too low, expected >= KES ${range.min.toLocaleString()}`);
    }
    if (valuation.estimatedValue > range.max) {
      issues.push(`Value too high, expected <= KES ${range.max.toLocaleString()}`);
    }

    if (new Date(valuation.valuationDate) > new Date()) {
      issues.push('Valuation date cannot be in the future');
    }
    if (valuation.confidence === 'LOW' && valuation.estimatedValue > 1_000_000) {
      issues.push('High-value assets require medium or high confidence');
    }

    return { isValid: issues.length === 0, issues };
  }

  private getExpectedValueRange(assetType: string): { min: number; max: number } {
    const ranges: { [key: string]: { min: number; max: number } } = {
      LAND_PARCEL: { min: 5000, max: 100_000_000 },
      PROPERTY: { min: 100_000, max: 500_000_000 },
      VEHICLE: { min: 100_000, max: 10_000_000 },
      LIVESTOCK: { min: 5000, max: 1_000_000 },
      FINANCIAL_ASSET: { min: 0, max: 1_000_000_000 },
    };
    return ranges[assetType] || { min: 0, max: 1_000_000_000 };
  }
}
