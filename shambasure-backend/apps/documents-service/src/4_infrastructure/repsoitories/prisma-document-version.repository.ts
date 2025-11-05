// src/4_infrastructure/repositories/prisma-document-version.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { DocumentVersion as PrismaDocumentVersion } from '@prisma/client';

import { IDocumentVersionRepository, FindDocumentVersionsFilters } from '../../3_domain/interfaces';
import { DocumentVersion } from '../../3_domain/models/document-version.model';
import {
  DocumentVersionId,
  DocumentId,
  UserId,
  StoragePath,
  FileMetadata,
  MimeType,
  FileSize,
  DocumentChecksum,
} from '../../3_domain/value-objects';

/**
 * Prisma implementation of the DocumentVersion repository.
 */
@Injectable()
export class PrismaDocumentVersionRepository implements IDocumentVersionRepository {
  private readonly logger = new Logger(PrismaDocumentVersionRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // CREATE
  // ============================================================================

  async create(version: DocumentVersion): Promise<DocumentVersion> {
    try {
      const prismaVersion = await this.prisma.documentVersion.create({
        data: {
          id: version.id.value,
          versionNumber: version.versionNumber,
          documentId: version.documentId.value,
          storagePath: version.storagePath.value,
          changeNote: version.changeNote,
          sizeBytes: version.fileMetadata.size.value,
          mimeType: version.fileMetadata.mimeType.value,
          checksum: version.fileMetadata.checksum.value,
          uploadedBy: version.uploadedBy.value,
          createdAt: version.createdAt,
        },
      });

      this.logger.log(
        `Document version created: ${prismaVersion.id} for document ${prismaVersion.documentId}`,
      );
      return this.toDomain(prismaVersion);
    } catch (error) {
      this.logger.error(`Failed to create document version: ${error.message}`, error.stack);
      throw new Error(`Failed to create document version: ${error.message}`);
    }
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  async findById(id: DocumentVersionId): Promise<DocumentVersion | null> {
    try {
      const prismaVersion = await this.prisma.documentVersion.findUnique({
        where: { id: id.value },
      });

      if (!prismaVersion) return null;
      return this.toDomain(prismaVersion);
    } catch (error) {
      this.logger.error(`Failed to find document version by ID: ${error.message}`, error.stack);
      throw new Error(`Failed to find document version by ID: ${error.message}`);
    }
  }

  async findByDocumentId(documentId: DocumentId): Promise<DocumentVersion[]> {
    try {
      const prismaVersions = await this.prisma.documentVersion.findMany({
        where: { documentId: documentId.value },
        orderBy: { versionNumber: 'desc' },
      });

      return prismaVersions.map((version) => this.toDomain(version));
    } catch (error) {
      this.logger.error(
        `Failed to find document versions by document ID: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to find document versions by document ID: ${error.message}`);
    }
  }

  async findByDocumentIdAndVersion(
    documentId: DocumentId,
    versionNumber: number,
  ): Promise<DocumentVersion | null> {
    try {
      const prismaVersion = await this.prisma.documentVersion.findFirst({
        where: {
          documentId: documentId.value,
          versionNumber,
        },
      });

      if (!prismaVersion) return null;
      return this.toDomain(prismaVersion);
    } catch (error) {
      this.logger.error(
        `Failed to find document version by document ID and version: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to find document version by document ID and version: ${error.message}`,
      );
    }
  }

  async findLatestVersion(documentId: DocumentId): Promise<DocumentVersion | null> {
    try {
      const prismaVersion = await this.prisma.documentVersion.findFirst({
        where: { documentId: documentId.value },
        orderBy: { versionNumber: 'desc' },
      });

      if (!prismaVersion) return null;
      return this.toDomain(prismaVersion);
    } catch (error) {
      this.logger.error(`Failed to find latest document version: ${error.message}`, error.stack);
      throw new Error(`Failed to find latest document version: ${error.message}`);
    }
  }

  async countByDocumentId(documentId: DocumentId): Promise<number> {
    try {
      return await this.prisma.documentVersion.count({
        where: { documentId: documentId.value },
      });
    } catch (error) {
      this.logger.error(`Failed to count document versions: ${error.message}`, error.stack);
      throw new Error(`Failed to count document versions: ${error.message}`);
    }
  }

  async exists(id: DocumentVersionId): Promise<boolean> {
    try {
      const count = await this.prisma.documentVersion.count({
        where: { id: id.value },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(
        `Failed to check document version existence: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to check document version existence: ${error.message}`);
    }
  }

  async getStorageUsageByDocument(documentId: DocumentId): Promise<number> {
    try {
      const result = await this.prisma.documentVersion.aggregate({
        where: { documentId: documentId.value },
        _sum: { sizeBytes: true },
      });

      return result._sum.sizeBytes || 0;
    } catch (error) {
      this.logger.error(`Failed to get storage usage by document: ${error.message}`, error.stack);
      throw new Error(`Failed to get storage usage by document: ${error.message}`);
    }
  }

  // ============================================================================
  // MAPPING HELPERS
  // ============================================================================

  private toDomain(prismaVersion: PrismaDocumentVersion): DocumentVersion {
    // Create value objects
    const fileMetadata = FileMetadata.create(
      this.extractFilenameFromPath(prismaVersion.storagePath),
      prismaVersion.mimeType,
      prismaVersion.sizeBytes,
      prismaVersion.checksum,
    );

    const storagePath = new StoragePath(prismaVersion.storagePath);
    const documentId = new DocumentId(prismaVersion.documentId);
    const uploadedBy = new UserId(prismaVersion.uploadedBy);

    // For now, we'll handle user names in the service layer
    const uploadedByName = 'Unknown'; // Will be enriched at service layer

    return DocumentVersion.fromPersistence({
      id: prismaVersion.id,
      versionNumber: prismaVersion.versionNumber,
      documentId: documentId.value,
      storagePath: storagePath.value,
      fileMetadata,
      changeNote: prismaVersion.changeNote,
      uploadedBy: uploadedBy.value,
      uploadedByName,
      createdAt: prismaVersion.createdAt,
    });
  }

  /**
   * Extract filename from storage path
   */
  private extractFilenameFromPath(storagePath: string): string {
    return storagePath.split('/').pop() || 'unknown';
  }
}
