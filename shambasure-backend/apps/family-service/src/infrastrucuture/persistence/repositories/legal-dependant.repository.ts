import { Injectable, Logger } from '@nestjs/common';
import {
  DependencyLevel,
  KenyanLawSection,
  Prisma,
  PrismaClient,
  LegalDependant as PrismaLegalDependant,
} from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { LegalDependant } from '../../../domain/entities/legal-dependant.entity';
import { ILegalDependantRepository } from '../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { LegalDependantMapper } from '../mappers/legal-dependant.mapper';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class LegalDependantRepository implements ILegalDependantRepository {
  private readonly logger = new Logger(LegalDependantRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dependantMapper: LegalDependantMapper,
  ) {}

  // ============ CORE CRUD OPERATIONS ============
  async create(dependant: LegalDependant): Promise<LegalDependant> {
    try {
      const persistenceData = this.dependantMapper.toPersistence(dependant);
      const savedDependant = await this.prisma.legalDependant.create({
        data: persistenceData,
      });
      return this.dependantMapper.toDomain(savedDependant)!;
    } catch (error) {
      this.logger.error(`Failed to create legal dependant ${dependant.id}:`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<LegalDependant | null> {
    const dependant = await this.prisma.legalDependant.findUnique({
      where: { id },
    });
    return this.dependantMapper.toDomain(dependant);
  }

  async update(dependant: LegalDependant): Promise<LegalDependant> {
    try {
      const persistenceData = this.dependantMapper.toPersistence(dependant);
      const { id, ...updateData } = persistenceData;

      const savedDependant = await this.prisma.legalDependant.update({
        where: { id },
        data: updateData,
      });
      return this.dependantMapper.toDomain(savedDependant)!;
    } catch (error) {
      this.logger.error(`Failed to update legal dependant ${dependant.id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.legalDependant.delete({
        where: { id },
      });
      this.logger.log(`Legal dependant ${id} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete legal dependant ${id}:`, error);
      throw error;
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await this.prisma.legalDependant.update({
        where: { id },
        data: {
          isClaimant: false,
          provisionOrderIssued: false,
          courtApprovedAmount: 0,
        },
      });
      this.logger.log(`Legal dependant ${id} soft deleted`);
    } catch (error) {
      this.logger.error(`Failed to soft delete legal dependant ${id}:`, error);
      throw error;
    }
  }

  // ============ DECEASED-DEPENDANT RELATIONSHIP QUERIES ============
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
      orderBy: { createdAt: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findAllByDependantId(dependantId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: { dependantId },
      orderBy: { createdAt: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async existsByDeceasedAndDependant(deceasedId: string, dependantId: string): Promise<boolean> {
    const count = await this.prisma.legalDependant.count({
      where: { deceasedId, dependantId },
    });
    return count > 0;
  }

  // ============ S.29 LSA COMPLIANCE QUERIES ============
  async findS29DependantsByDeceasedId(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        OR: [
          { basisSection: KenyanLawSection.S29_DEPENDANTS },
          { basisSection: null }, // Assume S.29 if no section specified
        ],
      },
      orderBy: { dependencyPercentage: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findPriorityDependantsByDeceasedId(deceasedId: string): Promise<LegalDependant[]> {
    const priorityBases = ['SPOUSE', 'CHILD', 'ADOPTED_CHILD'];
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        dependencyBasis: { in: priorityBases },
      },
      orderBy: { createdAt: 'asc' },
    });
    return this.toDomainArray(dependants);
  }

  async findNonPriorityDependantsByDeceasedId(deceasedId: string): Promise<LegalDependant[]> {
    const nonPriorityBases = ['PARENT', 'SIBLING', 'COHABITOR', 'EX_SPOUSE', 'OTHER'];
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        dependencyBasis: { in: nonPriorityBases },
      },
      orderBy: { dependencyPercentage: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findDependantsWithCourtOrders(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        provisionOrderIssued: true,
      },
      orderBy: { courtOrderDate: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findDependantsWithoutCourtOrders(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        provisionOrderIssued: false,
      },
      orderBy: { dependencyPercentage: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  // ============ S.26 COURT PROVISION QUERIES ============
  async findS26ClaimantsByDeceasedId(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        basisSection: KenyanLawSection.S26_DEPENDANT_PROVISION,
      },
      orderBy: { claimAmount: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findPendingS26Claims(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        isClaimant: true,
        provisionOrderIssued: false,
      },
      orderBy: { claimAmount: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findApprovedS26Claims(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        isClaimant: true,
        provisionOrderIssued: true,
        courtApprovedAmount: { gt: 0 },
      },
      orderBy: { courtApprovedAmount: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findRejectedS26Claims(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        isClaimant: true,
        provisionOrderIssued: true,
        courtApprovedAmount: 0,
      },
      orderBy: { courtOrderDate: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findS26ClaimsByAmount(deceasedId: string, minAmount: number): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        isClaimant: true,
        OR: [{ claimAmount: { gte: minAmount } }, { courtApprovedAmount: { gte: minAmount } }],
      },
      orderBy: { claimAmount: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  // ============ DEPENDENCY LEVEL & TYPE QUERIES ============
  async findByDependencyLevel(
    deceasedId: string,
    dependencyLevel: DependencyLevel,
  ): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        dependencyLevel,
      },
      orderBy: { dependencyPercentage: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findByDependencyBasis(
    deceasedId: string,
    dependencyBasis: string,
  ): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        dependencyBasis,
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findFullDependants(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        dependencyLevel: DependencyLevel.FULL,
      },
      orderBy: { dependencyPercentage: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findPartialDependants(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        dependencyLevel: DependencyLevel.PARTIAL,
      },
      orderBy: { dependencyPercentage: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  // ============ SPECIAL CIRCUMSTANCE QUERIES ============
  async findMinorsByDeceasedId(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        isMinor: true,
      },
      orderBy: { ageLimit: 'asc' },
    });
    return this.toDomainArray(dependants);
  }

  async findStudentsByDeceasedId(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        isStudent: true,
      },
      orderBy: { studentUntil: 'asc' },
    });
    return this.toDomainArray(dependants);
  }

  async findDisabledDependants(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        OR: [{ hasPhysicalDisability: true }, { hasMentalDisability: true }],
      },
      orderBy: { requiresOngoingCare: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findDependantsRequiringCare(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        requiresOngoingCare: true,
      },
      orderBy: { dependencyPercentage: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findWithPhysicalDisabilities(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        hasPhysicalDisability: true,
      },
      orderBy: { requiresOngoingCare: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findWithMentalDisabilities(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        hasMentalDisability: true,
      },
      orderBy: { requiresOngoingCare: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  // ============ FINANCIAL DEPENDENCY QUERIES ============
  async findByDependencyPercentage(
    deceasedId: string,
    minPercentage: number,
  ): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        dependencyPercentage: { gte: minPercentage },
      },
      orderBy: { dependencyPercentage: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findWithFinancialEvidence(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        monthlySupport: { not: null },
        monthlySupportEvidence: { not: null },
      },
      orderBy: { monthlySupportEvidence: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findWithoutFinancialEvidence(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        OR: [{ monthlySupport: null }, { monthlySupportEvidence: null }],
      },
      orderBy: { dependencyPercentage: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findWithMonthlySupport(deceasedId: string, minAmount: number): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        monthlySupport: { gte: minAmount },
      },
      orderBy: { monthlySupport: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  // ============ LEGAL SECTION & COURT REFERENCE QUERIES ============
  async findByLegalSection(
    deceasedId: string,
    section: KenyanLawSection,
  ): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        basisSection: section,
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findByCourtOrderReference(courtOrderReference: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: { courtOrderReference },
      orderBy: { courtOrderDate: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findByProvisionOrderNumber(provisionOrderNumber: string): Promise<LegalDependant | null> {
    const dependant = await this.prisma.legalDependant.findFirst({
      where: { provisionOrderNumber },
    });
    return this.dependantMapper.toDomain(dependant);
  }

  // ============ EVIDENCE & VERIFICATION QUERIES ============
  async findWithEvidenceDocuments(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        dependencyProofDocuments: {
          not: Prisma.AnyNull, // Use Prisma.AnyNull for checking both DbNull and JsonNull
        },
      },
      orderBy: { verifiedByCourtAt: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findVerifiedByCourt(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        verifiedByCourtAt: { not: null },
      },
      orderBy: { verifiedByCourtAt: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findUnverifiedByCourt(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        verifiedByCourtAt: null,
      },
      orderBy: { dependencyPercentage: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findWithInsufficientEvidence(deceasedId: string): Promise<LegalDependant[]> {
    const where: any = {
      deceasedId,
      OR: [
        { dependencyProofDocuments: null as any }, // Cast to any to bypass TypeScript
        { monthlySupportEvidence: null },
        { verifiedByCourtAt: null },
      ],
    };

    const dependants = await this.prisma.legalDependant.findMany({
      where,
      orderBy: { dependencyPercentage: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  // ============ CUSTODIAL PARENT QUERIES ============
  async findByCustodialParent(custodialParentId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: { custodialParentId },
      orderBy: { createdAt: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findWithoutCustodialParent(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        custodialParentId: null,
        isMinor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  // ============ BULK OPERATIONS ============
  async batchSave(dependants: LegalDependant[]): Promise<LegalDependant[]> {
    if (dependants.length === 0) {
      return [];
    }

    const savedDependants: LegalDependant[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const dependant of dependants) {
        const persistenceData = this.dependantMapper.toPersistence(dependant);
        const { id, ...updateData } = persistenceData;

        const saved = await tx.legalDependant.upsert({
          where: { id },
          create: persistenceData,
          update: updateData,
        });

        savedDependants.push(this.dependantMapper.toDomain(saved)!);
      }
    });

    return savedDependants;
  }

  async batchUpdateDependencyLevel(
    deceasedId: string,
    dependantIds: string[],
    dependencyLevel: DependencyLevel,
  ): Promise<void> {
    await this.prisma.legalDependant.updateMany({
      where: {
        deceasedId,
        id: { in: dependantIds },
      },
      data: {
        dependencyLevel,
        updatedAt: new Date(),
      },
    });
  }

  async batchUpdateCourtOrders(
    updates: Array<{
      dependantId: string;
      courtOrderNumber: string;
      approvedAmount: number;
      orderDate: Date;
    }>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const update of updates) {
        await tx.legalDependant.update({
          where: { id: update.dependantId },
          data: {
            provisionOrderIssued: true,
            provisionOrderNumber: update.courtOrderNumber,
            courtOrderReference: update.courtOrderNumber,
            courtOrderDate: update.orderDate,
            courtApprovedAmount: update.approvedAmount,
            provisionAmount: update.approvedAmount,
            verifiedByCourtAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    });
  }

  async deleteAllByDeceasedId(deceasedId: string): Promise<void> {
    await this.prisma.legalDependant.deleteMany({
      where: { deceasedId },
    });
    this.logger.log(`All legal dependants for deceased ${deceasedId} deleted`);
  }

  // ============ VALIDATION & EXISTENCE CHECKS ============
  async hasActiveS26Claim(deceasedId: string, dependantId: string): Promise<boolean> {
    const count = await this.prisma.legalDependant.count({
      where: {
        deceasedId,
        dependantId,
        isClaimant: true,
        provisionOrderIssued: false,
      },
    });
    return count > 0;
  }

  async hasCourtOrder(deceasedId: string, dependantId: string): Promise<boolean> {
    const count = await this.prisma.legalDependant.count({
      where: {
        deceasedId,
        dependantId,
        provisionOrderIssued: true,
      },
    });
    return count > 0;
  }

  async isAlreadyDependant(deceasedId: string, dependantId: string): Promise<boolean> {
    const count = await this.prisma.legalDependant.count({
      where: { deceasedId, dependantId },
    });
    return count > 0;
  }

  // ============ STATISTICS & REPORTING ============
  async getDependencyStatistics(deceasedId: string): Promise<{
    totalDependants: number;
    totalPriorityDependants: number;
    totalNonPriorityDependants: number;
    totalS26Claimants: number;
    totalWithCourtOrders: number;
    totalMinors: number;
    totalStudents: number;
    totalDisabled: number;
    totalFullDependants: number;
    totalPartialDependants: number;
    totalVerifiedByCourt: number;
    totalFinancialEvidence: number;
    averageDependencyPercentage: number;
    totalS26ClaimAmount: number;
    totalCourtApprovedAmount: number;
  }> {
    const [
      totalDependants,
      priorityDependants,
      nonPriorityDependants,
      s26Claimants,
      withCourtOrders,
      minors,
      students,
      disabled,
      fullDependants,
      partialDependants,
      verifiedByCourt,
      financialEvidence,
      dependencyStats,
      s26ClaimAmounts,
      courtApprovedAmounts,
    ] = await Promise.all([
      this.prisma.legalDependant.count({ where: { deceasedId } }),
      this.prisma.legalDependant.count({
        where: {
          deceasedId,
          dependencyBasis: { in: ['SPOUSE', 'CHILD', 'ADOPTED_CHILD'] },
        },
      }),
      this.prisma.legalDependant.count({
        where: {
          deceasedId,
          dependencyBasis: { not: { in: ['SPOUSE', 'CHILD', 'ADOPTED_CHILD'] } },
        },
      }),
      this.prisma.legalDependant.count({
        where: { deceasedId, isClaimant: true },
      }),
      this.prisma.legalDependant.count({
        where: { deceasedId, provisionOrderIssued: true },
      }),
      this.prisma.legalDependant.count({
        where: { deceasedId, isMinor: true },
      }),
      this.prisma.legalDependant.count({
        where: { deceasedId, isStudent: true },
      }),
      this.prisma.legalDependant.count({
        where: {
          deceasedId,
          OR: [{ hasPhysicalDisability: true }, { hasMentalDisability: true }],
        },
      }),
      this.prisma.legalDependant.count({
        where: { deceasedId, dependencyLevel: DependencyLevel.FULL },
      }),
      this.prisma.legalDependant.count({
        where: { deceasedId, dependencyLevel: DependencyLevel.PARTIAL },
      }),
      this.prisma.legalDependant.count({
        where: { deceasedId, verifiedByCourtAt: { not: null } },
      }),
      this.prisma.legalDependant.count({
        where: {
          deceasedId,
          monthlySupport: { not: null },
          monthlySupportEvidence: { not: null },
        },
      }),
      this.prisma.legalDependant.aggregate({
        where: { deceasedId },
        _avg: { dependencyPercentage: true },
      }),
      this.prisma.legalDependant.aggregate({
        where: { deceasedId, isClaimant: true },
        _sum: { claimAmount: true },
      }),
      this.prisma.legalDependant.aggregate({
        where: { deceasedId, provisionOrderIssued: true },
        _sum: { courtApprovedAmount: true },
      }),
    ]);

    return {
      totalDependants,
      totalPriorityDependants: priorityDependants,
      totalNonPriorityDependants: nonPriorityDependants,
      totalS26Claimants: s26Claimants,
      totalWithCourtOrders: withCourtOrders,
      totalMinors: minors,
      totalStudents: students,
      totalDisabled: disabled,
      totalFullDependants: fullDependants,
      totalPartialDependants: partialDependants,
      totalVerifiedByCourt: verifiedByCourt,
      totalFinancialEvidence: financialEvidence,
      averageDependencyPercentage: dependencyStats._avg.dependencyPercentage || 0,
      totalS26ClaimAmount: s26ClaimAmounts._sum.claimAmount || 0,
      totalCourtApprovedAmount: courtApprovedAmounts._sum.courtApprovedAmount || 0,
    };
  }

  // ============ SUMMATION QUERIES ============
  async sumMonthlySupport(deceasedId: string): Promise<number> {
    const result = await this.prisma.legalDependant.aggregate({
      where: { deceasedId },
      _sum: { monthlySupport: true },
    });
    return result._sum.monthlySupport || 0;
  }

  async sumClaimAmounts(deceasedId: string): Promise<number> {
    const result = await this.prisma.legalDependant.aggregate({
      where: { deceasedId, isClaimant: true },
      _sum: { claimAmount: true },
    });
    return result._sum.claimAmount || 0;
  }

  async sumCourtApprovedAmounts(deceasedId: string): Promise<number> {
    const result = await this.prisma.legalDependant.aggregate({
      where: { deceasedId, provisionOrderIssued: true },
      _sum: { courtApprovedAmount: true },
    });
    return result._sum.courtApprovedAmount || 0;
  }

  async calculateTotalDependencyPercentage(deceasedId: string): Promise<number> {
    const result = await this.prisma.legalDependant.aggregate({
      where: { deceasedId },
      _sum: { dependencyPercentage: true },
    });
    return result._sum.dependencyPercentage || 0;
  }

  // ============ AGE & DURATION QUERIES ============
  async findDependantsExceedingAgeLimit(
    deceasedId: string,
    currentDate: Date,
  ): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        ageLimit: { lte: this.calculateAgeFromDate(currentDate) },
      },
    });
    return this.toDomainArray(dependants);
  }

  async findStudentsExceedingLimit(
    deceasedId: string,
    currentDate: Date,
  ): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        isStudent: true,
        studentUntil: { lt: currentDate },
      },
    });
    return this.toDomainArray(dependants);
  }

  async findSupportEndedDependants(
    deceasedId: string,
    currentDate: Date,
  ): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        supportEndDate: { lt: currentDate },
      },
    });
    return this.toDomainArray(dependants);
  }

  // ============ LEGAL COMPLIANCE QUERIES ============
  async findNonCompliantDependants(deceasedId: string): Promise<LegalDependant[]> {
    // Create a more type-safe approach using Prisma's JsonNullableFilter
    const where: Prisma.LegalDependantWhereInput = {
      deceasedId,
      OR: [
        {
          dependencyProofDocuments: {
            equals: Prisma.DbNull, // Use DbNull instead of JsonNull
          },
        },
        { monthlySupportEvidence: null },
        { dependencyPercentage: 0 },
        { isClaimant: true, provisionOrderIssued: false },
      ],
    };

    const dependants = await this.prisma.legalDependant.findMany({
      where,
    });
    return this.toDomainArray(dependants);
  }

  async findWithMissingEvidence(deceasedId: string): Promise<LegalDependant[]> {
    const where: Prisma.LegalDependantWhereInput = {
      deceasedId,
      OR: [
        {
          dependencyProofDocuments: {
            equals: Prisma.DbNull, // Use DbNull instead of JsonNull
          },
        },
        { monthlySupportEvidence: null },
      ],
    };

    const dependants = await this.prisma.legalDependant.findMany({
      where,
    });
    return this.toDomainArray(dependants);
  }

  async findWithExpiredStudentStatus(
    deceasedId: string,
    currentDate: Date,
  ): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        isStudent: true,
        studentUntil: { lt: currentDate },
      },
    });
    return this.toDomainArray(dependants);
  }

  // ============ ESTATE DISTRIBUTION QUERIES ============
  async findEligibleForDistribution(deceasedId: string): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        OR: [
          { dependencyLevel: DependencyLevel.FULL },
          { dependencyLevel: DependencyLevel.PARTIAL, dependencyPercentage: { gte: 25 } },
          { provisionOrderIssued: true },
        ],
      },
      orderBy: { dependencyPercentage: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  async findDependantsWithLifeInterests(deceasedId: string): Promise<LegalDependant[]> {
    // This would need integration with Asset or Estate models
    // For now, return dependants with court orders as they may have life interests
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        provisionOrderIssued: true,
      },
    });
    return this.toDomainArray(dependants);
  }

  async findDependantsWithConditions(deceasedId: string): Promise<LegalDependant[]> {
    // Dependants with age limits or student status have conditions
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        OR: [{ ageLimit: { not: null } }, { isStudent: true }, { studentUntil: { not: null } }],
      },
    });
    return this.toDomainArray(dependants);
  }

  // ============ SEARCH & FILTER QUERIES ============
  async searchByCriteria(
    deceasedId: string,
    criteria: {
      dependencyBasis?: string[];
      dependencyLevel?: DependencyLevel[];
      hasCourtOrder?: boolean;
      isMinor?: boolean;
      isStudent?: boolean;
      hasDisability?: boolean;
      minDependencyPercentage?: number;
      maxDependencyPercentage?: number;
      hasEvidence?: boolean;
    },
  ): Promise<LegalDependant[]> {
    const where: any = { deceasedId };

    if (criteria.dependencyBasis?.length) {
      where.dependencyBasis = { in: criteria.dependencyBasis };
    }

    if (criteria.dependencyLevel?.length) {
      where.dependencyLevel = { in: criteria.dependencyLevel };
    }

    if (criteria.hasCourtOrder !== undefined) {
      where.provisionOrderIssued = criteria.hasCourtOrder;
    }

    if (criteria.isMinor !== undefined) {
      where.isMinor = criteria.isMinor;
    }

    if (criteria.isStudent !== undefined) {
      where.isStudent = criteria.isStudent;
    }

    if (criteria.hasDisability !== undefined) {
      where.OR = [
        { hasPhysicalDisability: criteria.hasDisability },
        { hasMentalDisability: criteria.hasDisability },
      ];
    }

    if (criteria.minDependencyPercentage !== undefined) {
      where.dependencyPercentage = { gte: criteria.minDependencyPercentage };
    }

    if (criteria.maxDependencyPercentage !== undefined) {
      where.dependencyPercentage = where.dependencyPercentage || {};
      where.dependencyPercentage.lte = criteria.maxDependencyPercentage;
    }

    if (criteria.hasEvidence !== undefined) {
      if (criteria.hasEvidence) {
        where.AND = [
          { NOT: { dependencyProofDocuments: Prisma.JsonNull } },
          { monthlySupportEvidence: { not: null } },
        ];
      } else {
        where.OR = [
          { dependencyProofDocuments: Prisma.JsonNull },
          { monthlySupportEvidence: null },
        ];
      }
    }

    const dependants = await this.prisma.legalDependant.findMany({
      where,
      orderBy: { dependencyPercentage: 'desc' },
    });
    return this.toDomainArray(dependants);
  }

  // ============ TIMELINE QUERIES ============
  async findCreatedAfter(deceasedId: string, date: Date): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        createdAt: { gt: date },
      },
    });
    return this.toDomainArray(dependants);
  }

  async findUpdatedAfter(deceasedId: string, date: Date): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        updatedAt: { gt: date },
      },
    });
    return this.toDomainArray(dependants);
  }

  async findCourtOrdersIssuedAfter(deceasedId: string, date: Date): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        courtOrderDate: { gt: date },
      },
    });
    return this.toDomainArray(dependants);
  }

  // ============ AUDIT & HISTORY QUERIES ============
  async findDependantsByAssessmentDate(
    deceasedId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        assessmentDate: { gte: fromDate, lte: toDate },
      },
    });
    return this.toDomainArray(dependants);
  }

  async findDependantsByVerificationDate(
    deceasedId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<LegalDependant[]> {
    const dependants = await this.prisma.legalDependant.findMany({
      where: {
        deceasedId,
        verifiedByCourtAt: { gte: fromDate, lte: toDate },
      },
    });
    return this.toDomainArray(dependants);
  }

  // ============ HELPER METHODS ============
  private toDomainArray(prismaDependants: PrismaLegalDependant[]): LegalDependant[] {
    return prismaDependants
      .map((d) => this.dependantMapper.toDomain(d))
      .filter((d): d is LegalDependant => d !== null);
  }

  private calculateAgeFromDate(date: Date): number {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age;
  }

  async withTransaction<T>(transactionFn: (client: TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return transactionFn(tx as TransactionClient);
    });
  }
}
