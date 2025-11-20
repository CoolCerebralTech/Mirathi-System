import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { BequestType, DistributionStatus } from '@prisma/client';
import { BeneficiaryRepositoryInterface } from '../../../domain/interfaces/beneficiary.repository.interface';
import { BeneficiaryAssignment } from '../../../domain/entities/beneficiary.entity';
import { BeneficiaryMapper } from '../mappers/beneficiary.mapper';

@Injectable()
export class BeneficiaryPrismaRepository implements BeneficiaryRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // BASIC PERSISTENCE
  // --------------------------------------------------------------------------

  async save(assignment: BeneficiaryAssignment): Promise<void> {
    const persistenceModel = BeneficiaryMapper.toPersistence(assignment);

    await this.prisma.beneficiaryAssignment.upsert({
      where: { id: persistenceModel.id },
      create: persistenceModel,
      update: persistenceModel,
    });
  }

  async findById(id: string): Promise<BeneficiaryAssignment | null> {
    const raw = await this.prisma.beneficiaryAssignment.findUnique({
      where: { id },
    });
    return raw ? BeneficiaryMapper.toDomain(raw) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.beneficiaryAssignment.delete({
      where: { id },
    });
  }

  // --------------------------------------------------------------------------
  // STANDARD LOOKUPS
  // --------------------------------------------------------------------------

  async findByWillId(willId: string): Promise<BeneficiaryAssignment[]> {
    const raw = await this.prisma.beneficiaryAssignment.findMany({
      where: { willId },
      orderBy: { priority: 'asc' }, // Load primary beneficiaries first
    });
    return raw.map(BeneficiaryMapper.toDomain);
  }

  async findByAssetId(assetId: string): Promise<BeneficiaryAssignment[]> {
    const raw = await this.prisma.beneficiaryAssignment.findMany({
      where: { assetId },
    });
    return raw.map(BeneficiaryMapper.toDomain);
  }

  async findByBeneficiaryUserId(userId: string): Promise<BeneficiaryAssignment[]> {
    const raw = await this.prisma.beneficiaryAssignment.findMany({
      where: { beneficiaryId: userId },
    });
    return raw.map(BeneficiaryMapper.toDomain);
  }

  async findByBeneficiaryFamilyMemberId(familyMemberId: string): Promise<BeneficiaryAssignment[]> {
    const raw = await this.prisma.beneficiaryAssignment.findMany({
      where: { familyMemberId },
    });
    return raw.map(BeneficiaryMapper.toDomain);
  }

  // --------------------------------------------------------------------------
  // STATUS & LOGIC QUERIES
  // --------------------------------------------------------------------------

  async findConditionalBequests(willId: string): Promise<BeneficiaryAssignment[]> {
    const raw = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        willId,
        hasCondition: true,
      },
    });
    return raw.map(BeneficiaryMapper.toDomain);
  }

  async findDistributedBequests(willId: string): Promise<BeneficiaryAssignment[]> {
    const raw = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        willId,
        distributionStatus: DistributionStatus.COMPLETED,
      },
    });
    return raw.map(BeneficiaryMapper.toDomain);
  }

  async findPendingDistributions(willId: string): Promise<BeneficiaryAssignment[]> {
    const raw = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        willId,
        distributionStatus: DistributionStatus.PENDING,
      },
    });
    return raw.map(BeneficiaryMapper.toDomain);
  }

  async findByDistributionStatus(
    willId: string,
    status: DistributionStatus,
  ): Promise<BeneficiaryAssignment[]> {
    const raw = await this.prisma.beneficiaryAssignment.findMany({
      where: { willId, distributionStatus: status },
    });
    return raw.map(BeneficiaryMapper.toDomain);
  }

  // --------------------------------------------------------------------------
  // ANALYTICAL SUMMARIES (Aggregation)
  // --------------------------------------------------------------------------

  async getAssetDistributionSummary(assetId: string): Promise<{
    totalAllocatedPercent: number;
    beneficiaryCount: number;
    hasResiduary: boolean;
    conditionalCount: number;
  }> {
    // 1. Aggregate Stats
    const stats = await this.prisma.beneficiaryAssignment.aggregate({
      where: { assetId },
      _sum: {
        sharePercent: true,
      },
      _count: {
        id: true,
      },
    });

    // 2. Check for specific types (Residuary / Conditional) efficiently
    // We use count instead of findMany to be faster
    const residuaryCount = await this.prisma.beneficiaryAssignment.count({
      where: { assetId, bequestType: BequestType.RESIDUARY },
    });

    const conditionalCount = await this.prisma.beneficiaryAssignment.count({
      where: { assetId, hasCondition: true },
    });

    return {
      totalAllocatedPercent: Number(stats._sum.sharePercent || 0),
      beneficiaryCount: stats._count.id,
      hasResiduary: residuaryCount > 0,
      conditionalCount,
    };
  }

  async getWillBeneficiarySummary(willId: string): Promise<{
    totalBeneficiaries: number;
    byBequestType: Record<BequestType, number>;
    byRelationship: Record<string, number>; // Note: Relationship is not directly on the table in current schema, skipping or needs join
    totalConditional: number;
  }> {
    // Group by Bequest Type
    const typeGroups = await this.prisma.beneficiaryAssignment.groupBy({
      by: ['bequestType'],
      where: { willId },
      _count: { id: true },
    });

    // Get Total Count
    const totalCount = await this.prisma.beneficiaryAssignment.count({
      where: { willId },
    });

    const conditionalCount = await this.prisma.beneficiaryAssignment.count({
      where: { willId, hasCondition: true },
    });

    // Map DB result to clean object
    const byBequestType = {} as Record<BequestType, number>;
    typeGroups.forEach((g) => {
      byBequestType[g.bequestType] = g._count.id;
    });

    return {
      totalBeneficiaries: totalCount,
      byBequestType,
      byRelationship: {}, // Placeholder until relationship column is denormalized or joined
      totalConditional: conditionalCount,
    };
  }

  // --------------------------------------------------------------------------
  // BULK OPERATIONS
  // --------------------------------------------------------------------------

  async bulkUpdateDistributionStatus(
    beneficiaryIds: string[],
    status: DistributionStatus,
    notes?: string,
  ): Promise<void> {
    await this.prisma.beneficiaryAssignment.updateMany({
      where: {
        id: { in: beneficiaryIds },
      },
      data: {
        distributionStatus: status,
        distributionNotes: notes,
        distributedAt: status === DistributionStatus.COMPLETED ? new Date() : null,
        updatedAt: new Date(),
      },
    });
  }

  // --------------------------------------------------------------------------
  // VALIDATION HELPERS
  // --------------------------------------------------------------------------

  async validateNoDuplicateAssignments(
    willId: string,
    assetId: string,
    beneficiaryId: string,
  ): Promise<boolean> {
    // We check if a record exists with this combo.
    // Note: 'beneficiaryId' in this context implies the USER ID column.
    // If checking family member, we'd need a separate check or logic.
    const count = await this.prisma.beneficiaryAssignment.count({
      where: {
        willId,
        assetId,
        beneficiaryId,
      },
    });
    return count === 0;
  }

  async getTotalPercentageAllocation(assetId: string): Promise<number> {
    const result = await this.prisma.beneficiaryAssignment.aggregate({
      where: {
        assetId,
        bequestType: BequestType.PERCENTAGE,
      },
      _sum: {
        sharePercent: true,
      },
    });

    return Number(result._sum.sharePercent || 0);
  }
}
