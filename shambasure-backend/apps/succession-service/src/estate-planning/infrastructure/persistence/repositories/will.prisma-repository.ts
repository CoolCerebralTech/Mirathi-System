import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { WillStatus } from '@prisma/client';
import { WillRepositoryInterface } from '../../../domain/interfaces/will.repository.interface';
import { WillAggregate } from '../../../domain/aggregates/will.aggregate';
import { WillMapper } from '../mappers/will.mapper';
import { AssetMapper } from '../mappers/asset.mapper';
import { BeneficiaryMapper } from '../mappers/beneficiary.mapper';
import { ExecutorMapper } from '../mappers/executor.mapper';
import { WitnessMapper } from '../mappers/witness.mapper';

@Injectable()
export class WillPrismaRepository implements WillRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // BASIC PERSISTENCE
  // --------------------------------------------------------------------------

  /**
   * Saves the Will Root Entity.
   * NOTE: In a strict DDD approach with Prisma, saving the Aggregate Root
   * typically implies saving the root properties. Child entities (Assets, etc.)
   * are usually saved via their own repositories within the same Transaction scope,
   * or using nested Prisma writes if strict consistency is required.
   *
   * For this implementation, we persist the Will Entity fields.
   */
  async save(aggregate: WillAggregate): Promise<void> {
    const will = aggregate.getWill();
    const persistenceModel = WillMapper.toPersistence(will);

    await this.prisma.will.upsert({
      where: { id: persistenceModel.id },
      update: persistenceModel,
      create: persistenceModel,
    });
  }

  async findById(id: string): Promise<WillAggregate | null> {
    const raw = await this.prisma.will.findUnique({
      where: { id },
      include: {
        assets: true, // Fetch linked assets
        beneficiaryAssignments: true, // Fetch beneficiaries
        executors: true, // Fetch executors
        witnesses: true, // Fetch witnesses
      },
    });

    if (!raw) return null;

    // Map Children
    const willEntity = WillMapper.toDomain(raw);

    const assets = raw.assets.map((a) => AssetMapper.toDomain(a));

    const beneficiaries = raw.beneficiaryAssignments.map((b) => BeneficiaryMapper.toDomain(b));

    const executors = raw.executors.map((e) => ExecutorMapper.toDomain(e));

    const witnesses = raw.witnesses.map((w) => WitnessMapper.toDomain(w));

    // Reconstitute Aggregate
    return WillAggregate.reconstitute(willEntity, assets, beneficiaries, executors, witnesses);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.will.count({ where: { id } });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.will.delete({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.will.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  // --------------------------------------------------------------------------
  // DOMAIN LOOKUPS
  // --------------------------------------------------------------------------

  async findByTestatorId(testatorId: string): Promise<WillAggregate[]> {
    const wills = await this.prisma.will.findMany({
      where: { testatorId, deletedAt: null },
      include: {
        assets: true,
        beneficiaryAssignments: true,
        executors: true,
        witnesses: true,
      },
    });

    return wills.map((raw) => {
      return WillAggregate.reconstitute(
        WillMapper.toDomain(raw),
        raw.assets.map(AssetMapper.toDomain),
        raw.beneficiaryAssignments.map(BeneficiaryMapper.toDomain),
        raw.executors.map(ExecutorMapper.toDomain),
        raw.witnesses.map(WitnessMapper.toDomain),
      );
    });
  }

  async findByStatus(status: WillStatus): Promise<WillAggregate[]> {
    const wills = await this.prisma.will.findMany({
      where: { status },
      include: { assets: true, beneficiaryAssignments: true, executors: true, witnesses: true },
    });

    // Simplified mapping for bulk queries (reusing logic)
    return wills.map(this.mapToAggregate);
  }

  async findActiveWillByTestatorId(testatorId: string): Promise<WillAggregate | null> {
    const raw = await this.prisma.will.findFirst({
      where: {
        testatorId,
        status: WillStatus.ACTIVE,
        deletedAt: null,
      },
      include: {
        assets: true,
        beneficiaryAssignments: true,
        executors: true,
        witnesses: true,
      },
    });

    return raw ? this.mapToAggregate(raw) : null;
  }

  async findSupersededWills(originalWillId: string): Promise<WillAggregate[]> {
    const wills = await this.prisma.will.findMany({
      where: { supersedes: originalWillId },
      include: { assets: true, beneficiaryAssignments: true, executors: true, witnesses: true },
    });
    return wills.map(this.mapToAggregate);
  }

  // --------------------------------------------------------------------------
  // WORKFLOW QUERIES
  // --------------------------------------------------------------------------

  async findWillsRequiringWitnesses(): Promise<WillAggregate[]> {
    const wills = await this.prisma.will.findMany({
      where: {
        status: WillStatus.PENDING_WITNESS,
        isActive: true,
      },
      include: { assets: true, beneficiaryAssignments: true, executors: true, witnesses: true },
    });
    return wills.map(this.mapToAggregate);
  }

  async findWillsPendingActivation(): Promise<WillAggregate[]> {
    // "Witnessed" status implies ready for activation but not yet Active
    const wills = await this.prisma.will.findMany({
      where: {
        status: WillStatus.WITNESSED,
        isActive: true,
      },
      include: { assets: true, beneficiaryAssignments: true, executors: true, witnesses: true },
    });
    return wills.map(this.mapToAggregate);
  }

  // --------------------------------------------------------------------------
  // VERSIONING
  // --------------------------------------------------------------------------

  async saveVersion(
    willId: string,
    versionNumber: number,
    versionData: Record<string, any>,
  ): Promise<void> {
    await this.prisma.willVersion.create({
      data: {
        willId,
        versionNumber,
        snapshot: versionData,
        changeLog: `Version ${versionNumber} auto-saved`,
        changedBy: 'SYSTEM', // Or pass user context if available
      },
    });
  }

  async findVersions(willId: string): Promise<{ version: number; data: any; createdAt: Date }[]> {
    const versions = await this.prisma.willVersion.findMany({
      where: { willId },
      orderBy: { versionNumber: 'desc' },
    });

    return versions.map((v) => ({
      version: v.versionNumber,
      data: v.snapshot,
      createdAt: v.createdAt,
    }));
  }

  // --------------------------------------------------------------------------
  // ANALYTICS / BULK
  // --------------------------------------------------------------------------

  async countByTestatorId(testatorId: string): Promise<number> {
    return this.prisma.will.count({
      where: { testatorId, isActive: true },
    });
  }

  async findRecentWills(days: number): Promise<WillAggregate[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const wills = await this.prisma.will.findMany({
      where: {
        updatedAt: { gte: sinceDate },
      },
      include: { assets: true, beneficiaryAssignments: true, executors: true, witnesses: true },
    });
    return wills.map(this.mapToAggregate);
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  /**
   * Helper to map a fully loaded Prisma result to an Aggregate
   * Note: Bind this if passing as callback
   */
  private mapToAggregate = (raw: any): WillAggregate => {
    return WillAggregate.reconstitute(
      WillMapper.toDomain(raw),
      raw.assets?.map(AssetMapper.toDomain) || [],
      raw.beneficiaryAssignments?.map(BeneficiaryMapper.toDomain) || [],
      raw.executors?.map(ExecutorMapper.toDomain) || [],
      raw.witnesses?.map(WitnessMapper.toDomain) || [],
    );
  };

  /**
   * Transaction support required by Interface.
   * This allows the Application Service to wrap multiple repository calls (Will + Assets)
   * into one atomic DB transaction.
   */
  async transaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => {
      return await work();
    });
  }
}
