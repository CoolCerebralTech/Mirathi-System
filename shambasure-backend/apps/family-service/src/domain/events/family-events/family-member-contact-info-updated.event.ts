// domain/events/family-events/family-member-contact-info-updated.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberContactInfoUpdatedEventPayload {
  familyMemberId: string;
  familyId: string;
  oldPhoneNumber?: string;
  newPhoneNumber?: string;
  oldEmail?: string;
  newEmail?: string;
  emergencyContactUpdated: boolean;
  timestamp: Date;
}

export class FamilyMemberContactInfoUpdatedEvent extends DomainEvent<FamilyMemberContactInfoUpdatedEventPayload> {
  constructor(payload: FamilyMemberContactInfoUpdatedEventPayload) {
    super('FamilyMemberContactInfoUpdated', payload.familyMemberId, 'FamilyMember', payload);
  }
}
