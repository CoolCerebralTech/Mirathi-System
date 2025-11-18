// estate-planning/application/dto/response/beneficiary.response.dto.ts
import { BequestType, BequestConditionType, DistributionStatus } from '@prisma/client';

export class BeneficiaryResponseDto {
  id: string;
  willId: string;
  assetId: string;
  beneficiaryInfo: {
    userId?: string;
    familyMemberId?: string;
    externalName?: string;
    externalContact?: string;
    relationship?: string;
  };
  bequestType: BequestType;
  sharePercentage?: number;
  specificAmount?: number;
  conditionType: BequestConditionType;
  conditionDetails?: string;
  alternateBeneficiaryId?: string;
  alternateSharePercentage?: number;
  distributionStatus: DistributionStatus;
  distributedAt?: Date;
  distributionNotes?: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;

  // Computed properties
  beneficiaryName: string;
  isConditional: boolean;
  hasAlternate: boolean;
  isDistributed: boolean;
}
