// domain/events/family-events/family-member-personal-info-updated.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberPersonalInfoUpdatedEventPayload {
  familyMemberId: string;
  familyId: string;
  updatedFields: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    maidenName?: string;
    occupation?: string;
    gender?: string;
    religion?: string;
    ethnicity?: string;
    clan?: string;
    subClan?: string;
  };
  timestamp: Date;
}

export class FamilyMemberPersonalInfoUpdatedEvent extends DomainEvent<FamilyMemberPersonalInfoUpdatedEventPayload> {
  constructor(payload: FamilyMemberPersonalInfoUpdatedEventPayload) {
    super('FamilyMemberPersonalInfoUpdated', payload.familyMemberId, 'FamilyMember', payload);
  }
}
