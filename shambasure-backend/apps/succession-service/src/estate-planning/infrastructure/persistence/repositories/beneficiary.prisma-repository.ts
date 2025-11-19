import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { BequestType, BequestConditionType, DistributionStatus } from '@prisma/client';
import { BeneficiaryRepositoryInterface } from '../../../domain/interfaces/beneficiary.repository.interface';
import { Beneficiary } from '../../../domain/entities/beneficiary.entity';
import { BeneficiaryMapper } from '../mappers/beneficiary.mapper';

@Injectable()
export class BeneficiaryPrismaRepository implements BeneficiaryRepositoryInterface {
  private readonly logger = new Logger(BeneficiaryPrismaRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Beneficiary | null> {
    try {
      const prismaBeneficiary = await this.prisma.beneficiaryAssignment.findUnique({
        where: { id },
      });

      return prismaBeneficiary ? BeneficiaryMapper.toDomain(prismaBeneficiary) : null;
    } catch (error) {
      this.logger.error(`Failed to find beneficiary by ID ${id}:`, error);
      throw new Error(`Could not retrieve beneficiary: ${error.message}`);
    }
  }

  async findByWillId(willId: string): Promise<Beneficiary[]> {
    try {
      const prismaBeneficiaries = await this.prisma.beneficiaryAssignment.findMany({
        where: { willId },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      });

      return BeneficiaryMapper.toDomainList(prismaBeneficiaries);
    } catch (error) {
      this.logger.error(`Failed to find beneficiaries for will ${willId}:`, error);
      throw new Error(`Could not retrieve beneficiaries: ${error.message}`);
    }
  }

  async findByAssetId(assetId: string): Promise<Beneficiary[]> {
    try {
      const prismaBeneficiaries = await this.prisma.beneficiaryAssignment.findMany({
        where: { assetId },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      });

      return BeneficiaryMapper.toDomainList(prismaBeneficiaries);
    } catch (error) {
      this.logger.error(`Failed to find beneficiaries for asset ${assetId}:`, error);
      throw new Error(`Could not retrieve beneficiaries: ${error.message}`);
    }
  }

  async save(beneficiary: Beneficiary): Promise<void> {
    try {
      const beneficiaryData = BeneficiaryMapper.toPersistence(beneficiary);

      await this.prisma.beneficiaryAssignment.upsert({
        where: { id: beneficiary.getId() },
        create: beneficiaryData,
        update: beneficiaryData,
      });

      this.logger.log(`Successfully saved beneficiary ${beneficiary.getId()}`);
    } catch (error) {
      this.logger.error(`Failed to save beneficiary ${beneficiary.getId()}:`, error);
      throw new Error(`Could not save beneficiary: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.beneficiaryAssignment.delete({
        where: { id },
      });
      this.logger.log(`Successfully deleted beneficiary ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete beneficiary ${id}:`, error);
      throw new Error(`Could not delete beneficiary: ${error.message}`);
    }
  }

  async findByBeneficiaryUserId(userId: string): Promise<Beneficiary[]> {
    try {
      const prismaBeneficiaries = await this.prisma.beneficiaryAssignment.findMany({
        where: { beneficiaryId: userId },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      });

      return BeneficiaryMapper.toDomainList(prismaBeneficiaries);
    } catch (error) {
      this.logger.error(`Failed to find beneficiaries for user ${userId}:`, error);
      throw new Error(`Could not retrieve beneficiaries: ${error.message}`);
    }
  }

  async findByBeneficiaryFamilyMemberId(familyMemberId: string): Promise<Beneficiary[]> {
    try {
      const prismaBeneficiaries = await this.prisma.beneficiaryAssignment.findMany({
        where: { familyMemberId },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      });

      return BeneficiaryMapper.toDomainList(prismaBeneficiaries);
    } catch (error) {
      this.logger.error(`Failed to find beneficiaries for family member ${familyMemberId}:`, error);
      throw new Error(`Could not retrieve beneficiaries: ${error.message}`);
    }
  }

  async findConditionalBequests(willId: string): Promise<Beneficiary[]> {
    try {
      const prismaBeneficiaries = await this.prisma.beneficiaryAssignment.findMany({
        where: {
          willId,
          conditionType: { not: BequestConditionType.NONE },
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      });

      return BeneficiaryMapper.toDomainList(prismaBeneficiaries);
    } catch (error) {
      this.logger.error(`Failed to find conditional bequests for will ${willId}:`, error);
      throw new Error(`Could not retrieve conditional bequests: ${error.message}`);
    }
  }

  async findDistributedBequests(willId: string): Promise<Beneficiary[]> {
    try {
      const prismaBeneficiaries = await this.prisma.beneficiaryAssignment.findMany({
        where: {
          willId,
          distributionStatus: DistributionStatus.COMPLETED,
        },
        orderBy: { distributedAt: 'desc' },
      });

      return BeneficiaryMapper.toDomainList(prismaBeneficiaries);
    } catch (error) {
      this.logger.error(`Failed to find distributed bequests for will ${willId}:`, error);
      throw new Error(`Could not retrieve distributed bequests: ${error.message}`);
    }
  }

  async findByDistributionStatus(
    willId: string,
    status: DistributionStatus,
  ): Promise<Beneficiary[]> {
    try {
      const prismaBeneficiaries = await this.prisma.beneficiaryAssignment.findMany({
        where: {
          willId,
          distributionStatus: status,
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      });

      return BeneficiaryMapper.toDomainList(prismaBeneficiaries);
    } catch (error) {
      this.logger.error(
        `Failed to find beneficiaries with status ${status} for will ${willId}:`,
        error,
      );
      throw new Error(`Could not retrieve beneficiaries: ${error.message}`);
    }
  }

  async findPendingDistributions(willId: string): Promise<Beneficiary[]> {
    try {
      const prismaBeneficiaries = await this.prisma.beneficiaryAssignment.findMany({
        where: {
          willId,
          distributionStatus: DistributionStatus.PENDING,
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      });

      return BeneficiaryMapper.toDomainList(prismaBeneficiaries);
    } catch (error) {
      this.logger.error(`Failed to find pending distributions for will ${willId}:`, error);
      throw new Error(`Could not retrieve pending distributions: ${error.message}`);
    }
  }

  async getAssetDistributionSummary(assetId: string): Promise<{
    totalAllocated: number;
    beneficiaryCount: number;
    conditionalCount: number;
  }> {
    try {
      const beneficiaries = await this.prisma.beneficiaryAssignment.findMany({
        where: { assetId },
      });

      const totalAllocated = beneficiaries.reduce((sum, beneficiary) => {
        if (beneficiary.bequestType === BequestType.PERCENTAGE && beneficiary.sharePercent) {
          return sum + beneficiary.sharePercent.toNumber();
        }
        return sum;
      }, 0);

      const beneficiaryCount = beneficiaries.length;
      const conditionalCount = beneficiaries.filter(
        (b) => b.conditionType !== BequestConditionType.NONE,
      ).length;

      return {
        totalAllocated,
        beneficiaryCount,
        conditionalCount,
      };
    } catch (error) {
      this.logger.error(`Failed to get distribution summary for asset ${assetId}:`, error);
      throw new Error(`Could not retrieve distribution summary: ${error.message}`);
    }
  }

  async getWillBeneficiarySummary(willId: string): Promise<{
    totalBeneficiaries: number;
    byBequestType: Record<BequestType, number>;
    byRelationship: Record<string, number>;
  }> {
    try {
      const beneficiaries = await this.prisma.beneficiaryAssignment.findMany({
        where: { willId },
      });

      const byBequestType: Record<BequestType, number> = {} as Record<BequestType, number>;
      const byRelationship: Record<string, number> = {};

      for (const beneficiary of beneficiaries) {
        // Count by bequest type
        const bequestType = beneficiary.bequestType;
        byBequestType[bequestType] = (byBequestType[bequestType] || 0) + 1;

        // Count by relationship
        const relationship = beneficiary.relationship || 'Unknown';
        byRelationship[relationship] = (byRelationship[relationship] || 0) + 1;
      }

      return {
        totalBeneficiaries: beneficiaries.length,
        byBequestType,
        byRelationship,
      };
    } catch (error) {
      this.logger.error(`Failed to get beneficiary summary for will ${willId}:`, error);
      throw new Error(`Could not retrieve beneficiary summary: ${error.message}`);
    }
  }

  async bulkUpdateDistributionStatus(
    beneficiaryIds: string[],
    status: DistributionStatus,
    notes?: string,
  ): Promise<void> {
    try {
      await this.prisma.beneficiaryAssignment.updateMany({
        where: {
          id: { in: beneficiaryIds },
        },
        data: {
          distributionStatus: status,
          distributionNotes: notes,
          ...(status === DistributionStatus.COMPLETED && {
            distributedAt: new Date(),
          }),
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `Successfully updated distribution status for ${beneficiaryIds.length} beneficiaries`,
      );
    } catch (error) {
      this.logger.error(`Failed to update distribution status for beneficiaries:`, error);
      throw new Error(`Could not update distribution status: ${error.message}`);
    }
  }

  async validateNoDuplicateAssignments(
    willId: string,
    assetId: string,
    beneficiaryId: string,
  ): Promise<boolean> {
    try {
      const existing = await this.prisma.beneficiaryAssignment.findFirst({
        where: {
          willId,
          assetId,
          OR: [{ beneficiaryId }, { familyMemberId: beneficiaryId }],
        },
      });

      return !existing;
    } catch (error) {
      this.logger.error(`Failed to validate duplicate assignments:`, error);
      throw new Error(`Could not validate assignments: ${error.message}`);
    }
  }

  async getTotalPercentageAllocation(assetId: string): Promise<number> {
    try {
      const result = await this.prisma.beneficiaryAssignment.aggregate({
        where: {
          assetId,
          bequestType: BequestType.PERCENTAGE,
        },
        _sum: {
          sharePercent: true,
        },
      });

      return result._sum.sharePercent?.toNumber() || 0;
    } catch (error) {
      this.logger.error(
        `Failed to calculate total percentage allocation for asset ${assetId}:`,
        error,
      );
      throw new Error(`Could not calculate percentage allocation: ${error.message}`);
    }
  }
}
