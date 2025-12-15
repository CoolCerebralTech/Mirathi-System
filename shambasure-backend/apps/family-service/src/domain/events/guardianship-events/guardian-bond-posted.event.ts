// domain/events/guardianship-events/guardian-bond-posted.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface GuardianBondPostedEventPayload {
  guardianshipId: string;
  amount: number;
  provider: string;
  policyNumber: string;
  expiryDate: Date;
  timestamp: Date;
}

export class GuardianBondPostedEvent extends DomainEvent<GuardianBondPostedEventPayload> {
  constructor(payload: Omit<GuardianBondPostedEventPayload, 'timestamp'>) {
    super('GuardianBondPosted', payload.guardianshipId, 'Guardian', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
