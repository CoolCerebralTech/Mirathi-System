// estate-planning/application/dto/request/add-asset.dto.ts
import { AssetType, AssetOwnershipType } from '@prisma/client';

export class AddAssetRequestDto {
  name: string;
  type: AssetType;
  estimatedValue: number;
  currency?: string;
  description?: string;
  ownershipType?: AssetOwnershipType;
  ownershipShare?: number;
  location?: {
    county: string;
    subCounty?: string;
    gpsCoordinates?: { latitude: number; longitude: number };
  };
  identification?: {
    registrationNumber?: string;
    accountNumber?: string;
    parcelNumber?: string;
  };
  metadata?: Record<string, any>;
}
