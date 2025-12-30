// src/family-service/src/domain/events/marriage-events.ts
import { DomainEvent } from '../base/domain-event';
import { MarriageType } from '../value-objects/family-enums.vo';

/**
 * MarriageRegisteredEvent
 * Emitted when a new marriage is registered
 */
export class MarriageRegisteredEvent extends DomainEvent<{
  marriageId: string;
  spouse1Id: string;
  spouse2Id: string;
  marriageType: MarriageType;
  startDate: Date;
  registeredBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    marriageId: string;
    spouse1Id: string;
    spouse2Id: string;
    marriageType: MarriageType;
    startDate: Date;
    registeredBy: string;
    timestamp: Date;
  }) {
    super(
      params.marriageId,
      'Marriage',
      1,
      {
        marriageId: params.marriageId,
        spouse1Id: params.spouse1Id,
        spouse2Id: params.spouse2Id,
        marriageType: params.marriageType,
        startDate: params.startDate,
        registeredBy: params.registeredBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * MarriageUpdatedEvent
 * Emitted when marriage information is updated
 */
export class MarriageUpdatedEvent extends DomainEvent<{
  marriageId: string;
  changes: Record<string, any>;
  updatedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    marriageId: string;
    changes: Record<string, any>;
    updatedBy: string;
    timestamp: Date;
  }) {
    super(
      params.marriageId,
      'Marriage',
      1,
      {
        marriageId: params.marriageId,
        changes: params.changes,
        updatedBy: params.updatedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * MarriageEndedEvent
 * Emitted when a marriage ends
 */
export class MarriageEndedEvent extends DomainEvent<{
  marriageId: string;
  spouse1Id: string;
  spouse2Id: string;
  endReason: string;
  endDate: Date;
  previousStatus: string;
  newStatus: string;
  endedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    marriageId: string;
    spouse1Id: string;
    spouse2Id: string;
    endReason: string;
    endDate: Date;
    previousStatus: string;
    newStatus: string;
    endedBy: string;
    timestamp: Date;
  }) {
    super(
      params.marriageId,
      'Marriage',
      1,
      {
        marriageId: params.marriageId,
        spouse1Id: params.spouse1Id,
        spouse2Id: params.spouse2Id,
        endReason: params.endReason,
        endDate: params.endDate,
        previousStatus: params.previousStatus,
        newStatus: params.newStatus,
        endedBy: params.endedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * PolygamousHouseAssignedEvent
 * Emitted when a marriage is assigned to a polygamous house
 */
export class PolygamousHouseAssignedEvent extends DomainEvent<{
  marriageId: string;
  polygamousHouseId: string;
  marriageOrder: number;
  assignedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    marriageId: string;
    polygamousHouseId: string;
    marriageOrder: number;
    assignedBy: string;
    timestamp: Date;
  }) {
    super(
      params.marriageId,
      'Marriage',
      1,
      {
        marriageId: params.marriageId,
        polygamousHouseId: params.polygamousHouseId,
        marriageOrder: params.marriageOrder,
        assignedBy: params.assignedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}
