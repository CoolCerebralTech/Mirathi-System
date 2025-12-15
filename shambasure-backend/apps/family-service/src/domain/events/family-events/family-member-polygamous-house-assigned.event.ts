// domain/events/family-events/family-member-polygamous-house-assigned.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberPolygamousHouseAssignedEventPayload {
  familyMemberId: string;
  familyId: string;
  polygamousHouseId: string;
  houseName?: string;
  houseOrder: number;
  assignedAs: 'HOUSE_HEAD' | 'MEMBER';
  timestamp: Date;
}

export class FamilyMemberPolygamousHouseAssignedEvent extends DomainEvent<FamilyMemberPolygamousHouseAssignedEventPayload> {
  constructor(payload: FamilyMemberPolygamousHouseAssignedEventPayload) {
    super('FamilyMemberPolygamousHouseAssigned', payload.familyMemberId, 'FamilyMember', payload);
  }
}
