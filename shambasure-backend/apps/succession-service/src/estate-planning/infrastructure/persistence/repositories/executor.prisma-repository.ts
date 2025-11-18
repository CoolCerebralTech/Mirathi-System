import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { ExecutorStatus } from '@prisma/client';
import { ExecutorRepositoryInterface } from '../../../domain/repositories/executor.repository.interface';
import { Executor } from '../../../domain/entities/executor.entity';
import { ExecutorMapper } from '../mappers/executor.mapper';

@Injectable()
export class ExecutorPrismaRepository implements ExecutorRepositoryInterface {
  private readonly logger = new Logger(ExecutorPrismaRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Executor | null> {
    try {
      const prismaExecutor = await this.prisma.willExecutor.findUnique({
        where: { id },
      });

      return prismaExecutor ? ExecutorMapper.toDomain(prismaExecutor) : null;
    } catch (error) {
      this.logger.error(`Failed to find executor by ID ${id}:`, error);
      throw new Error(`Could not retrieve executor: ${error.message}`);
    }
  }

  async findByWillId(willId: string): Promise<Executor[]> {
    try {
      const prismaExecutors = await this.prisma.willExecutor.findMany({
        where: { willId },
        orderBy: [{ isPrimary: 'desc' }, { orderOfPriority: 'asc' }],
      });

      return ExecutorMapper.toDomainList(prismaExecutors);
    } catch (error) {
      this.logger.error(`Failed to find executors for will ${willId}:`, error);
      throw new Error(`Could not retrieve executors: ${error.message}`);
    }
  }

  async save(executor: Executor): Promise<void> {
    try {
      const executorData = ExecutorMapper.toPersistence(executor);

      await this.prisma.willExecutor.upsert({
        where: { id: executor.getId() },
        create: executorData,
        update: executorData,
      });

      this.logger.log(`Successfully saved executor ${executor.getId()}`);
    } catch (error) {
      this.logger.error(`Failed to save executor ${executor.getId()}:`, error);
      throw new Error(`Could not save executor: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.willExecutor.delete({
        where: { id },
      });
      this.logger.log(`Successfully deleted executor ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete executor ${id}:`, error);
      throw new Error(`Could not delete executor: ${error.message}`);
    }
  }

  async findByStatus(willId: string, status: ExecutorStatus): Promise<Executor[]> {
    try {
      const prismaExecutors = await this.prisma.willExecutor.findMany({
        where: {
          willId,
          status,
        },
        orderBy: [{ isPrimary: 'desc' }, { orderOfPriority: 'asc' }],
      });

      return ExecutorMapper.toDomainList(prismaExecutors);
    } catch (error) {
      this.logger.error(
        `Failed to find executors with status ${status} for will ${willId}:`,
        error,
      );
      throw new Error(`Could not retrieve executors: ${error.message}`);
    }
  }

  async findActiveExecutors(willId: string): Promise<Executor[]> {
    try {
      const prismaExecutors = await this.prisma.willExecutor.findMany({
        where: {
          willId,
          status: ExecutorStatus.ACTIVE,
        },
        orderBy: [{ isPrimary: 'desc' }, { orderOfPriority: 'asc' }],
      });

      return ExecutorMapper.toDomainList(prismaExecutors);
    } catch (error) {
      this.logger.error(`Failed to find active executors for will ${willId}:`, error);
      throw new Error(`Could not retrieve active executors: ${error.message}`);
    }
  }

  async findNominatedExecutors(willId: string): Promise<Executor[]> {
    try {
      const prismaExecutors = await this.prisma.willExecutor.findMany({
        where: {
          willId,
          status: ExecutorStatus.NOMINATED,
        },
        orderBy: [{ isPrimary: 'desc' }, { orderOfPriority: 'asc' }],
      });

      return ExecutorMapper.toDomainList(prismaExecutors);
    } catch (error) {
      this.logger.error(`Failed to find nominated executors for will ${willId}:`, error);
      throw new Error(`Could not retrieve nominated executors: ${error.message}`);
    }
  }

  async findPrimaryExecutor(willId: string): Promise<Executor | null> {
    try {
      const prismaExecutor = await this.prisma.willExecutor.findFirst({
        where: {
          willId,
          isPrimary: true,
        },
      });

      return prismaExecutor ? ExecutorMapper.toDomain(prismaExecutor) : null;
    } catch (error) {
      this.logger.error(`Failed to find primary executor for will ${willId}:`, error);
      throw new Error(`Could not retrieve primary executor: ${error.message}`);
    }
  }

  async findExecutorsByPriority(willId: string): Promise<Executor[]> {
    try {
      const prismaExecutors = await this.prisma.willExecutor.findMany({
        where: { willId },
        orderBy: { orderOfPriority: 'asc' },
      });

      return ExecutorMapper.toDomainList(prismaExecutors);
    } catch (error) {
      this.logger.error(`Failed to find executors by priority for will ${willId}:`, error);
      throw new Error(`Could not retrieve executors: ${error.message}`);
    }
  }

  async findByExecutorUserId(userId: string): Promise<Executor[]> {
    try {
      const prismaExecutors = await this.prisma.willExecutor.findMany({
        where: { executorId: userId },
        orderBy: [{ isPrimary: 'desc' }, { orderOfPriority: 'asc' }],
      });

      return ExecutorMapper.toDomainList(prismaExecutors);
    } catch (error) {
      this.logger.error(`Failed to find executor roles for user ${userId}:`, error);
      throw new Error(`Could not retrieve executor roles: ${error.message}`);
    }
  }

  async findExecutorDuties(userId: string): Promise<Executor[]> {
    try {
      const prismaExecutors = await this.prisma.willExecutor.findMany({
        where: {
          executorId: userId,
          status: { in: [ExecutorStatus.ACTIVE, ExecutorStatus.NOMINATED] },
        },
        include: {
          will: {
            select: {
              title: true,
              status: true,
              testator: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { orderOfPriority: 'asc' }],
      });

      return ExecutorMapper.toDomainList(prismaExecutors);
    } catch (error) {
      this.logger.error(`Failed to find executor duties for user ${userId}:`, error);
      throw new Error(`Could not retrieve executor duties: ${error.message}`);
    }
  }

  async countActiveExecutors(willId: string): Promise<number> {
    try {
      return await this.prisma.willExecutor.count({
        where: {
          willId,
          status: ExecutorStatus.ACTIVE,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to count active executors for will ${willId}:`, error);
      throw new Error(`Could not count active executors: ${error.message}`);
    }
  }

  async findExecutorsRequiringAction(): Promise<Executor[]> {
    try {
      const prismaExecutors = await this.prisma.willExecutor.findMany({
        where: {
          status: ExecutorStatus.NOMINATED,
          will: {
            status: { in: ['ACTIVE', 'WITNESSED'] },
          },
        },
        include: {
          will: {
            select: {
              title: true,
              testator: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return ExecutorMapper.toDomainList(prismaExecutors);
    } catch (error) {
      this.logger.error(`Failed to find executors requiring action:`, error);
      throw new Error(`Could not retrieve executors requiring action: ${error.message}`);
    }
  }

  async bulkUpdateStatus(executorIds: string[], status: ExecutorStatus): Promise<void> {
    try {
      await this.prisma.willExecutor.updateMany({
        where: {
          id: { in: executorIds },
        },
        data: {
          status,
          updatedAt: new Date(),
          ...(status === ExecutorStatus.ACTIVE && {
            acceptedAt: new Date(),
          }),
          ...(status === ExecutorStatus.DECLINED && {
            declinedAt: new Date(),
          }),
        },
      });

      this.logger.log(`Successfully updated status for ${executorIds.length} executors`);
    } catch (error) {
      this.logger.error(`Failed to update status for executors:`, error);
      throw new Error(`Could not update executor status: ${error.message}`);
    }
  }

  async transferExecutorRole(originalExecutorId: string, newExecutorId: string): Promise<void> {
    try {
      await this.prisma.willExecutor.update({
        where: { id: originalExecutorId },
        data: {
          executorId: newExecutorId,
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `Successfully transferred executor role from ${originalExecutorId} to ${newExecutorId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to transfer executor role from ${originalExecutorId} to ${newExecutorId}:`,
        error,
      );
      throw new Error(`Could not transfer executor role: ${error.message}`);
    }
  }

  async updateCompensation(executorId: string, amount: number, currency: string): Promise<void> {
    try {
      await this.prisma.willExecutor.update({
        where: { id: executorId },
        data: {
          isCompensated: true,
          compensationAmount: amount,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Successfully updated compensation for executor ${executorId}`);
    } catch (error) {
      this.logger.error(`Failed to update compensation for executor ${executorId}:`, error);
      throw new Error(`Could not update executor compensation: ${error.message}`);
    }
  }
}
