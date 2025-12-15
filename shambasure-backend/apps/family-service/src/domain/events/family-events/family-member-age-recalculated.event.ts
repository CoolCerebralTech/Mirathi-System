// domain/events/family-events/family-member-age-recalculated.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberAgeRecalculatedEventPayload {
  familyMemberId: string;
  familyId: string;
  oldAge?: number;
  newAge: number;
  isMinor: boolean;
  isYoungAdult: boolean;
  isElderly: boolean;
  timestamp: Date;
}

export class FamilyMemberAgeRecalculatedEvent extends DomainEvent<FamilyMemberAgeRecalculatedEventPayload> {
  constructor(payload: FamilyMemberAgeRecalculatedEventPayload) {
    super('FamilyMemberAgeRecalculated', payload.familyMemberId, 'FamilyMember', payload);
  }
}
