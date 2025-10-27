import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { Document as PrismaDocument } from '@prisma/client';

import {
  IDocumentRepository,
  FindDocumentsFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../3_domain/interfaces';
import { Document } from '../../3_domain/models/document.model';
import { FileMetadata, StoragePath } from '../../3_domain/value-objects';
// NOTE: Import from @shamba/common after migration
import { DocumentStatus, DocumentCategory } from '../../3_domain/enums';

/**
 * Prisma implementation of the Document repository.
 * Handles all database operations and domain ↔ persistence mapping.
 */
@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
  private readonly logger = new Logger(PrismaDocumentRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // CREATE & UPDATE
  // ============================================================================

  async create(document: Document): Promise<Document> {
    try {
      const prismaDocument = await this.prisma.document.create({
        data: {
          id: document.id,
          filename: document.fileMetadata.filename,
          storagePath: document.storagePath.getValue(),
          mimeType: document.fileMetadata.mimeType,
          sizeBytes: document.fileMetadata.sizeBytes,
          category: document.category,
          status: document.status,
          uploaderId: document.uploaderId,
          verifiedBy: document.verifiedBy,
          verifiedAt: document.verifiedAt,
          rejectionReason: document.rejectionReason,
          assetId: document.assetId,
          willId: document.willId,
          metadata: document.metadata as any, // Prisma Json type
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          deletedAt: document.deletedAt,
        },
      });

      this.logger.log(`Document created: ${prismaDocument.id}`);
      return this.toDomain(prismaDocument);
    } catch (error) {
      this.logger.error(`Failed to create document: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(document: Document): Promise<Document> {
    try {
      const prismaDocument = await this.prisma.document.update({
        where: { id: document.id },
        data: {
          status: document.status,
          verifiedBy: document.verifiedBy,
          verifiedAt: document.verifiedAt,
          rejectionReason: document.rejectionReason,
          metadata: document.metadata as any,
          updatedAt: document.updatedAt,
          deletedAt: document.deletedAt,
        },
      });

      this.logger.log(`Document updated: ${prismaDocument.id}`);
      return this.toDomain(prismaDocument);
    } catch (error) {
      this.logger.error(`Failed to update document: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  async findById(id: string, includeDeleted = false): Promise<Document | null> {
    try {
      const prismaDocument = await this.prisma.document.findUnique({
        where: { id },
      });

      if (!prismaDocument) return null;
      if (!includeDeleted && prismaDocument.deletedAt) return null;

      return this.toDomain(prismaDocument);
    } catch (error) {
      this.logger.error(`Failed to find document by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findMany(
    filters: FindDocumentsFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Document>> {
    try {
      const where = this.buildWhereClause(filters);
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 20;
      const skip = (page - 1) * limit;

      const [prismaDocuments, total] = await Promise.all([
        this.prisma.document.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.document.count({ where }),
      ]);

      const documents = prismaDocuments.map((doc) => this.toDomain(doc));

      return {
        data: documents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to find documents: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByUploaderId(
    uploaderId: string,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Document>> {
    return this.findMany({ uploaderId, includeDeleted: false }, pagination);
  }

  async findByAssetId(assetId: string): Promise<Document[]> {
    try {
      const prismaDocuments = await this.prisma.document.findMany({
        where: {
          assetId,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      return prismaDocuments.map((doc) => this.toDomain(doc));
    } catch (error) {
      this.logger.error(`Failed to find documents by asset ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByWillId(willId: string): Promise<Document[]> {
    try {
      const prismaDocuments = await this.prisma.document.findMany({
        where: {
          willId,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      return prismaDocuments.map((doc) => this.toDomain(doc));
    } catch (error) {
      this.logger.error(`Failed to find documents by will ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findPendingVerification(
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Document>> {
    return this.findMany(
      {
        status: DocumentStatus.PENDING_VERIFICATION,
        includeDeleted: false,
      },
      pagination,
    );
  }

  // ============================================================================
  // DELETE & UTILITIES
  // ============================================================================

  async softDelete(id: string): Promise<void> {
    try {
      await this.prisma.document.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Document soft deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to soft delete document: ${error.message}`, error.stack);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.prisma.document.count({
        where: { id, deletedAt: null },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check document existence: ${error.message}`, error.stack);
      throw error;
    }
  }

  async count(filters: FindDocumentsFilters): Promise<number> {
    try {
      const where = this.buildWhereClause(filters);
      return await this.prisma.document.count({ where });
    } catch (error) {
      this.logger.error(`Failed to count documents: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================================================
  // MAPPING HELPERS
  // ============================================================================

  /**
   * Convert Prisma entity to Domain model.
   */
  private toDomain(prismaDoc: PrismaDocument): Document {
    // We need uploader name for events - fetch it separately or pass it in
    // For now, we'll handle this in the service layer when needed
    const uploaderName = 'Unknown'; // TODO: Fetch from User relation or pass from service

    return Document.fromPersistence({
      id: prismaDoc.id,
      fileMetadata: FileMetadata.create(
        prismaDoc.filename,
        prismaDoc.mimeType,
        prismaDoc.sizeBytes,
      ),
      storagePath: StoragePath.fromExisting(prismaDoc.storagePath),
      category: prismaDoc.category as DocumentCategory,
      status: prismaDoc.status as DocumentStatus,
      uploaderId: prismaDoc.uploaderId,
      uploaderName, // Will be enriched at service layer
      verifiedBy: prismaDoc.verifiedBy,
      verifiedByName: null, // Will be enriched at service layer
      verifiedAt: prismaDoc.verifiedAt,
      rejectionReason: prismaDoc.rejectionReason,
      assetId: prismaDoc.assetId,
      willId: prismaDoc.willId,
      metadata: prismaDoc.metadata as Record<string, any> | null,
      createdAt: prismaDoc.createdAt,
      updatedAt: prismaDoc.updatedAt,
      deletedAt: prismaDoc.deletedAt,
    });
  }

  /**
   * Build Prisma where clause from filters.
   */
  private buildWhereClause(filters: FindDocumentsFilters) {
    const where: any = {};

    if (filters.uploaderId) {
      where.uploaderId = filters.uploaderId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.assetId) {
      where.assetId = filters.assetId;
    }

    if (filters.willId) {
      where.willId = filters.willId;
    }

    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    return where;
  }
}
