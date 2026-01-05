// =============================================================================
// ASSET SERVICES
// =============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { Asset, AssetCategory, AssetStatus } from '../../domain/entities/asset.entity';
import { CalculateNetWorthService } from './estate.service';

@Injectable()
export class AddAssetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculateNetWorth: CalculateNetWorthService,
  ) {}

  async execute(
    estateId: string,
    name: string,
    category: AssetCategory,
    estimatedValue: number,
    description?: string,
    metadata?: any,
  ): Promise<Asset> {
    // Verify estate exists
    const estate = await this.prisma.estate.findUnique({
      where: { id: estateId },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    const asset = Asset.create(estateId, name, category, estimatedValue, description);

    // Create asset
    const created = await this.prisma.asset.create({
      data: {
        ...asset.toJSON(),
        estimatedValue: estimatedValue.toString(),
      },
    });

    // Create category-specific details if needed
    if (category === AssetCategory.LAND && metadata?.landDetails) {
      await this.prisma.landDetails.create({
        data: {
          assetId: created.id,
          ...metadata.landDetails,
        },
      });
    }

    if (category === AssetCategory.VEHICLE && metadata?.vehicleDetails) {
      await this.prisma.vehicleDetails.create({
        data: {
          assetId: created.id,
          ...metadata.vehicleDetails,
        },
      });
    }

    // Recalculate net worth
    await this.calculateNetWorth.execute(estateId);

    return asset;
  }
}

@Injectable()
export class ListAssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(estateId: string) {
    const assets = await this.prisma.asset.findMany({
      where: { estateId },
      include: {
        landDetails: true,
        vehicleDetails: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      description: asset.description,
      category: asset.category,
      status: asset.status,
      estimatedValue: Number(asset.estimatedValue),
      currency: asset.currency,
      isVerified: asset.isVerified,
      isEncumbered: asset.isEncumbered,
      proofDocumentUrl: asset.proofDocumentUrl,
      purchaseDate: asset.purchaseDate,
      location: asset.location,
      landDetails: asset.landDetails,
      vehicleDetails: asset.vehicleDetails,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    }));
  }
}

@Injectable()
export class UpdateAssetValueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculateNetWorth: CalculateNetWorthService,
  ) {}

  async execute(assetId: string, newValue: number, reason?: string): Promise<void> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        estimatedValue: newValue.toString(),
        updatedAt: new Date(),
      },
    });

    // Recalculate net worth
    await this.calculateNetWorth.execute(asset.estateId);
  }
}

@Injectable()
export class VerifyAssetService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(assetId: string, proofDocumentUrl: string): Promise<void> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        isVerified: true,
        proofDocumentUrl,
        status: AssetStatus.VERIFIED,
        updatedAt: new Date(),
      },
    });
  }
}
