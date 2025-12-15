// domain/events/family-events/family-member-s40-polygamous-status-changed.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface FamilyMemberS40PolygamousStatusChangedEventPayload {
  familyMemberId: string;
  familyId: string;
  polygamousHouseId?: string;
  houseOrder?: number;
  isPolygamousHouseHead: boolean;
  s40CertificateNumber?: string;
  courtRecognized: boolean;
  timestamp: Date;
}

export class FamilyMemberS40PolygamousStatusChangedEvent extends DomainEvent<FamilyMemberS40PolygamousStatusChangedEventPayload> {
  constructor(payload: FamilyMemberS40PolygamousStatusChangedEventPayload) {
    super(
      'FamilyMemberS40PolygamousStatusChanged',
      payload.familyMemberId,
      'FamilyMember',
      payload,
    );
  }
}
