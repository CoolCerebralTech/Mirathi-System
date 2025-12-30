import { Uuid } from '../value-objects';
import { DomainEvent } from './base.event';

export class DocumentExpiredEvent extends DomainEvent<Uuid> {
  constructor(
    aggregateId: Uuid,
    public readonly expiredAt: Date,
  ) {
    super(aggregateId, 'document.expired', 1);
  }
}
