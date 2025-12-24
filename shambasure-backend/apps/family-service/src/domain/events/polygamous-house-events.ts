// src/family-service/src/domain/events/polygamous-house-events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * PolygamousHouseCreatedEvent
 * Emitted when a polygamous house is created
 */
export class PolygamousHouseCreatedEvent extends DomainEvent<{
  houseId: string;
  houseName: string;
  houseOrder: number;
  familyId: string;
  establishedDate: Date;
  establishedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    houseId: string;
    houseName: string;
    houseOrder: number;
    familyId: string;
    establishedDate: Date;
    establishedBy: string;
    timestamp: Date;
  }) {
    super(
      params.houseId,
      'PolygamousHouse',
      1,
      {
        houseId: params.houseId,
        houseName: params.houseName,
        houseOrder: params.houseOrder,
        familyId: params.familyId,
        establishedDate: params.establishedDate,
        establishedBy: params.establishedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * PolygamousHouseUpdatedEvent
 * Emitted when polygamous house information is updated
 */
export class PolygamousHouseUpdatedEvent extends DomainEvent<{
  houseId: string;
  changes: Record<string, any>;
  updatedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    houseId: string;
    changes: Record<string, any>;
    updatedBy: string;
    timestamp: Date;
  }) {
    super(
      params.houseId,
      'PolygamousHouse',
      1,
      {
        houseId: params.houseId,
        changes: params.changes,
        updatedBy: params.updatedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * HouseHeadAssignedEvent
 * Emitted when a house head is assigned
 */
export class HouseHeadAssignedEvent extends DomainEvent<{
  houseId: string;
  houseName: string;
  previousHeadId?: string;
  newHeadId: string;
  reason: string;
  effectiveDate: Date;
  appointedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    houseId: string;
    houseName: string;
    previousHeadId?: string;
    newHeadId: string;
    reason: string;
    effectiveDate: Date;
    appointedBy: string;
    timestamp: Date;
  }) {
    super(
      params.houseId,
      'PolygamousHouse',
      1,
      {
        houseId: params.houseId,
        houseName: params.houseName,
        previousHeadId: params.previousHeadId,
        newHeadId: params.newHeadId,
        reason: params.reason,
        effectiveDate: params.effectiveDate,
        appointedBy: params.appointedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * ChildAddedToHouseEvent
 * Emitted when a child is added to a polygamous house
 */
export class ChildAddedToHouseEvent extends DomainEvent<{
  houseId: string;
  houseName: string;
  childId: string;
  motherId: string;
  addedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    houseId: string;
    houseName: string;
    childId: string;
    motherId: string;
    addedBy: string;
    timestamp: Date;
  }) {
    super(
      params.houseId,
      'PolygamousHouse',
      1,
      {
        houseId: params.houseId,
        houseName: params.houseName,
        childId: params.childId,
        motherId: params.motherId,
        addedBy: params.addedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}
