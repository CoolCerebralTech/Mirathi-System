import { Injectable } from '@nestjs/common';
import { GuardianType, Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Guardian } from '../../../domain/entities/guardian.entity';
import { IGuardianRepository } from '../../../domain/interfaces/repositories/iguardian.repository';
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

  // --- Core CRUD Operations ---
  async create(guardian: Guardian): Promise<Guardian> {
    const persistenceData = this.guardianMapper.toPersistence(guardian);
    const savedGuardian = await this.prisma.guardian.create({
      data: persistenceData,
    });
    return this.guardianMapper.toDomain(savedGuardian)!;
  }

  async findById(id: string): Promise<Guardian | null> {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
    });
    return this.guardianMapper.toDomain(guardian);
  }

  async update(guardian: Guardian): Promise<Guardian> {
    const persistenceData = this.guardianMapper.toPersistence(guardian);
    const { id, ...updateData } = persistenceData;

    const updatedGuardian = await this.prisma.guardian.update({
      where: { id },
      data: updateData,
    });
    return this.guardianMapper.toDomain(updatedGuardian)!;
  }

  async delete(id: string, tx?: TransactionClient): Promise<void> {
    const prismaClient = tx || this.prisma;
    await prismaClient.guardian.delete({
      where: { id },
    });
  }

  // --- Person-Centric Queries ---
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

  async findActiveByWardId(wardId: string): Promise<Guardian | null> {
    const guardian = await this.prisma.guardian.findFirst({
      where: {
        wardId,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
    });
    return this.guardianMapper.toDomain(guardian);
  }

  async findActiveByGuardianId(guardianId: string): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        guardianId,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findActiveGuardianship(wardId: string, guardianId: string): Promise<Guardian | null> {
    const guardian = await this.prisma.guardian.findFirst({
      where: {
        wardId,
        guardianId,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
    });
    return this.guardianMapper.toDomain(guardian);
  }

  // --- Kenyan Legal Requirement Queries ---
  async findByCourtCaseNumber(caseNumber: string): Promise<Guardian | null> {
    const guardian = await this.prisma.guardian.findUnique({
      where: { courtCaseNumber: caseNumber },
    });
    return this.guardianMapper.toDomain(guardian);
  }

  async findByCourtOrderNumber(orderNumber: string): Promise<Guardian | null> {
    const guardian = await this.prisma.guardian.findFirst({
      where: { courtOrderNumber: orderNumber },
    });
    return this.guardianMapper.toDomain(guardian);
  }

  async findAllCourtAppointed(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: { type: GuardianType.COURT_APPOINTED },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findAllTestamentary(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: { type: GuardianType.TESTAMENTARY },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  // --- S.72 Guardian Bond Compliance Queries ---
  async findGuardianshipsRequiringBond(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        bondRequired: true,
        isActive: true,
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findWithoutBondPosted(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        bondRequired: true,
        OR: [{ bondProvider: null }, { bondPolicyNumber: null }],
        isActive: true,
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findWithExpiredBond(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        bondRequired: true,
        bondExpiry: { lt: new Date() },
        isActive: true,
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findCompliantWithS72(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        bondRequired: true,
        isActive: true,
        bondProvider: { not: null },
        bondPolicyNumber: { not: null },
        bondExpiry: { gt: new Date() },
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findNonCompliantWithS72(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        bondRequired: true,
        isActive: true,
        OR: [
          { bondProvider: null },
          { bondPolicyNumber: null },
          { bondExpiry: { lt: new Date() } },
        ],
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  // --- S.73 Annual Reporting Compliance Queries ---
  async findWithOverdueReports(): Promise<Guardian[]> {
    const today = new Date();
    const guardians = await this.prisma.guardian.findMany({
      where: {
        isActive: true,
        hasPropertyManagementPowers: true,
        nextReportDue: { lt: today },
        OR: [{ reportStatus: { notIn: ['SUBMITTED', 'APPROVED'] } }, { reportStatus: null }],
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findWithReportsDueSoon(daysThreshold: number): Promise<Guardian[]> {
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + daysThreshold);

    const guardians = await this.prisma.guardian.findMany({
      where: {
        isActive: true,
        hasPropertyManagementPowers: true,
        nextReportDue: {
          gte: today,
          lte: dueDate,
        },
        OR: [{ reportStatus: { notIn: ['SUBMITTED', 'APPROVED'] } }, { reportStatus: null }],
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findCompliantWithS73(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        isActive: true,
        hasPropertyManagementPowers: true,
        reportStatus: { in: ['SUBMITTED', 'APPROVED'] },
        OR: [{ nextReportDue: { gt: new Date() } }, { nextReportDue: null }],
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findNonCompliantWithS73(): Promise<Guardian[]> {
    const today = new Date();
    const guardians = await this.prisma.guardian.findMany({
      where: {
        isActive: true,
        hasPropertyManagementPowers: true,
        OR: [
          {
            nextReportDue: { lt: today },
            reportStatus: { notIn: ['SUBMITTED', 'APPROVED'] },
          },
          {
            nextReportDue: { lt: today },
            reportStatus: null,
          },
        ],
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findRequiringAnnualReports(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        isActive: true,
        hasPropertyManagementPowers: true,
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  // --- Status & Active Management Queries ---
  async findActiveGuardianships(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findTerminatedGuardianships(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: { isActive: false },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findExpiredGuardianships(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        validUntil: { lt: new Date() },
        isActive: true,
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findGuardianshipsExpiringSoon(daysThreshold: number): Promise<Guardian[]> {
    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() + daysThreshold);

    const guardians = await this.prisma.guardian.findMany({
      where: {
        isActive: true,
        validUntil: {
          gte: today,
          lte: expiryDate,
        },
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  // --- Guardian Type & Powers Queries ---
  async findByType(type: GuardianType): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: { type },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findWithPropertyManagementPowers(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        hasPropertyManagementPowers: true,
        isActive: true,
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findWithoutPropertyManagementPowers(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        hasPropertyManagementPowers: false,
        isActive: true,
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findWithMedicalConsentPowers(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        canConsentToMedical: true,
        isActive: true,
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findWithMarriageConsentPowers(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        canConsentToMarriage: true,
        isActive: true,
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  // --- Bulk Operations ---
  async batchCreate(guardians: Guardian[]): Promise<Guardian[]> {
    const persistenceData = guardians.map((g) => this.guardianMapper.toPersistence(g));

    const createdGuardians = await this.prisma.$transaction(async (tx) => {
      const results: Awaited<ReturnType<typeof tx.guardian.create>>[] = [];
      for (const data of persistenceData) {
        const guardian = await tx.guardian.create({
          data,
        });
        results.push(guardian);
      }
      return results;
    });

    return createdGuardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async batchTerminateByWardId(wardId: string, reason: string): Promise<void> {
    await this.prisma.guardian.updateMany({
      where: {
        wardId,
        isActive: true,
      },
      data: {
        isActive: false,
        terminationDate: new Date(),
        terminationReason: reason,
        updatedAt: new Date(),
      },
    });
  }

  async batchUpdateReportStatuses(
    updates: Array<{ guardianId: string; reportStatus: string; lastReportDate: Date }>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const update of updates) {
        await tx.guardian.update({
          where: { id: update.guardianId },
          data: {
            reportStatus: update.reportStatus,
            lastReportDate: update.lastReportDate,
            updatedAt: new Date(),
          },
        });
      }
    });
  }

  // --- Compliance & Legal Reporting ---
  async getGuardianshipComplianceSummary(): Promise<{
    total: number;
    active: number;
    terminated: number;
    bondRequired: number;
    bondCompliant: number;
    s73Compliant: number;
    s73NonCompliant: number;
    propertyPowers: number;
    courtAppointed: number;
    testamentary: number;
  }> {
    const [total, active, terminated, bondRequired, propertyPowers, courtAppointed, testamentary] =
      await Promise.all([
        this.prisma.guardian.count(),
        this.prisma.guardian.count({ where: { isActive: true } }),
        this.prisma.guardian.count({ where: { isActive: false } }),
        this.prisma.guardian.count({ where: { bondRequired: true, isActive: true } }),
        this.prisma.guardian.count({
          where: { hasPropertyManagementPowers: true, isActive: true },
        }),
        this.prisma.guardian.count({ where: { type: GuardianType.COURT_APPOINTED } }),
        this.prisma.guardian.count({ where: { type: GuardianType.TESTAMENTARY } }),
      ]);

    // Get bond compliance
    const bondCompliantCount = await this.prisma.guardian.count({
      where: {
        bondRequired: true,
        isActive: true,
        bondProvider: { not: null },
        bondPolicyNumber: { not: null },
        bondExpiry: { gt: new Date() },
      },
    });

    // Get S.73 compliance (simplified - needs refinement based on exact business rules)
    const s73CompliantCount = await this.prisma.guardian.count({
      where: {
        isActive: true,
        hasPropertyManagementPowers: true,
        reportStatus: { in: ['SUBMITTED', 'APPROVED'] },
      },
    });

    const s73NonCompliantCount = await this.prisma.guardian.count({
      where: {
        isActive: true,
        hasPropertyManagementPowers: true,
        OR: [{ reportStatus: { notIn: ['SUBMITTED', 'APPROVED'] } }, { reportStatus: null }],
      },
    });

    return {
      total,
      active,
      terminated,
      bondRequired,
      bondCompliant: bondCompliantCount,
      s73Compliant: s73CompliantCount,
      s73NonCompliant: s73NonCompliantCount,
      propertyPowers,
      courtAppointed,
      testamentary,
    };
  }

  // --- Validation & Existence Checks ---
  async existsActiveForWard(wardId: string): Promise<boolean> {
    const count = await this.prisma.guardian.count({
      where: {
        wardId,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
    });
    return count > 0;
  }

  async existsActiveForGuardian(guardianId: string): Promise<boolean> {
    const count = await this.prisma.guardian.count({
      where: {
        guardianId,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
    });
    return count > 0;
  }

  async validateGuardianshipUniqueness(
    wardId: string,
    guardianId: string,
    type: GuardianType,
  ): Promise<boolean> {
    const count = await this.prisma.guardian.count({
      where: {
        wardId,
        guardianId,
        type,
        isActive: true,
      },
    });
    return count === 0;
  }

  // --- Bond Management Operations ---
  async postBond(
    guardianId: string,
    provider: string,
    policyNumber: string,
    expiryDate: Date,
  ): Promise<void> {
    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: {
        bondProvider: provider,
        bondPolicyNumber: policyNumber,
        bondExpiry: expiryDate,
        updatedAt: new Date(),
      },
    });
  }

  async updateBondExpiry(guardianId: string, newExpiry: Date): Promise<void> {
    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: {
        bondExpiry: newExpiry,
        updatedAt: new Date(),
      },
    });
  }

  // --- Annual Report Management Operations ---
  async fileAnnualReport(guardianId: string, reportDate: Date, approvedBy?: string): Promise<void> {
    const updateData: any = {
      lastReportDate: reportDate,
      reportStatus: 'SUBMITTED',
      updatedAt: new Date(),
    };

    if (approvedBy) {
      updateData.reportStatus = 'APPROVED';
      updateData.allowanceApprovedBy = approvedBy;
    }

    // Calculate next report due (1 year from report date)
    const nextReportDue = new Date(reportDate);
    nextReportDue.setFullYear(nextReportDue.getFullYear() + 1);
    updateData.nextReportDue = nextReportDue;

    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: updateData,
    });
  }

  async approveAnnualReport(guardianId: string, approvedBy: string): Promise<void> {
    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: {
        reportStatus: 'APPROVED',
        allowanceApprovedBy: approvedBy,
        updatedAt: new Date(),
      },
    });
  }

  async markReportOverdue(guardianId: string): Promise<void> {
    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: {
        reportStatus: 'OVERDUE',
        updatedAt: new Date(),
      },
    });
  }

  // --- Power Management Operations ---
  async grantPropertyManagementPowers(
    guardianId: string,
    courtOrderNumber?: string,
  ): Promise<void> {
    const updateData: any = {
      hasPropertyManagementPowers: true,
      updatedAt: new Date(),
    };

    if (courtOrderNumber) {
      updateData.courtOrderNumber = courtOrderNumber;
    }

    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: updateData,
    });
  }

  async revokePropertyManagementPowers(guardianId: string): Promise<void> {
    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: {
        hasPropertyManagementPowers: false,
        updatedAt: new Date(),
      },
    });
  }

  async updateGuardianPowers(
    guardianId: string,
    powers: {
      canConsentToMedical?: boolean;
      canConsentToMarriage?: boolean;
      restrictions?: any;
      specialInstructions?: string;
    },
  ): Promise<void> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (powers.canConsentToMedical !== undefined) {
      updateData.canConsentToMedical = powers.canConsentToMedical;
    }
    if (powers.canConsentToMarriage !== undefined) {
      updateData.canConsentToMarriage = powers.canConsentToMarriage;
    }
    if (powers.restrictions !== undefined) {
      updateData.restrictions = powers.restrictions;
    }
    if (powers.specialInstructions !== undefined) {
      updateData.specialInstructions = powers.specialInstructions;
    }

    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: updateData,
    });
  }

  // --- Allowance Management ---
  async updateAnnualAllowance(
    guardianId: string,
    amount: number,
    approvedBy: string,
  ): Promise<void> {
    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: {
        annualAllowanceKES: amount,
        allowanceApprovedBy: approvedBy,
        updatedAt: new Date(),
      },
    });
  }

  async approveAllowance(guardianId: string, approvedBy: string): Promise<void> {
    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: {
        allowanceApprovedBy: approvedBy,
        updatedAt: new Date(),
      },
    });
  }

  // --- Termination & Extension Operations ---
  async terminateGuardianship(
    guardianId: string,
    reason: string,
    terminationDate: Date,
  ): Promise<void> {
    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: {
        isActive: false,
        terminationDate,
        terminationReason: reason,
        nextReportDue: null,
        reportStatus: 'APPROVED',
        updatedAt: new Date(),
      },
    });
  }

  async extendGuardianshipTerm(
    guardianId: string,
    newValidUntil: Date,
    courtOrderNumber?: string,
  ): Promise<void> {
    const updateData: any = {
      validUntil: newValidUntil,
      updatedAt: new Date(),
    };

    if (courtOrderNumber) {
      updateData.courtOrderNumber = courtOrderNumber;
    }

    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: updateData,
    });
  }

  // --- Complex Queries for Legal Proceedings ---
  async findGuardianshipsInLegalProceedings(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        OR: [
          { courtCaseNumber: { not: null } },
          { interimOrderId: { not: null } },
          { restrictions: { not: Prisma.JsonNull } },
        ],
        isActive: true,
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findGuardianshipsWithRestrictions(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        restrictions: { not: Prisma.JsonNull },
        isActive: true,
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findGuardianshipsWithSpecialInstructions(): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        specialInstructions: { not: null },
        isActive: true,
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  async findGuardianshipsByCourtStation(courtStation: string): Promise<Guardian[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        courtStation,
        isActive: true,
      },
    });
    return guardians
      .map((g) => this.guardianMapper.toDomain(g))
      .filter((g): g is Guardian => g !== null);
  }

  // --- Existing methods with transaction support ---
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
}
