// succession-service/src/family-tree/domain/events/marriage-registered.event.ts

import { MarriageStatus } from '@prisma/client';

export class MarriageRegisteredEvent {
  constructor(
    public readonly marriageId: string,
    public readonly familyId: string,
    public readonly spouse1Id: string,
    public readonly spouse2Id: string,
    public readonly type: MarriageStatus, // e.g., CUSTOMARY_MARRIAGE, CIVIL_UNION
    public readonly marriageDate: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}
