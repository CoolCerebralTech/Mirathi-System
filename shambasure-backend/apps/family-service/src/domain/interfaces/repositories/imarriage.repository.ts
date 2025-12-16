import { MarriageType } from '@prisma/client';

import { Marriage } from '../../entities/marriage.entity';

/**
 * Defines the query criteria for finding Marriage entities.
 * All properties are optional, allowing for flexible searching.
 */
export interface MarriageQueryCriteria {
  familyId?: string;
  spouseId?: string; // Finds marriages where the person is either spouse1 or spouse2
  polygamousHouseId?: string;
  marriageType?: MarriageType;
  isActive?: boolean;
}

export interface IMarriageRepository {
  /**
   * Finds a Marriage by its unique ID.
   */
  findById(id: string): Promise<Marriage | null>;

  /**
   * Finds a Marriage by its unique government-issued registration number.
   * Essential for preventing duplicate entries for civil/Christian marriages.
   */
  findByRegistrationNumber(registrationNumber: string): Promise<Marriage | null>;

  /**
   * Finds all Marriage entities that match the given criteria.
   * @param criteria The query criteria to filter marriages by.
   */
  findAll(criteria: MarriageQueryCriteria): Promise<Marriage[]>;

  /**
   * Saves a new or updated Marriage entity. This method handles both
   * creation and updates (upsert).
   * @param marriage The Marriage entity to save.
   * @param tx An optional transaction client to perform the operation within a transaction.
   */
  save(marriage: Marriage, tx?: any): Promise<Marriage>;

  /**
   * Deletes a Marriage from the repository.
   */
  delete(id: string, tx?: any): Promise<void>;
}
