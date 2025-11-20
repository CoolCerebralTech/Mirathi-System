import { DomainEvent } from './base.event';
import { DocumentId } from '../value-objects';

/**
 * Domain Event: DocumentIndexedEvent
 *
 * Emitted when a document has been successfully indexed for search.
 * This allows other parts of the system to react to indexing completion.
 *
 * Event Name: 'document.indexed'
 * Event Version: 1
 */
export class DocumentIndexedEvent extends DomainEvent<DocumentId> {
  // The timestamp when indexing was completed
  public readonly indexedAt: Date;

  // Optional: The search engine or service that performed the indexing
  public readonly searchProvider?: string;

  // Optional: Metadata about the indexing process
  public readonly indexingMetadata?: {
    durationMs?: number;
    documentSizeBytes?: number;
    extractedFields?: string[];
    error?: string;
  };

  constructor(
    aggregateId: DocumentId,
    indexedAt: Date,
    searchProvider?: string,
    indexingMetadata?: {
      durationMs?: number;
      documentSizeBytes?: number;
      extractedFields?: string[];
      error?: string;
    },
  ) {
    super(aggregateId, 'document.indexed', 1);
    this.indexedAt = indexedAt;
    this.searchProvider = searchProvider;
    this.indexingMetadata = indexingMetadata;
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  toJSON(): object {
    return {
      eventName: this.eventName,
      eventVersion: this.eventVersion,
      occurredAt: this.occurredAt.toISOString(),
      aggregateId: this.aggregateId.value,
      indexedAt: this.indexedAt.toISOString(),
      searchProvider: this.searchProvider,
      indexingMetadata: this.indexingMetadata,
    };
  }

  // ============================================================================
  // Factory Method
  // ============================================================================

  static create(
    documentId: DocumentId,
    searchProvider?: string,
    indexingMetadata?: {
      durationMs?: number;
      documentSizeBytes?: number;
      extractedFields?: string[];
      error?: string;
    },
  ): DocumentIndexedEvent {
    return new DocumentIndexedEvent(documentId, new Date(), searchProvider, indexingMetadata);
  }
}
