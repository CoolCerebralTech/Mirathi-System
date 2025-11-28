import { AssetOwnershipType, AssetType } from '@prisma/client';

export class AssetAddedEvent {
  constructor(
    public readonly assetId: string,
    public readonly ownerId: string,
    public readonly assetType: AssetType,
    public readonly ownershipType: AssetOwnershipType,
    public readonly timestamp: Date = new Date(),
  ) {}
}
