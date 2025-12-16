import { FamilyLegalEvent } from '../../entities/family-legal-event.entity';

export interface IFamilyLegalEventRepository {
  /**
   * Finds a FamilyLegalEvent by its unique ID.
   */
  findById(id: string): Promise<FamilyLegalEvent | null>;

  /**
   * Retrieves the entire legal history for a specific family,
   * ordered from most recent to oldest.
   */
  findAllByFamilyId(familyId: string): Promise<FamilyLegalEvent[]>;

  /**
   * Saves a new, immutable FamilyLegalEvent to the repository.
   * This should only ever perform a 'create' operation.
   * @param event The FamilyLegalEvent entity to save.
   * @param tx An optional transaction client.
   */
  save(event: FamilyLegalEvent, tx?: any): Promise<FamilyLegalEvent>;
}
