// estate-planning/application/commands/add-asset.command.ts
import { AssetType, AssetOwnershipType } from '@prisma/client';

export class AddAssetCommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly name: string,
    public readonly type: AssetType,
    public readonly estimatedValue: number,
    public readonly currency: string,
    public readonly description?: string,
    public readonly ownershipType: AssetOwnershipType = AssetOwnershipType.SOLE,
    public readonly ownershipShare: number = 100,
    public readonly location?: {
      county: string;
      subCounty?: string;
      gpsCoordinates?: { latitude: number; longitude: number };
    },
    public readonly identification?: {
      registrationNumber?: string;
      accountNumber?: string;
      parcelNumber?: string;
    },
    public readonly metadata?: Record<string, any>,
  ) {}
}
