import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { CohabitationRecord } from '../../../domain/entities/cohabitation-record.entity';
import { ICohabitationRecordRepository } from '../../../domain/interfaces/repositories/icohabitation-record.repository';
import { CohabitationRecordMapper } from '../mappers/cohabitation-record.mapper';

// This type allows us to use the regular Prisma client or a transactional client.
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class CohabitationRecordRepository implements ICohabitationRecordRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recordMapper: CohabitationRecordMapper,
  ) {}

  async findById(id: string): Promise<CohabitationRecord | null> {
    const record = await this.prisma.cohabitationRecord.findUnique({
      where: { id },
    });
    return this.recordMapper.toDomain(record);
  }

  async findActiveByPartners(
    partner1Id: string,
    partner2Id: string,
  ): Promise<CohabitationRecord | null> {
    const record = await this.prisma.cohabitationRecord.findFirst({
      where: {
        AND: [
          { endDate: null }, // Active records have no end date
          {
            OR: [
              { partner1Id: partner1Id, partner2Id: partner2Id },
              { partner1Id: partner2Id, partner2Id: partner1Id },
            ],
          },
        ],
      },
    });
    return this.recordMapper.toDomain(record);
  }

  async findAllByFamilyId(familyId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: { familyId },
    });
    return records
      .map((record) => this.recordMapper.toDomain(record))
      .filter((record): record is CohabitationRecord => record !== null);
  }

  async findAllByPartnerId(partnerId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        OR: [{ partner1Id: partnerId }, { partner2Id: partnerId }],
      },
      orderBy: { startDate: 'desc' },
    });
    return records
      .map((record) => this.recordMapper.toDomain(record))
      .filter((record): record is CohabitationRecord => record !== null);
  }

  async save(record: CohabitationRecord, tx?: TransactionClient): Promise<CohabitationRecord> {
    const prismaClient = tx || this.prisma;
    const persistenceData = this.recordMapper.toPersistence(record);

    const { id, ...updateData } = persistenceData;

    const savedRecord = await prismaClient.cohabitationRecord.upsert({
      where: { id },
      create: persistenceData,
      update: updateData,
    });

    return this.recordMapper.toDomain(savedRecord)!;
  }

  async delete(id: string, tx?: TransactionClient): Promise<void> {
    const prismaClient = tx || this.prisma;
    await prismaClient.cohabitationRecord.delete({
      where: { id },
    });
  }
}
