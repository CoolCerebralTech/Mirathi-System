/**
 * DocumentVersion Entity - Persistence Layer
 *
 * Represents the document_versions table structure in the database.
 * Immutable record of document version history.
 */
export interface DocumentVersionEntity {
  id: string;
  versionNumber: number;
  documentId: string;

  // File information
  storagePath: string;
  sizeBytes: number;
  mimeType: string;
  checksum: string;

  // Version metadata
  changeNote: string | null;
  uploadedBy: string;

  // Timestamp
  createdAt: Date;
}

/**
 * Create input for new versions
 */
export type CreateDocumentVersionEntity = Omit<DocumentVersionEntity, 'createdAt'>;
