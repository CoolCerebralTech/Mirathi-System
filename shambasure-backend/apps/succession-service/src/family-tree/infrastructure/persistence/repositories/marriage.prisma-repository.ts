import { Injectable } from '@nestjs/common';
import { MarriageStatus } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Marriage } from '../../../domain/entities/marriage.entity';
import { MarriageRepositoryInterface } from '../../../domain/interfaces/marriage.repository.interface';
import { MarriageMapper } from '../mappers/marriage.mapper';

@Injectable()
export class MarriagePrismaRepository implements MarriageRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  async save(marriage: Marriage): Promise<void> {
    await this.prisma.marriage.upsert({
      where: { id: marriage.getId() },
      create: MarriageMapper.toPrismaCreate(marriage, marriage.getFamilyId()),
      update: MarriageMapper.toPrismaUpdate(marriage),
    });
  }

  async findById(id: string): Promise<Marriage | null> {
    const record = await this.prisma.marriage.findUnique({
      where: { id },
    });

    return record ? MarriageMapper.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.marriage.delete({
      where: { id },
    });
  }

  // ---------------------------------------------------------
  // DOMAIN LOOKUPS
  // ---------------------------------------------------------

  async findByFamilyId(familyId: string): Promise<Marriage[]> {
    const records = await this.prisma.marriage.findMany({
      where: { familyId },
      orderBy: { marriageDate: 'desc' },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  async findByMemberId(memberId: string): Promise<Marriage[]> {
    const records = await this.prisma.marriage.findMany({
      where: {
        OR: [{ spouse1Id: memberId }, { spouse2Id: memberId }],
      },
      orderBy: { marriageDate: 'desc' },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  async findActiveBetween(spouse1Id: string, spouse2Id: string): Promise<Marriage | null> {
    const record = await this.prisma.marriage.findFirst({
      where: {
        isActive: true,
        OR: [
          { spouse1Id: spouse1Id, spouse2Id: spouse2Id },
          { spouse1Id: spouse2Id, spouse2Id: spouse1Id },
        ],
      },
    });
    return record ? MarriageMapper.toDomain(record) : null;
  }

  async findActiveMarriages(memberId: string): Promise<Marriage[]> {
    const records = await this.prisma.marriage.findMany({
      where: {
        isActive: true,
        OR: [{ spouse1Id: memberId }, { spouse2Id: memberId }],
      },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // KENYAN MARRIAGE LAW SPECIFIC QUERIES
  // ---------------------------------------------------------

  async findCustomaryMarriages(familyId: string): Promise<Marriage[]> {
    const records = await this.prisma.marriage.findMany({
      where: {
        familyId,
        marriageType: MarriageStatus.CUSTOMARY_MARRIAGE,
      },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  async findByCertificateNumber(certificateNumber: string): Promise<Marriage | null> {
    const record = await this.prisma.marriage.findFirst({
      where: { certificateNumber },
    });
    return record ? MarriageMapper.toDomain(record) : null;
  }

  async findDissolvedMarriages(familyId: string): Promise<Marriage[]> {
    const records = await this.prisma.marriage.findMany({
      where: {
        familyId,
        isActive: false,
      },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // VALIDATION & BUSINESS RULES
  // ---------------------------------------------------------

  async canMemberMarry(memberId: string, proposedMarriageType: MarriageStatus): Promise<boolean> {
    const existingMarriages = await this.findActiveMarriages(memberId);

    // No existing marriages - can marry
    if (existingMarriages.length === 0) {
      return true;
    }

    // Check if existing marriages allow polygamy
    const hasMonogamousMarriage = existingMarriages.some((marriage) => !marriage.allowsPolygamy());

    // If member has a monogamous marriage, cannot marry again
    if (hasMonogamousMarriage) {
      return false;
    }

    // For polygamous marriages, check if proposed marriage type is allowed
    const proposedIsMonogamous =
      proposedMarriageType === MarriageStatus.CIVIL_UNION ||
      proposedMarriageType === MarriageStatus.MARRIED ||
      proposedMarriageType === MarriageStatus.CHRISTIAN;

    // Cannot enter monogamous marriage while in polygamous marriage
    if (proposedIsMonogamous) {
      return false;
    }

    // Allowed: existing polygamous marriage and proposed polygamous marriage
    return true;
  }

  // ---------------------------------------------------------
  // ANALYTICS
  // ---------------------------------------------------------

  async getMarriageStatistics(familyId: string): Promise<{
    total: number;
    active: number;
    dissolved: number;
    customary: number;
    civil: number;
    averageDurationYears: number;
  }> {
    const marriages = await this.findByFamilyId(familyId);

    let totalDurationYears = 0;
    let durationCount = 0;

    const statistics = marriages.reduce(
      (acc, marriage) => {
        acc.total++;

        if (marriage.getIsActive()) {
          acc.active++;
        } else {
          acc.dissolved++;
        }

        if (marriage.getMarriageType() === MarriageStatus.CUSTOMARY_MARRIAGE) {
          acc.customary++;
        } else if (
          marriage.getMarriageType() === MarriageStatus.CIVIL_UNION ||
          marriage.getMarriageType() === MarriageStatus.MARRIED
        ) {
          acc.civil++;
        }

        const duration = marriage.getMarriageDuration();
        if (duration !== null && duration > 0) {
          totalDurationYears += duration;
          durationCount++;
        }

        return acc;
      },
      {
        total: 0,
        active: 0,
        dissolved: 0,
        customary: 0,
        civil: 0,
      },
    );

    const averageDurationYears = durationCount > 0 ? totalDurationYears / durationCount : 0;

    return {
      ...statistics,
      averageDurationYears: parseFloat(averageDurationYears.toFixed(1)),
    };
  }

  // ---------------------------------------------------------
  // ADDITIONAL UTILITY METHODS
  // ---------------------------------------------------------

  async findMarriagesByOfficer(officerName: string): Promise<Marriage[]> {
    const records = await this.prisma.marriage.findMany({
      where: {
        marriageOfficerName: {
          contains: officerName,
          mode: 'insensitive',
        },
      },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  async findMarriagesByLocation(county?: string, venue?: string): Promise<Marriage[]> {
    const whereClause: any = {};

    if (county) {
      whereClause.marriageCounty = county;
    }

    if (venue) {
      whereClause.marriageVenue = {
        contains: venue,
        mode: 'insensitive',
      };
    }

    const records = await this.prisma.marriage.findMany({
      where: whereClause,
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  async findRecentMarriages(days: number = 30): Promise<Marriage[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const records = await this.prisma.marriage.findMany({
      where: {
        marriageDate: {
          gte: cutoffDate,
        },
      },
      orderBy: { marriageDate: 'desc' },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  async findMarriagesWithBridePrice(): Promise<Marriage[]> {
    const records = await this.prisma.marriage.findMany({
      where: {
        bridePricePaid: true,
      },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }
}
