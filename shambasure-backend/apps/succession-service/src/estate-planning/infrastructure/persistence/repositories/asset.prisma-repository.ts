import { Injectable } from '@nestjs/common';
import { AssetOwnershipType, AssetType, KenyanCounty } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Asset as AssetEntity } from '../../../domain/entities/asset.entity';
import { AssetRepositoryInterface } from '../../../domain/interfaces/asset.repository.interface';
import { AssetMapper } from '../mappers/asset.mapper';

@Injectable()
export class AssetPrismaRepository implements AssetRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  async save(asset: AssetEntity): Promise<void> {
    const persistenceData = AssetMapper.toPersistence(asset);

    await this.prisma.asset.upsert({
      where: { id: asset.id },
      create: persistenceData,
      update: AssetMapper.toUpdatePersistence(asset),
    });
  }

  async findById(id: string): Promise<AssetEntity | null> {
    const record = await this.prisma.asset.findUnique({
      where: { id, deletedAt: null },
    });

    return record ? AssetMapper.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.asset.delete({
      where: { id },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.asset.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // ---------------------------------------------------------
  // STANDARD LOOKUP OPERATIONS
  // ---------------------------------------------------------

  async findByOwnerId(ownerId: string): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => AssetMapper.toDomain(record));
  }

  async findByType(ownerId: string, type: AssetType): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        type,
        deletedAt: null,
      },
    });

    return records.map((record) => AssetMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // BUSINESS LOGIC & LEGAL COMPLIANCE QUERIES
  // ---------------------------------------------------------

  async findTransferableAssets(ownerId: string): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        isActive: true,
        verificationStatus: 'VERIFIED',
        isEncumbered: false,
        deletedAt: null,
      },
    });

    return records.map((record) => AssetMapper.toDomain(record));
  }

  async findEncumberedAssets(ownerId: string): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        isEncumbered: true,
        deletedAt: null,
      },
    });

    return records.map((record) => AssetMapper.toDomain(record));
  }

  async findMatrimonialAssets(ownerId: string): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        isMatrimonialProperty: true,
        deletedAt: null,
      },
    });

    return records.map((record) => AssetMapper.toDomain(record));
  }

  async findAssetsWithActiveLifeInterest(ownerId: string): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        hasLifeInterest: true,
        deletedAt: null,
        OR: [{ lifeInterestEndsAt: null }, { lifeInterestEndsAt: { gt: new Date() } }],
      },
    });

    return records.map((record) => AssetMapper.toDomain(record));
  }

  async findAssetsWithVerifiedDocuments(ownerId: string): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        verificationStatus: 'VERIFIED',
        deletedAt: null,
      },
    });

    return records.map((record) => AssetMapper.toDomain(record));
  }

  async findAssetsByOwnershipType(
    ownerId: string,
    ownershipType: AssetOwnershipType,
  ): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        ownershipType,
        deletedAt: null,
      },
    });

    return records.map((record) => AssetMapper.toDomain(record));
  }

  async findAssetsByLocation(ownerId: string, county: KenyanCounty): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        county,
        deletedAt: null,
      },
    });

    return records.map((record) => AssetMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // FINANCIAL ANALYSIS & VALUATION QUERIES
  // ---------------------------------------------------------

  async findAssetsAboveValue(
    ownerId: string,
    minValue: number,
    currency: string = 'KES',
  ): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        currency,
        currentValue: {
          gte: minValue,
        },
        deletedAt: null,
      },
      orderBy: { currentValue: 'desc' },
    });

    return records.map((record) => AssetMapper.toDomain(record));
  }

  async getTotalPortfolioValue(ownerId: string): Promise<{ currency: string; amount: number }[]> {
    const aggregations = await this.prisma.asset.groupBy({
      by: ['currency'],
      where: {
        ownerId,
        isActive: true,
        deletedAt: null,
      },
      _sum: {
        currentValue: true,
      },
    });

    return aggregations.map((agg) => ({
      currency: agg.currency,
      amount: agg._sum.currentValue || 0,
    }));
  }

  // ---------------------------------------------------------
  // SEARCH & DISCOVERY OPERATIONS
  // ---------------------------------------------------------

  async searchAssets(ownerId: string, query: string): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { registrationNumber: { contains: query, mode: 'insensitive' } },
          { titleDeedNumber: { contains: query, mode: 'insensitive' } },
          { landReferenceNumber: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    return records.map((record) => AssetMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // CO-OWNERSHIP & COMPLEX OWNERSHIP QUERIES
  // ---------------------------------------------------------

  async findCoOwnedAssets(userId: string): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        coOwners: {
          some: {
            userId: userId,
          },
        },
        deletedAt: null,
      },
    });

    return records.map((record) => AssetMapper.toDomain(record));
  }
}
