import { AssetEncumbranceType } from '@prisma/client';

export class AssetEncumberedEvent {
  constructor(
    public readonly assetId: string,
    public readonly ownerId: string,
    public readonly encumbranceType: AssetEncumbranceType,
    public readonly details: string,
    public readonly amount: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
