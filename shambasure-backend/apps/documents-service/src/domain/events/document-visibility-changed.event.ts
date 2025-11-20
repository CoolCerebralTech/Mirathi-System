import { DomainEvent } from './base.event';
import { Uuid } from '../value-objects';
import { UserId } from '../value-objects/user-id.vo';

export class DocumentVisibilityChangedEvent extends DomainEvent<Uuid> {
  constructor(
    aggregateId: Uuid,
    public readonly changedBy: UserId,
    public readonly previousVisibility: boolean,
    public readonly newVisibility: boolean,
  ) {
    super(aggregateId, 'document.visibility.changed', 1);
  }
}
