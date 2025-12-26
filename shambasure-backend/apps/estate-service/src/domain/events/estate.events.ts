// src/estate-service/src/domain/events/estate.event.ts
import { DomainEvent } from '../base/domain-event';

export abstract class EstateEvent<T = any> extends DomainEvent<T> {
  constructor(
    aggregateId: string,
    eventType: string,
    version: number,
    payload: T,
    occurredAt?: Date,
  ) {
    super(aggregateId, eventType, version, payload, occurredAt);
  }
}

export class EstateCreatedEvent extends EstateEvent<{
  estateId: string;
  name: string;
  deceasedId: string;
}> {
  constructor(estateId: string, name: string, deceasedId: string, version: number) {
    super(estateId, 'EstateCreatedEvent', version, { estateId, name, deceasedId });
  }
}

export class EstateFrozenEvent extends EstateEvent<{
  estateId: string;
  reason: string;
  byUser: string;
}> {
  constructor(estateId: string, reason: string, byUser: string, version: number) {
    super(estateId, 'EstateFrozenEvent', version, { estateId, reason, byUser });
  }
}

export class EstateUnfrozenEvent extends EstateEvent<{
  estateId: string;
  reason: string;
  byUser: string;
}> {
  constructor(estateId: string, reason: string, byUser: string, version: number) {
    super(estateId, 'EstateUnfrozenEvent', version, { estateId, reason, byUser });
  }
}

export class EstateInsolvencyDetectedEvent extends EstateEvent<{
  estateId: string;
  netValue: number;
}> {
  constructor(estateId: string, netValue: number, version: number) {
    super(estateId, 'EstateInsolvencyDetectedEvent', version, { estateId, netValue });
  }
}

export class EstateSolvencyRestoredEvent extends EstateEvent<{
  estateId: string;
  netValue: number;
}> {
  constructor(estateId: string, netValue: number, version: number) {
    super(estateId, 'EstateSolvencyRestoredEvent', version, { estateId, netValue });
  }
}

export class EstateReadyForDistributionEvent extends EstateEvent<{
  estateId: string;
  distributablePoolAmount: number;
}> {
  constructor(estateId: string, distributablePoolAmount: number, version: number) {
    super(estateId, 'EstateReadyForDistributionEvent', version, {
      estateId,
      distributablePoolAmount,
    });
  }
}
