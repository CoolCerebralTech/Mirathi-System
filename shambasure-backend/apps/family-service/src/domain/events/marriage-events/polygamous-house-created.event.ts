// domain/events/marriage-events/polygamous-house-created.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface PolygamousHouseCreatedEventPayload {
  familyId: string;
  houseId: string;
  houseHeadId?: string;
  houseCount: number;
  timestamp: Date;
}

export class PolygamousHouseCreatedEvent extends DomainEvent<PolygamousHouseCreatedEventPayload> {
  constructor(payload: PolygamousHouseCreatedEventPayload) {
    super('PolygamousHouseCreated', payload);
  }
}
