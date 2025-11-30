import { Injectable } from '@nestjs/common';
import { ExecutorStatus } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Executor } from '../../../domain/entities/executor.entity';
import { ExecutorRepositoryInterface } from '../../../domain/interfaces/executor.repository.interface';
import { ExecutorMapper } from '../mappers/executor.mapper';

@Injectable()
export class ExecutorPrismaRepository implements ExecutorRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

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
      include: {
        will: {
          select: {
            id: true,
            title: true,
            status: true,
            isActiveRecord: true,
            deletedAt: true,
          },
        },
      },
    });

    // Only return if will is active and not deleted
    if (!record || record.will.deletedAt || !record.will.isActiveRecord) {
      return null;
    }

    return ExecutorMapper.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.willExecutor.delete({
      where: { id },
    });
  }

  // ---------------------------------------------------------
  // SCOPE & RELATIONSHIP LOOKUPS
  // ---------------------------------------------------------

  async findByWillId(willId: string): Promise<Executor[]> {
    const records = await this.prisma.willExecutor.findMany({
      where: {
        willId,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { orderOfPriority: 'asc' },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  async findByExecutorUserId(userId: string): Promise<Executor[]> {
    const records = await this.prisma.willExecutor.findMany({
      where: {
        executorId: userId,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  async findByExternalEmail(email: string): Promise<Executor[]> {
    const records = await this.prisma.willExecutor.findMany({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        executorId: null, // External executors don't have user IDs
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // ROLE & PRIORITY MANAGEMENT QUERIES
  // ---------------------------------------------------------

  async findPrimaryExecutor(willId: string): Promise<Executor | null> {
    const record = await this.prisma.willExecutor.findFirst({
      where: {
        willId,
        isPrimary: true,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
    });

    return record ? ExecutorMapper.toDomain(record) : null;
  }

  async findExecutorsByPriority(willId: string): Promise<Executor[]> {
    const records = await this.prisma.willExecutor.findMany({
      where: {
        willId,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { orderOfPriority: 'asc' },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  async findProfessionalExecutors(willId: string): Promise<Executor[]> {
    const records = await this.prisma.willExecutor.findMany({
      where: {
        willId,
        isProfessional: true,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { orderOfPriority: 'asc' },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // STATUS & WORKFLOW QUERIES
  // ---------------------------------------------------------

  async findByStatus(willId: string, status: ExecutorStatus): Promise<Executor[]> {
    const records = await this.prisma.willExecutor.findMany({
      where: {
        willId,
        status,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
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
        nominatedAt: {
          lt: thresholdDate,
        },
        will: {
          deletedAt: null,
          isActiveRecord: true,
          status: { in: ['ACTIVE', 'WITNESSED'] }, // Only relevant for active wills
        },
      },
      include: {
        will: {
          select: {
            title: true,
            testatorId: true,
          },
        },
      },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // LEGAL COMPLIANCE QUERIES (Kenyan Law)
  // ---------------------------------------------------------

  async findIneligibleExecutors(willId: string): Promise<Executor[]> {
    const records = await this.prisma.willExecutor.findMany({
      where: {
        willId,
        eligibilityStatus: {
          in: [
            'INELIGIBLE_MINOR',
            'INELIGIBLE_BANKRUPT',
            'INELIGIBLE_CRIMINAL_RECORD',
            'INELIGIBLE_NON_RESIDENT',
          ],
        },
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { orderOfPriority: 'asc' },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  async findPendingBondExecutors(willId: string): Promise<Executor[]> {
    const records = await this.prisma.willExecutor.findMany({
      where: {
        willId,
        requiresBond: true,
        bondProvided: false,
        status: { in: ['ACTIVE', 'NOMINATED'] }, // Only relevant for active/pending executors
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { orderOfPriority: 'asc' },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  async countActiveExecutors(willId: string): Promise<number> {
    const count = await this.prisma.willExecutor.count({
      where: {
        willId,
        status: ExecutorStatus.ACTIVE,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
    });

    return count;
  }

  // ---------------------------------------------------------
  // ADDITIONAL BUSINESS LOGIC QUERIES
  // ---------------------------------------------------------

  async findExecutorsWithExpiredBonds(): Promise<Executor[]> {
    const now = new Date();

    const records = await this.prisma.willExecutor.findMany({
      where: {
        requiresBond: true,
        bondProvided: true,
        bondExpiryDate: {
          lt: now,
        },
        status: { in: ['ACTIVE', 'NOMINATED'] },
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      include: {
        will: {
          select: {
            title: true,
            testatorId: true,
            probateCaseNumber: true,
          },
        },
      },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  async findExecutorsPendingEligibilityVerification(): Promise<Executor[]> {
    const records = await this.prisma.willExecutor.findMany({
      where: {
        eligibilityStatus: 'PENDING_VERIFICATION',
        status: { in: ['NOMINATED', 'ACTIVE'] },
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { nominatedAt: 'asc' },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  async findExecutorsByAppointmentType(
    willId: string,
    appointmentType: string,
  ): Promise<Executor[]> {
    const records = await this.prisma.willExecutor.findMany({
      where: {
        willId,
        appointmentType: appointmentType as any, // Type assertion for enum
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { orderOfPriority: 'asc' },
    });

    return records.map((record) => ExecutorMapper.toDomain(record));
  }

  async getExecutorStatistics(willId: string): Promise<{
    total: number;
    byStatus: Record<ExecutorStatus, number>;
    byEligibility: Record<string, number>;
    professionalCount: number;
    pendingBondCount: number;
  }> {
    // Get counts by status
    const statusGroups = await this.prisma.willExecutor.groupBy({
      by: ['status'],
      where: {
        willId,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      _count: { _all: true },
    });

    // Get counts by eligibility
    const eligibilityGroups = await this.prisma.willExecutor.groupBy({
      by: ['eligibilityStatus'],
      where: {
        willId,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      _count: { _all: true },
    });

    // Get professional count
    const professionalCount = await this.prisma.willExecutor.count({
      where: {
        willId,
        isProfessional: true,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
    });

    // Get pending bond count
    const pendingBondCount = await this.prisma.willExecutor.count({
      where: {
        willId,
        requiresBond: true,
        bondProvided: false,
        status: { in: ['ACTIVE', 'NOMINATED'] },
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
    });

    // Get total count
    const total = await this.prisma.willExecutor.count({
      where: {
        willId,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
    });

    // Initialize result objects with all enum values set to 0
    const byStatus = Object.values(ExecutorStatus).reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<ExecutorStatus, number>,
    );

    const byEligibility: Record<string, number> = {};

    // Fill with actual data
    statusGroups.forEach((group) => {
      byStatus[group.status] = group._count._all;
    });

    eligibilityGroups.forEach((group) => {
      byEligibility[group.eligibilityStatus] = group._count._all;
    });

    return {
      total,
      byStatus,
      byEligibility,
      professionalCount,
      pendingBondCount,
    };
  }
}
