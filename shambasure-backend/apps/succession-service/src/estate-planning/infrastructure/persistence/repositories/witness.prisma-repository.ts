import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { WitnessStatus } from '@prisma/client';
import { WitnessRepositoryInterface } from '../../../domain/interfaces/witness.repository.interface';
import { Witness } from '../../../domain/entities/witness.entity';
import { WitnessMapper } from '../mappers/witness.mapper';

@Injectable()
export class WitnessPrismaRepository implements WitnessRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // BASIC PERSISTENCE
  // --------------------------------------------------------------------------

  async save(witness: Witness): Promise<void> {
    const persistenceModel = WitnessMapper.toPersistence(witness);

    await this.prisma.willWitness.upsert({
      where: { id: persistenceModel.id },
      create: persistenceModel,
      update: persistenceModel,
    });
  }

  async findById(id: string): Promise<Witness | null> {
    const raw = await this.prisma.willWitness.findUnique({
      where: { id },
    });
    return raw ? WitnessMapper.toDomain(raw) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.willWitness.delete({
      where: { id },
    });
  }

  // --------------------------------------------------------------------------
  // SCOPE LOOKUPS
  // --------------------------------------------------------------------------

  async findByWillId(willId: string): Promise<Witness[]> {
    const raw = await this.prisma.willWitness.findMany({
      where: { willId },
      orderBy: { createdAt: 'asc' },
    });
    return raw.map(WitnessMapper.toDomain);
  }

  async findByWitnessUserId(userId: string): Promise<Witness[]> {
    const raw = await this.prisma.willWitness.findMany({
      where: { witnessId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return raw.map(WitnessMapper.toDomain);
  }

  async findByIdNumber(idNumber: string): Promise<Witness[]> {
    // Critical for cross-referencing witnesses across different wills
    const raw = await this.prisma.willWitness.findMany({
      where: { idNumber },
    });
    return raw.map(WitnessMapper.toDomain);
  }

  // --------------------------------------------------------------------------
  // STATUS QUERIES
  // --------------------------------------------------------------------------

  async findByStatus(willId: string, status: WitnessStatus): Promise<Witness[]> {
    const raw = await this.prisma.willWitness.findMany({
      where: { willId, status },
    });
    return raw.map(WitnessMapper.toDomain);
  }

  async findPendingVerification(): Promise<Witness[]> {
    // Used for Admin Dashboard to verify identities
    const raw = await this.prisma.willWitness.findMany({
      where: {
        status: WitnessStatus.SIGNED, // Signed but not yet Verified
      },
      orderBy: { signedAt: 'asc' },
    });
    return raw.map(WitnessMapper.toDomain);
  }

  async countValidWitnesses(willId: string): Promise<number> {
    // Valid means they have signed, and haven't been rejected.
    // Ideally, for activation, they should be VERIFIED.
    return this.prisma.willWitness.count({
      where: {
        willId,
        status: {
          in: [WitnessStatus.SIGNED, WitnessStatus.VERIFIED],
        },
      },
    });
  }

  // --------------------------------------------------------------------------
  // BULK OPERATIONS
  // --------------------------------------------------------------------------

  async bulkUpdateStatus(
    witnessIds: string[],
    status: WitnessStatus,
    reason?: string,
  ): Promise<void> {
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
