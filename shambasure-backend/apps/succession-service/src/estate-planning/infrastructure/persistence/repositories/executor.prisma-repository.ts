import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { ExecutorStatus } from '@prisma/client';
import { ExecutorRepositoryInterface } from '../../../domain/interfaces/executor.repository.interface';
import { Executor } from '../../../domain/entities/executor.entity';
import { ExecutorMapper } from '../mappers/executor.mapper';

@Injectable()
export class ExecutorPrismaRepository implements ExecutorRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // BASIC PERSISTENCE
  // --------------------------------------------------------------------------

  async save(executor: Executor): Promise<void> {
    const persistenceModel = ExecutorMapper.toPersistence(executor);

    await this.prisma.willExecutor.upsert({
      where: { id: persistenceModel.id },
      create: persistenceModel,
      update: persistenceModel,
    });
  }

  async findById(id: string): Promise<Executor | null> {
    const raw = await this.prisma.willExecutor.findUnique({
      where: { id },
    });
    return raw ? ExecutorMapper.toDomain(raw) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.willExecutor.delete({
      where: { id },
    });
  }

  // --------------------------------------------------------------------------
  // SCOPE LOOKUPS
  // --------------------------------------------------------------------------

  async findByWillId(willId: string): Promise<Executor[]> {
    const raw = await this.prisma.willExecutor.findMany({
      where: { willId },
      orderBy: [
        { isPrimary: 'desc' }, // Primary first
        { orderOfPriority: 'asc' }, // Then by priority (1, 2, 3)
      ],
    });
    return raw.map(ExecutorMapper.toDomain);
  }

  async findByExecutorUserId(userId: string): Promise<Executor[]> {
    const raw = await this.prisma.willExecutor.findMany({
      where: { executorId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return raw.map(ExecutorMapper.toDomain);
  }

  // --------------------------------------------------------------------------
  // ROLE & PRIORITY LOGIC
  // --------------------------------------------------------------------------

  async findPrimaryExecutor(willId: string): Promise<Executor | null> {
    const raw = await this.prisma.willExecutor.findFirst({
      where: {
        willId,
        isPrimary: true,
      },
    });
    return raw ? ExecutorMapper.toDomain(raw) : null;
  }

  async findExecutorsByPriority(willId: string): Promise<Executor[]> {
    const raw = await this.prisma.willExecutor.findMany({
      where: { willId },
      orderBy: { orderOfPriority: 'asc' },
    });
    return raw.map(ExecutorMapper.toDomain);
  }

  // --------------------------------------------------------------------------
  // STATUS QUERIES
  // --------------------------------------------------------------------------

  async findByStatus(willId: string, status: ExecutorStatus): Promise<Executor[]> {
    const raw = await this.prisma.willExecutor.findMany({
      where: { willId, status },
    });
    return raw.map(ExecutorMapper.toDomain);
  }

  async findActiveExecutors(willId: string): Promise<Executor[]> {
    const raw = await this.prisma.willExecutor.findMany({
      where: {
        willId,
        status: ExecutorStatus.ACTIVE,
      },
    });
    return raw.map(ExecutorMapper.toDomain);
  }

  async findNominatedExecutors(willId: string): Promise<Executor[]> {
    const raw = await this.prisma.willExecutor.findMany({
      where: {
        willId,
        status: ExecutorStatus.NOMINATED,
      },
    });
    return raw.map(ExecutorMapper.toDomain);
  }

  async findExecutorsRequiringAction(daysPending: number): Promise<Executor[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysPending);

    // Find executors who were nominated before the cutoff date
    // but are still in NOMINATED status (ignoring reminders sent)
    const raw = await this.prisma.willExecutor.findMany({
      where: {
        status: ExecutorStatus.NOMINATED,
        createdAt: {
          lte: cutoffDate,
        },
      },
    });
    return raw.map(ExecutorMapper.toDomain);
  }

  // --------------------------------------------------------------------------
  // VALIDATION HELPERS
  // --------------------------------------------------------------------------

  async countActiveExecutors(willId: string): Promise<number> {
    return this.prisma.willExecutor.count({
      where: {
        willId,
        status: ExecutorStatus.ACTIVE,
      },
    });
  }
}
