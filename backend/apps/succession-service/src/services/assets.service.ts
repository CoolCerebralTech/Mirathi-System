import { Injectable, ForbiddenException } from '@nestjs/common';
import { Asset } from '@shamba/database';
import { CreateAssetRequestDto, UpdateAssetRequestDto, EventPattern, ShambaEvent } from '@shamba/common';
import { JwtPayload } from '@shamba/auth';
import { MessagingService } from '@shamba/messaging';
import { AssetsRepository } from '../repositories/assets.repository';

@Injectable()
export class AssetsService {
  constructor(
    private readonly assetsRepository: AssetsRepository,
    private readonly messagingService: MessagingService,
  ) {}

  async create(ownerId: string, data: CreateAssetRequestDto): Promise<Asset> {
    const asset = await this.assetsRepository.create({
      ...data,
      owner: { connect: { id: ownerId } },
    });

    // Publish event
    const event: ShambaEvent = {
      type: EventPattern.ASSET_CREATED,
      timestamp: new Date(),
      version: '1.0',
      source: 'succession-service',
      data: { assetId: asset.id, ownerId: asset.ownerId, name: asset.name, type: asset.type },
    };
    this.messagingService.emit(event);

    return asset;
  }

  async findOne(assetId: string, currentUser: JwtPayload): Promise<Asset> {
    const asset = await this.assetsRepository.findOneOrFail({ id: assetId });
    if (asset.ownerId !== currentUser.sub && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to this asset.');
    }
    return asset;
  }

  async findForOwner(ownerId: string): Promise<Asset[]> {
    return this.assetsRepository.findMany({ ownerId });
  }

  async update(assetId: string, data: UpdateAssetRequestDto, currentUser: JwtPayload): Promise<Asset> {
    const asset = await this.findOne(assetId, currentUser); // Re-uses auth check
    return this.assetsRepository.update(asset.id, data);
  }

  async delete(assetId: string, currentUser: JwtPayload): Promise<void> {
    const asset = await this.findOne(assetId, currentUser); // Re-uses auth check

    // Business Logic: Check if asset is part of a will before deleting
    // This requires injecting the WillsRepository/Service, showing inter-service logic
    // const assignments = await this.willsRepository.findAssignments({ assetId: asset.id });
    // if(assignments.length > 0) { throw new ConflictException(...) }

    await this.assetsRepository.delete(asset.id);
  }
}