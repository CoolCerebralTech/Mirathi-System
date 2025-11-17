import { BequestType } from '@prisma/client';
import { SharePercentage } from '../value-objects/share-percentage.vo';
import { AssetValue } from '../value-objects/asset-value.vo';

export class BeneficiaryAssignedEvent {
  constructor(
    public readonly beneficiaryId: string,
    public readonly willId: string,
    public readonly assetId: string,
    public readonly beneficiaryInfo: {
      userId?: string;
      familyMemberId?: string;
      externalName?: string;
    },
    public readonly bequestType: BequestType,
    public readonly sharePercentage: SharePercentage | null,
    public readonly specificAmount: AssetValue | null,
    public readonly timestamp: Date = new Date(),
  ) {}
}
