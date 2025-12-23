import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberNationalIdVerifiedEventPayload {
  memberId: string;
  nationalId?: string;
  verified: boolean;
  notes?: string;
  verifiedBy: string;
  action: 'NATIONAL_ID_VERIFIED'; // Explicit action tag
}

/**
 * Family Member National ID Verified Event
 *
 * Represents confirmation of identity against external registries (IPRS/NRB).
 * Verified identities are required for Guardianship and Executor roles.
 */
export class FamilyMemberNationalIdVerifiedEvent extends DomainEvent<FamilyMemberNationalIdVerifiedEventPayload> {
  constructor(payload: FamilyMemberNationalIdVerifiedEventPayload) {
    super(payload.memberId, 'FamilyMember', 1, payload);
  }
}
