// domain/events/family-events/family-member-archived.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberArchivedEventPayload {
  familyMemberId: string;
  familyId: string;
  archivedBy: string;
  reason: string;
  isDeceased: boolean;
  timestamp: Date;
}

export class FamilyMemberArchivedEvent extends DomainEvent<FamilyMemberArchivedEventPayload> {
  constructor(payload: FamilyMemberArchivedEventPayload) {
    super('FamilyMemberArchived', payload.familyMemberId, 'FamilyMember', payload);
  }
}
