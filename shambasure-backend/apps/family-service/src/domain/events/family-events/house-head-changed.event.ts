// domain/events/family-events/house-head-changed.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface HouseHeadChangedEventPayload {
  houseId: string;
  familyId: string;
  oldHeadId?: string;
  newHeadId: string;
  reason: string;
  timestamp: Date;
}

export class HouseHeadChangedEvent extends DomainEvent<HouseHeadChangedEventPayload> {
  constructor(payload: Omit<HouseHeadChangedEventPayload, 'timestamp'>) {
    super('HouseHeadChanged', payload.houseId, 'PolygamousHouse', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
