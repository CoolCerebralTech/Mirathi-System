import { Injectable, NotFoundException } from '@nestjs/common';
import { 
  Prisma, 
  PrismaService, 
  Document, 
  DocumentVersion, 
  DocumentStatus 
} from '@shamba/database';
import { PaginationQueryDto } from '@shamba/common';

/**
 * DocumentsRepository - Pure Data Access Layer for Documents
 * 
 * ARCHITECTURAL PRINCIPLES:
 * -------------------------
 * 1. NO business logic (file handling, validation, virus scanning)
 * 2. NO domain rules (ownership checks, status transitions)
 * 3. ONLY database queries and transactions
 * 4. Returns raw Prisma types
 * 
 * The SERVICE layer handles:
 * - File storage/retrieval
 * - Business validation
 * - Status transition rules
 * - Event publishing
 */
@Injectable()
export class DocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ========================================================================
  // CREATE OPERATIONS
  // ========================================================================

  /**
   * Create a new document record
   * @param data - Document creation data (file should already be stored)
   * @returns Created document (without relations)
   */
  async create(data: Prisma.DocumentCreateInput): Promise<Document> {
    return this.prisma.document.create({ data });
  }

  /**
   * Create document with initial version in a single transaction
   * Ensures atomicity between document and version creation
   */
  async createWithVersion(
    documentData: Omit<Prisma.DocumentCreateInput, 'versions'>,
    versionData: Omit<Prisma.DocumentVersionCreateInput, 'document'>,
  ): Promise<Document & { versions: DocumentVersion[] }> {
    return this.prisma.document.create({
      data: {
        ...documentData,
        versions: {
          create: versionData,
        },
      },
      include: { versions: true },
    });
  }

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  /**
   * Find document by ID (without versions)
   * Returns null if not found
   */
  async findById(id: string): Promise<Document | null> {
    return this.prisma.document.findUnique({ where: { id } });
  }

  /**
   * Find document by ID with versions (ordered newest first)
   * @throws NotFoundException if document not found
   */
  async findOneOrFail(
    where: Prisma.DocumentWhereUniqueInput
  ): Promise<Document & { versions: DocumentVersion[] }> {
    const document = await this.prisma.document.findUnique({
      where,
      include: { 
        versions: { 
          orderBy: { versionNumber: 'desc' } 
        } 
      },
    });

    if (!document) {
      const identifier = where.id || 'unknown';
      throw new NotFoundException(`Document with ID '${identifier}' not found`);
    }

    return document;
  }

  /**
   * Find document without throwing (includes versions)
   * Returns null if not found
   */
  async findByIdWithVersions(
    id: string
  ): Promise<(Document & { versions: DocumentVersion[] }) | null> {
    return this.prisma.document.findUnique({
      where: { id },
      include: { 
        versions: { 
          orderBy: { versionNumber: 'desc' } 
        } 
      },
    });
  }

  /**
   * Paginated document listing with filters
   */
  async findMany(
    where: Prisma.DocumentWhereInput,
    pagination: PaginationQueryDto,
  ): Promise<{ documents: Document[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [documents, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.document.count({ where }),
    ]);

    return { documents, total };
  }

  /**
   * Find all documents for a specific user
   */
  async findByUploader(
    uploaderId: string,
    pagination: PaginationQueryDto,
  ): Promise<{ documents: Document[]; total: number }> {
    return this.findMany({ uploaderId }, pagination);
  }

  /**
   * Find documents by status
   */
  async findByStatus(
    status: DocumentStatus,
    pagination: PaginationQueryDto,
  ): Promise<{ documents: Document[]; total: number }> {
    return this.findMany({ status }, pagination);
  }

  /**
   * Find documents by uploader and status
   */
  async findByUploaderAndStatus(
    uploaderId: string,
    status: DocumentStatus,
    pagination: PaginationQueryDto,
  ): Promise<{ documents: Document[]; total: number }> {
    return this.findMany({ uploaderId, status }, pagination);
  }

  /**
   * Check if document exists by ID
   */
  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.document.count({ where: { id } });
    return count > 0;
  }

  /**
   * Check if user owns a document
   */
  async isOwnedBy(documentId: string, uploaderId: string): Promise<boolean> {
    const count = await this.prisma.document.count({
      where: { id: documentId, uploaderId },
    });
    return count > 0;
  }

  // ========================================================================
  // UPDATE OPERATIONS
  // ========================================================================

  /**
   * Update document metadata
   * @throws PrismaClientKnownRequestError if document not found (P2025)
   */
  async update(id: string, data: Prisma.DocumentUpdateInput): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data,
    });
  }

  /**
   * Update document status
   * Common operation for verification workflow
   */
  async updateStatus(id: string, status: DocumentStatus): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Update document and return with versions
   */
  async updateWithVersions(
    id: string,
    data: Prisma.DocumentUpdateInput
  ): Promise<Document & { versions: DocumentVersion[] }> {
    return this.prisma.document.update({
      where: { id },
      data,
      include: { 
        versions: { 
          orderBy: { versionNumber: 'desc' } 
        } 
      },
    });
  }

  // ========================================================================
  // VERSION OPERATIONS
  // ========================================================================

  /**
   * Add a new version to an existing document
   * Version number should be calculated by service layer
   */
  async addVersion(
    data: Prisma.DocumentVersionUncheckedCreateInput
  ): Promise<DocumentVersion> {
    return this.prisma.documentVersion.create({ data });
  }

  /**
   * Get specific version by version number
   */
  async getVersion(
    documentId: string,
    versionNumber: number
  ): Promise<DocumentVersion | null> {
    return this.prisma.documentVersion.findUnique({
      where: {
        documentId_versionNumber: {
          documentId,
          versionNumber,
        },
      },
    });
  }

  /**
   * Get latest version for a document
   */
  async getLatestVersion(documentId: string): Promise<DocumentVersion | null> {
    return this.prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  /**
   * Get version count for a document
   */
  async getVersionCount(documentId: string): Promise<number> {
    return this.prisma.documentVersion.count({
      where: { documentId },
    });
  }

  // ========================================================================
  // DELETE OPERATIONS
  // ========================================================================

  /**
   * Delete document and all versions
   * Cascading delete handled by Prisma schema
   * @throws PrismaClientKnownRequestError if document not found (P2025)
   */
  async delete(id: string): Promise<Document> {
    return this.prisma.document.delete({ where: { id } });
  }

  /**
   * Delete specific version
   * NOTE: Should validate this isn't the only version in service layer
   */
  async deleteVersion(
    documentId: string,
    versionNumber: number
  ): Promise<DocumentVersion> {
    return this.prisma.documentVersion.delete({
      where: {
        documentId_versionNumber: {
          documentId,
          versionNumber,
        },
      },
    });
  }

  // ========================================================================
  // STATISTICS & REPORTING
  // ========================================================================

  /**
   * Get document statistics for a user
   * Groups by status and mime type
   */
  async getStatsForUploader(uploaderId: string) {
    return this.prisma.document.groupBy({
      by: ['status', 'mimeType'],
      where: { uploaderId },
      _count: {
        id: true,
      },
      _sum: {
        sizeBytes: true,
      },
    });
  }

  /**
   * Get total storage used by a user
   */
  async getTotalStorageUsed(uploaderId: string): Promise<number> {
    const result = await this.prisma.document.aggregate({
      where: { uploaderId },
      _sum: {
        sizeBytes: true,
      },
    });

    return result._sum.sizeBytes || 0;
  }

  /**
   * Get document count by status (admin analytics)
   */
  async getCountByStatus(): Promise<{ status: DocumentStatus; count: number }[]> {
    const results = await this.prisma.document.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    return results.map(r => ({
      status: r.status,
      count: r._count.id,
    }));
  }

  /**
   * Get pending verification count (for admin dashboard)
   */
  async getPendingVerificationCount(): Promise<number> {
    return this.prisma.document.count({
      where: { status: DocumentStatus.PENDING_VERIFICATION },
    });
  }
}