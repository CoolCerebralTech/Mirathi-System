import { DocumentId } from '../value-objects';
import { UserId } from '../value-objects';
import { DocumentStatus } from '../value-objects';
import { DomainEvent } from './base.event';

/**
 * Triggered when a soft-deleted document is restored.
 */
export class DocumentRestoredEvent extends DomainEvent<DocumentId> {
  public static readonly eventName = 'document.restored';
  public static readonly eventVersion = 1;

  constructor(
    aggregateId: DocumentId,
    public readonly restoredBy: UserId,
    public readonly previousStatus: DocumentStatus, // The status before it was deleted
  ) {
    super(aggregateId, DocumentRestoredEvent.eventName, DocumentRestoredEvent.eventVersion);
  }
}
