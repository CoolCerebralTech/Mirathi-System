import { PolygamousHouse } from '../../entities/polygamous-house.entity';

export interface IPolygamousHouseRepository {
  /**
   * Finds a PolygamousHouse by its unique ID.
   */
  findById(id: string): Promise<PolygamousHouse | null>;

  /**
   * Finds all polygamous houses belonging to a specific family.
   */
  findAllByFamilyId(familyId: string): Promise<PolygamousHouse[]>;

  /**
   * Saves a new or updated PolygamousHouse entity. This method handles both
   * creation and updates (upsert).
   * @param house The PolygamousHouse entity to save.
   * @param tx An optional transaction client to perform the operation within a transaction.
   */
  save(house: PolygamousHouse, tx?: any): Promise<PolygamousHouse>;

  /**
   * Deletes a PolygamousHouse from the repository.
   */
  delete(id: string, tx?: any): Promise<void>;
}
