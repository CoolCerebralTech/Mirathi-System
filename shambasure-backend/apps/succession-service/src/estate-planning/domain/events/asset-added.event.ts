import { AssetType, AssetOwnershipType } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';

export class AssetAddedEvent {
  constructor(
    public readonly assetId: string,
    public readonly ownerId: string,
    public readonly assetType: AssetType,
    public readonly ownershipType: AssetOwnershipType,
    public readonly initialValue: AssetValue,
    public readonly timestamp: Date = new Date(),
  ) {}
}
