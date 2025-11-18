// estate-planning/application/dto/response/asset.response.dto.ts
import { AssetType, AssetOwnershipType } from '@prisma/client';

export class AssetResponseDto {
  id: string;
  name: string;
  description: string;
  type: AssetType;
  ownerId: string;
  ownershipType: AssetOwnershipType;
  ownershipShare: number;
  currentValue: {
    amount: number;
    currency: string;
    valuationDate: Date;
  };
  location?: {
    county: string;
    subCounty?: string;
    gpsCoordinates?: { latitude: number; longitude: number };
  };
  identification?: {
    registrationNumber?: string;
    serialNumber?: string;
    accountNumber?: string;
  };
  hasVerifiedDocument: boolean;
  isEncumbered: boolean;
  encumbranceDetails?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Computed properties
  isFullyOwned: boolean;
  canBeTransferred: boolean;
  transferableValue: number;
}
