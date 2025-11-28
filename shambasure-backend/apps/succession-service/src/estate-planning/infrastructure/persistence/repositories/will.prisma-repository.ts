import { Injectable } from '@nestjs/common';
import { Prisma, WillStatus } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { WillAggregate } from '../../../domain/aggregates/will.aggregate';
import { WillRepositoryInterface } from '../../../domain/interfaces/will.repository.interface';
import { WillMapper } from '../mappers/will.mapper';

// Utility type guard to remove undefined values from arrays
const notUndefined = <T>(value: T | undefined): value is T => value !== undefined;

@Injectable()
export class WillPrismaRepository implements WillRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async save(aggregate: WillAggregate): Promise<void> {
    const persistenceData = WillMapper.toPersistence(aggregate);

    await this.prisma.will.upsert({
      where: { id: aggregate.getWill().id },
      create: persistenceData,
      update: WillMapper.toUpdatePersistence(aggregate),
    });
  }

  async findById(id: string): Promise<WillAggregate | null> {
    const record = await this.prisma.will.findUnique({
      where: { id },
      include: {
        beneficiaryAssignments: true,
        executors: true,
        witnesses: true,
      },
    });

    if (!record) return null;

    const assetIds = [
      ...new Set(record.beneficiaryAssignments.map((ba) => ba.assetId).filter(Boolean)),
    ] as string[];

    const assets =
      assetIds.length > 0
        ? await this.prisma.asset.findMany({
            where: {
              id: { in: assetIds },
              deletedAt: null,
            },
          })
        : [];

    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

    const resolvedAssets = assetIds.map((assetId) => assetMap.get(assetId)).filter(notUndefined);

    return WillMapper.toDomain({
      ...record,
      assets: resolvedAssets,
      beneficiaries: record.beneficiaryAssignments,
      executors: record.executors,
      witnesses: record.witnesses,
    });
  }

  async findByTestatorId(testatorId: string): Promise<WillAggregate[]> {
    const records = await this.prisma.will.findMany({
      where: { testatorId, deletedAt: null },
      orderBy: { willDate: 'desc' },
      include: {
        beneficiaryAssignments: true,
        executors: true,
        witnesses: true,
      },
    });

    const allAssetIds = [
      ...new Set(
        records.flatMap((record) =>
          record.beneficiaryAssignments.map((ba) => ba.assetId).filter(Boolean),
        ),
      ),
    ] as string[];

    const allAssets =
      allAssetIds.length > 0
        ? await this.prisma.asset.findMany({
            where: {
              id: { in: allAssetIds },
              deletedAt: null,
            },
          })
        : [];

    const assetMap = new Map(allAssets.map((asset) => [asset.id, asset]));

    return records.map((record) => {
      const recordAssetIds = record.beneficiaryAssignments.map((ba) => ba.assetId).filter(Boolean);

      const resolvedAssets = recordAssetIds
        .map((assetId) => assetMap.get(assetId))
        .filter(notUndefined);

      return WillMapper.toDomain({
        ...record,
        assets: resolvedAssets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.will.count({
      where: { id, deletedAt: null },
    });
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
        updatedAt: new Date(),
      },
    });
  }

  async findByStatus(status: WillStatus): Promise<WillAggregate[]> {
    const records = await this.prisma.will.findMany({
      where: { status, deletedAt: null },
      include: {
        beneficiaryAssignments: true,
        executors: true,
        witnesses: true,
      },
    });

    const allAssetIds = [
      ...new Set(
        records.flatMap((record) =>
          record.beneficiaryAssignments.map((ba) => ba.assetId).filter(Boolean),
        ),
      ),
    ] as string[];

    const allAssets =
      allAssetIds.length > 0
        ? await this.prisma.asset.findMany({
            where: {
              id: { in: allAssetIds },
              deletedAt: null,
            },
          })
        : [];

    const assetMap = new Map(allAssets.map((asset) => [asset.id, asset]));

    return records.map((record) => {
      const recordAssetIds = record.beneficiaryAssignments.map((ba) => ba.assetId).filter(Boolean);
      const resolvedAssets = recordAssetIds
        .map((assetId) => assetMap.get(assetId))
        .filter(notUndefined);

      return WillMapper.toDomain({
        ...record,
        assets: resolvedAssets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }

  async findActiveWillByTestatorId(testatorId: string): Promise<WillAggregate | null> {
    const record = await this.prisma.will.findFirst({
      where: {
        testatorId,
        status: WillStatus.ACTIVE,
        deletedAt: null,
      },
      include: {
        beneficiaryAssignments: true,
        executors: true,
        witnesses: true,
      },
    });

    if (!record) return null;

    const assetIds = record.beneficiaryAssignments.map((ba) => ba.assetId).filter(Boolean);

    const assets =
      assetIds.length > 0
        ? await this.prisma.asset.findMany({
            where: {
              id: { in: assetIds },
              deletedAt: null,
            },
          })
        : [];

    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
    const resolvedAssets = assetIds.map((id) => assetMap.get(id)).filter(notUndefined);

    return WillMapper.toDomain({
      ...record,
      assets: resolvedAssets,
      beneficiaries: record.beneficiaryAssignments,
      executors: record.executors,
      witnesses: record.witnesses,
    });
  }

  async findSupersededWills(originalWillId: string): Promise<WillAggregate[]> {
    const records = await this.prisma.will.findMany({
      where: { supersedes: originalWillId },
      include: {
        beneficiaryAssignments: true,
        executors: true,
        witnesses: true,
      },
    });

    const allAssetIds = [
      ...new Set(
        records.flatMap((record) =>
          record.beneficiaryAssignments.map((ba) => ba.assetId).filter(Boolean),
        ),
      ),
    ] as string[];

    const allAssets =
      allAssetIds.length > 0
        ? await this.prisma.asset.findMany({
            where: {
              id: { in: allAssetIds },
              deletedAt: null,
            },
          })
        : [];

    const assetMap = new Map(allAssets.map((asset) => [asset.id, asset]));

    return records.map((record) => {
      const recordAssetIds = record.beneficiaryAssignments.map((ba) => ba.assetId).filter(Boolean);

      const resolvedAssets = recordAssetIds
        .map((assetId) => assetMap.get(assetId))
        .filter(notUndefined);

      return WillMapper.toDomain({
        ...record,
        assets: resolvedAssets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }

  async findWillsRequiringWitnesses(): Promise<WillAggregate[]> {
    const records = await this.prisma.will.findMany({
      where: {
        status: { in: [WillStatus.DRAFT, WillStatus.PENDING_WITNESS] },
        requiresWitnesses: true,
        hasAllWitnesses: false,
        deletedAt: null,
      },
      include: {
        beneficiaryAssignments: true,
        executors: true,
        witnesses: true,
      },
    });

    const allAssetIds = [
      ...new Set(
        records.flatMap((record) =>
          record.beneficiaryAssignments.map((ba) => ba.assetId).filter(Boolean),
        ),
      ),
    ] as string[];

    const allAssets =
      allAssetIds.length > 0
        ? await this.prisma.asset.findMany({
            where: {
              id: { in: allAssetIds },
              deletedAt: null,
            },
          })
        : [];

    const assetMap = new Map(allAssets.map((asset) => [asset.id, asset]));

    return records.map((record) => {
      const recordAssetIds = record.beneficiaryAssignments.map((ba) => ba.assetId).filter(Boolean);

      const resolvedAssets = recordAssetIds
        .map((assetId) => assetMap.get(assetId))
        .filter(notUndefined);

      return WillMapper.toDomain({
        ...record,
        assets: resolvedAssets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }

  async findWillsPendingActivation(): Promise<WillAggregate[]> {
    const records = await this.prisma.will.findMany({
      where: {
        status: WillStatus.WITNESSED,
        deletedAt: null,
      },
      include: {
        beneficiaryAssignments: true,
        executors: true,
        witnesses: true,
      },
    });

    const allAssetIds = [
      ...new Set(
        records.flatMap((record) =>
          record.beneficiaryAssignments.map((ba) => ba.assetId).filter(Boolean),
        ),
      ),
    ] as string[];

    const allAssets =
      allAssetIds.length > 0
        ? await this.prisma.asset.findMany({
            where: {
              id: { in: allAssetIds },
              deletedAt: null,
            },
          })
        : [];

    const assetMap = new Map(allAssets.map((asset) => [asset.id, asset]));

    return records.map((record) => {
      const recordAssetIds = record.beneficiaryAssignments.map((ba) => ba.assetId).filter(Boolean);

      const resolvedAssets = recordAssetIds
        .map((assetId) => assetMap.get(assetId))
        .filter(notUndefined);

      return WillMapper.toDomain({
        ...record,
        assets: resolvedAssets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }

  async saveVersion(
    willId: string,
    versionNumber: number,
    versionData: Record<string, any>,
  ): Promise<void> {
    await this.prisma.willVersion.create({
      data: {
        willId,
        versionNumber,
        snapshot: versionData as Prisma.InputJsonValue,
        changeLog: `Version ${versionNumber}`,
        changedBy: 'SYSTEM',
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

  async countByTestatorId(testatorId: string): Promise<number> {
    return this.prisma.will.count({
      where: {
        testatorId,
        deletedAt: null,
      },
    });
  }

  async findRecentWills(days: number): Promise<WillAggregate[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);

    const records = await this.prisma.will.findMany({
      where: {
        updatedAt: { gte: thresholdDate },
        deletedAt: null,
      },
      include: {
        beneficiaryAssignments: true,
        executors: true,
        witnesses: true,
      },
    });

    const allAssetIds = [
      ...new Set(
        records.flatMap((record) =>
          record.beneficiaryAssignments.map((ba) => ba.assetId).filter(Boolean),
        ),
      ),
    ] as string[];

    const allAssets =
      allAssetIds.length > 0
        ? await this.prisma.asset.findMany({
            where: {
              id: { in: allAssetIds },
              deletedAt: null,
            },
          })
        : [];

    const assetMap = new Map(allAssets.map((asset) => [asset.id, asset]));

    return records.map((record) => {
      const recordAssetIds = record.beneficiaryAssignments.map((ba) => ba.assetId).filter(Boolean);

      const resolvedAssets = recordAssetIds
        .map((assetId) => assetMap.get(assetId))
        .filter(notUndefined);

      return WillMapper.toDomain({
        ...record,
        assets: resolvedAssets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }
}
