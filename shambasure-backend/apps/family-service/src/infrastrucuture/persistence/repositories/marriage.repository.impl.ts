import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Marriage } from '../../../domain/entities/marriage.entity';
import {
  IMarriageRepository,
  MarriageQueryCriteria,
} from '../../../domain/interfaces/repositories/imarriage.repository';
import { MarriageMapper } from '../mappers/marriage.mapper';

// This type allows us to use the regular Prisma client or a transactional client.
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class MarriageRepository implements IMarriageRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marriageMapper: MarriageMapper,
  ) {}

  async findById(id: string): Promise<Marriage | null> {
    const marriage = await this.prisma.marriage.findUnique({
      where: { id },
    });
    return this.marriageMapper.toDomain(marriage);
  }

  async findByRegistrationNumber(registrationNumber: string): Promise<Marriage | null> {
    const marriage = await this.prisma.marriage.findUnique({
      where: { registrationNumber },
    });
    return this.marriageMapper.toDomain(marriage);
  }

  async findAll(criteria: MarriageQueryCriteria): Promise<Marriage[]> {
    const where: Prisma.MarriageWhereInput = {};

    if (criteria.familyId) {
      where.familyId = criteria.familyId;
    }
    if (criteria.spouseId) {
      where.OR = [{ spouse1Id: criteria.spouseId }, { spouse2Id: criteria.spouseId }];
    }
    if (criteria.polygamousHouseId) {
      where.polygamousHouseId = criteria.polygamousHouseId;
    }
    if (criteria.marriageType) {
      where.marriageType = criteria.marriageType;
    }
    if (criteria.isActive !== undefined) {
      where.isActive = criteria.isActive;
    }

    const marriages = await this.prisma.marriage.findMany({ where });

    return marriages
      .map((marriage) => this.marriageMapper.toDomain(marriage))
      .filter((marriage): marriage is Marriage => marriage !== null);
  }

  async save(marriage: Marriage, tx?: TransactionClient): Promise<Marriage> {
    const prismaClient = tx || this.prisma;
    const persistenceData = this.marriageMapper.toPersistence(marriage);

    const { id, ...updateData } = persistenceData;

    const savedMarriage = await prismaClient.marriage.upsert({
      where: { id },
      create: persistenceData,
      update: updateData,
    });

    return this.marriageMapper.toDomain(savedMarriage)!;
  }

  async delete(id: string, tx?: TransactionClient): Promise<void> {
    const prismaClient = tx || this.prisma;
    await prismaClient.marriage.delete({
      where: { id },
    });
  }
}
