import { registerAs } from '@nestjs/config';
import { AssetType } from '@prisma/client';

/**
 * Type definition for value ranges
 */
type ValueRange = {
  min: number;
  max: number;
};

/**
 * Configuration for asset valuation market rates and rules.
 * Allows for tuning financial data via environment variables.
 */
export default registerAs('valuation', () => ({
  marketRates: {
    LAND_PARCEL: {
      urban: parseInt(process.env.RATE_LAND_URBAN || '50000', 10),
      rural: parseInt(process.env.RATE_LAND_RURAL || '10000', 10),
    },
    PROPERTY: {
      residential: parseInt(process.env.RATE_PROP_RESIDENTIAL || '80000', 10),
      commercial: parseInt(process.env.RATE_PROP_COMMERCIAL || '150000', 10),
    },
    VEHICLE: {
      depreciationRate: parseFloat(process.env.RATE_VEHICLE_DEPRECIATION || '0.15'),
    },
    LIVESTOCK: {
      cattle: parseInt(process.env.RATE_LIVESTOCK_CATTLE || '50000', 10),
      goats: parseInt(process.env.RATE_LIVESTOCK_GOATS || '8000', 10),
    },
  },
  /**
   * Expected value ranges for each asset type
   * Used for validation to ensure valuations are within reasonable bounds
   */
  expectedValueRanges: {
    [AssetType.LAND_PARCEL]: {
      min: 5_000,
      max: 100_000_000,
    },
    [AssetType.PROPERTY]: {
      min: 100_000,
      max: 500_000_000,
    },
    [AssetType.VEHICLE]: {
      min: 100_000,
      max: 10_000_000,
    },
    [AssetType.LIVESTOCK]: {
      min: 5_000,
      max: 1_000_000,
    },
    [AssetType.FINANCIAL_ASSET]: {
      min: 0,
      max: 1_000_000_000,
    },
  } as Record<AssetType, ValueRange>,
}));
