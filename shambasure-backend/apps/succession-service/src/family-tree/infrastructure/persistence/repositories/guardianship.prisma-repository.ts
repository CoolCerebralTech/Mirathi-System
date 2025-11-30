import { Injectable } from '@nestjs/common';
import { GuardianType, Prisma } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Guardianship } from '../../../domain/entities/guardianship.entity';
import { GuardianshipRepositoryInterface } from '../../../domain/interfaces/guardianship.repository.interface';
import { GuardianshipMapper } from '../mappers/guardianship.mapper';

@Injectable()
export class GuardianshipPrismaRepository implements GuardianshipRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  async save(guardianship: Guardianship): Promise<void> {
    await this.prisma.guardian.upsert({
      where: { id: guardianship.getId() },
      create: GuardianshipMapper.toPrismaCreate(guardianship),
      update: GuardianshipMapper.toPrismaUpdate(guardianship),
    });
  }

  async findById(id: string): Promise<Guardianship | null> {
    const record = await this.prisma.guardian.findUnique({
      where: { id },
    });

    return record ? GuardianshipMapper.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.guardian.delete({
      where: { id },
    });
  }

  // ---------------------------------------------------------
  // DOMAIN LOOKUPS
  // ---------------------------------------------------------

  async findByWardId(wardId: string): Promise<Guardianship[]> {
    const records = await this.prisma.guardian.findMany({
      where: { wardId },
    });
    return records.map((record) => GuardianshipMapper.toDomain(record));
  }

  async findByGuardianId(guardianId: string): Promise<Guardianship[]> {
    const records = await this.prisma.guardian.findMany({
      where: { guardianId },
    });
    return records.map((record) => GuardianshipMapper.toDomain(record));
  }

  async findActiveByFamilyId(familyId: string): Promise<Guardianship[]> {
    const records = await this.prisma.guardian.findMany({
      where: {
        isActive: true,
        ward: {
          familyId: familyId,
        },
      },
    });
    return records.map((record) => GuardianshipMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // KENYAN LEGAL GUARDIANSHIP SPECIFIC QUERIES
  // ---------------------------------------------------------

  async findExpiringGuardianships(daysThreshold: number): Promise<Guardianship[]> {
    const today = new Date();
    const futureThreshold = new Date();
    futureThreshold.setDate(today.getDate() + daysThreshold);

    const records = await this.prisma.guardian.findMany({
      where: {
        isActive: true,
        validUntil: {
          gte: today,
          lte: futureThreshold,
        },
      },
    });

    return records.map((record) => GuardianshipMapper.toDomain(record));
  }

  async findByCourtOrder(courtOrderNumber: string): Promise<Guardianship | null> {
    const record = await this.prisma.guardian.findFirst({
      where: {
        courtOrderNumber,
      },
    });

    return record ? GuardianshipMapper.toDomain(record) : null;
  }

  async findTestamentaryGuardianships(familyId: string): Promise<Guardianship[]> {
    const records = await this.prisma.guardian.findMany({
      where: {
        type: GuardianType.TESTAMENTARY,
        ward: { familyId },
      },
    });
    return records.map((record) => GuardianshipMapper.toDomain(record));
  }

  async findTemporaryGuardianshipsRequiringReview(): Promise<Guardianship[]> {
    const today = new Date();

    const records = await this.prisma.guardian.findMany({
      where: {
        isActive: true,
        isTemporary: true,
        reviewDate: {
          lte: today,
        },
      },
    });

    return records.map((record) => GuardianshipMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // VALIDATION & COMPLIANCE
  // ---------------------------------------------------------

  async isMemberGuardian(memberId: string): Promise<boolean> {
    const count = await this.prisma.guardian.count({
      where: {
        guardianId: memberId,
        isActive: true,
      },
    });
    return count > 0;
  }

  async countActiveByGuardian(guardianId: string): Promise<number> {
    return this.prisma.guardian.count({
      where: {
        guardianId,
        isActive: true,
      },
    });
  }

  // ---------------------------------------------------------
  // ANALYTICS
  // ---------------------------------------------------------

  async getGuardianshipStatistics(familyId: string): Promise<{
    total: number;
    active: number;
    testamentary: number;
    courtOrdered: number;
    expiringSoon: number;
  }> {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);

    const [total, active, testamentary, courtOrdered, expiringSoon] = await Promise.all([
      // Total
      this.prisma.guardian.count({
        where: { ward: { familyId } },
      }),
      // Active
      this.prisma.guardian.count({
        where: {
          ward: { familyId },
          isActive: true,
        },
      }),
      // Testamentary
      this.prisma.guardian.count({
        where: {
          ward: { familyId },
          type: GuardianType.TESTAMENTARY,
        },
      }),
      // Court Ordered
      this.prisma.guardian.count({
        where: {
          ward: { familyId },
          type: GuardianType.LEGAL_GUARDIAN,
        },
      }),
      // Expiring Soon
      this.prisma.guardian.count({
        where: {
          ward: { familyId },
          isActive: true,
          validUntil: {
            gte: today,
            lte: nextMonth,
          },
        },
      }),
    ]);

    return {
      total,
      active,
      testamentary,
      courtOrdered,
      expiringSoon,
    };
  }

  // ---------------------------------------------------------
  // ADDITIONAL UTILITY METHODS
  // ---------------------------------------------------------

  async findLegalGuardianships(familyId: string): Promise<Guardianship[]> {
    const records = await this.prisma.guardian.findMany({
      where: {
        type: GuardianType.LEGAL_GUARDIAN,
        ward: { familyId },
      },
    });
    return records.map((record) => GuardianshipMapper.toDomain(record));
  }

  async findGuardianshipsByCourtStation(courtStation: string): Promise<Guardianship[]> {
    const records = await this.prisma.guardian.findMany({
      where: {
        courtStation,
      },
    });
    return records.map((record) => GuardianshipMapper.toDomain(record));
  }

  async findOverdueGuardianships(): Promise<Guardianship[]> {
    const today = new Date();

    const records = await this.prisma.guardian.findMany({
      where: {
        isActive: true,
        validUntil: {
          lt: today,
        },
      },
    });

    return records.map((record) => GuardianshipMapper.toDomain(record));
  }

  async findGuardianshipsWithConditions(): Promise<Guardianship[]> {
    const records = await this.prisma.guardian.findMany({
      where: {
        conditions: {
          not: Prisma.JsonNull,
        },
      },
    });

    return records.map((record) => GuardianshipMapper.toDomain(record));
  }
}
