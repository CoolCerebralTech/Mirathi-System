import { AssetType, AssetOwnershipType } from '@prisma/client';
import { Asset } from '../entities/asset.entity';

export interface AssetRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<Asset | null>;
  findByOwnerId(ownerId: string): Promise<Asset[]>;
  findByType(ownerId: string, type: AssetType): Promise<Asset[]>;
  save(asset: Asset): Promise<void>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;

  // Complex queries
  findTransferableAssets(ownerId: string): Promise<Asset[]>;
  findEncumberedAssets(ownerId: string): Promise<Asset[]>;
  findAssetsWithVerifiedDocuments(ownerId: string): Promise<Asset[]>;
  findAssetsByOwnershipType(ownerId: string, ownershipType: AssetOwnershipType): Promise<Asset[]>;

  // Asset valuation
  findAssetsAboveValue(ownerId: string, minValue: number): Promise<Asset[]>;
  getTotalPortfolioValue(ownerId: string): Promise<number>;

  // Search and filtering
  searchAssets(ownerId: string, query: string): Promise<Asset[]>;
  findAssetsByLocation(ownerId: string, county: string): Promise<Asset[]>;

  // Bulk operations
  transferOwnership(originalOwnerId: string, newOwnerId: string): Promise<void>;
  bulkUpdateVerificationStatus(assetIds: string[], verified: boolean): Promise<void>;

  // Co-ownership management
  findCoOwnedAssets(userId: string): Promise<Asset[]>;
  findAssetsWithCoOwners(assetId: string): Promise<Asset[]>;
}
