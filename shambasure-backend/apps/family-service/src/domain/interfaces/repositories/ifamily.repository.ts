// domain/interfaces/repositories/ifamily.repository.ts
import { Family } from '../../aggregates/family.aggregate';

export interface IFamilyRepository {
  /**
   * Finds a Family aggregate by its unique ID.
   * This should load the core family properties and the IDs of its members/marriages/houses.
   */
  findById(id: string): Promise<Family | null>;

  /**
   * Finds all families created by a specific user.
   */
  findByCreatorId(creatorId: string): Promise<Family[]>;

  /**
   * Saves a new or updated Family aggregate.
   * This method handles both creation and updates, persisting the aggregate's state.
   */
  save(family: Family): Promise<Family>;

  /**
   * Deletes a Family aggregate from the repository.
   * Note: Business logic for deletion (e.g., checking for living members)
   * should be in the application service layer before calling this.
   */
  delete(id: string): Promise<void>;

  /**
   * Searches for families based on specific criteria.
   */
  search(criteria: {
    name?: string;
    county?: string;
    clanName?: string;
    isPolygamous?: boolean;
  }): Promise<Family[]>;
}
