import { Guardian } from '../../entities/guardian.entity';

export interface IGuardianRepository {
  /**
   * Finds a Guardian record by its unique ID.
   */
  findById(id: string): Promise<Guardian | null>;

  /**
   * Finds all guardianship appointments for a specific ward (child/dependent).
   * A ward can have multiple guardians (e.g., for person and property).
   */
  findAllByWardId(wardId: string): Promise<Guardian[]>;

  /**
   * Finds all guardianship appointments held by a specific person.
   */
  findAllByGuardianId(guardianId: string): Promise<Guardian[]>;

  /**
   * Finds a Guardian record by the unique court case number of the appointment.
   */
  findByCourtCaseNumber(caseNumber: string): Promise<Guardian | null>;

  /**
   * Saves a new or updated Guardian entity. This method handles both
   * creation and updates (upsert).
   * @param guardian The Guardian entity to save.
   * @param tx An optional transaction client.
   */
  save(guardian: Guardian, tx?: any): Promise<Guardian>;

  /**
   * Deletes a Guardian record from the repository.
   */
  delete(id: string, tx?: any): Promise<void>;
}
