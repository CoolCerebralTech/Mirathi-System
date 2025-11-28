import { Injectable } from '@nestjs/common';
import { ExecutorStatus } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Executor } from '../../../domain/entities/executor.entity';
import { ExecutorRepositoryInterface } from '../../../domain/interfaces/executor.repository.interface';
import { ExecutorMapper } from '../mappers/executor.mapper';

@Injectable()
export class ExecutorPrismaRepository implements ExecutorRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async save(executor: Executor): Promise<void> {
    const persistenceData = ExecutorMapper.toPersistence(executor);

    await this.prisma.willExecutor.upsert({
      where: { id: executor.id },
      create: persistenceData,
      update: ExecutorMapper.toUpdatePersistence(executor),
    });
  }

  async findById(id: string): Promise<Executor | null> {
    const record = await this.prisma.willExecutor.findUnique({
      where: { id },
    });

    return record ? ExecutorMapper.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.willExecutor.delete({
      where: { id },
    });
  }

  async findByWillId(willId: string): Promise<Executor[]> {
    const records = await this.prisma.willExecutor.findMany({
      where: { willId },
      orderBy: { orderOfPriority: 'asc' },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  async findByExecutorUserId(userId: string): Promise<Executor[]> {
    const records = await this.prisma.willExecutor.findMany({
      where: { executorId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  async findPrimaryExecutor(willId: string): Promise<Executor | null> {
    const record = await this.prisma.willExecutor.findFirst({
      where: {
        willId,
        isPrimary: true,
      },
    });

    return record ? ExecutorMapper.toDomain(record) : null;
  }

  async findExecutorsByPriority(willId: string): Promise<Executor[]> {
    const records = await this.prisma.willExecutor.findMany({
      where: { willId },
      orderBy: { orderOfPriority: 'asc' },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  async findByStatus(willId: string, status: ExecutorStatus): Promise<Executor[]> {
    const records = await this.prisma.willExecutor.findMany({
      where: {
        willId,
        status,
      },
      orderBy: { orderOfPriority: 'asc' },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  async findActiveExecutors(willId: string): Promise<Executor[]> {
    return this.findByStatus(willId, ExecutorStatus.ACTIVE);
  }

  async findNominatedExecutors(willId: string): Promise<Executor[]> {
    return this.findByStatus(willId, ExecutorStatus.NOMINATED);
  }

  async findExecutorsRequiringAction(daysPending: number): Promise<Executor[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysPending);

    const records = await this.prisma.willExecutor.findMany({
      where: {
        status: ExecutorStatus.NOMINATED,
        createdAt: {
          lt: thresholdDate,
        },
      },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  async countActiveExecutors(willId: string): Promise<number> {
    const count = await this.prisma.willExecutor.count({
      where: {
        willId,
        status: ExecutorStatus.ACTIVE,
      },
    });

    return count;
  }
}
