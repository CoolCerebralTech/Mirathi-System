// ============================================================================
// assets.service.ts - Asset Management Business Logic
// ============================================================================

import { 
  Injectable, 
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Asset, AssetType, UserRole } from '@shamba/database';
import { 
  CreateAssetRequestDto, 
  UpdateAssetRequestDto, 
  EventPattern, 
  AssetCreatedEvent,
  AssetUpdatedEvent,
  AssetDeletedEvent,
} from '@shamba/common';
import { JwtPayload } from '@shamba/auth';
import { MessagingService } from '@shamba/messaging';
import { AssetsRepository } from '../repositories/assets.repository';
import { WillsRepository } from '../repositories/wills.repository';

/**
 * AssetsService - Asset management business logic
 * 
 * BUSINESS RULES:
 * - Users can only manage their own assets (unless admin)
 * - Assets cannot be deleted if assigned in an active will
 * - Asset names must be unique per owner
 * - Land parcels require description (title deed reference)
 */
@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    private readonly assetsRepository: AssetsRepository,
    private readonly willsRepository: WillsRepository,
    private readonly messagingService: MessagingService,
  ) {}

  // ========================================================================
  // CREATE OPERATIONS
  // ========================================================================

  async create(ownerId: string, data: CreateAssetRequestDto): Promise<Asset> {
    // Business rule: Land parcels should have description (title deed info)
    if (data.type === AssetType.LAND_PARCEL && !data.description) {
      throw new BadRequestException(
        'Land parcels must include a description with title deed information'
      );
    }

    const asset = await this.assetsRepository.create({
      name: data.name,
      description: data.description,
      type: data.type,
      owner: { connect: { id: ownerId } },
    });

    // Publish event
    this.publishAssetCreatedEvent(asset);

    this.logger.log(`Asset created: ${asset.id} by owner ${ownerId}`);
    return asset;
  }

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  async findOne(assetId: string, currentUser: JwtPayload): Promise<Asset> {
    const asset = await this.assetsRepository.findOneOrFailWithAssignments({ 
      id: assetId 
    });

    // Authorization check
    if (asset.ownerId !== currentUser.sub && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to access this asset');
    }

    return asset;
  }

  async findForOwner(ownerId: string): Promise<Asset[]> {
    return this.assetsRepository.findByOwner(ownerId);
  }

  async findByType(ownerId: string, type: AssetType): Promise<Asset[]> {
    return this.assetsRepository.findByOwnerAndType(ownerId, type);
  }

  async getOwnerStats(ownerId: string) {
    const assets = await this.assetsRepository.findByOwner(ownerId);
    
    // Group by type
    const byType = assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {} as Record<AssetType, number>);

    return {
      totalAssets: assets.length,
      byType,
    };
  }

  // ========================================================================
  // UPDATE OPERATIONS
  // ========================================================================

  async update(
    assetId: string, 
    data: UpdateAssetRequestDto, 
    currentUser: JwtPayload
  ): Promise<Asset> {
    // Check ownership
    const asset = await this.findOne(assetId, currentUser);

    // Business rule: Cannot change type if asset is assigned in active will
    if (data.type && data.type !== asset.type) {
      const assignments = await this.willsRepository.findAssignmentsByAsset(assetId);
      if (assignments.length > 0) {
        throw new ConflictException(
          'Cannot change asset type while it is assigned in a will'
        );
      }
    }

    const updatedAsset = await this.assetsRepository.update(assetId, data);

    // Publish event
    this.publishAssetUpdatedEvent(updatedAsset);

    this.logger.log(`Asset updated: ${assetId} by user ${currentUser.sub}`);
    return updatedAsset;
  }

  // ========================================================================
  // DELETE OPERATIONS
  // ========================================================================

  async delete(assetId: string, currentUser: JwtPayload): Promise<void> {
    // Check ownership
    const asset = await this.findOne(assetId, currentUser);

    // Business rule: Cannot delete asset if assigned in any will
    const assignments = await this.willsRepository.findAssignmentsByAsset(assetId);
    if (assignments.length > 0) {
      throw new ConflictException(
        'Cannot delete asset that is assigned in a will. Remove assignments first.'
      );
    }

    await this.assetsRepository.delete(assetId);

    // Publish event
    this.publishAssetDeletedEvent(asset);

    this.logger.log(`Asset deleted: ${assetId} by user ${currentUser.sub}`);
  }

  // ========================================================================
  // EVENT PUBLISHING
  // ========================================================================

  private publishAssetCreatedEvent(asset: Asset): void {
    const event: AssetCreatedEvent = {
      type: EventPattern.ASSET_CREATED,
      timestamp: new Date(),
      version: '1.0',
      source: 'succession-service',
      data: { 
        assetId: asset.id, 
        ownerId: asset.ownerId, 
        name: asset.name, 
        type: asset.type 
      },
    };

    try {
      this.messagingService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to publish AssetCreatedEvent`, error);
    }
  }

  private publishAssetUpdatedEvent(asset: Asset): void {
    const event: AssetUpdatedEvent = {
      type: EventPattern.ASSET_UPDATED,
      timestamp: new Date(),
      version: '1.0',
      source: 'succession-service',
      data: { 
        assetId: asset.id, 
        ownerId: asset.ownerId,
        name: asset.name,
      },
    };

    try {
      this.messagingService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to publish AssetUpdatedEvent`, error);
    }
  }

  private publishAssetDeletedEvent(asset: Asset): void {
    const event: AssetDeletedEvent = {
      type: EventPattern.ASSET_DELETED,
      timestamp: new Date(),
      version: '1.0',
      source: 'succession-service',
      data: { 
        assetId: asset.id, 
        ownerId: asset.ownerId 
      },
    };

    try {
      this.messagingService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to publish AssetDeletedEvent`, error);
    }
  }
}
