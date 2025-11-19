import { AssetType, AssetOwnershipType } from '@prisma/client';
import { Asset } from '../entities/asset.entity';

export interface AssetRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(asset: Asset): Promise<void>;
  findById(id: string): Promise<Asset | null>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // Standard Lookups
  // ---------------------------------------------------------
  findByOwnerId(ownerId: string): Promise<Asset[]>;
  findByType(ownerId: string, type: AssetType): Promise<Asset[]>;

  // ---------------------------------------------------------
  // Business Logic Queries
  // ---------------------------------------------------------
  /**
   * Assets eligible for transfer (Active, Unencumbered/Solvent, Verified)
   */
  findTransferableAssets(ownerId: string): Promise<Asset[]>;

  findEncumberedAssets(ownerId: string): Promise<Asset[]>;
  findAssetsWithVerifiedDocuments(ownerId: string): Promise<Asset[]>;
  findAssetsByOwnershipType(ownerId: string, ownershipType: AssetOwnershipType): Promise<Asset[]>;

  /**
   * Returns assets strictly for a specific location (Ministry of Lands search)
   */
  findAssetsByLocation(ownerId: string, county: string): Promise<Asset[]>;

  // ---------------------------------------------------------
  // Financial Analysis
  // ---------------------------------------------------------
  findAssetsAboveValue(ownerId: string, minValue: number, currency?: string): Promise<Asset[]>;

  /**
   * Returns total value grouped by currency to prevent mixing USD/KES
   * e.g. [{ currency: 'KES', amount: 5000000 }, { currency: 'USD', amount: 10000 }]
   */
  getTotalPortfolioValue(ownerId: string): Promise<{ currency: string; amount: number }[]>;

  // ---------------------------------------------------------
  // Search
  // ---------------------------------------------------------
  searchAssets(ownerId: string, query: string): Promise<Asset[]>;

  // ---------------------------------------------------------
  // Co-Ownership (Advanced)
  // ---------------------------------------------------------
  findCoOwnedAssets(userId: string): Promise<Asset[]>;
}
