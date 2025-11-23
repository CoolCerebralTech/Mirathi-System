import { CourtHearing } from '../entities/court-hearing.entity';
import { HearingStatus, HearingType } from '../../../common/types/kenyan-law.types';

export interface CourtHearingRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<CourtHearing | null>;
  findAll(): Promise<CourtHearing[]>;
  save(hearing: CourtHearing): Promise<CourtHearing>;
  delete(id: string): Promise<void>;

  // Domain-specific queries
  findByCaseId(caseId: string): Promise<CourtHearing[]>;
  findByStatus(status: HearingStatus): Promise<CourtHearing[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<CourtHearing[]>;
  findByTypeAndDate(type: HearingType, date: Date): Promise<CourtHearing[]>;

  // Court-specific queries
  findByCourtStation(station: string): Promise<CourtHearing[]>;
  findByJudge(judgeName: string): Promise<CourtHearing[]>;

  // Status management
  findOverdueHearings(): Promise<CourtHearing[]>;
  findUpcomingHearings(days: number): Promise<CourtHearing[]>;

  // Complex queries
  findHearingsWithComplianceDeadlines(): Promise<CourtHearing[]>;
  findAdjournedHearings(): Promise<CourtHearing[]>;

  // Bulk operations
  saveAll(hearings: CourtHearing[]): Promise<CourtHearing[]>;
  deleteByCaseId(caseId: string): Promise<void>;
}
