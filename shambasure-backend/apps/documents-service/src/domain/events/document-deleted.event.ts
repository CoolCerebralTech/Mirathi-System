import { DomainEvent } from './base.event';
import { DocumentId } from '../value-objects';
import { UserId } from '../value-objects';

/**
 * Triggered when a document is marked for deletion.
 */
export class DocumentDeletedEvent extends DomainEvent<DocumentId> {
  // Event versioning for future-proofing
  public static readonly eventName = 'document.deleted';
  public static readonly eventVersion = 1;

  constructor(
    aggregateId: DocumentId,
    public readonly deletedBy: UserId,
    public readonly deletionType: 'SOFT' | 'HARD' = 'SOFT',
    public readonly reason?: string,
    public readonly permanentDeletionDate?: Date, // For compliance on hard delete
  ) {
    super(aggregateId, DocumentDeletedEvent.eventName, DocumentDeletedEvent.eventVersion);
  }
}
