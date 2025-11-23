import {
  EstateInventory,
  InventoryStatus,
  AssetCategory,
} from '../entities/estate-inventory.entity';

export interface EstateInventoryRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<EstateInventory | null>;
  findAll(): Promise<EstateInventory[]>;
  save(inventory: EstateInventory): Promise<EstateInventory>;
  delete(id: string): Promise<void>;

  // Domain-specific queries
  findByEstateId(estateId: string): Promise<EstateInventory[]>;
  findByAssetId(assetId: string): Promise<EstateInventory | null>;
  findByStatus(status: InventoryStatus): Promise<EstateInventory[]>;
  findByCategory(category: AssetCategory): Promise<EstateInventory[]>;

  // Verification queries
  findVerifiedInventory(estateId: string): Promise<EstateInventory[]>;
  findUnverifiedInventory(estateId: string): Promise<EstateInventory[]>;
  findDisputedInventory(estateId: string): Promise<EstateInventory[]>;
  findRemovedInventory(estateId: string): Promise<EstateInventory[]>;

  // Value-based queries
  findHighValueItems(threshold: number): Promise<EstateInventory[]>;
  findInventoryByValueRange(min: number, max: number): Promise<EstateInventory[]>;

  // Ownership queries
  findSoleOwnershipItems(estateId: string): Promise<EstateInventory[]>;
  findJointOwnershipItems(estateId: string): Promise<EstateInventory[]>;
  findTrustPropertyItems(estateId: string): Promise<EstateInventory[]>;

  // Location-based queries
  findByLocation(county: string): Promise<EstateInventory[]>;
  findByParcelNumber(parcelNumber: string): Promise<EstateInventory[]>;

  // Complex queries
  findInventoryRequiringVerification(): Promise<EstateInventory[]>;
  findInventoryWithMissingDocuments(): Promise<EstateInventory[]>;
  findAmendedInventory(estateId: string): Promise<EstateInventory[]>;

  // Statistical queries
  getEstateInventorySummary(estateId: string): Promise<{
    totalItems: number;
    verifiedItems: number;
    totalValue: number;
    verifiedValue: number;
    byCategory: Record<AssetCategory, { count: number; value: number }>;
  }>;

  // Bulk operations
  saveAll(inventoryItems: EstateInventory[]): Promise<EstateInventory[]>;
  updateStatus(inventoryIds: string[], status: InventoryStatus): Promise<void>;

  // Validation queries
  existsByDescription(estateId: string, description: string): Promise<boolean>;
  existsByAssetId(assetId: string): Promise<boolean>;

  // Search queries
  searchInventory(query: string, estateId?: string): Promise<EstateInventory[]>;
}
