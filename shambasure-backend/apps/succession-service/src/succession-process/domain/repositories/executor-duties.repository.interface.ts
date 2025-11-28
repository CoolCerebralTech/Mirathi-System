import { ExecutorDuty, DutyStatus } from '../entities/executor-duties.entity';
import { ExecutorDutyType } from '../../../common/types/kenyan-law.types';

export interface ExecutorDutiesRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<ExecutorDuty | null>;
  findAll(): Promise<ExecutorDuty[]>;
  save(duty: ExecutorDuty): Promise<ExecutorDuty>;
  delete(id: string): Promise<void>;

  // Domain-specific queries
  findByEstateId(estateId: string): Promise<ExecutorDuty[]>;
  findByExecutorId(executorId: string): Promise<ExecutorDuty[]>;
  findByStatus(status: DutyStatus): Promise<ExecutorDuty[]>;
  findByType(type: ExecutorDutyType): Promise<ExecutorDuty[]>;

  // Workflow queries
  findPendingDuties(estateId: string): Promise<ExecutorDuty[]>;
  findCompletedDuties(estateId: string): Promise<ExecutorDuty[]>;
  findOverdueDuties(estateId: string): Promise<ExecutorDuty[]>;
  findInProgressDuties(estateId: string): Promise<ExecutorDuty[]>;

  // Priority and ordering queries
  findByPriority(priority: 'HIGH' | 'MEDIUM' | 'LOW'): Promise<ExecutorDuty[]>;
  findByStepOrder(estateId: string): Promise<ExecutorDuty[]>;
  findCriticalDuties(): Promise<ExecutorDuty[]>;

  // Timeline queries
  findDutiesDueSoon(days: number): Promise<ExecutorDuty[]>;
  findDutiesByDeadlineRange(start: Date, end: Date): Promise<ExecutorDuty[]>;
  findRecentlyCompletedDuties(days: number): Promise<ExecutorDuty[]>;

  // Complex queries
  findDutiesRequiringCourtSupervision(): Promise<ExecutorDuty[]>;
  findDutiesWithExtensions(): Promise<ExecutorDuty[]>;
  findWaivedDuties(estateId: string): Promise<ExecutorDuty[]>;

  // Statistical queries
  getExecutorPerformance(executorId: string): Promise<{
    totalDuties: number;
    completed: number;
    overdue: number;
    completionRate: number;
    averageCompletionTime: number;
  }>;

  getEstateDutyProgress(estateId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionPercentage: number;
  }>;

  // Bulk operations
  saveAll(duties: ExecutorDuty[]): Promise<ExecutorDuty[]>;
  updateStatus(dutyIds: string[], status: DutyStatus): Promise<void>;
  extendDeadlines(dutyIds: string[], newDeadline: Date): Promise<void>;

  // Validation queries
  existsByTypeAndEstate(estateId: string, type: ExecutorDutyType): Promise<boolean>;
  hasOverdueDuties(estateId: string): Promise<boolean>;

  // Search queries
  searchDuties(query: string, estateId?: string): Promise<ExecutorDuty[]>;
}
