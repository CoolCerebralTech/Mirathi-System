import { BequestType } from '@prisma/client';

import { AssetValue } from '../value-objects/asset-value.vo';
import { SharePercentage } from '../value-objects/share-percentage.vo';

export class BeneficiaryShareUpdatedEvent {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly bequestType: BequestType,
    // Nullable because one might be set while the other is cleared
    public readonly newSharePercentage: SharePercentage | null,
    public readonly newSpecificAmount: AssetValue | null,
    public readonly updatedBy: string, // User ID of who made the change
    public readonly timestamp: Date = new Date(),
  ) {}
}
