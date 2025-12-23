import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberDeathRecordedEventPayload {
  memberId: string;
  fullName: string;
  dateOfBirth?: Date;
  dateOfDeath: Date;
  ageAtDeath: number | null;
  causeOfDeath?: string;
  burialLocation?: string; // Important for customary burial disputes
  deathCertificateNumber: string; // Required for court filing
  recordedBy: string;
  timestamp: Date;
}

/**
 * Family Member Death Recorded Event
 *
 * CRITICAL EVENT: This triggers the Succession Process.
 * Under Kenyan Law (Law of Succession Act), the date of death establishes:
 * 1. The set of survivors (S. 29)
 * 2. The assets available for distribution
 * 3. The commencement of the probate timeline
 */
export class FamilyMemberDeathRecordedEvent extends DomainEvent<FamilyMemberDeathRecordedEventPayload> {
  constructor(payload: FamilyMemberDeathRecordedEventPayload) {
    super(payload.memberId, 'FamilyMember', 1, payload, payload.timestamp);
  }
}
