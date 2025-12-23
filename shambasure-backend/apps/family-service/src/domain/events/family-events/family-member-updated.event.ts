import { DomainEvent } from '../../base/domain-event';

export interface AttributeChange {
  old: any;
  new: any;
}

export type ChangeSet = Record<string, AttributeChange>;

export interface FamilyMemberUpdatedEventPayload {
  memberId: string;
  changes: ChangeSet;
  updatedBy: string;
  timestamp: Date;
}

/**
 * Family Member Updated Event
 *
 * Captures modifications to member details.
 * Crucial for tracking changes in name, religion, or location which may
 * affect customary law applicability (e.g., change from Christian to Islamic faith).
 */
export class FamilyMemberUpdatedEvent extends DomainEvent<FamilyMemberUpdatedEventPayload> {
  constructor(payload: FamilyMemberUpdatedEventPayload) {
    super(payload.memberId, 'FamilyMember', 1, payload, payload.timestamp);
  }
}
