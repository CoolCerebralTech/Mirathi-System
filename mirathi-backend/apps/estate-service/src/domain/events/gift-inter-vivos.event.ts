// src/estate-service/src/domain/events/gift-inter-vivos.event.ts
import { DomainEvent } from '../base/domain-event';
import { GiftStatus } from '../entities/gift-inter-vivos.entity';
import { AssetType } from '../enums/asset-type.enum';

export class GiftInterVivosCreatedEvent extends DomainEvent<{
  estateId: string;
  recipientId: string;
  assetType: AssetType;
  value: number;
}> {
  constructor(
    giftId: string,
    estateId: string,
    recipientId: string,
    assetType: AssetType,
    value: number,
    version: number,
  ) {
    super(giftId, 'GiftInterVivos', version, {
      estateId,
      recipientId,
      assetType,
      value,
    });
  }
}

export class GiftInterVivosContestedEvent extends DomainEvent<{
  estateId: string;
  recipientId: string;
  reason: string;
  contestedBy: string;
}> {
  constructor(
    giftId: string,
    estateId: string,
    recipientId: string,
    reason: string,
    contestedBy: string,
    version: number,
  ) {
    super(giftId, 'GiftInterVivos', version, {
      estateId,
      recipientId,
      reason,
      contestedBy,
    });
  }
}

export class GiftInterVivosResolvedEvent extends DomainEvent<{
  estateId: string;
  recipientId: string;
  oldStatus: GiftStatus;
  newStatus: GiftStatus;
  resolution: string;
  resolvedBy: string;
}> {
  constructor(
    giftId: string,
    estateId: string,
    recipientId: string,
    oldStatus: GiftStatus,
    newStatus: GiftStatus,
    resolution: string,
    resolvedBy: string,
    version: number,
  ) {
    super(giftId, 'GiftInterVivos', version, {
      estateId,
      recipientId,
      oldStatus,
      newStatus,
      resolution,
      resolvedBy,
    });
  }
}

export class GiftInterVivosExcludedEvent extends DomainEvent<{
  estateId: string;
  recipientId: string;
  reason: string;
  excludedBy: string;
}> {
  constructor(
    giftId: string,
    estateId: string,
    recipientId: string,
    reason: string,
    excludedBy: string,
    version: number,
  ) {
    super(giftId, 'GiftInterVivos', version, {
      estateId,
      recipientId,
      reason,
      excludedBy,
    });
  }
}

export class GiftInterVivosReclassifiedEvent extends DomainEvent<{
  estateId: string;
  recipientId: string;
  value: number;
  reason: string;
  reclassifiedBy: string;
}> {
  constructor(
    giftId: string,
    estateId: string,
    recipientId: string,
    value: number,
    reason: string,
    reclassifiedBy: string,
    version: number,
  ) {
    super(giftId, 'GiftInterVivos', version, {
      estateId,
      recipientId,
      value,
      reason,
      reclassifiedBy,
    });
  }
}
