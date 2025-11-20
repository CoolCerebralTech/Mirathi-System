import { DomainEvent } from './base.event';
import { DocumentId } from '../value-objects';
import { UserId } from '../value-objects';
import { RejectionReason } from '../value-objects';

/**
 * Triggered when a document fails the verification process.
 */
export class DocumentRejectedEvent extends DomainEvent<DocumentId> {
  public static readonly eventName = 'document.rejected';
  public static readonly eventVersion = 1;

  constructor(
    aggregateId: DocumentId,
    public readonly rejectedBy: UserId, // ID of the verifier
    public readonly reason: RejectionReason,
    public readonly requiresReupload: boolean = true,
  ) {
    super(aggregateId, DocumentRejectedEvent.eventName, DocumentRejectedEvent.eventVersion);
  }
}
