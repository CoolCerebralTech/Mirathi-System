import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Guardian } from '../../../domain/entities/guardian.entity';
import { IGuardianRepository } from '../../../domain/interfaces/repositories/iguardianship.repository';
import { GuardianMapper } from '../mappers/guardianship.mapper';

// This type allows us to use the regular Prisma client or a transactional client.
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class GuardianRepository implements IGuardianRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guardianMapper: GuardianMapper,
  ) {}

  async findById(id: string): Promise<Guardian | null> {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
    });
    return this.guardianMapper.toDomain(guardian);
  }

  async findAllByWardId(wardId: string): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: { wardId },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findAllByGuardianId(guardianId: string): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: { guardianId },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findByCourtCaseNumber(caseNumber: string): Promise<Guardian | null> {
    const guardian = await this.prisma.guardian.findUnique({
      where: { courtCaseNumber: caseNumber },
    });
    return this.guardianMapper.toDomain(guardian);
  }

  async save(guardian: Guardian, tx?: TransactionClient): Promise<Guardian> {
    const prismaClient = tx || this.prisma;
    const persistenceData = this.guardianMapper.toPersistence(guardian);

    const { id, ...updateData } = persistenceData;

    const savedGuardian = await prismaClient.guardian.upsert({
      where: { id },
      create: persistenceData,
      update: updateData,
    });

    return this.guardianMapper.toDomain(savedGuardian)!;
  }

  async delete(id: string, tx?: TransactionClient): Promise<void> {
    const prismaClient = tx || this.prisma;
    await prismaClient.guardian.delete({
      where: { id },
    });
  }
}
