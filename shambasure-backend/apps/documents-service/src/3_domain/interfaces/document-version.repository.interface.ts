import { DocumentVersion } from '../models/document-version.model';
import { DocumentVersionId, DocumentId, UserId } from '../value-objects';

/**
 * Query filters for fetching document versions.
 */
export interface FindDocumentVersionsFilters {
  documentId?: DocumentId;
  uploadedBy?: UserId;
  versionNumber?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Repository interface for the DocumentVersion entity.
 * Defines the contract for persisting and retrieving version history.
 */
export interface IDocumentVersionRepository {
  /**
   * Saves a new DocumentVersion entity to the database.
   * Since versions are immutable, this will always be an insert operation.
   */
  save(version: DocumentVersion): Promise<void>;

  /**
   * Finds a single version by its unique identifier.
   */
  findById(id: DocumentVersionId): Promise<DocumentVersion | null>;

  /**
   * Finds a specific version of a document by its number.
   */
  findByDocumentIdAndVersionNumber(
    documentId: DocumentId,
    versionNumber: number,
  ): Promise<DocumentVersion | null>;

  /**
   * Finds all versions for a given document, typically sorted by version number descending.
   */
  findAllByDocumentId(documentId: DocumentId): Promise<DocumentVersion[]>;

  /**
   * A flexible method to find versions based on various criteria.
   */
  findMany(filters: FindDocumentVersionsFilters): Promise<DocumentVersion[]>;

  /**
   * Finds the most recent version of a document.
   */
  findLatestForDocument(documentId: DocumentId): Promise<DocumentVersion | null>;

  /**
   * Counts the number of versions associated with a document.
   */
  countForDocument(documentId: DocumentId): Promise<number>;

  /**
   * Calculates the total storage size (in bytes) of all versions for a document.
   */
  getTotalStorageUsageForDocument(documentId: DocumentId): Promise<number>;

  /**
   * Checks if a specific version exists. More performant than fetching the full entity.
   */
  exists(id: DocumentVersionId): Promise<boolean>;
}
