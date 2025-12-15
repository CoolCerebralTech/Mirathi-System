// domain/events/family-events/family-member-missing-status-changed.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberMissingStatusChangedEventPayload {
  familyMemberId: string;
  familyId: string;
  status: 'MISSING' | 'FOUND' | 'PRESUMED_DEAD';
  missingSince?: Date;
  lastSeenLocation?: string;
  presumedDeadDate?: Date;
  courtOrderNumber?: string;
  timestamp: Date;
}

export class FamilyMemberMissingStatusChangedEvent extends DomainEvent<FamilyMemberMissingStatusChangedEventPayload> {
  constructor(payload: FamilyMemberMissingStatusChangedEventPayload) {
    super('FamilyMemberMissingStatusChanged', payload.familyMemberId, 'FamilyMember', payload);
  }
}
