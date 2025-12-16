import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { CohabitationRecord } from '../../../domain/entities/cohabitation-record.entity';
import { ICohabitationRecordRepository } from '../../../domain/interfaces/repositories/icohabitation-record.repository';
import { CohabitationRecordMapper } from '../mappers/cohabitation-record.mapper';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class CohabitationRecordRepository implements ICohabitationRecordRepository {
  private readonly logger = new Logger(CohabitationRecordRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recordMapper: CohabitationRecordMapper,
  ) {}

  // ============ CORE CRUD OPERATIONS ============
  async create(record: CohabitationRecord): Promise<CohabitationRecord> {
    try {
      const persistenceData = this.recordMapper.toPersistence(record);
      const savedRecord = await this.prisma.cohabitationRecord.create({
        data: persistenceData,
      });
      return this.recordMapper.toDomain(savedRecord)!;
    } catch (error) {
      this.logger.error(`Failed to create cohabitation record ${record.id}:`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<CohabitationRecord | null> {
    const record = await this.prisma.cohabitationRecord.findUnique({
      where: { id },
    });
    return this.recordMapper.toDomain(record);
  }

  async update(record: CohabitationRecord): Promise<CohabitationRecord> {
    try {
      const persistenceData = this.recordMapper.toPersistence(record);
      const { id, ...updateData } = persistenceData;

      const savedRecord = await this.prisma.cohabitationRecord.update({
        where: { id },
        data: updateData,
      });
      return this.recordMapper.toDomain(savedRecord)!;
    } catch (error) {
      this.logger.error(`Failed to update cohabitation record ${record.id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.cohabitationRecord.delete({
        where: { id },
      });
      this.logger.log(`Cohabitation record ${id} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete cohabitation record ${id}:`, error);
      throw error;
    }
  }

  // ============ PARTNER RELATIONSHIP QUERIES ============
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

  async findAllByPartners(partner1Id: string, partner2Id: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        OR: [
          { partner1Id: partner1Id, partner2Id: partner2Id },
          { partner1Id: partner2Id, partner2Id: partner1Id },
        ],
      },
      orderBy: { startDate: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  async findAllByPartnerId(partnerId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        OR: [{ partner1Id: partnerId }, { partner2Id: partnerId }],
      },
      orderBy: { startDate: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  async getActivePartnerId(partnerId: string): Promise<string | null> {
    const record = await this.prisma.cohabitationRecord.findFirst({
      where: {
        endDate: null,
        OR: [{ partner1Id: partnerId }, { partner2Id: partnerId }],
      },
      select: { partner1Id: true, partner2Id: true },
    });

    if (!record) return null;

    // Return the partner's ID that is not the input partnerId
    return record.partner1Id === partnerId ? record.partner2Id : record.partner1Id;
  }

  async isPersonInActiveCohabitation(partnerId: string): Promise<boolean> {
    const count = await this.prisma.cohabitationRecord.count({
      where: {
        endDate: null,
        OR: [{ partner1Id: partnerId }, { partner2Id: partnerId }],
      },
    });
    return count > 0;
  }

  // ============ FAMILY RELATIONSHIP QUERIES ============
  async findAllByFamilyId(familyId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: { familyId },
      orderBy: { startDate: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  async countByFamilyId(familyId: string): Promise<number> {
    return await this.prisma.cohabitationRecord.count({
      where: { familyId },
    });
  }

  async findActiveByFamilyId(familyId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        endDate: null,
      },
      orderBy: { startDate: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  async findEndedByFamilyId(familyId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        endDate: { not: null },
      },
      orderBy: { endDate: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  // ============ S.29(5) LSA COMPLIANCE QUERIES ============
  async findQualifyingForS29ByFamilyId(familyId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        durationYears: { gte: 5 },
        OR: [{ isAcknowledged: true }, { isRegistered: true }],
      },
      orderBy: { durationYears: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  async findQualifyingForS29ByPartnerId(partnerId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        AND: [
          {
            OR: [{ partner1Id: partnerId }, { partner2Id: partnerId }],
          },
          { durationYears: { gte: 5 } },
          {
            OR: [{ isAcknowledged: true }, { isRegistered: true }],
          },
        ],
      },
      orderBy: { durationYears: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  async findQualifyingAsWomanLivingAsWife(familyId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        durationYears: { gte: 5 },
        isAcknowledged: true,
        OR: [{ hasChildren: true }, { isRegistered: true }],
        rejectionReason: null,
      },
      orderBy: { durationYears: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  // ============ STATUS-BASED QUERIES ============
  async findAcknowledgedByFamilyId(familyId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        isAcknowledged: true,
      },
      orderBy: { startDate: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  async findRegisteredByFamilyId(familyId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        isRegistered: true,
      },
      orderBy: { startDate: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  async findRejectedByFamilyId(familyId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        rejectionReason: { not: null },
      },
      orderBy: { startDate: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  async findWithChildrenByFamilyId(familyId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        hasChildren: true,
      },
      orderBy: { startDate: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  // ============ DURATION-BASED QUERIES ============
  async findWithDurationGreaterThan(
    familyId: string,
    years: number,
  ): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        durationYears: { gte: years },
      },
      orderBy: { durationYears: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  async findActiveWithLongDuration(familyId: string, years: number): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        endDate: null,
        durationYears: { gte: years },
      },
      orderBy: { durationYears: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  async findPotentialS29Claims(familyId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        OR: [
          {
            // Active records with 5+ years
            endDate: null,
            durationYears: { gte: 5 },
            isAcknowledged: true,
          },
          {
            // Ended records that ended in last 12 months with 5+ years duration
            endDate: {
              gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
            },
            durationYears: { gte: 5 },
            isAcknowledged: true,
          },
        ],
      },
      orderBy: { durationYears: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  // ============ BULK OPERATIONS ============
  async batchSave(records: CohabitationRecord[]): Promise<CohabitationRecord[]> {
    if (records.length === 0) {
      return [];
    }

    const savedRecords: CohabitationRecord[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const record of records) {
        const persistenceData = this.recordMapper.toPersistence(record);
        const { id, ...updateData } = persistenceData;

        const saved = await tx.cohabitationRecord.upsert({
          where: { id },
          create: persistenceData,
          update: updateData,
        });

        savedRecords.push(this.recordMapper.toDomain(saved)!);
      }
    });

    return savedRecords;
  }

  async batchEndByFamilyId(familyId: string, endDate: Date): Promise<void> {
    await this.prisma.cohabitationRecord.updateMany({
      where: {
        familyId,
        endDate: null, // Only end active records
      },
      data: {
        endDate,
        updatedAt: new Date(),
      },
    });
    this.logger.log(
      `All active cohabitation records for family ${familyId} ended on ${endDate.toISOString()}`,
    );
  }

  // ============ VALIDATION & EXISTENCE CHECKS ============
  async existsActiveForPartners(partner1Id: string, partner2Id: string): Promise<boolean> {
    const count = await this.prisma.cohabitationRecord.count({
      where: {
        endDate: null,
        OR: [
          { partner1Id: partner1Id, partner2Id: partner2Id },
          { partner1Id: partner2Id, partner2Id: partner1Id },
        ],
      },
    });
    return count > 0;
  }

  async validateCohabitationUniqueness(
    familyId: string,
    partner1Id: string,
    partner2Id: string,
    startDate: Date,
  ): Promise<boolean> {
    // Check for overlapping records
    const existing = await this.prisma.cohabitationRecord.findFirst({
      where: {
        familyId,
        AND: [
          {
            OR: [
              { partner1Id: partner1Id, partner2Id: partner2Id },
              { partner1Id: partner2Id, partner2Id: partner1Id },
            ],
          },
          {
            OR: [
              { endDate: null }, // Active record
              {
                AND: [
                  { endDate: { not: null } },
                  { startDate: { lte: startDate } },
                  { endDate: { gte: startDate } },
                ],
              },
            ],
          },
        ],
      },
    });
    return existing === null; // Return true if no overlapping records
  }

  // ============ STATISTICS & REPORTING ============
  async getCohabitationStatistics(familyId: string) {
    const [
      total,
      active,
      ended,
      acknowledged,
      registered,
      qualifyingS29,
      withChildren,
      durationStats,
    ] = await Promise.all([
      this.countByFamilyId(familyId),
      this.prisma.cohabitationRecord.count({
        where: { familyId, endDate: null },
      }),
      this.prisma.cohabitationRecord.count({
        where: { familyId, endDate: { not: null } },
      }),
      this.prisma.cohabitationRecord.count({
        where: { familyId, isAcknowledged: true },
      }),
      this.prisma.cohabitationRecord.count({
        where: { familyId, isRegistered: true },
      }),
      this.prisma.cohabitationRecord.count({
        where: {
          familyId,
          durationYears: { gte: 5 },
          OR: [{ isAcknowledged: true }, { isRegistered: true }],
        },
      }),
      this.prisma.cohabitationRecord.count({
        where: { familyId, hasChildren: true },
      }),
      this.prisma.cohabitationRecord.aggregate({
        where: { familyId },
        _avg: { durationYears: true },
        _max: { durationYears: true },
        _min: { durationYears: true },
      }),
    ]);

    return {
      total,
      active,
      ended,
      acknowledged,
      registered,
      qualifyingS29,
      withChildren,
      averageDuration: durationStats._avg.durationYears || 0,
      maxDuration: durationStats._max.durationYears || 0,
      minDuration: durationStats._min.durationYears || 0,
    };
  }

  // ============ DATE RANGE QUERIES ============
  async findOverlappingByDateRange(
    familyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        OR: [
          // Records that started before or at endDate and ended after or at startDate
          {
            startDate: { lte: endDate },
            OR: [{ endDate: null }, { endDate: { gte: startDate } }],
          },
        ],
      },
      orderBy: { startDate: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  // ============ LEGAL EVIDENCE QUERIES ============
  async findWithStrongEvidence(familyId: string): Promise<CohabitationRecord[]> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        durationYears: { gte: 5 },
        isAcknowledged: true,
        OR: [{ isRegistered: true }, { hasChildren: true }],
        rejectionReason: null,
      },
      orderBy: { durationYears: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  // ============ HELPER METHODS ============
  private toDomainBatch(records: any[]): CohabitationRecord[] {
    return records
      .map((record) => this.recordMapper.toDomain(record))
      .filter((record): record is CohabitationRecord => record !== null);
  }

  async withTransaction<T>(transactionFn: (client: TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return transactionFn(tx as TransactionClient);
    });
  }

  // ============ ADDITIONAL UTILITY METHODS ============
  async findRecordsNeedingReview(familyId: string): Promise<CohabitationRecord[]> {
    // Find records that might need review for S.29 claims
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        durationYears: { gte: 4, lt: 5 }, // Approaching 5 years
        isAcknowledged: true,
        hasChildren: true,
        isRegistered: false, // Not officially registered
      },
      orderBy: { startDate: 'desc' },
    });
    return this.toDomainBatch(records);
  }

  async calculateS29DependencyScore(familyId: string): Promise<number> {
    const records = await this.prisma.cohabitationRecord.findMany({
      where: {
        familyId,
        durationYears: { gte: 5 },
        isAcknowledged: true,
      },
    });

    let score = 0;
    records.forEach((record) => {
      // Score based on evidence strength
      if (record.isRegistered) score += 3;
      if (record.hasChildren) score += 2;
      if (record.durationYears >= 10) score += 2;
      if (record.durationYears >= 5) score += 1;
    });

    return score;
  }
}
