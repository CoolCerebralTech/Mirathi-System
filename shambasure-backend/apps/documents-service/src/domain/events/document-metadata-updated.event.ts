import { DomainEvent } from './base.event';
import { Uuid } from '../value-objects';
import { UserId } from '../value-objects/user-id.vo';

export class DocumentMetadataUpdatedEvent extends DomainEvent<Uuid> {
  constructor(
    aggregateId: Uuid,
    public readonly updatedBy: UserId,
    public readonly previousMetadata: Record<string, any> | null,
    public readonly newMetadata: Record<string, any> | null,
  ) {
    super(aggregateId, 'document.metadata.updated', 1);
  }
}
