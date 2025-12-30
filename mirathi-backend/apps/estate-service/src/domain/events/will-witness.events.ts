import { DomainEvent } from '../base/domain-event';

/**
 * Witness Added Event
 *
 * Emitted when a witness is added to the will
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
    signedAt: string,
    signatureLocation?: string,
  ) {
    super(willId, 'Will', 1, {
      witnessId,
      willId,
      witnessName,
      signatureType,
      signedAt,
      signatureLocation,
    });
  }
}

/**
 * Witness Verified Event
 *
 * Emitted when a witness identity is verified
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
 * Emitted when a witness is rejected (e.g., deemed ineligible)
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
