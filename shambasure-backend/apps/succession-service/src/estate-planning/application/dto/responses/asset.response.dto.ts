import {
  AssetEncumbranceType,
  AssetOwnershipType,
  AssetType,
  AssetVerificationStatus,
  KenyanCounty,
} from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class AssetValueResponseDto {
  @Expose()
  amount: number;

  @Expose()
  currency: string;

  @Expose()
  valuationDate: Date | null;

  @Expose()
  valuationSource: string | null;

  @Expose()
  get formatted(): string {
    return `${this.currency} ${this.amount?.toLocaleString() ?? '0'}`;
  }

  @Expose()
  get isCurrent(): boolean {
    if (!this.valuationDate) return false;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return this.valuationDate >= oneYearAgo;
  }
}

@Exclude()
export class AssetLocationResponseDto {
  @Expose() county: KenyanCounty | null;
  @Expose() subCounty: string | null;
  @Expose() ward: string | null;
  @Expose() village: string | null;
  @Expose() landReferenceNumber: string | null;

  @Expose()
  gpsCoordinates: { latitude: number; longitude: number } | null;

  @Expose()
  get formattedAddress(): string {
    const parts = [this.village, this.ward, this.subCounty, this.county].filter(Boolean);
    return parts.join(', ') || 'Location not specified';
  }
}

@Exclude()
export class AssetIdentificationResponseDto {
  @Expose() titleDeedNumber: string | null;
  @Expose() registrationNumber: string | null;
  @Expose() kraPin: string | null;
  @Expose() identificationDetails: Record<string, any> | null;
}

@Exclude()
export class AssetEncumbranceResponseDto {
  @Expose() isEncumbered: boolean;
  @Expose() encumbranceType: AssetEncumbranceType | null;
  @Expose() encumbranceDetails: string | null;
  @Expose() encumbranceAmount: number | null;

  @Expose()
  get hasSignificantEncumbrance(): boolean {
    return this.isEncumbered && (this.encumbranceAmount ?? 0) > 0;
  }
}

@Exclude()
export class AssetLifeInterestResponseDto {
  @Expose() hasLifeInterest: boolean;
  @Expose() lifeInterestHolderId: string | null;
  @Expose() lifeInterestEndsAt: Date | null;

  @Expose()
  get isActive(): boolean {
    if (!this.hasLifeInterest || !this.lifeInterestEndsAt) return false;
    return this.lifeInterestEndsAt > new Date();
  }
}

@Exclude()
export class AssetMatrimonialResponseDto {
  @Expose() isMatrimonialProperty: boolean;
  @Expose() acquiredDuringMarriage: boolean;
  @Expose() spouseConsentRequired: boolean;
}

@Exclude()
export class AssetResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string | null;

  @Expose()
  type: AssetType;

  @Expose()
  ownerId: string;

  @Expose()
  ownershipType: AssetOwnershipType;

  @Expose()
  ownershipShare: number;

  // Nested DTOs
  @Expose()
  @Type(() => AssetLocationResponseDto)
  location: AssetLocationResponseDto;

  @Expose()
  @Type(() => AssetIdentificationResponseDto)
  identification: AssetIdentificationResponseDto;

  @Expose()
  @Type(() => AssetValueResponseDto)
  valuation: AssetValueResponseDto;

  @Expose()
  @Type(() => AssetEncumbranceResponseDto)
  encumbrance: AssetEncumbranceResponseDto;

  @Expose()
  @Type(() => AssetLifeInterestResponseDto)
  lifeInterest: AssetLifeInterestResponseDto;

  @Expose()
  @Type(() => AssetMatrimonialResponseDto)
  matrimonial: AssetMatrimonialResponseDto;

  // Status & Verification
  @Expose()
  verificationStatus: AssetVerificationStatus;

  @Expose()
  isActive: boolean;

  @Expose()
  requiresProbate: boolean;

  // Domain Logic Exposed
  @Expose()
  get canBeTransferred(): boolean {
    // This mirrors the domain logic for UI decision making
    if (!this.isActive) return false;
    if (this.verificationStatus !== AssetVerificationStatus.VERIFIED) return false;
    if (this.lifeInterest.isActive) return false;
    if (this.encumbrance.isEncumbered && this.encumbrance.encumbranceType === 'COURT_ORDER')
      return false;
    return true;
  }

  @Expose()
  get netEquityValue(): number {
    const value = this.valuation.amount ?? 0;
    const debt = this.encumbrance.encumbranceAmount ?? 0;
    const netValue = Math.max(0, value - debt);
    return netValue * (this.ownershipShare / 100);
  }

  @Expose()
  get formattedNetEquity(): string {
    return `${this.valuation.currency} ${this.netEquityValue.toLocaleString()}`;
  }

  // Timestamps
  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  deletedAt: Date | null;
}
