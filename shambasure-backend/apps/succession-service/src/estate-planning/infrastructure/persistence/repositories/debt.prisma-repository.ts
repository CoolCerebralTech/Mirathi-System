import { Injectable } from '@nestjs/common';
import { DebtPriority, DebtStatus, DebtType } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Debt } from '../../../domain/entities/debt.entity';
import { DebtRepositoryInterface } from '../../../domain/interfaces/debt.repository.interface';
import { DebtMapper } from '../mappers/debt.mapper';

@Injectable()
export class DebtPrismaRepository implements DebtRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  async save(debt: Debt): Promise<void> {
    const persistenceData = DebtMapper.toPersistence(debt);

    await this.prisma.debt.upsert({
      where: { id: debt.id },
      create: persistenceData,
      update: DebtMapper.toUpdatePersistence(debt),
    });
  }

  async findById(id: string): Promise<Debt | null> {
    const record = await this.prisma.debt.findUnique({
      where: { id },
    });

    return record ? DebtMapper.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.debt.delete({
      where: { id },
    });
  }

  // ---------------------------------------------------------
  // STANDARD LOOKUP OPERATIONS
  // ---------------------------------------------------------

  async findByOwnerId(ownerId: string): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        // Only include active records (not soft-deleted via asset)
        asset: { deletedAt: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async findByAssetId(assetId: string): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: {
        assetId,
        asset: { deletedAt: null }, // Only include if asset is active
      },
      orderBy: { outstandingBalance: 'desc' },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async findSecuredDebts(ownerId: string): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        isSecured: true,
        status: { in: ['OUTSTANDING', 'PARTIALLY_PAID', 'DISPUTED'] },
        asset: { deletedAt: null },
      },
      orderBy: { priority: 'asc' }, // Higher priority first
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // PAYMENT STATUS & LEGAL ENFORCEABILITY
  // ---------------------------------------------------------

  async findOutstandingDebts(ownerId: string): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        status: { in: ['OUTSTANDING', 'PARTIALLY_PAID'] },
        isStatuteBarred: false,
        asset: { deletedAt: null },
      },
      orderBy: [
        { priority: 'asc' }, // Higher priority first
        { outstandingBalance: 'desc' },
      ],
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async findPaidDebts(ownerId: string): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        status: 'SETTLED',
        asset: { deletedAt: null },
      },
      orderBy: { paidAt: 'desc' },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async findStatuteBarredDebts(ownerId: string): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        isStatuteBarred: true,
        asset: { deletedAt: null },
      },
      orderBy: { statuteBarredDate: 'desc' },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async findDisputedDebts(ownerId: string): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        isDisputed: true,
        status: { not: 'SETTLED' }, // Only active disputes
        asset: { deletedAt: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async findOverdueDebts(ownerId: string): Promise<Debt[]> {
    const now = new Date();
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        status: { in: ['OUTSTANDING', 'PARTIALLY_PAID'] },
        dueDate: {
          lt: now,
        },
        isStatuteBarred: false,
        asset: { deletedAt: null },
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'asc' }],
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // CATEGORIZATION & PRIORITY (SIXTH SCHEDULE)
  // ---------------------------------------------------------

  async findByType(ownerId: string, type: DebtType): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        type,
        asset: { deletedAt: null },
      },
      orderBy: { outstandingBalance: 'desc' },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async findPriorityDebts(ownerId: string, minPriority?: DebtPriority): Promise<Debt[]> {
    // Define priority order for filtering
    const priorityOrder: Record<DebtPriority, number> = {
      HIGHEST: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    const minPriorityLevel = minPriority ? priorityOrder[minPriority] : 1; // Default to LOW

    const priorityFilter = Object.entries(priorityOrder)
      .filter(([_, level]) => level >= minPriorityLevel)
      .map(([priority]) => priority as DebtPriority);

    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        priority: { in: priorityFilter },
        status: { in: ['OUTSTANDING', 'PARTIALLY_PAID'] },
        isStatuteBarred: false,
        asset: { deletedAt: null },
      },
      orderBy: [
        { priority: 'asc' }, // Higher priority first
        { outstandingBalance: 'desc' },
      ],
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // FINANCIAL ANALYSIS QUERIES
  // ---------------------------------------------------------

  async getTotalLiabilities(ownerId: string): Promise<{ currency: string; amount: number }[]> {
    const aggregations = await this.prisma.debt.groupBy({
      by: ['currency'],
      where: {
        ownerId,
        status: { in: ['OUTSTANDING', 'PARTIALLY_PAID', 'DISPUTED'] },
        isStatuteBarred: false,
        asset: { deletedAt: null },
      },
      _sum: {
        outstandingBalance: true,
      },
    });

    return aggregations.map((agg) => ({
      currency: agg.currency,
      amount: agg._sum.outstandingBalance || 0,
    }));
  }

  // ---------------------------------------------------------
  // ADDITIONAL BUSINESS LOGIC QUERIES
  // ---------------------------------------------------------

  async findDebtsRequiringCourtApproval(ownerId: string): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        requiresCourtApproval: true,
        courtApprovalObtained: false,
        status: { in: ['OUTSTANDING', 'PARTIALLY_PAID'] },
        asset: { deletedAt: null },
      },
      orderBy: { priority: 'asc' },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async findTaxDebts(ownerId: string): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        type: 'TAX_OBLIGATION',
        status: { in: ['OUTSTANDING', 'PARTIALLY_PAID'] },
        isStatuteBarred: false,
        asset: { deletedAt: null },
      },
      orderBy: { outstandingBalance: 'desc' },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async getDebtPrioritySummary(ownerId: string): Promise<{
    byPriority: Record<DebtPriority, number>;
    byStatus: Record<DebtStatus, number>;
    totalOutstanding: number;
  }> {
    // Get counts by priority
    const priorityGroups = await this.prisma.debt.groupBy({
      by: ['priority'],
      where: {
        ownerId,
        status: { in: ['OUTSTANDING', 'PARTIALLY_PAID'] },
        isStatuteBarred: false,
        asset: { deletedAt: null },
      },
      _count: { _all: true },
      _sum: { outstandingBalance: true },
    });

    // Get counts by status
    const statusGroups = await this.prisma.debt.groupBy({
      by: ['status'],
      where: {
        ownerId,
        asset: { deletedAt: null },
      },
      _count: { _all: true },
    });

    // Calculate total outstanding
    const totalOutstandingResult = await this.prisma.debt.aggregate({
      where: {
        ownerId,
        status: { in: ['OUTSTANDING', 'PARTIALLY_PAID'] },
        isStatuteBarred: false,
        asset: { deletedAt: null },
      },
      _sum: { outstandingBalance: true },
    });

    // Initialize result objects with all enum values set to 0
    const byPriority = Object.values(DebtPriority).reduce(
      (acc, priority) => {
        acc[priority] = 0;
        return acc;
      },
      {} as Record<DebtPriority, number>,
    );

    const byStatus = Object.values(DebtStatus).reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<DebtStatus, number>,
    );

    // Fill with actual data
    priorityGroups.forEach((group) => {
      byPriority[group.priority] = group._count._all;
    });

    statusGroups.forEach((group) => {
      byStatus[group.status] = group._count._all;
    });

    return {
      byPriority,
      byStatus,
      totalOutstanding: totalOutstandingResult._sum.outstandingBalance || 0,
    };
  }
}
