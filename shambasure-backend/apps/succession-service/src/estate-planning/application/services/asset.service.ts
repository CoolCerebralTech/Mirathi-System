// estate-planning/application/services/asset.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { AssetType, AssetOwnershipType } from '@prisma/client';
import { AssetRepositoryInterface } from '../../domain/repositories/asset.repository.interface';
import { WillRepositoryInterface } from '../../domain/repositories/will.repository.interface';
import { AssetValue } from '../../domain/value-objects/asset-value.vo';
import { AddAssetCommand } from '../commands/add-asset.command';
import { RemoveAssetCommand } from '../commands/remove-asset.command';
import { GetEstateAssetsQuery } from '../queries/get-estate-assets.query';
import { AssetResponseDto } from '../dto/response/asset.response.dto';

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  constructor(
    private readonly assetRepository: AssetRepositoryInterface,
    private readonly willRepository: WillRepositoryInterface
  ) {}

  async addAssetToWill(addAssetDto: any, willId: string, testatorId: string): Promise<AssetResponseDto> {
    try {
      const willAggregate = await this.willRepository.findById(willId);
      
      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      if (willAggregate.getWill().getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      if (!willAggregate.getWill().canBeModified()) {
        throw new BadRequestException('Cannot add assets to will in its current status');
      }

      // Create asset value object
      const assetValue = new AssetValue(
        addAssetDto.estimatedValue,
        addAssetDto.currency || 'KES'
      );

      // Create asset entity
      const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // This would use the Asset.create factory method from domain
      const asset = {
        getId: () => assetId,
        getName: () => addAssetDto.name,
        getDescription: () => addAssetDto.description || '',
        getType: () => addAssetDto.type,
        getOwnerId: () => testatorId,
        getCurrentValue: () => assetValue,
        // ... other getter methods
      } as any;

      // Set additional properties
      Object.assign(asset, {
        ownershipType: addAssetDto.ownershipType || AssetOwnershipType.SOLE,
        ownershipShare: addAssetDto.ownershipShare || 100,
        location: addAssetDto.location,
        identification: addAssetDto.identification,
        metadata: addAssetDto.metadata,
        hasVerifiedDocument: false,
        isEncumbered: false
      });

      // Add asset to will aggregate
      willAggregate.addAsset(asset);

      // Save will (which will save the asset through repository)
      await this.willRepository.save(willAggregate);

      return this.mapToAssetResponseDto(asset);
    } catch (error) {
      this.logger.error(`Failed to add asset to will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not add asset: ${error.message}`);
    }
  }

  async removeAssetFromWill(assetId: string, willId: string, testatorId: string): Promise<void> {
    try {
      const willAggregate = await this.willRepository.findById(willId);
      
      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      if (willAggregate.getWill().getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      if (!willAggregate.getWill().canBeModified()) {
        throw new BadRequestException('Cannot remove assets from will in its current status');
      }

      // Remove asset from will aggregate
      willAggregate.removeAsset(assetId);

      await this.willRepository.save(willAggregate);
    } catch (error) {
      this.logger.error(`Failed to remove asset ${assetId} from will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not remove asset: ${error.message}`);
    }
  }

  async getEstateAssets(testatorId: string, willId?: string, includeStandalone: boolean = true): Promise<{
    willAssets: AssetResponseDto[];
    standaloneAssets: AssetResponseDto[];
    totalValue: number;
  }> {
    try {
      let willAssets: AssetResponseDto[] = [];
      let standaloneAssets: AssetResponseDto[] = [];

      // Get assets from specific will
      if (willId) {
        const willAggregate = await this.willRepository.findById(willId);
        if (willAggregate && willAggregate.getWill().getTestatorId() === testatorId) {
          willAssets = willAggregate.getAllAssets().map(asset => this.mapToAssetResponseDto(asset));
        }
      } else {
        // Get assets from all wills
        const wills = await this.willRepository.findByTestatorId(testatorId);
        for (const willAggregate of wills) {
          const assets = willAggregate.getAllAssets().map(asset => this.mapToAssetResponseDto(asset));
          willAssets.push(...assets);
        }
      }

      // Get standalone assets (not in any will)
      if (includeStandalone) {
        const standaloneAssetsEntities = await this.assetRepository.findByOwnerId(testatorId);
        standaloneAssets = standaloneAssetsEntities.map(asset => this.mapToAssetResponseDto(asset));
      }

      // Calculate total value
      const totalValue = [...willAssets, ...standaloneAssets].reduce((sum, asset) => {
        return sum + asset.currentValue.amount;
      }, 0);

      return {
        willAssets,
        standaloneAssets,
        totalValue
      };
    } catch (error) {
      this.logger.error(`Failed to get estate assets for testator ${testatorId}:`, error);
      throw new BadRequestException(`Could not retrieve estate assets: ${error.message}`);
    }
  }

  async updateAssetVerification(assetId: string, verified: boolean, verifiedBy: string): Promise<AssetResponseDto> {
    try {
      const asset = await this.assetRepository.findById(assetId);
      
      if (!asset) {
        throw new NotFoundException(`Asset ${assetId} not found`);
      }

      if (verified) {
        asset.markAsVerified();
      } else {
        asset.markAsUnverified();
      }

      await this.assetRepository.save(asset);

      return this.mapToAssetResponseDto(asset);
    } catch (error) {
      this.logger.error(`Failed to update asset verification for ${assetId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Could not update asset verification: ${error.message}`);
    }
  }

  async getAssetsByType(testatorId: string, assetType: AssetType): Promise<AssetResponseDto[]> {
    try {
      const assets = await this.assetRepository.findByType(testatorId, assetType);
      return assets.map(asset => this.mapToAssetResponseDto(asset));
    } catch (error) {
      this.logger.error(`Failed to get assets of type ${assetType} for testator ${testatorId}:`, error);
      throw new BadRequestException(`Could not retrieve assets: ${error.message}`);
    }
  }

  private mapToAssetResponseDto(asset: any): AssetResponseDto {
    const currentValue = asset.getCurrentValue();
    
    return {
      id: asset.getId(),
      name: asset.getName(),
      description: asset.getDescription(),
      type: asset.getType(),
      ownerId: asset.getOwnerId(),
      ownershipType: asset.getOwnershipType(),
      ownershipShare: asset.getOwnershipShare(),
      currentValue: {
        amount: currentValue.getAmount(),
        currency: currentValue.getCurrency(),
        valuationDate: currentValue.getValuationDate()
      },
      location: asset.getLocation(),
      identification: asset.getIdentification(),
      hasVerifiedDocument: asset.getHasVerifiedDocument(),
      isEncumbered: asset.getIsEncumbered(),
      encumbranceDetails: asset.getEncumbranceDetails(),
      metadata: asset.getMetadata(),
      isActive: asset.getIsActive(),
      createdAt: asset.getCreatedAt(),
      updatedAt: asset.getUpdatedAt(),
      isFullyOwned: asset.isFullyOwned ? asset.isFullyOwned() : (asset.getOwnershipShare() === 100),
      canBeTransferred: asset.canBeTransferred ? asset.canBeTransferred() : true,
      transferableValue: asset.getTransferableValue ? asset.getTransferableValue().getAmount() : currentValue.getAmount()
    };
  }
}