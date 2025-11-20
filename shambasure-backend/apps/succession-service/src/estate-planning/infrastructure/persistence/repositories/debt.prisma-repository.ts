import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { DebtType } from '@prisma/client';
import { DebtRepositoryInterface } from '../../../domain/interfaces/debt.repository.interface';
import { Debt } from '../../../domain/entities/debt.entity';
import { DebtMapper } from '../mappers/debt.mapper';

@Injectable()
export class DebtPrismaRepository implements DebtRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // BASIC PERSISTENCE
  // --------------------------------------------------------------------------

  async save(debt: Debt): Promise<void> {
    const persistenceModel = DebtMapper.toPersistence(debt);

    await this.prisma.debt.upsert({
      where: { id: persistenceModel.id },
      create: persistenceModel,
      update: persistenceModel,
    });
  }

  async findById(id: string): Promise<Debt | null> {
    const raw = await this.prisma.debt.findUnique({
      where: { id },
    });
    return raw ? DebtMapper.toDomain(raw) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.debt.delete({
      where: { id },
    });
  }

  // --------------------------------------------------------------------------
  // STANDARD LOOKUPS
  // --------------------------------------------------------------------------

  async findByOwnerId(ownerId: string): Promise<Debt[]> {
    const raw = await this.prisma.debt.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
    return raw.map(DebtMapper.toDomain);
  }

  async findByAssetId(assetId: string): Promise<Debt[]> {
    // Used to find Secured Debts (Mortgages) linked to a specific title
    const raw = await this.prisma.debt.findMany({
      where: { assetId },
    });
    return raw.map(DebtMapper.toDomain);
  }

  // --------------------------------------------------------------------------
  // PAYMENT STATUS QUERIES
  // --------------------------------------------------------------------------

  async findOutstandingDebts(ownerId: string): Promise<Debt[]> {
    const raw = await this.prisma.debt.findMany({
      where: {
        ownerId,
        isPaid: false,
      },
    });
    return raw.map(DebtMapper.toDomain);
  }

  async findPaidDebts(ownerId: string): Promise<Debt[]> {
    const raw = await this.prisma.debt.findMany({
      where: {
        ownerId,
        isPaid: true,
      },
      orderBy: { paidAt: 'desc' },
    });
    return raw.map(DebtMapper.toDomain);
  }

  async findOverdueDebts(ownerId: string): Promise<Debt[]> {
    const now = new Date();
    const raw = await this.prisma.debt.findMany({
      where: {
        ownerId,
        isPaid: false,
        dueDate: {
          lt: now, // Less than today
        },
      },
    });
    return raw.map(DebtMapper.toDomain);
  }

  // --------------------------------------------------------------------------
  // CATEGORIZATION & PRIORITY
  // --------------------------------------------------------------------------

  async findByType(ownerId: string, type: DebtType): Promise<Debt[]> {
    const raw = await this.prisma.debt.findMany({
      where: { ownerId, type },
    });
    return raw.map(DebtMapper.toDomain);
  }

  async findPriorityDebts(ownerId: string): Promise<Debt[]> {
    // Under Section 83, Funeral Expenses and Taxes have first priority.
    // We fetch these specific types to help the Executor prioritize payment.
    const raw = await this.prisma.debt.findMany({
      where: {
        ownerId,
        isPaid: false,
        type: {
          in: [DebtType.FUNERAL_EXPENSE, DebtType.TAX_OBLIGATION],
        },
      },
    });
    return raw.map(DebtMapper.toDomain);
  }

  // --------------------------------------------------------------------------
  // FINANCIALS (Aggregation)
  // --------------------------------------------------------------------------

  async getTotalLiabilities(ownerId: string): Promise<{ currency: string; amount: number }[]> {
    // Aggregate outstanding balance by currency
    const result = await this.prisma.debt.groupBy({
      by: ['currency'],
      where: {
        ownerId,
        isPaid: false,
      },
      _sum: {
        outstandingBalance: true,
      },
    });

    return result.map((item) => ({
      currency: item.currency,
      amount: Number(item._sum.outstandingBalance || 0),
    }));
  }
}
