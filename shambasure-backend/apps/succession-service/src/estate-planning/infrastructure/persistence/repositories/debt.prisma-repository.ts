import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { DebtType } from '@prisma/client';
import { Debt } from '../../../domain/entities/debt.entity';
import { DebtRepositoryInterface } from '../../../domain/interfaces/debt.repository.interface';
import { DebtMapper } from '../mappers/debt.mapper';

@Injectable()
export class DebtPrismaRepository implements DebtRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

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

  async findByOwnerId(ownerId: string): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async findByAssetId(assetId: string): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: { assetId },
      orderBy: { outstandingBalance: 'desc' },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async findOutstandingDebts(ownerId: string): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        isPaid: false,
      },
      orderBy: { outstandingBalance: 'desc' },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async findPaidDebts(ownerId: string): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        isPaid: true,
      },
      orderBy: { paidAt: 'desc' },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async findOverdueDebts(ownerId: string): Promise<Debt[]> {
    const now = new Date();
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        isPaid: false,
        dueDate: {
          lt: now,
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async findByType(ownerId: string, type: DebtType): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        type,
      },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async findPriorityDebts(ownerId: string): Promise<Debt[]> {
    const records = await this.prisma.debt.findMany({
      where: {
        ownerId,
        isPaid: false,
        type: {
          in: [DebtType.FUNERAL_EXPENSE, DebtType.TAX_OBLIGATION, DebtType.MEDICAL_BILL],
        },
      },
      orderBy: { outstandingBalance: 'desc' },
    });

    return records.map((record) => DebtMapper.toDomain(record));
  }

  async getTotalLiabilities(ownerId: string): Promise<{ currency: string; amount: number }[]> {
    const aggregations = await this.prisma.debt.groupBy({
      by: ['currency'],
      where: {
        ownerId,
        isPaid: false,
      },
      _sum: {
        outstandingBalance: true,
      },
    });

    return aggregations.map((agg) => ({
      currency: agg.currency,
      amount: agg._sum.outstandingBalance?.toNumber() || 0,
    }));
  }
}
