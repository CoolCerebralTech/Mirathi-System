import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { BequestType, DistributionStatus } from '@prisma/client';
import { BeneficiaryAssignment } from '../../../domain/entities/beneficiary.entity';
import { BeneficiaryRepositoryInterface } from '../../../domain/interfaces/beneficiary.repository.interface';
import { BeneficiaryMapper } from '../mappers/beneficiary.mapper';

@Injectable()
export class BeneficiaryPrismaRepository implements BeneficiaryRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

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
      where: { beneficiaryId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }

  async findByBeneficiaryFamilyMemberId(familyMemberId: string): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: { familyMemberId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => BeneficiaryMapper.toDomain(record));
  }

  async findConditionalBequests(willId: string): Promise<BeneficiaryAssignment[]> {
    const records = await this.prisma.beneficiaryAssignment.findMany({
      where: {
        willId,
        hasCondition: true,
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

  async getAssetDistributionSummary(assetId: string): Promise<{
    totalAllocatedPercent: number;
    beneficiaryCount: number;
    hasResiduary: boolean;
  }> {
    const aggregation = await this.prisma.beneficiaryAssignment.aggregate({
      where: { assetId },
      _sum: { sharePercent: true },
      _count: { id: true },
    });

    const residuaryCount = await this.prisma.beneficiaryAssignment.count({
      where: {
        assetId,
        bequestType: BequestType.RESIDUARY,
      },
    });

    return {
      totalAllocatedPercent: aggregation._sum.sharePercent?.toNumber() || 0,
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

    Object.values(BequestType).forEach((type) => {
      if (!byBequestType[type]) byBequestType[type] = 0;
    });

    const totalConditional = await this.prisma.beneficiaryAssignment.count({
      where: {
        willId,
        hasCondition: true,
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
      where: { assetId },
      _sum: { sharePercent: true },
    });

    return result._sum.sharePercent?.toNumber() || 0;
  }
}
