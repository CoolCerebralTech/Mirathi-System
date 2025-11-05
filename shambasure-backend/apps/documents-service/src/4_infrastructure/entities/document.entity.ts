/**
 * Document Entity - Persistence Layer
 *
 * Represents the document table structure in the database.
 * This is a pure data structure with no business logic.
 */
export interface DocumentEntity {
  id: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  category: string;
  status: string;

  // Ownership
  uploaderId: string;

  // Verification
  verifiedBy: string | null;
  verifiedAt: Date | null;
  rejectionReason: string | null;

  // Cross-service references
  assetId: string | null;
  willId: string | null;
  identityForUserId: string | null;

  // Metadata
  metadata: any | null; // JSON field
  documentNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  issuingAuthority: string | null;

  // Security
  isPublic: boolean;
  encrypted: boolean;
  allowedViewers: string[]; // Array of user IDs
  storageProvider: string;

  // Retention
  retentionPolicy: string | null;

  // Performance
  isIndexed: boolean;
  indexedAt: Date | null;

  // Concurrency
  version: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Create input for new documents
 */
export type CreateDocumentEntity = Omit<
  DocumentEntity,
  'createdAt' | 'updatedAt' | 'deletedAt' | 'indexedAt'
>;

/**
 * Update input for existing documents
 */
export type UpdateDocumentEntity = Partial<
  Omit<DocumentEntity, 'id' | 'uploaderId' | 'createdAt'>
> & {
  id: string;
  version: number; // Required for optimistic locking
};
