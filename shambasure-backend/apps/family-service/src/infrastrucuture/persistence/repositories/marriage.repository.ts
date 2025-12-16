import { Injectable, Logger } from '@nestjs/common';
import { MarriageEndReason, MarriageType, Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Marriage } from '../../../domain/entities/marriage.entity';
import { IMarriageRepository } from '../../../domain/interfaces/repositories/imarriage.repository';
import { MarriageMapper } from '../mappers/marriage.mapper';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class MarriageRepository implements IMarriageRepository {
  private readonly logger = new Logger(MarriageRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly marriageMapper: MarriageMapper,
  ) {}

  // ============ CORE CRUD OPERATIONS ============
  async create(marriage: Marriage): Promise<Marriage> {
    try {
      const persistenceData = this.marriageMapper.toPersistence(marriage);
      const savedMarriage = await this.prisma.marriage.create({
        data: persistenceData,
      });
      return this.marriageMapper.toDomain(savedMarriage)!;
    } catch (error) {
      this.logger.error(`Failed to create marriage ${marriage.id}:`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<Marriage | null> {
    const marriage = await this.prisma.marriage.findUnique({
      where: { id },
    });
    return this.marriageMapper.toDomain(marriage);
  }

  async update(marriage: Marriage): Promise<Marriage> {
    try {
      const persistenceData = this.marriageMapper.toPersistence(marriage);
      const { id, ...updateData } = persistenceData;

      const savedMarriage = await this.prisma.marriage.update({
        where: { id },
        data: updateData,
      });
      return this.marriageMapper.toDomain(savedMarriage)!;
    } catch (error) {
      this.logger.error(`Failed to update marriage ${marriage.id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.marriage.delete({
        where: { id },
      });
      this.logger.log(`Marriage ${id} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete marriage ${id}:`, error);
      throw error;
    }
  }

  async hardDelete(id: string): Promise<void> {
    try {
      await this.prisma.marriage.delete({
        where: { id },
      });
      this.logger.log(`Marriage ${id} hard deleted`);
    } catch (error) {
      this.logger.error(`Failed to hard delete marriage ${id}:`, error);
      throw error;
    }
  }

  // ============ LEGAL REGISTRATION QUERIES ============
  async findByRegistrationNumber(registrationNumber: string): Promise<Marriage | null> {
    const marriage = await this.prisma.marriage.findUnique({
      where: { registrationNumber },
    });
    return this.marriageMapper.toDomain(marriage);
  }

  async existsByRegistrationNumber(registrationNumber: string): Promise<boolean> {
    const count = await this.prisma.marriage.count({
      where: { registrationNumber },
    });
    return count > 0;
  }

  async findUnregisteredMarriages(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        registrationNumber: null,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findRegisteredMarriages(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        registrationNumber: { not: null },
      },
    });
    return this.mapToDomainArray(marriages);
  }

  // ============ FAMILY RELATIONSHIP QUERIES ============
  async findAllByFamilyId(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: { familyId },
      orderBy: { startDate: 'asc' },
    });
    return this.mapToDomainArray(marriages);
  }

  async findActiveByFamilyId(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        isActive: true,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findEndedByFamilyId(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        isActive: false,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async countByFamilyId(familyId: string): Promise<number> {
    return await this.prisma.marriage.count({
      where: { familyId },
    });
  }

  // ============ SPOUSE-CENTRIC QUERIES ============
  async findActiveBySpouseId(spouseId: string): Promise<Marriage | null> {
    const marriage = await this.prisma.marriage.findFirst({
      where: {
        OR: [{ spouse1Id: spouseId }, { spouse2Id: spouseId }],
        isActive: true,
      },
    });
    return this.marriageMapper.toDomain(marriage);
  }

  async findAllBySpouseId(spouseId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        OR: [{ spouse1Id: spouseId }, { spouse2Id: spouseId }],
      },
      orderBy: { startDate: 'asc' },
    });
    return this.mapToDomainArray(marriages);
  }

  async findActiveMarriagesBySpouseId(spouseId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        OR: [{ spouse1Id: spouseId }, { spouse2Id: spouseId }],
        isActive: true,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findEndedMarriagesBySpouseId(spouseId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        OR: [{ spouse1Id: spouseId }, { spouse2Id: spouseId }],
        isActive: false,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findDeceasedSpouseMarriages(spouseId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        OR: [{ spouse1Id: spouseId }, { spouse2Id: spouseId }],
        endReason: MarriageEndReason.DEATH_OF_SPOUSE,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findDivorcedMarriagesBySpouseId(spouseId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        OR: [{ spouse1Id: spouseId }, { spouse2Id: spouseId }],
        endReason: MarriageEndReason.DIVORCE,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  // ============ S.40 POLYGAMY COMPLIANCE QUERIES ============
  async findPolygamousByFamilyId(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        isPolygamousUnderS40: true,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findMonogamousByFamilyId(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        isPolygamousUnderS40: false,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findByPolygamousHouseId(houseId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: { polygamousHouseId: houseId },
    });
    return this.mapToDomainArray(marriages);
  }

  async findWithoutPolygamousHouse(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        isPolygamousUnderS40: true,
        polygamousHouseId: null,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async validateS40Compliance(familyId: string): Promise<{
    totalHouses: number;
    marriagesWithoutHouse: number;
    nonPolygamousMarriages: number;
    isCompliant: boolean;
  }> {
    const [polygamousMarriages, houses] = await Promise.all([
      this.prisma.marriage.findMany({
        where: {
          familyId,
          isPolygamousUnderS40: true,
        },
      }),
      this.prisma.polygamousHouse.findMany({
        where: { familyId },
      }),
    ]);

    const marriagesWithoutHouse = polygamousMarriages.filter((m) => !m.polygamousHouseId).length;
    const nonPolygamousMarriages = await this.prisma.marriage.count({
      where: {
        familyId,
        isPolygamousUnderS40: false,
      },
    });

    return {
      totalHouses: houses.length,
      marriagesWithoutHouse,
      nonPolygamousMarriages,
      isCompliant: marriagesWithoutHouse === 0 && houses.length > 0,
    };
  }

  // ============ MARRIAGE TYPE QUERIES ============
  async findByType(familyId: string, type: MarriageType): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: { familyId, marriageType: type },
    });
    return this.mapToDomainArray(marriages);
  }

  async findCustomaryMarriages(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        OR: [
          { marriageType: MarriageType.CUSTOMARY },
          { marriageType: 'TRADITIONAL' as MarriageType },
          { marriageType: 'CUSTOMARY_MARRIAGE' as MarriageType },
        ],
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findIslamicMarriages(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: { familyId, marriageType: MarriageType.ISLAMIC },
    });
    return this.mapToDomainArray(marriages);
  }

  async findCivilMarriages(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: { familyId, marriageType: MarriageType.CIVIL },
    });
    return this.mapToDomainArray(marriages);
  }

  async findChristianMarriages(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: { familyId, marriageType: MarriageType.CHRISTIAN },
    });
    return this.mapToDomainArray(marriages);
  }

  // ============ STATUS & LIFECYCLE QUERIES ============
  async findActiveMarriages(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: { familyId, isActive: true },
    });
    return this.mapToDomainArray(marriages);
  }

  async findEndedMarriages(familyId: string, endReason?: MarriageEndReason): Promise<Marriage[]> {
    const where: Prisma.MarriageWhereInput = {
      familyId,
      isActive: false,
    };
    if (endReason) {
      where.endReason = endReason;
    }

    const marriages = await this.prisma.marriage.findMany({ where });
    return this.mapToDomainArray(marriages);
  }

  async findDissolvedMarriages(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        OR: [
          { endReason: MarriageEndReason.DIVORCE },
          { endReason: MarriageEndReason.ANNULMENT },
          { endReason: MarriageEndReason.CUSTOMARY_DISSOLUTION },
        ],
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findWidowedMarriages(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        endReason: MarriageEndReason.DEATH_OF_SPOUSE,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findSeparatedMarriages(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        separationDate: { not: null },
        isActive: true, // Separated but not legally dissolved
      },
    });
    return this.mapToDomainArray(marriages);
  }

  // ============ S.29 DEPENDANT CLAIM QUERIES ============
  async findQualifyingDependantMarriages(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        OR: [
          { isActive: true }, // Current marriages
          {
            endReason: MarriageEndReason.DEATH_OF_SPOUSE,
            endDate: {
              gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)), // Within last year
            },
          },
        ],
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findMarriagesWithPendingMaintenance(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        maintenanceOrderIssued: false,
        separationDate: { not: null },
        isActive: true,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findMarriagesWithUnsettledProperty(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        isMatrimonialPropertyRegime: true,
        matrimonialPropertySettled: false,
        OR: [{ isActive: false }, { separationDate: { not: null } }],
      },
    });
    return this.mapToDomainArray(marriages);
  }

  // ============ BRIDE PRICE & CUSTOMARY COMPLIANCE QUERIES ============
  async findMarriagesWithBridePrice(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        bridePricePaid: true,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findMarriagesWithPaidBridePrice(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        bridePricePaid: true,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findMarriagesWithUnpaidBridePrice(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        bridePriceAmount: { not: null },
        bridePricePaid: false,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findMarriagesWithClanApproval(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        clanApproval: true,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findMarriagesWithFamilyConsent(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        familyConsent: true,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  // ============ ISLAMIC MARRIAGE QUERIES ============
  async findMarriagesWithMahr(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        mahrAmount: { not: null },
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findMarriagesWithTalaq(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        talaqIssued: true,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  // ============ MATRIMONIAL PROPERTY ACT QUERIES ============
  async findMarriagesWithMatrimonialProperty(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        isMatrimonialPropertyRegime: true,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findMarriagesWithSettledProperty(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        isMatrimonialPropertyRegime: true,
        matrimonialPropertySettled: true,
      },
    });
    return this.mapToDomainArray(marriages);
  }

  // Already implemented: findMarriagesWithUnsettledProperty

  // ============ DATE RANGE & TIMELINE QUERIES ============
  async findMarriagesByDateRange(
    familyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        startDate: { gte: startDate, lte: endDate },
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findOverlappingMarriages(
    spouse1Id: string,
    spouse2Id: string,
    startDate: Date,
    endDate?: Date,
  ): Promise<Marriage[]> {
    const where: Prisma.MarriageWhereInput = {
      OR: [
        { spouse1Id, spouse2Id },
        { spouse1Id: spouse2Id, spouse2Id: spouse1Id },
      ],
      startDate: { lte: endDate || new Date() },
      OR: [
        { endDate: null }, // Ongoing marriages
        { endDate: { gte: startDate } }, // Ended after our start date
      ],
    };

    const marriages = await this.prisma.marriage.findMany({ where });
    return this.mapToDomainArray(marriages);
  }

  async findCurrentMarriageAtDate(spouseId: string, date: Date): Promise<Marriage | null> {
    const marriage = await this.prisma.marriage.findFirst({
      where: {
        OR: [{ spouse1Id: spouseId }, { spouse2Id: spouseId }],
        startDate: { lte: date },
        OR: [{ endDate: null }, { endDate: { gte: date } }],
        isActive: true,
      },
    });
    return this.marriageMapper.toDomain(marriage);
  }

  // ============ BULK OPERATIONS ============
  async batchSave(marriages: Marriage[]): Promise<Marriage[]> {
    if (marriages.length === 0) {
      return [];
    }

    const savedMarriages: Marriage[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const marriage of marriages) {
        const persistenceData = this.marriageMapper.toPersistence(marriage);
        const { id, ...updateData } = persistenceData;

        const saved = await tx.marriage.upsert({
          where: { id },
          create: persistenceData,
          update: updateData,
        });

        savedMarriages.push(this.marriageMapper.toDomain(saved)!);
      }
    });

    return savedMarriages;
  }

  async batchDeleteByFamilyId(familyId: string): Promise<void> {
    await this.prisma.marriage.deleteMany({
      where: { familyId },
    });
    this.logger.log(`All marriages for family ${familyId} deleted`);
  }

  async batchEndMarriagesBySpouseDeath(spouseId: string, dateOfDeath: Date): Promise<void> {
    await this.prisma.marriage.updateMany({
      where: {
        OR: [{ spouse1Id: spouseId }, { spouse2Id: spouseId }],
        isActive: true,
      },
      data: {
        isActive: false,
        endReason: MarriageEndReason.DEATH_OF_SPOUSE,
        endDate: dateOfDeath,
        deceasedSpouseId: spouseId,
        updatedAt: new Date(),
      },
    });
    this.logger.log(`Ended all active marriages for deceased spouse ${spouseId}`);
  }

  // ============ VALIDATION & EXISTENCE CHECKS ============
  async existsActiveForSpouses(spouse1Id: string, spouse2Id: string): Promise<boolean> {
    const count = await this.prisma.marriage.count({
      where: {
        OR: [
          { spouse1Id, spouse2Id },
          { spouse1Id: spouse2Id, spouse2Id: spouse1Id },
        ],
        isActive: true,
      },
    });
    return count > 0;
  }

  async validateMarriageUniqueness(
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    startDate: Date,
  ): Promise<boolean> {
    const existing = await this.prisma.marriage.findFirst({
      where: {
        familyId,
        OR: [
          { spouse1Id, spouse2Id },
          { spouse1Id: spouse2Id, spouse2Id: spouse1Id },
        ],
        startDate,
      },
    });
    return existing === null;
  }

  async hasAnyActiveMarriage(spouseId: string): Promise<boolean> {
    const count = await this.prisma.marriage.count({
      where: {
        OR: [{ spouse1Id: spouseId }, { spouse2Id: spouseId }],
        isActive: true,
      },
    });
    return count > 0;
  }

  async countActiveMarriages(spouseId: string): Promise<number> {
    return await this.prisma.marriage.count({
      where: {
        OR: [{ spouse1Id: spouseId }, { spouse2Id: spouseId }],
        isActive: true,
      },
    });
  }

  // ============ STATISTICS & REPORTING ============
  async getMarriageStatistics(familyId: string): Promise<{
    total: number;
    active: number;
    ended: number;
    polygamous: number;
    customary: number;
    islamic: number;
    civil: number;
    christian: number;
    withBridePrice: number;
    withMatrimonialProperty: number;
    averageDuration: number;
    divorceRate: number;
  }> {
    const [
      total,
      active,
      ended,
      polygamous,
      customary,
      islamic,
      civil,
      christian,
      withBridePrice,
      withMatrimonialProperty,
      allMarriages,
    ] = await Promise.all([
      this.countByFamilyId(familyId),
      this.prisma.marriage.count({ where: { familyId, isActive: true } }),
      this.prisma.marriage.count({ where: { familyId, isActive: false } }),
      this.prisma.marriage.count({ where: { familyId, isPolygamousUnderS40: true } }),
      this.prisma.marriage.count({
        where: {
          familyId,
          OR: [
            { marriageType: MarriageType.CUSTOMARY },
            { marriageType: 'TRADITIONAL' as MarriageType },
          ],
        },
      }),
      this.prisma.marriage.count({ where: { familyId, marriageType: MarriageType.ISLAMIC } }),
      this.prisma.marriage.count({ where: { familyId, marriageType: MarriageType.CIVIL } }),
      this.prisma.marriage.count({ where: { familyId, marriageType: MarriageType.CHRISTIAN } }),
      this.prisma.marriage.count({ where: { familyId, bridePricePaid: true } }),
      this.prisma.marriage.count({ where: { familyId, isMatrimonialPropertyRegime: true } }),
      this.prisma.marriage.findMany({ where: { familyId } }),
    ]);

    // Calculate average duration
    let totalDuration = 0;
    let marriagesWithEndDate = 0;

    allMarriages.forEach((m) => {
      if (m.endDate) {
        const duration =
          (m.endDate.getTime() - m.startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        totalDuration += duration;
        marriagesWithEndDate++;
      }
    });

    const averageDuration = marriagesWithEndDate > 0 ? totalDuration / marriagesWithEndDate : 0;

    // Calculate divorce rate
    const divorced = await this.prisma.marriage.count({
      where: { familyId, endReason: MarriageEndReason.DIVORCE },
    });

    const divorceRate = total > 0 ? (divorced / total) * 100 : 0;

    return {
      total,
      active,
      ended,
      polygamous,
      customary,
      islamic,
      civil,
      christian,
      withBridePrice,
      withMatrimonialProperty,
      averageDuration,
      divorceRate,
    };
  }

  // ============ LEGAL COMPLIANCE CHECKS ============
  async findNonCompliantMarriages(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        OR: [
          {
            marriageType: { in: [MarriageType.CIVIL, MarriageType.CHRISTIAN] },
            registrationNumber: null,
          },
          {
            isPolygamousUnderS40: true,
            s40CertificateNumber: null,
          },
          {
            isValidUnderKenyanLaw: false,
          },
        ],
      },
    });
    return this.mapToDomainArray(marriages);
  }

  async findInvalidUnderKenyanLaw(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: { familyId, isValidUnderKenyanLaw: false },
    });
    return this.mapToDomainArray(marriages);
  }

  async findMarriagesNeedingCourtValidation(familyId: string): Promise<Marriage[]> {
    const marriages = await this.prisma.marriage.findMany({
      where: {
        familyId,
        OR: [
          { courtValidationDate: null },
          { isPolygamousUnderS40: true, s40CertificateNumber: null },
        ],
      },
    });
    return this.mapToDomainArray(marriages);
  }

  // ============ HELPER METHODS ============
  private mapToDomainArray(marriages: any[]): Marriage[] {
    return marriages
      .map((marriage) => this.marriageMapper.toDomain(marriage))
      .filter((marriage): marriage is Marriage => marriage !== null);
  }

  async withTransaction<T>(transactionFn: (client: TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return transactionFn(tx as TransactionClient);
    });
  }

  // ============ LEGACY METHODS (for compatibility) ============
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

  async findAll(criteria: any): Promise<Marriage[]> {
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
    return this.mapToDomainArray(marriages);
  }
}
