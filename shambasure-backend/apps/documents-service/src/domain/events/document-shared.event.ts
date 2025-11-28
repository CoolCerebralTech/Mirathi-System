import { DomainEvent } from './base.event';
import { DocumentId } from '../value-objects';
import { UserId } from '../value-objects';

/**
 * Triggered when a user grants access to a document to other users.
 */
export class DocumentSharedEvent extends DomainEvent<DocumentId> {
  public static readonly eventName = 'document.shared';
  public static readonly eventVersion = 1;

  constructor(
    aggregateId: DocumentId,
    public readonly sharedBy: UserId,
    public readonly sharedWith: UserId[], // An array of UserIds
    public readonly permissionLevel: 'VIEW' = 'VIEW', // For now, only VIEW is supported
  ) {
    super(aggregateId, DocumentSharedEvent.eventName, DocumentSharedEvent.eventVersion);
  }
}
