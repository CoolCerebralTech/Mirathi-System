// domain/events/family-events/family-member-deceased.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberDeceasedEventPayload {
  familyMemberId: string;
  familyId: string;
  dateOfDeath: Date;
  placeOfDeath?: string;
  causeOfDeath?: string;
  deathCertificateNumber?: string;
  ageAtDeath?: number;
  timestamp: Date;
}

export class FamilyMemberDeceasedEvent extends DomainEvent<FamilyMemberDeceasedEventPayload> {
  constructor(payload: FamilyMemberDeceasedEventPayload) {
    super('FamilyMemberDeceased', payload.familyMemberId, 'FamilyMember', payload);
  }
}
