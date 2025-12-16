import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { PolygamousHouse } from '../../../domain/entities/polygamous-house.entity';
import { IPolygamousHouseRepository } from '../../../domain/interfaces/repositories/ipolygamous-house.repository';
import { PolygamousHouseMapper } from '../mappers/polygamous-house.mapper';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class PolygamousHouseRepository implements IPolygamousHouseRepository {
  private readonly logger = new Logger(PolygamousHouseRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly houseMapper: PolygamousHouseMapper,
  ) {}

  // ============ CORE CRUD OPERATIONS ============
  async create(house: PolygamousHouse): Promise<PolygamousHouse> {
    try {
      const persistenceData = this.houseMapper.toPersistence(house);
      const savedHouse = await this.prisma.polygamousHouse.create({
        data: persistenceData,
      });
      return this.houseMapper.toDomain(savedHouse)!;
    } catch (error) {
      this.logger.error(`Failed to create polygamous house ${house.id}:`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<PolygamousHouse | null> {
    const house = await this.prisma.polygamousHouse.findUnique({
      where: { id },
    });
    return this.houseMapper.toDomain(house);
  }

  async update(house: PolygamousHouse): Promise<PolygamousHouse> {
    try {
      const persistenceData = this.houseMapper.toPersistence(house);
      const { id, ...updateData } = persistenceData;

      const savedHouse = await this.prisma.polygamousHouse.update({
        where: { id },
        data: updateData,
      });
      return this.houseMapper.toDomain(savedHouse)!;
    } catch (error) {
      this.logger.error(`Failed to update polygamous house ${house.id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.polygamousHouse.delete({
        where: { id },
      });
      this.logger.log(`Polygamous house ${id} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete polygamous house ${id}:`, error);
      throw error;
    }
  }

  async softDelete(id: string, dissolutionDate: Date): Promise<void> {
    try {
      await this.prisma.polygamousHouse.update({
        where: { id },
        data: {
          houseDissolvedAt: dissolutionDate,
          houseAssetsFrozen: true,
          updatedAt: new Date(),
        },
      });
      this.logger.log(`Polygamous house ${id} dissolved on ${dissolutionDate}`);
    } catch (error) {
      this.logger.error(`Failed to soft delete polygamous house ${id}:`, error);
      throw error;
    }
  }

  // ============ FAMILY RELATIONSHIP QUERIES ============
  async findAllByFamilyId(familyId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: { familyId },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  async countByFamilyId(familyId: string): Promise<number> {
    return await this.prisma.polygamousHouse.count({
      where: { familyId },
    });
  }

  async findActiveByFamilyId(familyId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        houseDissolvedAt: null,
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  async findDissolvedByFamilyId(familyId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        houseDissolvedAt: { not: null },
      },
      orderBy: { houseDissolvedAt: 'desc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  async getFamilyHouseOrder(familyId: string, houseOrder: number): Promise<PolygamousHouse | null> {
    const house = await this.prisma.polygamousHouse.findFirst({
      where: {
        familyId,
        houseOrder,
      },
    });
    return this.houseMapper.toDomain(house);
  }

  // ============ S.40 LSA COMPLIANCE QUERIES ============
  async findCertifiedUnderSection40(familyId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        s40CertificateNumber: { not: null },
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  async findNonCompliantHouses(familyId: string): Promise<PolygamousHouse[]> {
    // Houses that are not court recognized but are not the first house
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        OR: [
          {
            houseOrder: { gt: 1 },
            courtRecognized: false,
          },
          {
            houseOrder: { gt: 1 },
            wivesConsentObtained: false,
          },
        ],
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  async findByCertificateNumber(certificateNumber: string): Promise<PolygamousHouse | null> {
    const house = await this.prisma.polygamousHouse.findUnique({
      where: { s40CertificateNumber: certificateNumber },
    });
    return this.houseMapper.toDomain(house);
  }

  async existsByCertificateNumber(certificateNumber: string): Promise<boolean> {
    const count = await this.prisma.polygamousHouse.count({
      where: { s40CertificateNumber: certificateNumber },
    });
    return count > 0;
  }

  async findWithWivesConsent(familyId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        wivesConsentObtained: true,
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  async findWithoutWivesConsent(familyId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        houseOrder: { gt: 1 },
        wivesConsentObtained: false,
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  // ============ HOUSE HEAD MANAGEMENT ============
  async findByHouseHeadId(houseHeadId: string): Promise<PolygamousHouse | null> {
    const house = await this.prisma.polygamousHouse.findFirst({
      where: {
        houseHeadId,
        houseDissolvedAt: null,
      },
    });
    return this.houseMapper.toDomain(house);
  }

  async findHeadedByPersonId(personId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: { houseHeadId: personId },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  async countHeadedByPersonId(personId: string): Promise<number> {
    return await this.prisma.polygamousHouse.count({
      where: { houseHeadId: personId },
    });
  }

  async updateHouseHead(houseId: string, newHeadId: string): Promise<void> {
    await this.prisma.polygamousHouse.update({
      where: { id: houseId },
      data: {
        houseHeadId: newHeadId,
        updatedAt: new Date(),
      },
    });
  }

  // ============ ESTATE DISTRIBUTION QUERIES ============
  async findWithHouseSharePercentage(familyId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        houseSharePercentage: { not: null },
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  async getTotalHouseShares(familyId: string): Promise<number> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: { familyId },
      select: { houseSharePercentage: true },
    });

    const total = houses.reduce((sum, house) => {
      return sum + (house.houseSharePercentage || 0);
    }, 0);

    return total;
  }

  async findHousesWithSuccessionInstructions(familyId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        successionInstructions: { not: null },
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  // ============ BUSINESS & PROPERTY MANAGEMENT ============
  async findWithBusinessRegistration(familyId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        houseBusinessName: { not: null },
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  async findByBusinessKraPin(kraPin: string): Promise<PolygamousHouse | null> {
    const house = await this.prisma.polygamousHouse.findUnique({
      where: { houseBusinessKraPin: kraPin },
    });
    return this.houseMapper.toDomain(house);
  }

  async findWithSeparateProperty(familyId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        separateProperty: true,
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  // ============ HOUSE STATUS QUERIES ============
  async findWithFrozenAssets(familyId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        houseAssetsFrozen: true,
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  async findWithoutHead(familyId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        houseHeadId: null,
        houseDissolvedAt: null,
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  async findCourtRecognizedHouses(familyId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        courtRecognized: true,
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  async findNonCourtRecognizedHouses(familyId: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        courtRecognized: false,
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  // ============ BULK OPERATIONS ============
  async batchSave(houses: PolygamousHouse[]): Promise<PolygamousHouse[]> {
    if (houses.length === 0) {
      return [];
    }

    const savedHouses: PolygamousHouse[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const house of houses) {
        const persistenceData = this.houseMapper.toPersistence(house);
        const { id, ...updateData } = persistenceData;

        const saved = await tx.polygamousHouse.upsert({
          where: { id },
          create: persistenceData,
          update: updateData,
        });

        savedHouses.push(this.houseMapper.toDomain(saved)!);
      }
    });

    return savedHouses;
  }

  async batchDissolveByFamilyId(familyId: string, dissolutionDate: Date): Promise<void> {
    await this.prisma.polygamousHouse.updateMany({
      where: {
        familyId,
        houseDissolvedAt: null,
      },
      data: {
        houseDissolvedAt: dissolutionDate,
        houseAssetsFrozen: true,
        updatedAt: new Date(),
      },
    });
    this.logger.log(`All active houses for family ${familyId} dissolved on ${dissolutionDate}`);
  }

  async batchFreezeAssetsByFamilyId(familyId: string): Promise<void> {
    await this.prisma.polygamousHouse.updateMany({
      where: { familyId },
      data: {
        houseAssetsFrozen: true,
        updatedAt: new Date(),
      },
    });
    this.logger.log(`All house assets for family ${familyId} frozen`);
  }

  async batchUnfreezeAssetsByFamilyId(familyId: string): Promise<void> {
    await this.prisma.polygamousHouse.updateMany({
      where: { familyId },
      data: {
        houseAssetsFrozen: false,
        updatedAt: new Date(),
      },
    });
    this.logger.log(`All house assets for family ${familyId} unfrozen`);
  }

  // ============ VALIDATION & EXISTENCE CHECKS ============
  async existsByHouseName(familyId: string, houseName: string): Promise<boolean> {
    const count = await this.prisma.polygamousHouse.count({
      where: {
        familyId,
        houseName,
      },
    });
    return count > 0;
  }

  async existsByHouseOrder(familyId: string, houseOrder: number): Promise<boolean> {
    const count = await this.prisma.polygamousHouse.count({
      where: {
        familyId,
        houseOrder,
      },
    });
    return count > 0;
  }

  async validateHouseUniqueness(
    familyId: string,
    houseName: string,
    houseOrder: number,
  ): Promise<boolean> {
    const existing = await this.prisma.polygamousHouse.findFirst({
      where: {
        familyId,
        OR: [{ houseName }, { houseOrder }],
      },
    });
    return existing === null;
  }

  async hasActiveHouseForHead(houseHeadId: string): Promise<boolean> {
    const count = await this.prisma.polygamousHouse.count({
      where: {
        houseHeadId,
        houseDissolvedAt: null,
      },
    });
    return count > 0;
  }

  // ============ STATISTICS & REPORTING ============
  async getHouseStatistics(familyId: string): Promise<{
    total: number;
    active: number;
    dissolved: number;
    certifiedS40: number;
    courtRecognized: number;
    withBusiness: number;
    withSuccessionInstructions: number;
    averageSharePercentage: number;
    complianceRate: number;
  }> {
    const [
      total,
      active,
      dissolved,
      certifiedS40,
      courtRecognized,
      withBusiness,
      withSuccessionInstructions,
      houses,
    ] = await Promise.all([
      this.countByFamilyId(familyId),
      this.prisma.polygamousHouse.count({ where: { familyId, houseDissolvedAt: null } }),
      this.prisma.polygamousHouse.count({ where: { familyId, houseDissolvedAt: { not: null } } }),
      this.prisma.polygamousHouse.count({
        where: { familyId, s40CertificateNumber: { not: null } },
      }),
      this.prisma.polygamousHouse.count({ where: { familyId, courtRecognized: true } }),
      this.prisma.polygamousHouse.count({ where: { familyId, houseBusinessName: { not: null } } }),
      this.prisma.polygamousHouse.count({
        where: { familyId, successionInstructions: { not: null } },
      }),
      this.prisma.polygamousHouse.findMany({
        where: { familyId },
        select: { houseSharePercentage: true, houseOrder: true, s40CertificateNumber: true },
      }),
    ]);

    // Calculate average share percentage
    const totalShare = houses.reduce((sum, house) => sum + (house.houseSharePercentage || 0), 0);
    const averageSharePercentage = total > 0 ? totalShare / total : 0;

    // Calculate compliance rate (houses with S.40 certificate / total houses after first house)
    const housesAfterFirst = houses.filter((h) => h.houseOrder > 1).length;
    const compliantHouses = houses.filter(
      (h) => h.houseOrder === 1 || h.s40CertificateNumber,
    ).length;
    const complianceRate = total > 0 ? (compliantHouses / total) * 100 : 100;

    return {
      total,
      active,
      dissolved,
      certifiedS40,
      courtRecognized,
      withBusiness,
      withSuccessionInstructions,
      averageSharePercentage,
      complianceRate,
    };
  }

  // ============ S.40(2) DISTRIBUTION CALCULATIONS ============
  async calculateHouseDistribution(familyId: string): Promise<
    Array<{
      houseId: string;
      houseName: string;
      houseOrder: number;
      sharePercentage: number;
      calculatedShare: number;
      isCertified: boolean;
      hasSuccessionInstructions: boolean;
    }>
  > {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: { familyId },
      orderBy: { houseOrder: 'asc' },
    });

    const totalHouses = houses.length;

    return houses.map((house) => {
      // S.40(2) calculation: If no specific share, divide equally
      const sharePercentage = house.houseSharePercentage || 100 / totalHouses;

      return {
        houseId: house.id,
        houseName: house.houseName,
        houseOrder: house.houseOrder,
        sharePercentage,
        calculatedShare: sharePercentage / 100, // Convert to decimal
        isCertified: !!house.s40CertificateNumber,
        hasSuccessionInstructions: !!house.successionInstructions,
      };
    });
  }

  // ============ LEGAL COMPLIANCE REPORTING ============
  async getS40ComplianceReport(familyId: string): Promise<{
    totalHouses: number;
    compliantHouses: number;
    nonCompliantHouses: number;
    pendingHouses: number;
    missingCertificates: string[];
    missingWivesConsent: string[];
    housesWithoutHeads: string[];
  }> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: { familyId },
      orderBy: { houseOrder: 'asc' },
    });

    const missingCertificates: string[] = [];
    const missingWivesConsent: string[] = [];
    const housesWithoutHeads: string[] = [];

    let compliantHouses = 0;
    let nonCompliantHouses = 0;
    let pendingHouses = 0;

    houses.forEach((house) => {
      if (house.houseOrder === 1) {
        compliantHouses++; // First house is automatically compliant
      } else {
        if (house.s40CertificateNumber && house.wivesConsentObtained) {
          compliantHouses++;
        } else if (house.wivesConsentObtained && !house.s40CertificateNumber) {
          pendingHouses++;
          missingCertificates.push(`${house.houseName} (Order ${house.houseOrder})`);
        } else {
          nonCompliantHouses++;
          if (!house.s40CertificateNumber) {
            missingCertificates.push(`${house.houseName} (Order ${house.houseOrder})`);
          }
          if (!house.wivesConsentObtained) {
            missingWivesConsent.push(`${house.houseName} (Order ${house.houseOrder})`);
          }
        }
      }

      if (!house.houseHeadId && !house.houseDissolvedAt) {
        housesWithoutHeads.push(`${house.houseName} (Order ${house.houseOrder})`);
      }
    });

    return {
      totalHouses: houses.length,
      compliantHouses,
      nonCompliantHouses,
      pendingHouses,
      missingCertificates,
      missingWivesConsent,
      housesWithoutHeads,
    };
  }

  // ============ HOUSE ORDER MANAGEMENT ============
  async getNextHouseOrder(familyId: string): Promise<number> {
    const lastHouse = await this.prisma.polygamousHouse.findFirst({
      where: { familyId },
      orderBy: { houseOrder: 'desc' },
      select: { houseOrder: true },
    });

    return (lastHouse?.houseOrder || 0) + 1;
  }

  async reorderHouses(
    familyId: string,
    newOrderMapping: Array<{ houseId: string; newOrder: number }>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const mapping of newOrderMapping) {
        await tx.polygamousHouse.update({
          where: { id: mapping.houseId, familyId },
          data: {
            houseOrder: mapping.newOrder,
            updatedAt: new Date(),
          },
        });
      }
    });
  }

  // ============ SEARCH OPERATIONS ============
  async searchByName(familyId: string, name: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        houseName: { contains: name, mode: 'insensitive' },
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  async findByBusinessName(familyId: string, businessName: string): Promise<PolygamousHouse[]> {
    const houses = await this.prisma.polygamousHouse.findMany({
      where: {
        familyId,
        houseBusinessName: { contains: businessName, mode: 'insensitive' },
      },
      orderBy: { houseOrder: 'asc' },
    });
    return houses.map((house) => this.houseMapper.toDomain(house)!);
  }

  // ============ HELPER METHODS ============
  async withTransaction<T>(transactionFn: (client: TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return transactionFn(tx as TransactionClient);
    });
  }
}
