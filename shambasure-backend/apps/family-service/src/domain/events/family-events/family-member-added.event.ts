// domain/events/family-events/family-member-added.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberAddedEventPayload {
  familyId: string;
  memberId: string;
  memberName: string;
  isDeceased: boolean;
  isMinor: boolean;
  isPotentialDependant: boolean;
  timestamp: Date;
}

export class FamilyMemberAddedEvent extends DomainEvent<FamilyMemberAddedEventPayload> {
  constructor(payload: FamilyMemberAddedEventPayload) {
    super('FamilyMemberAdded', payload);
  }
}
