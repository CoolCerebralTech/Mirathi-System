import { ExecutorStatus } from '@prisma/client';
import { Executor } from '../entities/executor.entity';

export interface ExecutorRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(executor: Executor): Promise<void>;
  findById(id: string): Promise<Executor | null>;
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // Scope Lookups
  // ---------------------------------------------------------
  findByWillId(willId: string): Promise<Executor[]>;

  /**
   * Find all wills where a specific User is nominated as an executor
   */
  findByExecutorUserId(userId: string): Promise<Executor[]>;

  // ---------------------------------------------------------
  // Role & Priority Logic
  // ---------------------------------------------------------
  findPrimaryExecutor(willId: string): Promise<Executor | null>;

  /**
   * Returns executors sorted by priority order (1, 2, 3...)
   */
  findExecutorsByPriority(willId: string): Promise<Executor[]>;

  // ---------------------------------------------------------
  // Status Queries
  // ---------------------------------------------------------
  findByStatus(willId: string, status: ExecutorStatus): Promise<Executor[]>;
  findActiveExecutors(willId: string): Promise<Executor[]>;
  findNominatedExecutors(willId: string): Promise<Executor[]>;

  /**
   * Find executors who have been nominated but haven't accepted/declined yet.
   * Used for cron jobs sending reminders.
   */
  findExecutorsRequiringAction(daysPending: number): Promise<Executor[]>;

  // ---------------------------------------------------------
  // Validation Helpers
  // ---------------------------------------------------------
  countActiveExecutors(willId: string): Promise<number>;
}
