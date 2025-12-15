// domain/events/guardianship-events/guardian-bond-posted.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface GuardianBondPostedEventPayload {
  guardianshipId: string;
  bondProvider: string;
  bondAmountKES: number;
  bondPolicyNumber: string;
  expiryDate?: Date;
  timestamp: Date;
}

export class GuardianBondPostedEvent extends DomainEvent<GuardianBondPostedEventPayload> {
  constructor(payload: GuardianBondPostedEventPayload) {
    super('GuardianBondPosted', payload);
  }
}
