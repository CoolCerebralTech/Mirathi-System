/**
 * Document Entity - Persistence Layer
 *
 * Represents the document table structure in the database.
 * This is a pure data structure with no business logic.
 */
import { DocumentCategory, DocumentStatus, Prisma } from '@prisma/client';

export interface DocumentEntity {
  id: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string | null;
  category: DocumentCategory;
  status: DocumentStatus;

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
  metadata: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  documentNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  issuingAuthority: string | null;

  // Security
  isPublic: boolean;
  encrypted: boolean;
  allowedViewers: string[]; // Array of user IDs
  storageProvider: string;

  // Retention - FIXED: Added missing expiresAt field from Prisma schema
  retentionPolicy: string | null;
  expiresAt: Date | null; // NEW: Auto-delete date for retention

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
export type UpdateDocumentData = Partial<Omit<DocumentEntity, 'id' | 'createdAt' | 'uploaderId'>>;

/**
 * NEW: Specialized types for specific operations
 */

/**
 * Input for document creation (aligns with Prisma create input)
 */
export type DocumentCreateInput = {
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  checksum?: string | null;
  category: string;
  status: string;
  uploaderId: string;
  assetId?: string | null;
  willId?: string | null;
  identityForUserId?: string | null;
  metadata?: Prisma.JsonValue | null;
  documentNumber?: string | null;
  issueDate?: Date | null;
  expiryDate?: Date | null;
  issuingAuthority?: string | null;
  isPublic?: boolean;
  encrypted?: boolean;
  allowedViewers?: string[];
  storageProvider?: string;
  retentionPolicy?: string | null;
  expiresAt?: Date | null;
  isIndexed?: boolean;
  version?: number;
};

/**
 * Input for document updates (aligns with Prisma update input)
 */
export type DocumentUpdateInput = {
  filename?: string;
  storagePath?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string | null;
  category?: string;
  status?: string;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  rejectionReason?: string | null;
  assetId?: string | null;
  willId?: string | null;
  identityForUserId?: string | null;
  metadata?: Prisma.JsonValue | null;
  documentNumber?: string | null;
  issueDate?: Date | null;
  expiryDate?: Date | null;
  issuingAuthority?: string | null;
  isPublic?: boolean;
  encrypted?: boolean;
  allowedViewers?: string[];
  storageProvider?: string;
  retentionPolicy?: string | null;
  expiresAt?: Date | null;
  isIndexed?: boolean;
  indexedAt?: Date | null;
  version?: number;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

/**
 * Query filters for document search (aligns with Prisma where input)
 */
export type DocumentWhereInput = {
  id?: string | { in: string[] };
  filename?: string | { contains: string; mode?: 'insensitive' };
  uploaderId?: string | { in: string[] };
  status?: string | { in: string[] };
  category?: string | { in: string[] };
  assetId?: string | null | { not: null };
  willId?: string | null | { not: null };
  identityForUserId?: string | null | { not: null };
  isPublic?: boolean;
  encrypted?: boolean;
  storageProvider?: string;
  verifiedBy?: string | null;
  createdAt?: { gte?: Date; lte?: Date };
  updatedAt?: { gte?: Date; lte?: Date };
  deletedAt?: Date | null;
  expiresAt?: { gte?: Date; lte?: Date } | null;
  isIndexed?: boolean;
  AND?: DocumentWhereInput[];
  OR?: DocumentWhereInput[];
  NOT?: DocumentWhereInput[];
};

/**
 * Sorting options for document queries
 */
export type DocumentOrderByInput = {
  createdAt?: 'asc' | 'desc';
  updatedAt?: 'asc' | 'desc';
  filename?: 'asc' | 'desc';
  sizeBytes?: 'asc' | 'desc';
  expiryDate?: 'asc' | 'desc';
  expiresAt?: 'asc' | 'desc';
};
