import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { AssetType, AssetOwnershipType } from '@prisma/client';
import { AssetRepositoryInterface } from '../../../domain/interfaces/asset.repository.interface';
import { Asset } from '../../../domain/entities/asset.entity';
import { AssetMapper } from '../mappers/asset.mapper';

@Injectable()
export class AssetPrismaRepository implements AssetRepositoryInterface {
  private readonly logger = new Logger(AssetPrismaRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Asset | null> {
    try {
      const prismaAsset = await this.prisma.asset.findUnique({
        where: { id, isActive: true },
      });

      return prismaAsset ? AssetMapper.toDomain(prismaAsset) : null;
    } catch (error) {
      this.logger.error(`Failed to find asset by ID ${id}:`, error);
      throw new Error(`Could not retrieve asset: ${error.message}`);
    }
  }

  async findByOwnerId(ownerId: string): Promise<Asset[]> {
    try {
      const prismaAssets = await this.prisma.asset.findMany({
        where: {
          ownerId,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return AssetMapper.toDomainList(prismaAssets);
    } catch (error) {
      this.logger.error(`Failed to find assets for owner ${ownerId}:`, error);
      throw new Error(`Could not retrieve assets: ${error.message}`);
    }
  }

  async findByType(ownerId: string, type: AssetType): Promise<Asset[]> {
    try {
      const prismaAssets = await this.prisma.asset.findMany({
        where: {
          ownerId,
          type,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return AssetMapper.toDomainList(prismaAssets);
    } catch (error) {
      this.logger.error(`Failed to find assets of type ${type} for owner ${ownerId}:`, error);
      throw new Error(`Could not retrieve assets: ${error.message}`);
    }
  }

  async save(asset: Asset): Promise<void> {
    try {
      const assetData = AssetMapper.toPersistence(asset);

      await this.prisma.asset.upsert({
        where: { id: asset.getId() },
        create: assetData,
        update: assetData,
      });

      this.logger.log(`Successfully saved asset ${asset.getId()}`);
    } catch (error) {
      this.logger.error(`Failed to save asset ${asset.getId()}:`, error);
      throw new Error(`Could not save asset: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.asset.delete({
        where: { id },
      });
      this.logger.log(`Successfully deleted asset ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete asset ${id}:`, error);
      throw new Error(`Could not delete asset: ${error.message}`);
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await this.prisma.asset.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });
      this.logger.log(`Successfully soft-deleted asset ${id}`);
    } catch (error) {
      this.logger.error(`Failed to soft-delete asset ${id}:`, error);
      throw new Error(`Could not soft-delete asset: ${error.message}`);
    }
  }

  async findTransferableAssets(ownerId: string): Promise<Asset[]> {
    try {
      const prismaAssets = await this.prisma.asset.findMany({
        where: {
          ownerId,
          isActive: true,
          isEncumbered: false,
          hasVerifiedDocument: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return AssetMapper.toDomainList(prismaAssets);
    } catch (error) {
      this.logger.error(`Failed to find transferable assets for owner ${ownerId}:`, error);
      throw new Error(`Could not retrieve transferable assets: ${error.message}`);
    }
  }

  async findEncumberedAssets(ownerId: string): Promise<Asset[]> {
    try {
      const prismaAssets = await this.prisma.asset.findMany({
        where: {
          ownerId,
          isActive: true,
          isEncumbered: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return AssetMapper.toDomainList(prismaAssets);
    } catch (error) {
      this.logger.error(`Failed to find encumbered assets for owner ${ownerId}:`, error);
      throw new Error(`Could not retrieve encumbered assets: ${error.message}`);
    }
  }

  async findAssetsWithVerifiedDocuments(ownerId: string): Promise<Asset[]> {
    try {
      const prismaAssets = await this.prisma.asset.findMany({
        where: {
          ownerId,
          isActive: true,
          hasVerifiedDocument: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return AssetMapper.toDomainList(prismaAssets);
    } catch (error) {
      this.logger.error(`Failed to find verified assets for owner ${ownerId}:`, error);
      throw new Error(`Could not retrieve verified assets: ${error.message}`);
    }
  }

  async findAssetsByOwnershipType(
    ownerId: string,
    ownershipType: AssetOwnershipType,
  ): Promise<Asset[]> {
    try {
      const prismaAssets = await this.prisma.asset.findMany({
        where: {
          ownerId,
          isActive: true,
          ownershipType,
        },
        orderBy: { createdAt: 'desc' },
      });

      return AssetMapper.toDomainList(prismaAssets);
    } catch (error) {
      this.logger.error(
        `Failed to find assets by ownership type ${ownershipType} for owner ${ownerId}:`,
        error,
      );
      throw new Error(`Could not retrieve assets: ${error.message}`);
    }
  }

  async findAssetsAboveValue(ownerId: string, minValue: number): Promise<Asset[]> {
    try {
      const prismaAssets = await this.prisma.asset.findMany({
        where: {
          ownerId,
          isActive: true,
          estimatedValue: { gte: minValue },
        },
        orderBy: { estimatedValue: 'desc' },
      });

      return AssetMapper.toDomainList(prismaAssets);
    } catch (error) {
      this.logger.error(
        `Failed to find assets above value ${minValue} for owner ${ownerId}:`,
        error,
      );
      throw new Error(`Could not retrieve assets: ${error.message}`);
    }
  }

  async getTotalPortfolioValue(ownerId: string): Promise<number> {
    try {
      const result = await this.prisma.asset.aggregate({
        where: {
          ownerId,
          isActive: true,
        },
        _sum: {
          estimatedValue: true,
        },
      });

      return result._sum.estimatedValue?.toNumber() || 0;
    } catch (error) {
      this.logger.error(`Failed to calculate portfolio value for owner ${ownerId}:`, error);
      throw new Error(`Could not calculate portfolio value: ${error.message}`);
    }
  }

  async searchAssets(ownerId: string, query: string): Promise<Asset[]> {
    try {
      const prismaAssets = await this.prisma.asset.findMany({
        where: {
          ownerId,
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { registrationNumber: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      return AssetMapper.toDomainList(prismaAssets);
    } catch (error) {
      this.logger.error(`Failed to search assets for owner ${ownerId} with query ${query}:`, error);
      throw new Error(`Could not search assets: ${error.message}`);
    }
  }

  async findAssetsByLocation(ownerId: string, county: string): Promise<Asset[]> {
    try {
      const prismaAssets = await this.prisma.asset.findMany({
        where: {
          ownerId,
          isActive: true,
          location: {
            path: ['county'],
            equals: county,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return AssetMapper.toDomainList(prismaAssets);
    } catch (error) {
      this.logger.error(`Failed to find assets in county ${county} for owner ${ownerId}:`, error);
      throw new Error(`Could not retrieve assets: ${error.message}`);
    }
  }

  async transferOwnership(originalOwnerId: string, newOwnerId: string): Promise<void> {
    try {
      await this.prisma.asset.updateMany({
        where: {
          ownerId: originalOwnerId,
          isActive: true,
        },
        data: {
          ownerId: newOwnerId,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Successfully transferred assets from ${originalOwnerId} to ${newOwnerId}`);
    } catch (error) {
      this.logger.error(
        `Failed to transfer assets from ${originalOwnerId} to ${newOwnerId}:`,
        error,
      );
      throw new Error(`Could not transfer assets: ${error.message}`);
    }
  }

  async bulkUpdateVerificationStatus(assetIds: string[], verified: boolean): Promise<void> {
    try {
      await this.prisma.asset.updateMany({
        where: {
          id: { in: assetIds },
          isActive: true,
        },
        data: {
          hasVerifiedDocument: verified,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Successfully updated verification status for ${assetIds.length} assets`);
    } catch (error) {
      this.logger.error(`Failed to update verification status for assets:`, error);
      throw new Error(`Could not update verification status: ${error.message}`);
    }
  }

  async findCoOwnedAssets(userId: string): Promise<Asset[]> {
    try {
      const coOwnerships = await this.prisma.assetCoOwner.findMany({
        where: { userId },
        include: { asset: true },
      });

      const assets = coOwnerships.map((co) => co.asset);
      return AssetMapper.toDomainList(assets);
    } catch (error) {
      this.logger.error(`Failed to find co-owned assets for user ${userId}:`, error);
      throw new Error(`Could not retrieve co-owned assets: ${error.message}`);
    }
  }

  async findAssetsWithCoOwners(assetId: string): Promise<Asset[]> {
    try {
      const coOwnerships = await this.prisma.assetCoOwner.findMany({
        where: { assetId },
        include: { asset: true },
      });

      const assets = coOwnerships.map((co) => co.asset);
      return AssetMapper.toDomainList(assets);
    } catch (error) {
      this.logger.error(`Failed to find assets with co-owners for asset ${assetId}:`, error);
      throw new Error(`Could not retrieve assets with co-owners: ${error.message}`);
    }
  }
}
