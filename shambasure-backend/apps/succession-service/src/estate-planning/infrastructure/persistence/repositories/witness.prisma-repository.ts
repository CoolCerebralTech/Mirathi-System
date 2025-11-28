import { Injectable } from '@nestjs/common';
import { WitnessStatus } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Witness } from '../../../domain/entities/witness.entity';
import { WitnessRepositoryInterface } from '../../../domain/interfaces/witness.repository.interface';
import { WitnessMapper } from '../mappers/witness.mapper';

@Injectable()
export class WitnessPrismaRepository implements WitnessRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async save(witness: Witness): Promise<void> {
    const persistenceData = WitnessMapper.toPersistence(witness);

    await this.prisma.willWitness.upsert({
      where: { id: witness.id },
      create: persistenceData,
      update: WitnessMapper.toUpdatePersistence(witness),
    });
  }

  async findById(id: string): Promise<Witness | null> {
    const record = await this.prisma.willWitness.findUnique({
      where: { id },
    });

    return record ? WitnessMapper.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.willWitness.delete({
      where: { id },
    });
  }

  async findByWillId(willId: string): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: { willId },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  async findByWitnessUserId(userId: string): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: { witnessId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  async findByIdNumber(idNumber: string): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: { idNumber },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  async findByStatus(willId: string, status: WitnessStatus): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: {
        willId,
        status,
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  async findPendingVerification(): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: {
        status: WitnessStatus.SIGNED,
      },
      orderBy: { signedAt: 'asc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  async countValidWitnesses(willId: string): Promise<number> {
    const count = await this.prisma.willWitness.count({
      where: {
        willId,
        status: {
          in: [WitnessStatus.SIGNED, WitnessStatus.VERIFIED],
        },
        isEligible: true,
      },
    });

    return count;
  }

  async bulkUpdateStatus(
    witnessIds: string[],
    status: WitnessStatus,
    reason?: string,
  ): Promise<void> {
    if (witnessIds.length === 0) return;

    await this.prisma.willWitness.updateMany({
      where: {
        id: { in: witnessIds },
      },
      data: {
        status,
        ineligibilityReason: reason || undefined,
        updatedAt: new Date(),
      },
    });
  }
}
