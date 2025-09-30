import {
  Document as PrismaDocument,
  DocumentVersion as PrismaDocumentVersion,
} from '@shamba/database';

// ============================================================================
// ARCHITECTURAL NOTE: The Role of the Entity
// ============================================================================
// This entity is a clean representation of our Document data model, used for
// serializing API responses. It uses Prisma's generated types as its
// foundation to ensure it is always in sync with the database schema.
//
// All business logic methods (`canBeDeleted`, `isImage`, etc.) have been
// REMOVED from this file. This logic now lives in the `DocumentsService`
// where it can be properly tested and managed.
// ============================================================================

export class DocumentVersionEntity implements PrismaDocumentVersion {
  id!: string;
  versionNumber!: number;
  storagePath!: string;
  changeNote!: string | null;
  documentId!: string;
  createdAt!: Date;

  constructor(partial: Partial<PrismaDocumentVersion>) {
    Object.assign(this, partial);
  }
}

export class DocumentEntity implements Omit<PrismaDocument, 'uploader'> {
  id!: string;
  filename!: string;
  storagePath!: string;
  mimeType!: string;
  sizeBytes!: number;
  status!: PrismaDocument['status'];
  uploaderId!: string;
  createdAt!: Date;
  updatedAt!: Date;

  versions?: DocumentVersionEntity[];

  constructor(partial: Partial<PrismaDocument & { versions?: PrismaDocumentVersion[] }>) {
    Object.assign(this, partial);
    if (partial.versions) {
      this.versions = partial.versions.map(v => new DocumentVersionEntity(v));
    }
  }
}