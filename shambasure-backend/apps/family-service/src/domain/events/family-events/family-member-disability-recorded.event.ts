import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberDisabilityRecordedEventPayload {
  memberId: string;
  disabilityType: string;
  percentage: number;
  medicalReportId?: string;
  recordedBy: string;
  timestamp: Date;
}

/**
 * Family Member Disability Recorded Event
 *
 * Relevant for Section 29 (Dependants) of the Law of Succession Act.
 * Children with disabilities (regardless of age) are permanent dependants.
 */
export class FamilyMemberDisabilityRecordedEvent extends DomainEvent<FamilyMemberDisabilityRecordedEventPayload> {
  constructor(payload: FamilyMemberDisabilityRecordedEventPayload) {
    super(payload.memberId, 'FamilyMember', 1, payload, payload.timestamp);
  }
}
