// estate-asset-added.event.ts
import { IEvent } from '@nestjs/cqrs';
import { AssetType } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';

/**
 * Event emitted when an asset is added to an estate aggregate
 * Different from AssetAddedEvent which is for individual asset creation
 * @class EstateAssetAddedEvent
 * @implements {IEvent}
 */
export class EstateAssetAddedEvent implements IEvent {
  constructor(
    public readonly estateId: string,
    public readonly assetId: string,
    public readonly assetType: AssetType,
    public readonly assetValue: AssetValue,
    public readonly addedAt: Date,
  ) {}
}
