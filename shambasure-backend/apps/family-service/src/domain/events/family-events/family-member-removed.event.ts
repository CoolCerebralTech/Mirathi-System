// domain/events/family-events/family-member-removed.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberRemovedEventPayload {
  familyId: string;
  memberId: string;
  timestamp: Date;
}

export class FamilyMemberRemovedEvent extends DomainEvent<FamilyMemberRemovedEventPayload> {
  constructor(payload: FamilyMemberRemovedEventPayload) {
    super('FamilyMemberRemoved', payload);
  }
}
