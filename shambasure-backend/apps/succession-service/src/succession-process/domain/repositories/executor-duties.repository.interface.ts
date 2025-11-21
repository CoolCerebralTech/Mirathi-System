// succession-service/src/succession-process/domain/repositories/executor-duties.repository.interface.ts

import { ExecutorDuty } from '../entities/executor-duties.entity';

export interface ExecutorDutiesRepositoryInterface {
  save(duty: ExecutorDuty): Promise<void>;
  findById(id: string): Promise<ExecutorDuty | null>;

  /**
   * Get the To-Do list for an estate.
   * Ordered by deadline.
   */
  findByEstateId(estateId: string): Promise<ExecutorDuty[]>;

  /**
   * Find duties assigned to a specific executor (if duties are split).
   */
  findByExecutorId(executorId: string): Promise<ExecutorDuty[]>;

  /**
   * Find duties that are past their deadline and not completed.
   */
  findOverdueDuties(): Promise<ExecutorDuty[]>;

  /**
   * Bulk initialize standard duties (Factory pattern helper).
   */
  initializeStandardDuties(estateId: string, grantDate: Date): Promise<void>;
}
