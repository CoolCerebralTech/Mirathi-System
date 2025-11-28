import { BequestConditionType, BequestType, DistributionStatus } from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';

import { AssetValueResponse } from './asset.response.dto';

@Exclude()
export class BeneficiaryIdentityResponse {
  @Expose() userId?: string;
  @Expose() familyMemberId?: string;
  @Expose() externalName?: string;
  @Expose() relationship?: string;

  @Expose()
  get displayName(): string {
    return this.externalName || 'Unknown Beneficiary';
  }
}

@Exclude()
export class BeneficiaryResponseDto {
  @Expose()
  id: string;

  @Expose()
  willId: string;

  @Expose()
  assetId: string;

  @Expose()
  @Type(() => BeneficiaryIdentityResponse)
  identity: BeneficiaryIdentityResponse;

  @Expose()
  bequestType: BequestType;

  @Expose()
  sharePercentage?: number; // Flattened from SharePercentage VO

  @Expose()
  @Type(() => AssetValueResponse)
  specificAmount?: AssetValueResponse;

  // Conditions
  @Expose()
  hasCondition: boolean;

  @Expose()
  conditionType: BequestConditionType;

  @Expose()
  conditionDetails?: string;

  // Status
  @Expose()
  distributionStatus: DistributionStatus;

  @Expose()
  distributedAt?: Date;

  @Expose()
  priority: number;
}
