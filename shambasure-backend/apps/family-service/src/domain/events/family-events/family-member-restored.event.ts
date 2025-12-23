import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberRestoredEventPayload {
  memberId: string;
  restoredBy: string;
  timestamp: Date;
}

/**
 * Family Member Restored Event
 *
 * Restoring a record that was previously archived/soft-deleted.
 */
export class FamilyMemberRestoredEvent extends DomainEvent<FamilyMemberRestoredEventPayload> {
  constructor(payload: FamilyMemberRestoredEventPayload) {
    super(payload.memberId, 'FamilyMember', 1, payload, payload.timestamp);
  }
}
