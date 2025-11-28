import { DocumentId } from '../value-objects';
import { UserId } from '../value-objects';
import { StoragePath } from '../value-objects';
import { FileSize } from '../value-objects';
import { DocumentChecksum } from '../value-objects';
import { DomainEvent } from './base.event';

/**
 * Triggered when a new version of an existing document is uploaded.
 */
export class DocumentVersionedEvent extends DomainEvent<DocumentId> {
  public static readonly eventName = 'document.versioned';
  public static readonly eventVersion = 1;

  constructor(
    aggregateId: DocumentId,
    public readonly versionNumber: number,
    public readonly uploadedBy: UserId,
    public readonly storagePath: StoragePath,
    public readonly size: FileSize,
    public readonly checksum: DocumentChecksum | null,
    public readonly changeNote?: string,
  ) {
    super(aggregateId, DocumentVersionedEvent.eventName, DocumentVersionedEvent.eventVersion);
  }
}
