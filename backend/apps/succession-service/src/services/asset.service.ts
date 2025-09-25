import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { AssetRepository } from '../repositories/asset.repository';
import { AssetEntity } from '../entities/will.entity';
import { MessagingService } from '@shamba/messaging';
import { LoggerService } from '@shamba/observability';
import { 
  CreateAssetDto, 
  UpdateAssetDto, 
  AssetResponseDto, 
  AssetType,
  EventType 
} from '@shamba/common';
import { JwtPayload } from '@shamba/auth';

@Injectable()
export class AssetService {
  constructor(
    private assetRepository: AssetRepository,
    private messagingService: MessagingService,
    private logger: LoggerService,
  ) {}

  async createAsset(createAssetDto: CreateAssetDto, ownerId: string): Promise<AssetResponseDto> {
    this.logger.info('Creating new asset', 'AssetService', { 
      ownerId,
      assetType: createAssetDto.type,
    });

    const assetEntity = await this.assetRepository.create(ownerId, createAssetDto);

    // Publish asset created event
    await this.messagingService.publish(EventType.ASSET_CREATED, {
      assetId: assetEntity.id,
      ownerId: assetEntity.ownerId,
      name: assetEntity.name,
      type: assetEntity.type,
      timestamp: new Date(),
    });

    this.logger.info('Asset created successfully', 'AssetService', { 
      assetId: assetEntity.id,
      ownerId,
    });

    return this.mapToResponseDto(assetEntity);
  }

  async getAssetById(assetId: string, currentUser: JwtPayload): Promise<AssetResponseDto> {
    this.logger.debug('Fetching asset by ID', 'AssetService', { assetId });

    const assetEntity = await this.assetRepository.findById(assetId);

    // Authorization: Only owner or admin can view asset
    if (assetEntity.ownerId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to this asset');
    }

    return this.mapToResponseDto(assetEntity);
  }

  async getAssetsByOwner(ownerId: string, currentUser: JwtPayload): Promise<AssetResponseDto[]> {
    this.logger.debug('Fetching assets for owner', 'AssetService', { ownerId });

    // Authorization: Users can only view their own assets unless admin
    if (ownerId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to these assets');
    }

    const assetEntities = await this.assetRepository.findByOwnerId(ownerId);
    return assetEntities.map(asset => this.mapToResponseDto(asset));
  }

  async getAssetsByType(ownerId: string, type: AssetType, currentUser: JwtPayload): Promise<AssetResponseDto[]> {
    this.logger.debug('Fetching assets by type', 'AssetService', { ownerId, type });

    // Authorization: Users can only view their own assets unless admin
    if (ownerId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to these assets');
    }

    const assetEntities = await this.assetRepository.getAssetsByType(ownerId, type);
    return assetEntities.map(asset => this.mapToResponseDto(asset));
  }

  async updateAsset(assetId: string, updateAssetDto: UpdateAssetDto, currentUser: JwtPayload): Promise<AssetResponseDto> {
    this.logger.info('Updating asset', 'AssetService', { assetId });

    const existingAsset = await this.assetRepository.findById(assetId);

    // Authorization: Only owner can update their asset
    if (existingAsset.ownerId !== currentUser.userId) {
      throw new ForbiddenException('Only the owner can update this asset');
    }

    const assetEntity = await this.assetRepository.update(assetId, updateAssetDto);

    this.logger.info('Asset updated successfully', 'AssetService', { assetId });

    return this.mapToResponseDto(assetEntity);
  }

  async deleteAsset(assetId: string, currentUser: JwtPayload): Promise<void> {
    this.logger.info('Deleting asset', 'AssetService', { assetId });

    const existingAsset = await this.assetRepository.findById(assetId);

    // Authorization: Only owner or admin can delete asset
    if (existingAsset.ownerId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to delete this asset');
    }

    await this.assetRepository.delete(assetId);

    this.logger.info('Asset deleted successfully', 'AssetService', { assetId });
  }

  async searchAssets(ownerId: string, query: string, currentUser: JwtPayload): Promise<AssetResponseDto[]> {
    this.logger.debug('Searching assets', 'AssetService', { ownerId, query });

    // Authorization: Users can only search their own assets unless admin
    if (ownerId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to search these assets');
    }

    const assetEntities = await this.assetRepository.searchAssets(ownerId, query);
    return assetEntities.map(asset => this.mapToResponseDto(asset));
  }

