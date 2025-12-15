// domain/events/legal-events/s40-certificate-verified.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface S40CertificateVerifiedEventPayload {
  houseId: string;
  certificateNumber: string;
  courtStation: string;
  issuedDate: Date;
  timestamp: Date;
}

export class S40CertificateVerifiedEvent extends DomainEvent<S40CertificateVerifiedEventPayload> {
  constructor(payload: Omit<S40CertificateVerifiedEventPayload, 'timestamp'>) {
    super('S40CertificateVerified', payload.houseId, 'PolygamousHouse', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
