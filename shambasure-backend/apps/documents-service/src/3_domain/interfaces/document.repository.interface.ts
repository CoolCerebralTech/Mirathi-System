import { Document } from '../models/document.model';
// NOTE: These will come from @shamba/common after migration
import { DocumentStatus, DocumentCategory } from '../enums';

/**
 * Query filters for fetching documents.
 */
export interface FindDocumentsFilters {
  uploaderId?: string;
  status?: DocumentStatus;
  category?: DocumentCategory;
  assetId?: string;
  willId?: string;
  includeDeleted?: boolean;
}

/**
 * Pagination options for list queries.
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Paginated result wrapper.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Repository interface for Document aggregate.
 * Defines all data access operations needed by the domain.
 *
 * Infrastructure layer will implement this using Prisma.
 */
export interface IDocumentRepository {
  /**
   * Save a new document to the database.
   */
  create(document: Document): Promise<Document>;

  /**
   * Update an existing document.
   */
  update(document: Document): Promise<Document>;

  /**
   * Find document by ID.
   * Returns null if not found.
   */
  findById(id: string, includeDeleted?: boolean): Promise<Document | null>;

  /**
   * Find documents matching filters with pagination.
   */
  findMany(
    filters: FindDocumentsFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Document>>;

  /**
   * Find all documents uploaded by a specific user.
   */
  findByUploaderId(
    uploaderId: string,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Document>>;

  /**
   * Find all documents linked to a specific asset.
   */
  findByAssetId(assetId: string): Promise<Document[]>;

  /**
   * Find all documents linked to a specific will.
   */
  findByWillId(willId: string): Promise<Document[]>;

  /**
   * Find all documents pending verification.
   */
  findPendingVerification(pagination?: PaginationOptions): Promise<PaginatedResult<Document>>;

  /**
   * Soft delete a document (sets deletedAt timestamp).
   */
  softDelete(id: string): Promise<void>;

  /**
   * Check if a document exists by ID.
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count documents matching filters.
   */
  count(filters: FindDocumentsFilters): Promise<number>;
}