  async getAssetStats(ownerId: string, currentUser: JwtPayload): Promise<any> {
    this.logger.debug('Fetching asset statistics', 'AssetService', { ownerId });

    // Authorization: Users can only view their own stats unless admin
    if (ownerId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to these statistics');
    }

    const stats = await this.assetRepository.getAssetStats(ownerId);

    return {
      ...stats,
      generatedAt: new Date().toISOString(),
    };
  }

  async getAssetValuation(assetId: string, currentUser: JwtPayload): Promise<{
    assetId: string;
    estimatedValue: number | null;
    valuationMethod: string;
    lastValuationDate: Date | null;
    confidence: 'high' | 'medium' | 'low';
  }> {
    this.logger.debug('Getting asset valuation', 'AssetService', { assetId });

    const asset = await this.assetRepository.findById(assetId);

    // Authorization: Only owner or admin can view valuation
    if (asset.ownerId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to this asset valuation');
    }

    // This would integrate with external valuation services
    const valuation = {
      assetId: asset.id,
      estimatedValue: asset.getEstimatedValue(),
      valuationMethod: this.getValuationMethod(asset.type),
      lastValuationDate: asset.metadata?.lastValuationDate 
        ? new Date(asset.metadata.lastValuationDate) 
        : null,
      confidence: this.getValuationConfidence(asset),
    };

    return valuation;
  }

  async bulkCreateAssets(assets: CreateAssetDto[], ownerId: string): Promise<AssetResponseDto[]> {
    this.logger.info('Bulk creating assets', 'AssetService', { 
      ownerId,
      count: assets.length,
    });

    const createdAssets: AssetResponseDto[] = [];

    for (const assetDto of assets) {
      try {
        const asset = await this.createAsset(assetDto, ownerId);
        createdAssets.push(asset);
      } catch (error) {
        this.logger.error('Failed to create asset in bulk operation', 'AssetService', {
          assetName: assetDto.name,
          error: error.message,
        });
        // Continue with other assets
      }
    }

    this.logger.info('Bulk asset creation completed', 'AssetService', {
      successful: createdAssets.length,
      failed: assets.length - createdAssets.length,
    });

    return createdAssets;
  }

  private getValuationMethod(assetType: AssetType): string {
    const methods: Record<AssetType, string> = {
      [AssetType.LAND_PARCEL]: 'comparable_sales',
      [AssetType.BANK_ACCOUNT]: 'account_balance',
      [AssetType.VEHICLE]: 'depreciated_cost',
      [AssetType.PROPERTY]: 'income_approach',
      [AssetType.OTHER]: 'market_comparison',
    };

    return methods[assetType] || 'market_comparison';
  }

  private getValuationConfidence(asset: AssetEntity): 'high' | 'medium' | 'low' {
    if (asset.metadata?.lastValuationDate) {
      const valuationAge = Date.now() - new Date(asset.metadata.lastValuationDate).getTime();
      const oneYear = 365 * 24 * 60 * 60 * 1000;

      if (valuationAge < oneYear) {
        return 'high';
      } else if (valuationAge < 3 * oneYear) {
        return 'medium';
      }
    }

    return 'low';
  }

  private mapToResponseDto(asset: AssetEntity): AssetResponseDto {
    return {
      id: asset.id,
      name: asset.name,
      description: asset.description,
      type: asset.type,
      ownerId: asset.ownerId,
      owner: asset.owner ? {
        id: asset.owner.id,
        email: asset.owner.email,
        firstName: asset.owner.firstName,
        lastName: asset.owner.lastName,
      } : undefined,
      metadata: asset.metadata,
      beneficiaryAssignments: asset.beneficiaryAssignments?.map(assignment => ({
        id: assignment.id,
        willId: assignment.willId,
        beneficiaryId: assignment.beneficiaryId,
        sharePercent: assignment.sharePercent,
        will: assignment.will ? {
          id: assignment.will.id,
          title: assignment.will.title,
          status: assignment.will.status,
        } : undefined,
        beneficiary: assignment.beneficiary ? {
          id: assignment.beneficiary.id,
          email: assignment.beneficiary.email,
          firstName: assignment.beneficiary.firstName,
          lastName: assignment.beneficiary.lastName,
        } : undefined,
      })) || [],
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  }
}