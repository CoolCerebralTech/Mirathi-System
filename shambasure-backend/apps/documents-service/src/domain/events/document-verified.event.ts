import { DomainEvent } from './base.event';
import { DocumentId } from '../value-objects';
import { UserId } from '../value-objects';

/**
 * Triggered when a document has been successfully verified by an admin or verifier.
 */
export class DocumentVerifiedEvent extends DomainEvent<DocumentId> {
  public static readonly eventName = 'document.verified';
  public static readonly eventVersion = 1;

  constructor(
    aggregateId: DocumentId,
    public readonly verifiedBy: UserId, // ID of the verifier
  ) {
    super(aggregateId, DocumentVerifiedEvent.eventName, DocumentVerifiedEvent.eventVersion);
  }
}
