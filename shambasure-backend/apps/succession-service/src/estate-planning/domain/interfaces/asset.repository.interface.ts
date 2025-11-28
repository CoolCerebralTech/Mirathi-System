import { AssetOwnershipType, AssetType } from '@prisma/client';

import { Asset } from '../entities/asset.entity';

/**
 * Repository Interface for Asset Aggregate Root
 *
 * Defines the contract for Asset data persistence following Kenyan succession law requirements
 * Includes specialized queries for asset management, valuation, and legal compliance
 *
 * @interface AssetRepositoryInterface
 */
export interface AssetRepositoryInterface {
  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  /**
   * Persists an Asset entity to the data store
   *
   * @param {Asset} asset - The Asset entity to save
   * @returns {Promise<void>}
   */
  save(asset: Asset): Promise<void>;

  /**
   * Retrieves an Asset by its unique identifier
   *
   * @param {string} id - Unique Asset identifier
   * @returns {Promise<Asset | null>} Asset entity or null if not found
   */
  findById(id: string): Promise<Asset | null>;

  /**
   * Permanently deletes an Asset from the data store
   *
   * @param {string} id - Unique Asset identifier to delete
   * @returns {Promise<void>}
   */
  delete(id: string): Promise<void>;

  /**
   * Performs soft deletion of an Asset (marks as inactive)
   *
   * @param {string} id - Unique Asset identifier to soft delete
   * @returns {Promise<void>}
   */
  softDelete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // STANDARD LOOKUP OPERATIONS
  // ---------------------------------------------------------

  /**
   * Finds all Assets owned by a specific user
   *
   * @param {string} ownerId - Unique identifier of the asset owner
   * @returns {Promise<Asset[]>} Array of Asset entities
   */
  findByOwnerId(ownerId: string): Promise<Asset[]>;

  /**
   * Finds Assets by type for a specific owner
   *
   * @param {string} ownerId - Unique identifier of the asset owner
   * @param {AssetType} type - Classification of assets to find
   * @returns {Promise<Asset[]>} Array of Asset entities matching the type
   */
  findByType(ownerId: string, type: AssetType): Promise<Asset[]>;

  // ---------------------------------------------------------
  // BUSINESS LOGIC & LEGAL COMPLIANCE QUERIES
  // ---------------------------------------------------------

  /**
   * Finds assets eligible for legal transfer under Kenyan succession law
   * Criteria: Active, Unencumbered/Solvent, Verified Documentation
   *
   * @param {string} ownerId - Unique identifier of the asset owner
   * @returns {Promise<Asset[]>} Array of transferable Asset entities
   */
  findTransferableAssets(ownerId: string): Promise<Asset[]>;

  /**
   * Finds assets with existing encumbrances (mortgages, liens)
   *
   * @param {string} ownerId - Unique identifier of the asset owner
   * @returns {Promise<Asset[]>} Array of encumbered Asset entities
   */
  findEncumberedAssets(ownerId: string): Promise<Asset[]>;

  /**
   * Finds assets with verified legal documentation
   *
   * @param {string} ownerId - Unique identifier of the asset owner
   * @returns {Promise<Asset[]>} Array of verified Asset entities
   */
  findAssetsWithVerifiedDocuments(ownerId: string): Promise<Asset[]>;

  /**
   * Finds assets by ownership structure type
   *
   * @param {string} ownerId - Unique identifier of the asset owner
   * @param {AssetOwnershipType} ownershipType - Type of ownership structure
   * @returns {Promise<Asset[]>} Array of Asset entities with specified ownership type
   */
  findAssetsByOwnershipType(ownerId: string, ownershipType: AssetOwnershipType): Promise<Asset[]>;

  /**
   * Finds assets in a specific Kenyan geographical location
   * Used for Ministry of Lands integration and location-based searches
   *
   * @param {string} ownerId - Unique identifier of the asset owner
   * @param {string} county - Kenyan county for location filtering
   * @returns {Promise<Asset[]>} Array of Asset entities in specified location
   */
  findAssetsByLocation(ownerId: string, county: string): Promise<Asset[]>;

  // ---------------------------------------------------------
  // FINANCIAL ANALYSIS & VALUATION QUERIES
  // ---------------------------------------------------------

  /**
   * Finds assets valued above a specified minimum threshold
   *
   * @param {string} ownerId - Unique identifier of the asset owner
   * @param {number} minValue - Minimum valuation threshold
   * @param {string} [currency] - Currency filter (default: KES)
   * @returns {Promise<Asset[]>} Array of high-value Asset entities
   */
  findAssetsAboveValue(ownerId: string, minValue: number, currency?: string): Promise<Asset[]>;

  /**
   * Calculates total portfolio value grouped by currency
   * Prevents currency mixing for accurate financial reporting
   *
   * @param {string} ownerId - Unique identifier of the asset owner
   * @returns {Promise<Array<{ currency: string; amount: number }>>} Portfolio summary by currency
   */
  getTotalPortfolioValue(ownerId: string): Promise<{ currency: string; amount: number }[]>;

  // ---------------------------------------------------------
  // SEARCH & DISCOVERY OPERATIONS
  // ---------------------------------------------------------

  /**
   * Performs text-based search across asset properties
   *
   * @param {string} ownerId - Unique identifier of the asset owner
   * @param {string} query - Search query string
   * @returns {Promise<Asset[]>} Array of matching Asset entities
   */
  searchAssets(ownerId: string, query: string): Promise<Asset[]>;

  // ---------------------------------------------------------
  // CO-OWNERSHIP & COMPLEX OWNERSHIP QUERIES
  // ---------------------------------------------------------

  /**
   * Finds assets where user has co-ownership rights
   *
   * @param {string} userId - Unique identifier of the co-owner
   * @returns {Promise<Asset[]>} Array of co-owned Asset entities
   */
  findCoOwnedAssets(userId: string): Promise<Asset[]>;
}
