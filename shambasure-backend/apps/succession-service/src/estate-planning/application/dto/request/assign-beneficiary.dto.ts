// estate-planning/application/dto/request/assign-beneficiary.dto.ts
import { BequestType, BequestConditionType } from '@prisma/client';

export class AssignBeneficiaryRequestDto {
  assetId: string;
  beneficiaryType: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL';
  beneficiaryId?: string;
  externalBeneficiary?: {
    name: string;
    contact?: string;
  };
  bequestType: BequestType;
  sharePercentage?: number;
  specificAmount?: number;
  conditionType?: BequestConditionType;
  conditionDetails?: string;
  priority?: number;
  relationship?: string;
}
