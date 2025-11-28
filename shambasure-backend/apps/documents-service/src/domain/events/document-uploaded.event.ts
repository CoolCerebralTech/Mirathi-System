import { DocumentId } from '../value-objects';
import { UserId } from '../value-objects';
import { StoragePath } from '../value-objects';
import { MimeType } from '../value-objects';
import { FileSize } from '../value-objects';
import { DocumentCategory } from '../value-objects';
import { DocumentChecksum } from '../value-objects';
import { FileName } from '../value-objects';
import { DomainEvent } from './base.event';

/**
 * Triggered when a new document file has been successfully uploaded
 * and its initial record has been created.
 */
export class DocumentUploadedEvent extends DomainEvent<DocumentId> {
  public static readonly eventName = 'document.uploaded';
  public static readonly eventVersion = 1;

  constructor(
    aggregateId: DocumentId,
    public readonly uploaderId: UserId,
    public readonly filename: FileName,
    public readonly storagePath: StoragePath,
    public readonly mimeType: MimeType,
    public readonly size: FileSize,
    public readonly category: DocumentCategory,
    public readonly checksum: DocumentChecksum | null,
    public readonly metadata?: Record<string, any>,
  ) {
    super(aggregateId, DocumentUploadedEvent.eventName, DocumentUploadedEvent.eventVersion);
  }
}
