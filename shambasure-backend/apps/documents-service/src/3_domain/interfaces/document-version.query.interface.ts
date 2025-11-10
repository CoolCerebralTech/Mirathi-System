import { DocumentVersionId, DocumentId, UserId } from '../value-objects';

// ============================================================================
// Data Transfer Objects (DTOs) and Query Models
// ============================================================================

/**
 * A lightweight, flattened representation of a DocumentVersion for read operations.
 */
export interface DocumentVersionDTO {
  id: string;
  versionNumber: number;
  documentId: string;
  fileSize: number;
  mimeType: string;
  checksum: string | null;
  changeNote: string | null;
  uploadedBy: string;
  createdAt: Date;
}

export interface FindDocumentVersionsFilters {
  documentId?: DocumentId;
  uploadedBy?: UserId;
  versionNumber?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface VersionQueryOptions {
  sortBy?: 'versionNumber' | 'createdAt' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface VersionStorageStats {
  totalVersions: number;
  totalSizeBytes: number;
  averageSizeBytes: number;
  oldestVersionDate: Date;
  newestVersionDate: Date;
}

// ============================================================================
// Query Repository Interface
// ============================================================================

/**
 * Defines the contract for all read and query operations for document versions.
 *
 * NOTE: There is no corresponding "command" repository for DocumentVersion.
 * As a child entity of the Document aggregate, all modifications (creation, deletion)
 * must be performed through methods on the Document aggregate root itself and persisted

 * via `IDocumentRepository.save()`. This interface provides the necessary read-model
 * access to version history without violating aggregate boundaries.
 */
export interface IDocumentVersionQueryRepository {
  /**
   * Finds a single version by its unique identifier.
   */
  findById(id: DocumentVersionId): Promise<DocumentVersionDTO | null>;

  /**
   * Finds a specific version of a document by its number.
   */
  findByDocumentIdAndVersionNumber(
    documentId: DocumentId,
    versionNumber: number,
  ): Promise<DocumentVersionDTO | null>;

  /**
   * Finds all versions for a given document.
   */
  findAllByDocumentId(
    documentId: DocumentId,
    options?: VersionQueryOptions,
  ): Promise<DocumentVersionDTO[]>;

  /**
   * Finds the most recent version of a document.
   */
  findLatestForDocument(documentId: DocumentId): Promise<DocumentVersionDTO | null>;

  /**
   * A flexible method to find versions based on various criteria.
   */
  findMany(
    filters: FindDocumentVersionsFilters,
    options?: VersionQueryOptions,
  ): Promise<DocumentVersionDTO[]>;

  /**
   * Checks if a specific version number exists for a document.
   */
  existsForDocument(documentId: DocumentId, versionNumber: number): Promise<boolean>;

  /**
   * Gets the next available version number for a document.
   * Useful for pre-validation in application services.
   */
  getNextVersionNumber(documentId: DocumentId): Promise<number>;

  /**
   * Counts the number of versions associated with a document.
   */
  countForDocument(documentId: DocumentId): Promise<number>;

  /**
   * Calculates the total storage size (in bytes) of all versions for a document.
   */
  getTotalStorageUsageForDocument(documentId: DocumentId): Promise<number>;

  /**
   * Gets storage statistics for a document's versions.
   */
  getStorageStatsForDocument(documentId: DocumentId): Promise<VersionStorageStats>;

  /**
   * Gets version counts for multiple documents in a single batch.
   * @returns A Map where the key is the documentId and the value is the version count.
   */
  getVersionCountsForDocuments(documentIds: DocumentId[]): Promise<Map<string, number>>;
}
