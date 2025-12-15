// domain/events/dependency-events/s26-claim-filed.event.ts
import { DomainEvent } from '../../base/domain-event';

export interface S26ClaimFiledEventPayload {
  legalDependantId: string;
  amount: number;
  currency: string;
  timestamp: Date;
}

export class S26ClaimFiledEvent extends DomainEvent<S26ClaimFiledEventPayload> {
  static readonly eventName = 'S26ClaimFiledEvent';

  constructor(payload: S26ClaimFiledEventPayload) {
    super(
      S26ClaimFiledEvent.eventName,
      payload.legalDependantId,
      'DependencyAssessmentAggregate',
      payload,
    );
  }
}
