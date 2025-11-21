// succession-service/src/succession-process/domain/events/entitlement-created.event.ts

import { ShareType } from '../../../common/types/kenyan-law.types';

export class EntitlementCreatedEvent {
  constructor(
    public readonly distributionId: string,
    public readonly estateId: string,
    public readonly beneficiaryId: string, // User or FamilyMember ID
    public readonly assetId: string | null, // Specific asset or General share
    public readonly share: number, // Percentage or Amount
    public readonly shareType: ShareType, // ABSOLUTE vs LIFE_INTEREST
    public readonly timestamp: Date = new Date(),
  ) {}
}
