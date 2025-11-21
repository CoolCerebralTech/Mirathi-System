// succession-service/src/succession-process/domain/repositories/estate-inventory.repository.interface.ts

import { EstateInventory } from '../entities/estate-inventory.entity';

export interface EstateInventoryRepositoryInterface {
  save(item: EstateInventory): Promise<void>;
  findById(id: string): Promise<EstateInventory | null>;
  delete(id: string): Promise<void>;

  /**
   * Get the full P&A 5 list for an estate.
   */
  findByEstateId(estateId: string): Promise<EstateInventory[]>;

  /**
   * Find items that have been verified against the Lands Registry/Bank.
   */
  findVerifiedItems(estateId: string): Promise<EstateInventory[]>;

  /**
   * Get total estimated value of the inventory submitted to court.
   */
  calculateTotalValue(estateId: string, currency: string): Promise<number>;
}
