import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberCreatedEventPayload {
  memberId: string;
  fullName: string;
  nationalId?: string;
  createdBy: string;
  timestamp: Date;
}

/**
 * Family Member Created Event
 *
 * Signals the creation of a new digital identity in the family system.
 * This is the start of the legal audit trail.
 */
export class FamilyMemberCreatedEvent extends DomainEvent<FamilyMemberCreatedEventPayload> {
  constructor(payload: FamilyMemberCreatedEventPayload) {
    super(payload.memberId, 'FamilyMember', 1, payload, payload.timestamp);
  }
}
