// src/family-service/src/domain/events/next-of-kin-events.ts
import { DomainEvent } from '../base/domain-event';
import { RelationshipType } from '../value-objects/family-enums.vo';

/**
 * NextOfKinAppointedEvent
 * Emitted when a next of kin is appointed
 */
export class NextOfKinAppointedEvent extends DomainEvent<{
  nextOfKinId: string;
  designatorId: string;
  nomineeId: string;
  relationshipType: RelationshipType;
  priorityLevel: string;
  appointmentReason: string;
  appointedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    nextOfKinId: string;
    designatorId: string;
    nomineeId: string;
    relationshipType: RelationshipType;
    priorityLevel: string;
    appointmentReason: string;
    appointedBy: string;
    timestamp: Date;
  }) {
    super(
      params.nextOfKinId,
      'NextOfKin',
      1,
      {
        nextOfKinId: params.nextOfKinId,
        designatorId: params.designatorId,
        nomineeId: params.nomineeId,
        relationshipType: params.relationshipType,
        priorityLevel: params.priorityLevel,
        appointmentReason: params.appointmentReason,
        appointedBy: params.appointedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * NextOfKinUpdatedEvent
 * Emitted when next of kin information is updated
 */
export class NextOfKinUpdatedEvent extends DomainEvent<{
  nextOfKinId: string;
  designatorId: string;
  nomineeId: string;
  changes: Record<string, any>;
  updatedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    nextOfKinId: string;
    designatorId: string;
    nomineeId: string;
    changes: Record<string, any>;
    updatedBy: string;
    timestamp: Date;
  }) {
    super(
      params.nextOfKinId,
      'NextOfKin',
      1,
      {
        nextOfKinId: params.nextOfKinId,
        designatorId: params.designatorId,
        nomineeId: params.nomineeId,
        changes: params.changes,
        updatedBy: params.updatedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * NextOfKinContactedEvent
 * Emitted when next of kin is contacted
 */
export class NextOfKinContactedEvent extends DomainEvent<{
  nextOfKinId: string;
  designatorId: string;
  nomineeId: string;
  contactMethod: string;
  reason: string;
  urgency: string;
  initiatedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    nextOfKinId: string;
    designatorId: string;
    nomineeId: string;
    contactMethod: string;
    reason: string;
    urgency: string;
    initiatedBy: string;
    timestamp: Date;
  }) {
    super(
      params.nextOfKinId,
      'NextOfKin',
      1,
      {
        nextOfKinId: params.nextOfKinId,
        designatorId: params.designatorId,
        nomineeId: params.nomineeId,
        contactMethod: params.contactMethod,
        reason: params.reason,
        urgency: params.urgency,
        initiatedBy: params.initiatedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * NextOfKinEmergencyTriggeredEvent
 * Emitted when emergency protocol is triggered for next of kin
 */
export class NextOfKinEmergencyTriggeredEvent extends DomainEvent<{
  nextOfKinId: string;
  designatorId: string;
  nomineeId: string;
  emergencyType: string;
  severity: string;
  location: string;
  priority: number;
  estimatedResponseTime: number;
  triggeredBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    nextOfKinId: string;
    designatorId: string;
    nomineeId: string;
    emergencyType: string;
    severity: string;
    location: string;
    priority: number;
    estimatedResponseTime: number;
    triggeredBy: string;
    timestamp: Date;
  }) {
    super(
      params.nextOfKinId,
      'NextOfKin',
      1,
      {
        nextOfKinId: params.nextOfKinId,
        designatorId: params.designatorId,
        nomineeId: params.nomineeId,
        emergencyType: params.emergencyType,
        severity: params.severity,
        location: params.location,
        priority: params.priority,
        estimatedResponseTime: params.estimatedResponseTime,
        triggeredBy: params.triggeredBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}
