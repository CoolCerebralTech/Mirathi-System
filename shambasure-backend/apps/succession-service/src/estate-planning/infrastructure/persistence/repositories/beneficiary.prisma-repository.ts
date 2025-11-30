import { Injectable } from '@nestjs/common';
import { BequestType, DistributionStatus } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { BeneficiaryAssignment } from '../../../domain/entities/beneficiary.entity';
import { BeneficiaryRepositoryInterface } from '../../../domain/interfaces/beneficiary.repository.interface';
import { BeneficiaryMapper } from '../mappers/beneficiary.mapper';

@Injectable()
export class BeneficiaryPrismaRepository implements BeneficiaryRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  async save(assignment: BeneficiaryAssignment): Promise<void> {
    const persistenceData = BeneficiaryMapper.toPersistence(assignment);

    await this.prisma.beneficiaryAssignment.upsert({
      where: { id: assignment.id },
      create: persistenceData,
      update: BeneficiaryMapper.toUpdatePersistence(assignment),
    });
  }

  async findById(id: string): Promise<BeneficiaryAssignment | null> {
    const record = await this.prisma.beneficiaryAssignment.findUnique({
      where: { id },
    });

    return record ? BeneficiaryMapper.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.beneficiaryAssignment.delete({
      where: { id },
    });
  }

  // ---------------------------------------------------------
  // STANDARD LOOKUP OPERATIONS
  // ---------------------------------------------------------

  async findByWillId(willId: string): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: { willId },
      orderBy: { priority: 'asc' },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }

  async findByAssetId(assetId: string): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: { assetId },
      orderBy: { priority: 'asc' },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }

  async findByBeneficiaryUserId(userId: string): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        userId,
        // Only include active assignments (not deleted/removed)
        asset: { deletedAt: null },
        will: { deletedAt: null, isActiveRecord: true },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }

  async findByBeneficiaryFamilyMemberId(familyMemberId: string): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        familyMemberId,
        // Only include active assignments
        asset: { deletedAt: null },
        will: { deletedAt: null, isActiveRecord: true },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }

  async findByExternalIdentity(willId: string, name: string): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        willId,
        beneficiaryType: 'EXTERNAL',
        externalName: {
          contains: name,
          mode: 'insensitive',
        },
      },
      orderBy: { priority: 'asc' },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // LEGAL COMPLIANCE QUERIES (Kenyan Law)
  // ---------------------------------------------------------

  async findDependantAssignments(willId: string): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        willId,
        isDependant: true,
      },
      orderBy: { priority: 'asc' },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }

  async findLifeInterestAssignments(willId: string): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        willId,
        hasLifeInterest: true,
        OR: [{ lifeInterestEndsAt: null }, { lifeInterestEndsAt: { gt: new Date() } }],
      },
      orderBy: { priority: 'asc' },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // STATUS & DISTRIBUTION LOGIC QUERIES
  // ---------------------------------------------------------

  async findConditionalBequests(willId: string): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        willId,
        conditionType: { not: 'NONE' },
      },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }

  async findDistributedBequests(willId: string): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        willId,
        distributionStatus: DistributionStatus.COMPLETED,
      },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }

  async findByDistributionStatus(
    willId: string,
    status: DistributionStatus,
  ): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        willId,
        distributionStatus: status,
      },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // ANALYTICAL SUMMARIES & VALIDATION
  // ---------------------------------------------------------

  async getAssetDistributionSummary(assetId: string): Promise<{
    totalAllocatedPercent: number;
    beneficiaryCount: number;
    hasResiduary: boolean;
  }> {
    const aggregation = await this.prisma.beneficiaryAssignment.aggregate({
      where: {
        assetId,
        // Only count active assignments
        asset: { deletedAt: null },
        will: { deletedAt: null, isActiveRecord: true },
      },
      _sum: { sharePercent: true },
      _count: { id: true },
    });

    const residuaryCount = await this.prisma.beneficiaryAssignment.count({
      where: {
        assetId,
        bequestType: BequestType.RESIDUARY,
        // Only count active assignments
        asset: { deletedAt: null },
        will: { deletedAt: null, isActiveRecord: true },
      },
    });

    return {
      totalAllocatedPercent: aggregation._sum.sharePercent || 0,
      beneficiaryCount: aggregation._count.id,
      hasResiduary: residuaryCount > 0,
    };
  }

  async getWillBeneficiarySummary(willId: string): Promise<{
    totalBeneficiaries: number;
    byBequestType: Record<BequestType, number>;
    totalConditional: number;
  }> {
    const totalBeneficiaries = await this.prisma.beneficiaryAssignment.count({
      where: { willId },
    });

    const byTypeGroups = await this.prisma.beneficiaryAssignment.groupBy({
      by: ['bequestType'],
      where: { willId },
      _count: { _all: true },
    });

    const byBequestType = byTypeGroups.reduce(
      (acc, curr) => {
        acc[curr.bequestType] = curr._count._all;
        return acc;
      },
      {} as Record<BequestType, number>,
    );

    // Ensure all bequest types are represented
    Object.values(BequestType).forEach((type) => {
      if (!byBequestType[type]) byBequestType[type] = 0;
    });

    const totalConditional = await this.prisma.beneficiaryAssignment.count({
      where: {
        willId,
        conditionType: { not: 'NONE' },
      },
    });

    return {
      totalBeneficiaries,
      byBequestType,
      totalConditional,
    };
  }

  async getTotalPercentageAllocation(assetId: string): Promise<number> {
    const result = await this.prisma.beneficiaryAssignment.aggregate({
      where: {
        assetId,
        // Only count active assignments
        asset: { deletedAt: null },
        will: { deletedAt: null, isActiveRecord: true },
      },
      _sum: { sharePercent: true },
    });

    return result._sum.sharePercent || 0;
  }

  // ---------------------------------------------------------
  // ADDITIONAL BUSINESS LOGIC QUERIES
  // ---------------------------------------------------------

  async findActiveLifeInterestAssignments(): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        hasLifeInterest: true,
        OR: [{ lifeInterestEndsAt: null }, { lifeInterestEndsAt: { gt: new Date() } }],
        // Only active wills and assets
        asset: { deletedAt: null },
        will: { deletedAt: null, isActiveRecord: true },
      },
      include: {
        asset: true,
        will: true,
      },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }

  async findPendingConditionalBequests(): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        conditionType: { not: 'NONE' },
        conditionMet: false,
        OR: [{ conditionDeadline: null }, { conditionDeadline: { gt: new Date() } }],
        // Only active assignments
        asset: { deletedAt: null },
        will: { deletedAt: null, isActiveRecord: true },
      },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }

  async findAssignmentsRequiringCourtApproval(): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        courtApprovalRequired: true,
        courtApprovalObtained: false,
        // Only active assignments
        asset: { deletedAt: null },
        will: { deletedAt: null, isActiveRecord: true },
      },
      include: {
        will: {
          select: {
            probateCaseNumber: true,
            courtRegistry: true,
          },
        },
      },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }
}
