import { ExecutorStatus } from '@prisma/client';
import { Executor } from '../entities/executor.entity';

export interface ExecutorRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<Executor | null>;
  findByWillId(willId: string): Promise<Executor[]>;
  save(executor: Executor): Promise<void>;
  delete(id: string): Promise<void>;

  // Status-based queries
  findByStatus(willId: string, status: ExecutorStatus): Promise<Executor[]>;
  findActiveExecutors(willId: string): Promise<Executor[]>;
  findNominatedExecutors(willId: string): Promise<Executor[]>;

  // Role-based queries
  findPrimaryExecutor(willId: string): Promise<Executor | null>;
  findExecutorsByPriority(willId: string): Promise<Executor[]>;

  // User-based queries
  findByExecutorUserId(userId: string): Promise<Executor[]>;
  findExecutorDuties(userId: string): Promise<Executor[]>;

  // Management queries
  countActiveExecutors(willId: string): Promise<number>;
  findExecutorsRequiringAction(): Promise<Executor[]>;

  // Bulk operations
  bulkUpdateStatus(executorIds: string[], status: ExecutorStatus): Promise<void>;
  transferExecutorRole(originalExecutorId: string, newExecutorId: string): Promise<void>;

  // Compensation tracking
  updateCompensation(executorId: string, amount: number, currency: string): Promise<void>;
}
