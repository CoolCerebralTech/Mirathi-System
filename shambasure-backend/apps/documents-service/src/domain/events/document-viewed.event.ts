import { DomainEvent } from './base.event';
import { DocumentId } from '../value-objects';
import { UserId } from '../value-objects';

/**
 * Triggered when a user views a document's details or preview within the application.
 * This is a useful event for auditing and analytics.
 */
export class DocumentViewedEvent extends DomainEvent<DocumentId> {
  public static readonly eventName = 'document.viewed';
  public static readonly eventVersion = 1;

  constructor(
    aggregateId: DocumentId,
    public readonly viewedBy: UserId,
    public readonly ipAddress: string,
    public readonly userAgent: string,
    public readonly viewDurationSeconds?: number,
  ) {
    super(aggregateId, DocumentViewedEvent.eventName, DocumentViewedEvent.eventVersion);
  }
}
