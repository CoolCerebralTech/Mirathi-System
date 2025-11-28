// succession-service/src/succession-process/infrastructure/persistence/repositories/distribution.prisma-repository.ts
import { Injectable } from '@nestjs/common';
import { DistributionStatus } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Distribution } from '../../../domain/entities/distribution.entity';
import { DistributionRepositoryInterface } from '../../../domain/repositories/distribution.repository.interface';
import { DistributionMapper } from '../mappers/distribution.mapper';

@Injectable()
export class DistributionPrismaRepository implements DistributionRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async save(distribution: Distribution): Promise<void> {
    const model = DistributionMapper.toPersistence(distribution);

    await this.prisma.beneficiaryEntitlement.upsert({
      where: { id: model.id },
      create: model,
      update: model,
    });
  }

  async findById(id: string): Promise<Distribution | null> {
    const raw = await this.prisma.beneficiaryEntitlement.findUnique({
      where: { id },
    });
    return raw ? DistributionMapper.toDomain(raw) : null;
  }

  async findByEstateId(estateId: string): Promise<Distribution[]> {
    const raw = await this.prisma.beneficiaryEntitlement.findMany({
      where: { estateId },
      orderBy: { priority: 'asc' },
    });
    return raw.map(DistributionMapper.toDomain);
  }

  async findByBeneficiaryId(beneficiaryId: string): Promise<Distribution[]> {
    const raw = await this.prisma.beneficiaryEntitlement.findMany({
      where: {
        OR: [{ beneficiaryUserId: beneficiaryId }, { beneficiaryFamilyMemberId: beneficiaryId }],
      },
    });
    return raw.map(DistributionMapper.toDomain);
  }

  async findPendingTransfers(estateId: string): Promise<Distribution[]> {
    const raw = await this.prisma.beneficiaryEntitlement.findMany({
      where: {
        estateId,
        distributionStatus: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
    });
    return raw.map(DistributionMapper.toDomain);
  }

  async bulkUpdateStatus(ids: string[], status: DistributionStatus, date: Date): Promise<void> {
    await this.prisma.beneficiaryEntitlement.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        distributionStatus: status,
        distributedAt: status === 'COMPLETED' ? date : undefined,
        updatedAt: new Date(),
      },
    });
  }
}
