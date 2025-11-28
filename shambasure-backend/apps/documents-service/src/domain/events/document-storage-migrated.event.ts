import { DocumentId } from '../value-objects';
import { StorageProvider } from '../value-objects';
import { DomainEvent } from './base.event';

/**
 * Triggered after a document's physical file has been migrated
 * from one storage provider to another (e.g., local to s3).
 */
export class DocumentStorageMigratedEvent extends DomainEvent<DocumentId> {
  public static readonly eventName = 'document.storage.migrated';
  public static readonly eventVersion = 1;

  constructor(
    aggregateId: DocumentId,
    public readonly fromProvider: StorageProvider,
    public readonly toProvider: StorageProvider,
    public readonly migrationSizeBytes: number,
    public readonly success: boolean,
  ) {
    super(
      aggregateId,
      DocumentStorageMigratedEvent.eventName,
      DocumentStorageMigratedEvent.eventVersion,
    );
  }
}
