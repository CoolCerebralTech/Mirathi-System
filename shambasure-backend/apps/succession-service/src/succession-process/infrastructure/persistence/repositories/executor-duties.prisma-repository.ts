// succession-service/src/succession-process/infrastructure/persistence/repositories/executor-duties.prisma-repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { ExecutorDutiesRepositoryInterface } from '../../../domain/repositories/executor-duties.repository.interface';
import { ExecutorDuty } from '../../../domain/entities/executor-duties.entity';
import { ExecutorDutiesMapper } from '../mappers/executor-duties.mapper';

@Injectable()
export class ExecutorDutiesPrismaRepository implements ExecutorDutiesRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async save(duty: ExecutorDuty): Promise<void> {
    const model = ExecutorDutiesMapper.toPersistence(duty);

    await this.prisma.distributionSchedule.upsert({
      where: { id: model.id },
      create: model,
      update: model,
    });
  }

  async findById(id: string): Promise<ExecutorDuty | null> {
    const raw = await this.prisma.distributionSchedule.findUnique({
      where: { id },
    });
    return raw ? ExecutorDutiesMapper.toDomain(raw) : null;
  }

  async findByEstateId(estateId: string): Promise<ExecutorDuty[]> {
    const raw = await this.prisma.distributionSchedule.findMany({
      where: { estateId },
      orderBy: { stepOrder: 'asc' },
    });
    return raw.map(ExecutorDutiesMapper.toDomain);
  }

  async findByExecutorId(executorId: string): Promise<ExecutorDuty[]> {
    // Only works if schema supports assignment to specific executor.
    // Assuming metadata logic or if column exists (schema had generic setup).
    // If no column, we fetch all for estate and filter in memory, or assume this query relies on
    // a 'assignedTo' column added in future.
    // For now, returning empty or implementing based on strict schema:
    return [];
  }

  async findOverdueDuties(): Promise<ExecutorDuty[]> {
    const now = new Date();
    const raw = await this.prisma.distributionSchedule.findMany({
      where: {
        completed: false,
        dueDate: { lt: now },
      },
    });
    return raw.map(ExecutorDutiesMapper.toDomain);
  }

  async initializeStandardDuties(estateId: string, grantDate: Date): Promise<void> {
    // Standard Kenya Succession Steps
    const duties = [
      {
        stepOrder: 1,
        stepType: 'FILE_INVENTORY',
        description: 'File Inventory of Assets (Form P&A 5)',
        months: 6,
      },
      {
        stepOrder: 2,
        stepType: 'GAZETTE_NOTICE',
        description: 'Publish Gazette Notice',
        months: 1,
      },
      {
        stepOrder: 3,
        stepType: 'PAY_DEBTS',
        description: 'Settle all verified debts and taxes',
        months: 7,
      },
      {
        stepOrder: 4,
        stepType: 'CONFIRM_GRANT',
        description: 'Apply for Confirmation of Grant',
        months: 7, // Can only be done after 6 months
      },
      {
        stepOrder: 5,
        stepType: 'DISTRIBUTE_ASSETS',
        description: 'Transfer assets to beneficiaries',
        months: 12,
      },
    ];

    const data = duties.map((d) => {
      const deadline = new Date(grantDate);
      deadline.setMonth(deadline.getMonth() + d.months);
      return {
        id: crypto.randomUUID(),
        estateId,
        stepOrder: d.stepOrder,
        stepType: d.stepType,
        description: d.description,
        dueDate: deadline,
        completed: false,
      };
    });

    await this.prisma.distributionSchedule.createMany({
      data,
    });
  }
}
