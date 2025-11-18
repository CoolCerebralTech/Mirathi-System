import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { WillStatus } from '@prisma/client';
import { WillRepositoryInterface } from '../../../domain/repositories/will.repository.interface';
import { WillAggregate } from '../../../domain/aggregates/will.aggregate';
import { WillMapper } from '../mappers/will.mapper';
import { AssetMapper } from '../mappers/asset.mapper';
import { BeneficiaryMapper } from '../mappers/beneficiary.mapper';
import { ExecutorMapper } from '../mappers/executor.mapper';
import { WitnessMapper } from '../mappers/witness.mapper';

@Injectable()
export class WillPrismaRepository implements WillRepositoryInterface {
  private readonly logger = new Logger(WillPrismaRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<WillAggregate | null> {
    try {
      const prismaWill = await this.prisma.will.findUnique({
        where: { id, isActive: true },
        include: {
          assets: {
            where: { isActive: true },
          },
          beneficiaryAssignments: true,
          executors: true,
          witnesses: true,
          versions: {
            orderBy: { versionNumber: 'desc' },
          },
        },
      });

      if (!prismaWill) {
        return null;
      }

      return this.mapToAggregate(prismaWill);
    } catch (error) {
      this.logger.error(`Failed to find will by ID ${id}:`, error);
      throw new Error(`Could not retrieve will: ${error.message}`);
    }
  }

  async findByTestatorId(testatorId: string): Promise<WillAggregate[]> {
    try {
      const prismaWills = await this.prisma.will.findMany({
        where: {
          testatorId,
          isActive: true,
        },
        include: {
          assets: {
            where: { isActive: true },
          },
          beneficiaryAssignments: true,
          executors: true,
          witnesses: true,
          versions: {
            orderBy: { versionNumber: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return prismaWills.map((will) => this.mapToAggregate(will)).filter(Boolean);
    } catch (error) {
      this.logger.error(`Failed to find wills for testator ${testatorId}:`, error);
      throw new Error(`Could not retrieve wills: ${error.message}`);
    }
  }

  async findByStatus(status: WillStatus): Promise<WillAggregate[]> {
    try {
      const prismaWills = await this.prisma.will.findMany({
        where: {
          status,
          isActive: true,
        },
        include: {
          assets: {
            where: { isActive: true },
          },
          beneficiaryAssignments: true,
          executors: true,
          witnesses: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return prismaWills.map((will) => this.mapToAggregate(will)).filter(Boolean);
    } catch (error) {
      this.logger.error(`Failed to find wills by status ${status}:`, error);
      throw new Error(`Could not retrieve wills: ${error.message}`);
    }
  }

  async save(willAggregate: WillAggregate): Promise<void> {
    const will = willAggregate.getWill();

    try {
      await this.prisma.$transaction(async (tx) => {
        // Save will
        const willData = WillMapper.toPersistence(will);
        await tx.will.upsert({
          where: { id: will.getId() },
          create: willData,
          update: willData,
        });

        // Save assets
        const assets = willAggregate.getAllAssets();
        for (const asset of assets) {
          const assetData = AssetMapper.toPersistence(asset);
          await tx.asset.upsert({
            where: { id: asset.getId() },
            create: assetData,
            update: assetData,
          });
        }

        // Save beneficiaries
        const beneficiaries = willAggregate.getAllBeneficiaries();
        for (const beneficiary of beneficiaries) {
          const beneficiaryData = BeneficiaryMapper.toPersistence(beneficiary);
          await tx.beneficiaryAssignment.upsert({
            where: { id: beneficiary.getId() },
            create: beneficiaryData,
            update: beneficiaryData,
          });
        }

        // Save executors
        const executors = willAggregate.getAllExecutors();
        for (const executor of executors) {
          const executorData = ExecutorMapper.toPersistence(executor);
          await tx.willExecutor.upsert({
            where: { id: executor.getId() },
            create: executorData,
            update: executorData,
          });
        }

        // Save witnesses
        const witnesses = willAggregate.getAllWitnesses();
        for (const witness of witnesses) {
          const witnessData = WitnessMapper.toPersistence(witness);
          await tx.willWitness.upsert({
            where: { id: witness.getId() },
            create: witnessData,
            update: witnessData,
          });
        }

        // Save version if version number changed
        const currentVersion = await tx.willVersion.findFirst({
          where: { willId: will.getId() },
          orderBy: { versionNumber: 'desc' },
        });

        if (!currentVersion || currentVersion.versionNumber < will.getVersionNumber()) {
          await tx.willVersion.create({
            data: {
              id: `${will.getId()}_v${will.getVersionNumber()}`,
              willId: will.getId(),
              versionNumber: will.getVersionNumber(),
              snapshot: willData, // Store current will state
              changeLog: `Version ${will.getVersionNumber()} saved`,
              changedBy: will.getTestatorId(), // In reality, get from context
              ipAddress: '127.0.0.1', // In reality, get from request
            },
          });
        }
      });

      this.logger.log(`Successfully saved will ${will.getId()}`);
    } catch (error) {
      this.logger.error(`Failed to save will ${will.getId()}:`, error);
      throw new Error(`Could not save will: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.will.delete({
        where: { id },
      });
      this.logger.log(`Successfully deleted will ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete will ${id}:`, error);
      throw new Error(`Could not delete will: ${error.message}`);
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await this.prisma.will.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });
      this.logger.log(`Successfully soft-deleted will ${id}`);
    } catch (error) {
      this.logger.error(`Failed to soft-delete will ${id}:`, error);
      throw new Error(`Could not soft-delete will: ${error.message}`);
    }
  }

  async findActiveWillByTestatorId(testatorId: string): Promise<WillAggregate | null> {
    try {
      const prismaWill = await this.prisma.will.findFirst({
        where: {
          testatorId,
          status: WillStatus.ACTIVE,
          isActive: true,
        },
        include: {
          assets: {
            where: { isActive: true },
          },
          beneficiaryAssignments: true,
          executors: true,
          witnesses: true,
        },
      });

      return prismaWill ? this.mapToAggregate(prismaWill) : null;
    } catch (error) {
      this.logger.error(`Failed to find active will for testator ${testatorId}:`, error);
      throw new Error(`Could not retrieve active will: ${error.message}`);
    }
  }

  async findWillsRequiringWitnesses(): Promise<WillAggregate[]> {
    try {
      const prismaWills = await this.prisma.will.findMany({
        where: {
          status: WillStatus.PENDING_WITNESS,
          requiresWitnesses: true,
          witnessCount: { lt: 2 },
          isActive: true,
        },
        include: {
          assets: {
            where: { isActive: true },
          },
          beneficiaryAssignments: true,
          executors: true,
          witnesses: true,
        },
      });

      return prismaWills.map((will) => this.mapToAggregate(will)).filter(Boolean);
    } catch (error) {
      this.logger.error('Failed to find wills requiring witnesses:', error);
      throw new Error(`Could not retrieve wills requiring witnesses: ${error.message}`);
    }
  }

  async findWillsPendingActivation(): Promise<WillAggregate[]> {
    try {
      const prismaWills = await this.prisma.will.findMany({
        where: {
          status: WillStatus.WITNESSED,
          isActive: true,
        },
        include: {
          assets: {
            where: { isActive: true },
          },
          beneficiaryAssignments: true,
          executors: true,
          witnesses: true,
        },
      });

      return prismaWills.map((will) => this.mapToAggregate(will)).filter(Boolean);
    } catch (error) {
      this.logger.error('Failed to find wills pending activation:', error);
      throw new Error(`Could not retrieve wills pending activation: ${error.message}`);
    }
  }

  async findSupersededWills(originalWillId: string): Promise<WillAggregate[]> {
    try {
      const prismaWills = await this.prisma.will.findMany({
        where: {
          supersedes: originalWillId,
          isActive: true,
        },
        include: {
          assets: {
            where: { isActive: true },
          },
          beneficiaryAssignments: true,
          executors: true,
          witnesses: true,
        },
      });

      return prismaWills.map((will) => this.mapToAggregate(will)).filter(Boolean);
    } catch (error) {
      this.logger.error(`Failed to find superseded wills for ${originalWillId}:`, error);
      throw new Error(`Could not retrieve superseded wills: ${error.message}`);
    }
  }

  async saveVersion(willId: string, versionData: any): Promise<void> {
    try {
      const latestVersion = await this.prisma.willVersion.findFirst({
        where: { willId },
        orderBy: { versionNumber: 'desc' },
      });

      const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

      await this.prisma.willVersion.create({
        data: {
          id: `${willId}_v${newVersionNumber}`,
          willId,
          versionNumber: newVersionNumber,
          snapshot: versionData.snapshot,
          changeLog: versionData.changeLog,
          changedBy: versionData.changedBy,
          ipAddress: versionData.ipAddress,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to save version for will ${willId}:`, error);
      throw new Error(`Could not save will version: ${error.message}`);
    }
  }

  async findVersions(willId: string): Promise<any[]> {
    try {
      return await this.prisma.willVersion.findMany({
        where: { willId },
        orderBy: { versionNumber: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to find versions for will ${willId}:`, error);
      throw new Error(`Could not retrieve will versions: ${error.message}`);
    }
  }

  async countByTestatorId(testatorId: string): Promise<number> {
    try {
      return await this.prisma.will.count({
        where: {
          testatorId,
          isActive: true,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to count wills for testator ${testatorId}:`, error);
      throw new Error(`Could not count wills: ${error.message}`);
    }
  }

  async findRecentWills(days: number): Promise<WillAggregate[]> {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      const prismaWills = await this.prisma.will.findMany({
        where: {
          createdAt: { gte: sinceDate },
          isActive: true,
        },
        include: {
          assets: {
            where: { isActive: true },
          },
          beneficiaryAssignments: true,
          executors: true,
          witnesses: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return prismaWills.map((will) => this.mapToAggregate(will)).filter(Boolean);
    } catch (error) {
      this.logger.error(`Failed to find recent wills (last ${days} days):`, error);
      throw new Error(`Could not retrieve recent wills: ${error.message}`);
    }
  }

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(work);
  }

  private mapToAggregate(prismaWill: any): WillAggregate {
    try {
      const will = WillMapper.toDomain(prismaWill);
      if (!will) {
        throw new Error('Failed to map will entity');
      }

      const aggregate = new WillAggregate(will);

      // Map assets
      const assets = AssetMapper.toDomainList(prismaWill.assets || []);
      assets.forEach((asset) => aggregate.addAsset(asset));

      // Map beneficiaries
      const beneficiaries = BeneficiaryMapper.toDomainList(prismaWill.beneficiaryAssignments || []);
      beneficiaries.forEach((beneficiary) => aggregate.assignBeneficiary(beneficiary));

      // Map executors
      const executors = ExecutorMapper.toDomainList(prismaWill.executors || []);
      executors.forEach((executor) => aggregate.nominateExecutor(executor));

      // Map witnesses
      const witnesses = WitnessMapper.toDomainList(prismaWill.witnesses || []);
      witnesses.forEach((witness) => aggregate.addWitness(witness));

      return aggregate;
    } catch (error) {
      this.logger.error('Failed to map will to aggregate:', error);
      throw new Error(`Could not map will aggregate: ${error.message}`);
    }
  }
}
