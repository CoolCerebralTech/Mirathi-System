// succession-service/src/family-tree/domain/events/guardian-assigned.event.ts

import { GuardianType } from '@prisma/client';

export class GuardianAssignedEvent {
  constructor(
    public readonly guardianshipId: string,
    public readonly familyId: string,
    public readonly guardianId: string, // FamilyMember ID
    public readonly wardId: string, // FamilyMember ID (The Child)
    public readonly type: GuardianType,
    public readonly appointmentDate: Date,
    public readonly validUntil: Date | null,
    public readonly timestamp: Date = new Date(),
  ) {}
}
