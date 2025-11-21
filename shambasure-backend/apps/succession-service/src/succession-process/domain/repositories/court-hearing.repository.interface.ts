// succession-service/src/succession-process/domain/repositories/court-hearing.repository.interface.ts

import { CourtHearing } from '../entities/court-hearing.entity';

export interface CourtHearingRepositoryInterface {
  save(hearing: CourtHearing): Promise<void>;
  findById(id: string): Promise<CourtHearing | null>;

  /**
   * Get the schedule for a specific case.
   */
  findByCaseId(caseId: string): Promise<CourtHearing[]>;

  /**
   * Find upcoming hearings for a user (Executor/Beneficiary).
   */
  findUpcomingByEstateId(estateId: string): Promise<CourtHearing[]>;

  /**
   * Find hearings scheduled for today/tomorrow (Notification Cron).
   */
  findUpcomingReminders(date: Date): Promise<CourtHearing[]>;
}
