// =============================================================================
// ASSET APPLICATION SERVICES
// =============================================================================
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AssetCategory, AssetStatus } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Asset, LandDetailsProps, VehicleDetailsProps } from '../../domain/entities/asset.entity';
import { CalculateNetWorthService } from './estate.service';

// Type Guard Union for Metadata
type AssetMetadata =
  | { type: 'LAND'; details: LandDetailsProps }
  | { type: 'VEHICLE'; details: VehicleDetailsProps }
  | { type: 'GENERIC' };

@Injectable()
export class AddAssetService {
  private readonly logger = new Logger(AddAssetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculateNetWorth: CalculateNetWorthService,
  ) {}

  async execute(
    estateId: string,
    category: AssetCategory,
    estimatedValue: number,
    metadata: AssetMetadata,
    description?: string,
    genericName?: string, // Only used if not Land/Vehicle
  ): Promise<Asset> {
    // 1. Verify Estate Exists
    const estate = await this.prisma.estate.findUnique({ where: { id: estateId } });
    if (!estate) throw new NotFoundException('Estate not found');

    // 2. Instantiate Domain Entity using Factories
    let asset: Asset;

    try {
      if (category === AssetCategory.LAND && metadata.type === 'LAND') {
        asset = Asset.createLand(estateId, estimatedValue, metadata.details, description);
      } else if (category === AssetCategory.VEHICLE && metadata.type === 'VEHICLE') {
        asset = Asset.createVehicle(estateId, estimatedValue, metadata.details, description);
      } else {
        // Generic Fallback
        if (!genericName)
          throw new BadRequestException('Asset name is required for generic assets');
        asset = Asset.create(estateId, genericName, category, estimatedValue, description);
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    // 3. Persist Transactionally (ACID Compliance)
    // Ensures we don't get an Asset row without its Land/Vehicle details row

    // 4. Trigger Side Effects (Net Worth)
    // We do this outside the transaction to keep the DB lock short
    await this.calculateNetWorth.execute(estateId).catch((err) => {
      this.logger.error(`Failed to recalculate net worth for estate ${estateId}`, err);
    });

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

    // Transform Persistence -> Domain/DTO
    return assets.map((asset) => {
      // Rehydrate Domain Entity logic if needed, or return DTO
      return {
        id: asset.id,
        name: asset.name,
        description: asset.description,
        category: asset.category,
        status: asset.status,
        estimatedValue: Number(asset.estimatedValue),
        currency: asset.currency,
        isVerified: asset.isVerified,
        proofDocumentUrl: asset.proofDocumentUrl,
        isEncumbered: asset.isEncumbered,
        encumbranceDetails: asset.encumbranceDetails,

        // Flattened Details for Frontend Convenience
        details: asset.landDetails
          ? {
              type: 'LAND',
              ...asset.landDetails,
              sizeInAcres: Number(asset.landDetails.sizeInAcres),
            }
          : asset.vehicleDetails
            ? { type: 'VEHICLE', ...asset.vehicleDetails }
            : null,

        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      };
    });
  }
}

@Injectable()
export class UpdateAssetValueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculateNetWorth: CalculateNetWorthService,
  ) {}

  async execute(assetId: string, newValue: number): Promise<void> {
    if (newValue < 0) throw new BadRequestException('Value cannot be negative');

    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) throw new NotFoundException('Asset not found');

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
    if (!proofDocumentUrl) {
      throw new BadRequestException('Proof document URL is required for verification');
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) throw new NotFoundException('Asset not found');

    await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        isVerified: true,
        proofDocumentUrl,
        status: AssetStatus.VERIFIED,
        updatedAt: new Date(),
      },
    });

    // Future Innovation: Trigger OCR Job here to read the Title Deed
  }
}
