// domain/events/family-events/family-member-created.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberCreatedEventPayload {
  familyMemberId: string;
  familyId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: Date;
  gender?: string;
  citizenship: string;
  religion?: string;
  ethnicity?: string;
  isDeceased: boolean;
  isMinor: boolean;
  identityStatus: 'VERIFIED' | 'UNVERIFIED';
  createdAt: Date;
}

export class FamilyMemberCreatedEvent extends DomainEvent<FamilyMemberCreatedEventPayload> {
  constructor(payload: FamilyMemberCreatedEventPayload) {
    super('FamilyMemberCreated', payload.familyMemberId, 'FamilyMember', payload);
  }
}
