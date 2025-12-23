import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberArchivedEventPayload {
  memberId: string;
  reason: string;
  archivedBy: string;
  timestamp: Date;
}

/**
 * Family Member Archived Event
 *
 * Soft delete for data retention compliance.
 * Records are never fully deleted to maintain historical lineage for future generations.
 */
export class FamilyMemberArchivedEvent extends DomainEvent<FamilyMemberArchivedEventPayload> {
  constructor(payload: FamilyMemberArchivedEventPayload) {
    super(payload.memberId, 'FamilyMember', 1, payload, payload.timestamp);
  }
}
