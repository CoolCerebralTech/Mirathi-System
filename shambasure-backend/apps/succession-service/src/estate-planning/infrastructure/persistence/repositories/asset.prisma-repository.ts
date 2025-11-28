import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { AssetType, AssetOwnershipType, Prisma } from '@prisma/client';
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
      create: {
        id: persistenceData.id,
        name: persistenceData.name,
        description: persistenceData.description,
        type: persistenceData.type,
        ownerId: persistenceData.ownerId,
        ownershipType: persistenceData.ownershipType,
        ownershipShare: persistenceData.ownershipShare,
        estimatedValue: persistenceData.estimatedValue,
        currency: persistenceData.currency,
        valuationDate: persistenceData.valuationDate,
        valuationSource: persistenceData.valuationSource,
        location: persistenceData.location === null ? Prisma.JsonNull : persistenceData.location,
        identificationDetails:
          persistenceData.identificationDetails === null
            ? Prisma.JsonNull
            : persistenceData.identificationDetails,
        registrationNumber: persistenceData.registrationNumber,
        hasVerifiedDocument: persistenceData.hasVerifiedDocument,
        isEncumbered: persistenceData.isEncumbered,
        encumbranceDetails: persistenceData.encumbranceDetails,
        metadata: persistenceData.metadata === null ? Prisma.JsonNull : persistenceData.metadata,
        isActive: persistenceData.isActive,
        createdAt: persistenceData.createdAt,
        updatedAt: persistenceData.updatedAt,
        deletedAt: persistenceData.deletedAt,
      },
      update: {
        name: persistenceData.name,
        description: persistenceData.description,
        ownershipType: persistenceData.ownershipType,
        ownershipShare: persistenceData.ownershipShare,
        estimatedValue: persistenceData.estimatedValue,
        currency: persistenceData.currency,
        valuationDate: persistenceData.valuationDate,
        valuationSource: persistenceData.valuationSource,
        location: persistenceData.location === null ? Prisma.JsonNull : persistenceData.location,
        identificationDetails:
          persistenceData.identificationDetails === null
            ? Prisma.JsonNull
            : persistenceData.identificationDetails,
        registrationNumber: persistenceData.registrationNumber,
        hasVerifiedDocument: persistenceData.hasVerifiedDocument,
        isEncumbered: persistenceData.isEncumbered,
        encumbranceDetails: persistenceData.encumbranceDetails,
        metadata: persistenceData.metadata === null ? Prisma.JsonNull : persistenceData.metadata,
        isActive: persistenceData.isActive,
        updatedAt: persistenceData.updatedAt,
        deletedAt: persistenceData.deletedAt,
      },
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
  // BUSINESS LOGIC QUERIES
  // ---------------------------------------------------------

  async findTransferableAssets(ownerId: string): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        isActive: true,
        hasVerifiedDocument: true,
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

  async findAssetsWithVerifiedDocuments(ownerId: string): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        hasVerifiedDocument: true,
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

  async findAssetsByLocation(ownerId: string, county: string): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        deletedAt: null,
        location: {
          path: ['county'],
          equals: county.toUpperCase(),
        },
      },
    });

    return records.map((record) => AssetMapper.toDomain(record));
  }

  async findAssetsAboveValue(
    ownerId: string,
    minValue: number,
    currency: string = 'KES',
  ): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        currency,
        estimatedValue: {
          gte: new Prisma.Decimal(minValue),
        },
        deletedAt: null,
      },
      orderBy: { estimatedValue: 'desc' },
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
        estimatedValue: true,
      },
    });

    return aggregations.map((agg) => ({
      currency: agg.currency,
      amount: agg._sum.estimatedValue?.toNumber() || 0,
    }));
  }

  async searchAssets(ownerId: string, query: string): Promise<AssetEntity[]> {
    const records = await this.prisma.asset.findMany({
      where: {
        ownerId,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { registrationNumber: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    return records.map((record) => AssetMapper.toDomain(record));
  }

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
