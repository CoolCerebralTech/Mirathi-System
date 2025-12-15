// domain/events/dependency-events/dependant-evidence-verified.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface DependantEvidenceVerifiedEventPayload {
  legalDependantId: string;
  verifiedBy: string;
  verificationMethod: string;
  timestamp: Date;
}

export class DependantEvidenceVerifiedEvent extends DomainEvent<DependantEvidenceVerifiedEventPayload> {
  constructor(payload: Omit<DependantEvidenceVerifiedEventPayload, 'timestamp'>) {
    super('DependantEvidenceVerified', payload.legalDependantId, 'LegalDependant', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
