import { AssetOwnershipType, AssetType } from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';

// Reusable Value Object DTO
@Exclude()
export class AssetValueResponse {
  @Expose()
  amount: number;

  @Expose()
  currency: string;

  @Expose()
  valuationDate: Date;

  @Expose()
  get formatted(): string {
    return `${this.currency} ${this.amount.toLocaleString()}`;
  }
}

@Exclude()
export class AssetLocationResponse {
  @Expose() county: string;
  @Expose() subCounty?: string;
  @Expose() ward?: string;
  @Expose() gpsCoordinates?: { latitude: number; longitude: number };
}

@Exclude()
export class AssetResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  type: AssetType;

  @Expose()
  @Type(() => AssetValueResponse)
  currentValue: AssetValueResponse;

  @Expose()
  ownershipType: AssetOwnershipType;

  @Expose()
  ownershipShare: number;

  @Expose()
  @Type(() => AssetLocationResponse)
  location: AssetLocationResponse;

  // Status Flags (Critical for UI badges)
  @Expose()
  hasVerifiedDocument: boolean;

  @Expose()
  isEncumbered: boolean;

  @Expose()
  encumbranceDetails?: string;

  @Expose()
  encumbranceAmount?: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
