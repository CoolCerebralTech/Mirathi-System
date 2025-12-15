// domain/interfaces/repositories/iguardianship.repository.ts
import { GuardianshipAggregate } from '../../aggregates/guardianship.aggregate';

export interface IGuardianshipRepository {
  save(guardianship: GuardianshipAggregate): Promise<void>;

  findById(id: string): Promise<GuardianshipAggregate | null>;

  /**
   * Finds the active guardian(s) for a specific minor/ward.
   */
  findActiveByWardId(wardId: string): Promise<GuardianshipAggregate[]>;

  /**
   * Finds all guardianships managed by a specific person.
   */
  findByGuardianId(guardianId: string): Promise<GuardianshipAggregate[]>;

  /**
   * Retrieves guardianships with overdue annual reports (S.73 Compliance).
   * Used by background jobs to send reminders.
   */
  findWithOverdueReports(): Promise<GuardianshipAggregate[]>;
}
