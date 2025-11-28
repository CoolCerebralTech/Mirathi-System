// succession-service/src/succession-process/infrastructure/persistence/mappers/executor-duties.mapper.ts

import { DistributionSchedule as PrismaSchedule } from '@prisma/client';
import { ExecutorDuty, DutyStatus } from '../../../domain/entities/executor-duties.entity';
import { ExecutorDutyType } from '../../../../common/types/kenyan-law.types';

export class ExecutorDutiesMapper {
  static toPersistence(domain: ExecutorDuty): PrismaSchedule {
    return {
      id: domain.getId(),
      estateId: (domain as any).estateId,

      stepOrder: domain.getStepOrder(),
      stepType: domain.getType(),
      description: (domain as any).description,

      dueDate: domain.getDeadline(),
      completed: domain.getStatus() === 'COMPLETED',
      completedAt: (domain as any).completedAt || null,

      createdAt: new Date(),
    } as unknown as PrismaSchedule;
  }

  static toDomain(raw: PrismaSchedule): ExecutorDuty {
    // Determine status from boolean + dates
    let status: DutyStatus = 'PENDING';
    if (raw.completed) status = 'COMPLETED';
    else if (raw.dueDate && new Date() > raw.dueDate) status = 'OVERDUE';

    return ExecutorDuty.reconstitute({
      id: raw.id,
      estateId: raw.estateId,
      // executorId: not in schema, assumes shared responsibility or metadata
      stepType: raw.stepType as ExecutorDutyType,
      description: raw.description,
      stepOrder: raw.stepOrder,
      dueDate: raw.dueDate,

      status: status,
      completed: raw.completed,
      completedAt: raw.completedAt,

      createdAt: raw.createdAt,
    });
  }
}
