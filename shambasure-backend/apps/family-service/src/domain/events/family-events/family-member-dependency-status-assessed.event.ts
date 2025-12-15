// domain/events/family-events/family-member-dependency-status-assessed.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberDependencyStatusAssessedEventPayload {
  familyMemberId: string;
  familyId: string;
  isPotentialDependant: boolean;
  assessmentReasons: string[]; // e.g., ['MINOR', 'DISABILITY', 'STUDENT']
  qualifiesForS29: boolean;
  dependencyLevel: 'NONE' | 'PARTIAL' | 'FULL';
  timestamp: Date;
}

export class FamilyMemberDependencyStatusAssessedEvent extends DomainEvent<FamilyMemberDependencyStatusAssessedEventPayload> {
  constructor(payload: FamilyMemberDependencyStatusAssessedEventPayload) {
    super('FamilyMemberDependencyStatusAssessed', payload.familyMemberId, 'FamilyMember', payload);
  }
}
