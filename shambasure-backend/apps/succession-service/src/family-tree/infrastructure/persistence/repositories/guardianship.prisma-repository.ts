import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { GuardianType } from '@prisma/client';
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
    const data = GuardianshipMapper.toPersistence(guardianship);

    await this.prisma.guardian.upsert({
      where: { id: guardianship.getId() },
      create: {
        id: data.id,
        guardianId: data.guardianId,
        wardId: data.wardId,
        type: data.type,
        appointedBy: data.appointedBy,
        appointmentDate: data.appointmentDate,
        validUntil: data.validUntil,
        isActive: data.isActive,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        type: data.type,
        appointedBy: data.appointedBy,
        validUntil: data.validUntil,
        isActive: data.isActive,
        notes: data.notes,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<Guardianship | null> {
    const record = await this.prisma.guardian.findUnique({
      where: { id },
      include: {
        ward: { select: { familyId: true } }, // Fetch Family ID for Entity context
      },
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
      include: { ward: { select: { familyId: true } } },
    });
    return records.map((record) => GuardianshipMapper.toDomain(record));
  }

  async findByGuardianId(guardianId: string): Promise<Guardianship[]> {
    const records = await this.prisma.guardian.findMany({
      where: { guardianId },
      include: { ward: { select: { familyId: true } } },
    });
    return records.map((record) => GuardianshipMapper.toDomain(record));
  }

  async findActiveByFamilyId(familyId: string): Promise<Guardianship[]> {
    // Relational filtering: Find guardianships where the Ward belongs to this family
    const records = await this.prisma.guardian.findMany({
      where: {
        isActive: true,
        ward: {
          familyId: familyId,
        },
      },
      include: { ward: { select: { familyId: true } } },
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
      include: { ward: { select: { familyId: true } } },
    });

    return records.map((record) => GuardianshipMapper.toDomain(record));
  }

  async findByCourtOrder(courtOrderNumber: string): Promise<Guardianship | null> {
    // LIMITATION: Schema lacks 'courtOrderNumber'.
    // FALLBACK: Search in notes or appointedBy fields.
    const record = await this.prisma.guardian.findFirst({
      where: {
        OR: [
          { notes: { contains: courtOrderNumber } },
          { appointedBy: { contains: courtOrderNumber } },
        ],
      },
      include: { ward: { select: { familyId: true } } },
    });

    return record ? GuardianshipMapper.toDomain(record) : null;
  }

  async findTestamentaryGuardianships(familyId: string): Promise<Guardianship[]> {
    const records = await this.prisma.guardian.findMany({
      where: {
        type: GuardianType.TESTAMENTARY,
        ward: { familyId },
      },
      include: { ward: { select: { familyId: true } } },
    });
    return records.map((record) => GuardianshipMapper.toDomain(record));
  }

  async findTemporaryGuardianshipsRequiringReview(): Promise<Guardianship[]> {
    // LIMITATION: Schema lacks 'isTemporary' or 'reviewDate'.
    // STRATEGY: Fetch all property guardians (often temporary) or check notes.
    // Ideally, we filter in-memory if not supported by DB.
    // Here we query generic active records and filter in Domain if possible,
    // or rely on 'notes' tagging (e.g. "#TEMPORARY").

    // For production safety without column support, we return an empty array
    // or search specifically tagged notes if that convention exists.
    // Returning empty to prevent false positives until schema update.
    return [];
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

  async findGuardianshipsRequiringReporting(): Promise<Guardianship[]> {
    // Usually Legal and Financial guardianships require reporting.
    const records = await this.prisma.guardian.findMany({
      where: {
        isActive: true,
        type: {
          in: [GuardianType.LEGAL_GUARDIAN, GuardianType.FINANCIAL_GUARDIAN],
        },
      },
      include: { ward: { select: { familyId: true } } },
    });
    return records.map((record) => GuardianshipMapper.toDomain(record));
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

    // Run aggregations in parallel
    const [total, active, testamentary, courtOrdered, expiringSoon] = await Promise.all([
      // Total
      this.prisma.guardian.count({
        where: { ward: { familyId } },
      }),
      // Active
      this.prisma.guardian.count({
        where: { ward: { familyId }, isActive: true },
      }),
      // Testamentary
      this.prisma.guardian.count({
        where: { ward: { familyId }, type: GuardianType.TESTAMENTARY },
      }),
      // Court Ordered (Inferred from Legal/Financial types usually appointed by court)
      this.prisma.guardian.count({
        where: {
          ward: { familyId },
          type: { in: [GuardianType.LEGAL_GUARDIAN, GuardianType.FINANCIAL_GUARDIAN] },
        },
      }),
      // Expiring Soon (Active + expires within 30 days)
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
}
