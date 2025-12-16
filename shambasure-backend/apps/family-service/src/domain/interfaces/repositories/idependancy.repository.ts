import { LegalDependant } from '../../entities/legal-dependant.entity';

export interface ILegalDependantRepository {
  /**
   * Finds a LegalDependant record by its unique ID.
   */
  findById(id: string): Promise<LegalDependant | null>;

  /**
   * Finds a specific dependency relationship between a deceased person and a dependant.
   * This is crucial for checking if a dependency has already been recorded.
   */
  findByDeceasedAndDependant(
    deceasedId: string,
    dependantId: string,
  ): Promise<LegalDependant | null>;

  /**
   * Finds all dependants associated with a specific deceased person.
   * This is a primary query for any succession case.
   */
  findAllByDeceasedId(deceasedId: string): Promise<LegalDependant[]>;

  /**
   * Saves a new or updated LegalDependant entity. This method handles both
   * creation and updates (upsert).
   * @param dependant The LegalDependant entity to save.
   * @param tx An optional transaction client.
   */
  save(dependant: LegalDependant, tx?: any): Promise<LegalDependant>;

  /**
   * Deletes a LegalDependant record from the repository.
   */
  delete(id: string, tx?: any): Promise<void>;
}
