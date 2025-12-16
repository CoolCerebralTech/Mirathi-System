import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { LegalDependant } from '../../../domain/entities/legal-dependant.entity';
import { ILegalDependantRepository } from '../../../domain/interfaces/repositories/idependancy.repository';
import { LegalDependantMapper } from '../mappers/legal-dependant.mapper';

// This type allows us to use the regular Prisma client or a transactional client.
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class LegalDependantRepository implements ILegalDependantRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dependantMapper: LegalDependantMapper,
  ) {}

  async findById(id: string): Promise<LegalDependant | null> {
    const dependant = await this.prisma.legalDependant.findUnique({
      where: { id },
    });
    return this.dependantMapper.toDomain(dependant);
  }

  async findByDeceasedAndDependant(
    deceasedId: string,
    dependantId: string,
  ): Promise<LegalDependant | null> {
    const dependant = await this.prisma.legalDependant.findUnique({
      where: { deceasedId_dependantId: { deceasedId, dependantId } },
    });
    return this.dependantMapper.toDomain(dependant);
  }

  async findAllByDeceasedId(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: { deceasedId },
    });
    return dependants
      .map((d) => this.dependantMapper.toDomain(d))
      .filter((d): d is LegalDependant => d !== null);
  }

  async save(dependant: LegalDependant, tx?: TransactionClient): Promise<LegalDependant> {
    const prismaClient = tx || this.prisma;
    const persistenceData = this.dependantMapper.toPersistence(dependant);

    const { id, ...updateData } = persistenceData;

    const savedDependant = await prismaClient.legalDependant.upsert({
      where: { id },
      create: persistenceData,
      update: updateData,
    });

    return this.dependantMapper.toDomain(savedDependant)!;
  }

  async delete(id: string, tx?: TransactionClient): Promise<void> {
    const prismaClient = tx || this.prisma;
    await prismaClient.legalDependant.delete({
      where: { id },
    });
  }
}
