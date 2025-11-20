import { WillExecutor as PrismaExecutor } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Executor, ExecutorInfo } from '../../../domain/entities/executor.entity';
import { AssetValue } from '../../../domain/value-objects/asset-value.vo';

export class ExecutorMapper {
  static toPersistence(domain: Executor): PrismaExecutor {
    const info = domain.getExecutorInfo();
    const comp = domain.getCompensationAmount();

    return {
      id: domain.getId(),
      willId: domain.getWillId(),

      // Info Flattening
      executorId: info.userId || null,
      fullName: info.fullName || null,
      email: info.email || null,
      phone: info.phone || null,
      relationship: info.relationship || null,

      // Configuration
      isPrimary: domain.getIsPrimary(),
      orderOfPriority: domain.getOrderOfPriority(),
      status: domain.getStatus(),

      // Dates
      appointedAt: domain.getAppointedAt(),
      acceptedAt: domain.getAcceptedAt(),
      declinedAt: domain.getDeclinedAt(),
      declineReason: domain.getDeclineReason(),

      // Compensation
      isCompensated: domain.getIsCompensated(),
      compensationAmount: comp ? new Decimal(comp.getAmount()) : null,

      createdAt: domain.getCreatedAt(),
      updatedAt: domain.getUpdatedAt(),
    } as unknown as PrismaExecutor;
  }

  static toDomain(raw: PrismaExecutor): Executor {
    const info: ExecutorInfo = {
      userId: raw.executorId || undefined,
      fullName: raw.fullName || undefined,
      email: raw.email || undefined,
      phone: raw.phone || undefined,
      relationship: raw.relationship || undefined,
    };

    // Handle Compensation VO
    const compAmount = raw.compensationAmount
      ? new AssetValue(Number(raw.compensationAmount), 'KES')
      : null;

    return Executor.reconstitute({
      id: raw.id,
      willId: raw.willId,
      executorInfo: info,
      isPrimary: raw.isPrimary,
      orderOfPriority: raw.orderOfPriority,

      status: raw.status,
      appointedAt: raw.appointedAt,
      acceptedAt: raw.acceptedAt,
      declinedAt: raw.declinedAt,
      declineReason: raw.declineReason,

      isCompensated: raw.isCompensated,
      compensationAmount: compAmount,

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
