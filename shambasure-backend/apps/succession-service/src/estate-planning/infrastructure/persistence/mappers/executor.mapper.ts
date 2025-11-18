import { ExecutorStatus } from '@prisma/client';
import { Executor } from '../../../domain/entities/executor.entity';
import { AssetValue } from '../../../domain/value-objects/asset-value.vo';

export class ExecutorMapper {
  static toDomain(prismaExecutor: any): Executor {
    if (!prismaExecutor) return null;

    const executorInfo: any = {};

    if (prismaExecutor.executorId) {
      executorInfo.userId = prismaExecutor.executorId;
    } else {
      executorInfo.fullName = prismaExecutor.fullName;
      executorInfo.email = prismaExecutor.email;
      executorInfo.phone = prismaExecutor.phone;
      executorInfo.relationship = prismaExecutor.relationship;
      executorInfo.address = prismaExecutor.address;
    }

    const executor = new Executor(
      prismaExecutor.id,
      prismaExecutor.willId,
      executorInfo,
      prismaExecutor.isPrimary,
      prismaExecutor.orderOfPriority,
    );

    // Set additional properties
    Object.assign(executor, {
      status: prismaExecutor.status as ExecutorStatus,
      appointedAt: prismaExecutor.appointedAt,
      acceptedAt: prismaExecutor.acceptedAt,
      declinedAt: prismaExecutor.declinedAt,
      declineReason: prismaExecutor.declineReason,
      isCompensated: prismaExecutor.isCompensated,
      compensationAmount: prismaExecutor.compensationAmount
        ? new AssetValue(prismaExecutor.compensationAmount.toNumber(), 'KES')
        : null,
      createdAt: prismaExecutor.createdAt,
      updatedAt: prismaExecutor.updatedAt,
    });

    return executor;
  }

  static toPersistence(executor: Executor): any {
    const persistenceObj: any = {
      id: executor.getId(),
      willId: executor.getWillId(),
      isPrimary: executor.getIsPrimary(),
      orderOfPriority: executor.getOrderOfPriority(),
      status: executor.getStatus(),
      appointedAt: executor.getAppointedAt(),
      acceptedAt: executor.getAcceptedAt(),
      declinedAt: executor.getDeclinedAt(),
      declineReason: executor.getDeclineReason(),
      isCompensated: executor.getIsCompensated(),
      compensationAmount: executor.getCompensationAmount()?.getAmount(),
      createdAt: executor.getCreatedAt(),
      updatedAt: executor.getUpdatedAt(),
    };

    // Set executor identification
    const executorInfo = executor.getExecutorInfo();
    if (executorInfo.userId) {
      persistenceObj.executorId = executorInfo.userId;
    } else {
      persistenceObj.fullName = executorInfo.fullName;
      persistenceObj.email = executorInfo.email;
      persistenceObj.phone = executorInfo.phone;
      persistenceObj.relationship = executorInfo.relationship;
      persistenceObj.address = executorInfo.address;
    }

    return persistenceObj;
  }

  static toDomainList(prismaExecutors: any[]): Executor[] {
    return prismaExecutors.map((executor) => this.toDomain(executor)).filter(Boolean);
  }
}
