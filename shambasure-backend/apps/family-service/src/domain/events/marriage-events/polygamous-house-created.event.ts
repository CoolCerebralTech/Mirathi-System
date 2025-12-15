// domain/events/marriage-events/polygamous-house-created.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface PolygamousHouseCreatedEventPayload {
  houseId: string;
  familyId: string;
  houseName: string;
  houseOrder: number;
  houseHeadId?: string;
  establishedDate: Date;
  timestamp: Date;
}

export class PolygamousHouseCreatedEvent extends DomainEvent<PolygamousHouseCreatedEventPayload> {
  constructor(payload: Omit<PolygamousHouseCreatedEventPayload, 'timestamp'>) {
    super('PolygamousHouseCreated', payload.houseId, 'PolygamousHouse', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
