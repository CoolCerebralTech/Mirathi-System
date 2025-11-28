import { Prisma, WillExecutor as PrismaExecutor } from '@prisma/client';

import { Executor, ExecutorReconstituteProps } from '../../../domain/entities/executor.entity';

export class ExecutorMapper {
  static toDomain(raw: PrismaExecutor): Executor {
    const compensationVal = raw.compensationAmount ? raw.compensationAmount.toNumber() : null;

    const compensationData =
      compensationVal !== null
        ? {
            amount: compensationVal,
            currency: 'KES',
            valuationDate: raw.updatedAt,
          }
        : null;

    const props: ExecutorReconstituteProps = {
      id: raw.id,
      willId: raw.willId,
      userId: raw.executorId,
      fullName: raw.fullName,
      email: raw.email,
      phone: raw.phone,
      relationship: raw.relationship,
      address: undefined,
      isPrimary: raw.isPrimary,
      orderOfPriority: raw.orderOfPriority,
      status: raw.status,
      appointedAt: raw.appointedAt,
      acceptedAt: raw.acceptedAt,
      declinedAt: raw.declinedAt,
      declineReason: raw.declineReason,
      isCompensated: raw.isCompensated,
      compensationAmount: compensationData,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    return Executor.reconstitute(props);
  }

  static toPersistence(entity: Executor): Prisma.WillExecutorUncheckedCreateInput {
    const info = entity.executorInfo;
    const compensation = entity.compensationAmount;

    return {
      id: entity.id,
      willId: entity.willId,
      executorId: info.userId || null,
      fullName: info.fullName || null,
      email: info.email || null,
      phone: info.phone || null,
      relationship: info.relationship || null,
      isPrimary: entity.isPrimary,
      orderOfPriority: entity.orderOfPriority,
      status: entity.status,
      appointedAt: entity.appointedAt,
      acceptedAt: entity.acceptedAt,
      declinedAt: entity.declinedAt,
      declineReason: entity.declineReason,
      isCompensated: entity.isCompensated,
      compensationAmount: compensation ? new Prisma.Decimal(compensation.getAmount()) : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toUpdatePersistence(entity: Executor): Prisma.WillExecutorUncheckedUpdateInput {
    const full = this.toPersistence(entity);

    const updatableFields: Omit<
      Prisma.WillExecutorUncheckedCreateInput,
      'id' | 'willId' | 'executorId' | 'createdAt'
    > = full;

    return {
      ...updatableFields,
      updatedAt: new Date(),
    };
  }

  static toDomainBatch(records: PrismaExecutor[]): Executor[] {
    return records.map((record) => this.toDomain(record));
  }

  static toPersistenceBatch(entities: Executor[]): Prisma.WillExecutorUncheckedCreateInput[] {
    return entities.map((entity) => this.toPersistence(entity));
  }
}
