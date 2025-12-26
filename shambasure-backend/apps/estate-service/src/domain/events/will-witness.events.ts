// src/estate-service/src/domain/events/will-witness.events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Witness Added Event
 *
 * Emitted when a new witness is added to a will
 */
export class WitnessAddedEvent extends DomainEvent<{
  witnessId: string;
  willId: string;
  witnessName: string;
  witnessType: string;
  status: string;
}> {
  constructor(
    willId: string,
    witnessId: string,
    witnessName: string,
    witnessType: string,
    status: string,
  ) {
    super(willId, 'Will', 1, {
      witnessId,
      willId,
      witnessName,
      witnessType,
      status,
    });
  }
}

/**
 * Witness Signed Event
 *
 * Emitted when a witness signs the will
 */
export class WitnessSignedEvent extends DomainEvent<{
  witnessId: string;
  willId: string;
  witnessName: string;
  signatureType: string;
  signedAt: string;
  signatureLocation?: string;
}> {
  constructor(
    willId: string,
    witnessId: string,
    witnessName: string,
    signatureType: string,
    signedAt: Date,
    signatureLocation?: string,
  ) {
    super(willId, 'Will', 1, {
      witnessId,
      willId,
      witnessName,
      signatureType,
      signedAt: signedAt.toISOString(),
      signatureLocation,
    });
  }
}

/**
 * Witness Verified Event
 *
 * Emitted when witness identity is verified
 */
export class WitnessVerifiedEvent extends DomainEvent<{
  witnessId: string;
  willId: string;
  witnessName: string;
  verificationMethod: string;
  documentId: string;
}> {
  constructor(
    willId: string,
    witnessId: string,
    witnessName: string,
    verificationMethod: string,
    documentId: string,
  ) {
    super(willId, 'Will', 1, {
      witnessId,
      willId,
      witnessName,
      verificationMethod,
      documentId,
    });
  }
}

/**
 * Witness Rejected Event
 *
 * Emitted when a witness is rejected
 */
export class WitnessRejectedEvent extends DomainEvent<{
  witnessId: string;
  willId: string;
  witnessName: string;
  reason: string;
}> {
  constructor(willId: string, witnessId: string, witnessName: string, reason: string) {
    super(willId, 'Will', 1, {
      witnessId,
      willId,
      witnessName,
      reason,
    });
  }
}

/**
 * Witness Contact Updated Event
 *
 * Emitted when witness contact information is updated
 */
export class WitnessContactUpdatedEvent extends DomainEvent<{
  witnessId: string;
  willId: string;
  witnessName: string;
  updatedFields: string[];
}> {
  constructor(willId: string, witnessId: string, witnessName: string, updatedFields: string[]) {
    super(willId, 'Will', 1, {
      witnessId,
      willId,
      witnessName,
      updatedFields,
    });
  }
}

/**
 * Witness Invited Event
 *
 * Emitted when witness is invited to sign
 */
export class WitnessInvitedEvent extends DomainEvent<{
  witnessId: string;
  willId: string;
  witnessName: string;
  invitedAt: string;
}> {
  constructor(willId: string, witnessId: string, witnessName: string, invitedAt: Date) {
    super(willId, 'Will', 1, {
      witnessId,
      willId,
      witnessName,
      invitedAt: invitedAt.toISOString(),
    });
  }
}

/**
 * Witness Reminded Event
 *
 * Emitted when reminder is sent to witness
 */
export class WitnessRemindedEvent extends DomainEvent<{
  witnessId: string;
  willId: string;
  witnessName: string;
  reminderCount: number;
  lastRemindedAt: string;
}> {
  constructor(
    willId: string,
    witnessId: string,
    witnessName: string,
    reminderCount: number,
    lastRemindedAt: Date,
  ) {
    super(willId, 'Will', 1, {
      witnessId,
      willId,
      witnessName,
      reminderCount,
      lastRemindedAt: lastRemindedAt.toISOString(),
    });
  }
}
