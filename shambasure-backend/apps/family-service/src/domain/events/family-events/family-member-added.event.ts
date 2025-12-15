import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberAddedEventPayload {
  familyId: string;
  memberId: string;
  firstName: string;
  lastName: string;
  isDeceased: boolean;
  isMinor: boolean;
  isS29Dependant: boolean;
  nationalId?: string;
  kraPin?: string;
  timestamp: Date;
}

export class FamilyMemberAddedEvent extends DomainEvent<FamilyMemberAddedEventPayload> {
  constructor(payload: Omit<FamilyMemberAddedEventPayload, 'timestamp'>) {
    super('FamilyMemberAdded', payload.familyId, 'Family', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
