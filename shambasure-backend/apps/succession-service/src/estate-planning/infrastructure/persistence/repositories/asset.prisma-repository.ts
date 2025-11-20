import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { AssetType, AssetOwnershipType } from '@prisma/client';
import { AssetRepositoryInterface } from '../../../domain/interfaces/asset.repository.interface';
import { Asset } from '../../../domain/entities/asset.entity';
import { AssetMapper } from '../mappers/asset.mapper';

@Injectable()
export class AssetPrismaRepository implements AssetRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // BASIC PERSISTENCE
  // --------------------------------------------------------------------------

  async save(asset: Asset): Promise<void> {
    const persistenceModel = AssetMapper.toPersistence(asset);

    // We use upsert to handle both Create and Update in one atomic operation
    await this.prisma.asset.upsert({
      where: { id: persistenceModel.id },
      create: persistenceModel,
      update: persistenceModel,
    });
  }

  async findById(id: string): Promise<Asset | null> {
    const raw = await this.prisma.asset.findUnique({
      where: { id },
    });

    return raw ? AssetMapper.toDomain(raw) : null;
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
      },
    });
  }

  // --------------------------------------------------------------------------
  // STANDARD LOOKUPS
  // --------------------------------------------------------------------------

  async findByOwnerId(ownerId: string): Promise<Asset[]> {
    const rawAssets = await this.prisma.asset.findMany({
      where: { ownerId, deletedAt: null },
    });
    return rawAssets.map(AssetMapper.toDomain);
  }

  async findByType(ownerId: string, type: AssetType): Promise<Asset[]> {
    const rawAssets = await this.prisma.asset.findMany({
      where: { ownerId, type, deletedAt: null },
    });
    return rawAssets.map(AssetMapper.toDomain);
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC QUERIES
  // --------------------------------------------------------------------------

  async findTransferableAssets(ownerId: string): Promise<Asset[]> {
    // Logic: Active + Verified + Unencumbered (Basic strict filter)
    // Note: Encumbered assets *can* be transferred with consent, but this query implies "Clean" transfer.
    const rawAssets = await this.prisma.asset.findMany({
      where: {
        ownerId,
        isActive: true,
        hasVerifiedDocument: true,
        isEncumbered: false,
      },
    });
    return rawAssets.map(AssetMapper.toDomain);
  }

  async findEncumberedAssets(ownerId: string): Promise<Asset[]> {
    const rawAssets = await this.prisma.asset.findMany({
      where: {
        ownerId,
        isActive: true,
        isEncumbered: true,
      },
    });
    return rawAssets.map(AssetMapper.toDomain);
  }

  async findAssetsWithVerifiedDocuments(ownerId: string): Promise<Asset[]> {
    const rawAssets = await this.prisma.asset.findMany({
      where: {
        ownerId,
        isActive: true,
        hasVerifiedDocument: true,
      },
    });
    return rawAssets.map(AssetMapper.toDomain);
  }

  async findAssetsByOwnershipType(
    ownerId: string,
    ownershipType: AssetOwnershipType,
  ): Promise<Asset[]> {
    const rawAssets = await this.prisma.asset.findMany({
      where: {
        ownerId,
        isActive: true,
        ownershipType,
      },
    });
    return rawAssets.map(AssetMapper.toDomain);
  }

  async findAssetsByLocation(ownerId: string, county: string): Promise<Asset[]> {
    // Using PostgreSQL JSONB filtering via Prisma
    const rawAssets = await this.prisma.asset.findMany({
      where: {
        ownerId,
        isActive: true,
        location: {
          path: ['county'],
          equals: county, // Case sensitive in JSON usually, ensure input matches stored format
        },
      },
    });
    return rawAssets.map(AssetMapper.toDomain);
  }

  // --------------------------------------------------------------------------
  // FINANCIAL ANALYSIS
  // --------------------------------------------------------------------------

  async findAssetsAboveValue(
    ownerId: string,
    minValue: number,
    currency: string = 'KES',
  ): Promise<Asset[]> {
    const rawAssets = await this.prisma.asset.findMany({
      where: {
        ownerId,
        isActive: true,
        currency,
        estimatedValue: {
          gte: minValue,
        },
      },
    });
    return rawAssets.map(AssetMapper.toDomain);
  }

  async getTotalPortfolioValue(ownerId: string): Promise<{ currency: string; amount: number }[]> {
    // High-performance database aggregation
    const result = await this.prisma.asset.groupBy({
      by: ['currency'],
      where: {
        ownerId,
        isActive: true,
      },
      _sum: {
        estimatedValue: true,
      },
    });

    return result.map((item) => ({
      currency: item.currency,
      amount: Number(item._sum.estimatedValue || 0),
    }));
  }

  // --------------------------------------------------------------------------
  // SEARCH
  // --------------------------------------------------------------------------

  async searchAssets(ownerId: string, query: string): Promise<Asset[]> {
    const rawAssets = await this.prisma.asset.findMany({
      where: {
        ownerId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          {
            // Search registration numbers inside the JSON blob (requires Postgres)
            identificationDetails: {
              path: ['registrationNumber'],
              string_contains: query,
            },
          },
          {
            // Search parcel numbers inside the JSON blob
            identificationDetails: {
              path: ['parcelNumber'],
              string_contains: query,
            },
          },
        ],
      },
    });
    return rawAssets.map(AssetMapper.toDomain);
  }

  // --------------------------------------------------------------------------
  // CO-OWNERSHIP (Using the Join Table)
  // --------------------------------------------------------------------------

  async findCoOwnedAssets(userId: string): Promise<Asset[]> {
    // Find IDs from the pivot table
    const coOwnerships = await this.prisma.assetCoOwner.findMany({
      where: { userId },
      select: { assetId: true },
    });

    const assetIds = coOwnerships.map((c) => c.assetId);

    if (assetIds.length === 0) return [];

    const rawAssets = await this.prisma.asset.findMany({
      where: {
        id: { in: assetIds },
        isActive: true,
      },
    });

    return rawAssets.map(AssetMapper.toDomain);
  }
}
