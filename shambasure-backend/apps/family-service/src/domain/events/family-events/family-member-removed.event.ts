import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberRemovedEventPayload {
  familyId: string;
  memberId: string;
  wasDeceased: boolean;
  wasMinor: boolean;
  wasDependant: boolean;
  removalReason?: string;
  timestamp: Date;
}

export class FamilyMemberRemovedEvent extends DomainEvent<FamilyMemberRemovedEventPayload> {
  constructor(payload: Omit<FamilyMemberRemovedEventPayload, 'timestamp'>) {
    super('FamilyMemberRemoved', payload.familyId, 'Family', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
