import { DomainEvent } from './base.event';
import { DocumentId } from '../value-objects';
import { UserId } from '../value-objects';

/**
 * Triggered when a user successfully downloads a document's file.
 * This is a critical event for the audit trail.
 */
export class DocumentDownloadedEvent extends DomainEvent<DocumentId> {
  public static readonly eventName = 'document.downloaded';
  public static readonly eventVersion = 1;

  constructor(
    aggregateId: DocumentId,
    public readonly downloadedBy: UserId,
    // Note: We will use the base event's `occurredAt` for the timestamp.
    public readonly ipAddress: string,
    public readonly userAgent: string,
    public readonly downloadPurpose?: string,
  ) {
    super(aggregateId, DocumentDownloadedEvent.eventName, DocumentDownloadedEvent.eventVersion);
  }
}
