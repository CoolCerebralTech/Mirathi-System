// domain/events/family-events/family-member-disability-status-updated.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberDisabilityStatusUpdatedEventPayload {
  familyMemberId: string;
  familyId: string;
  hasDisability: boolean;
  disabilityType?: string;
  requiresSupportedDecisionMaking: boolean;
  registeredWithNCPWD: boolean;
  disabilityCardNumber?: string;
  timestamp: Date;
}

export class FamilyMemberDisabilityStatusUpdatedEvent extends DomainEvent<FamilyMemberDisabilityStatusUpdatedEventPayload> {
  constructor(payload: FamilyMemberDisabilityStatusUpdatedEventPayload) {
    super('FamilyMemberDisabilityStatusUpdated', payload.familyMemberId, 'FamilyMember', payload);
  }
}
