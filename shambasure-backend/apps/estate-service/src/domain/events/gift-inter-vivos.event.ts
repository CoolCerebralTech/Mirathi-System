// src/estate-service/src/domain/events/gift-inter-vivos.event.ts
import { DomainEvent } from '../base/domain-event';
import { GiftStatus } from '../entities/gift-inter-vivos.entity';

/**
 * Base Gift Event
 */
export abstract class GiftInterVivosEvent<T = any> extends DomainEvent<T> {
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

export class GiftInterVivosRegisteredEvent extends GiftInterVivosEvent<{
  giftId: string;
  estateId: string;
  recipientId: string;
  valueAmount: number;
}> {
  constructor(
    giftId: string,
    estateId: string,
    recipientId: string,
    valueAmount: number,
    version: number,
  ) {
    super(giftId, 'GiftInterVivosRegisteredEvent', version, {
      giftId,
      estateId,
      recipientId,
      valueAmount,
    });
  }
}

export class GiftInterVivosContestedEvent extends GiftInterVivosEvent<{
  giftId: string;
  estateId: string;
  reason: string;
  contestedBy: string;
}> {
  constructor(
    giftId: string,
    estateId: string,
    reason: string,
    contestedBy: string,
    version: number,
  ) {
    super(giftId, 'GiftInterVivosContestedEvent', version, {
      giftId,
      estateId,
      reason,
      contestedBy,
    });
  }
}

export class GiftInterVivosStatusChangedEvent extends GiftInterVivosEvent<{
  giftId: string;
  estateId: string;
  oldStatus: GiftStatus;
  newStatus: GiftStatus;
  changedBy: string;
}> {
  constructor(
    giftId: string,
    estateId: string,
    oldStatus: GiftStatus,
    newStatus: GiftStatus,
    changedBy: string,
    version: number,
  ) {
    super(giftId, 'GiftInterVivosStatusChangedEvent', version, {
      giftId,
      estateId,
      oldStatus,
      newStatus,
      changedBy,
    });
  }
}
