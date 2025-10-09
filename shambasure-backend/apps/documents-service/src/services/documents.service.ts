/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// ============================================================================
// documents.service.ts - Document Management Business Logic
// ============================================================================

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Document, DocumentStatus, DocumentVersion, UserRole } from '@shamba/database';
import {
  DocumentQueryDto,
  EventPattern,
  DocumentUploadedEvent,
  DocumentVerifiedEvent,
  DocumentDeletedEvent,
} from '@shamba/common';
import { JwtPayload } from '@shamba/auth';
import { MessagingService } from '@shamba/messaging';

import { DocumentsRepository } from '../repositories/documents.repository';
import { StorageService } from '../storage/storage.service';

/**
 * DocumentsService - Core document management business logic
 *
 * RESPONSIBILITIES:
 * - Document upload with validation
 * - Document versioning
 * - Authorization checks (ownership, admin)
 * - Status transitions (pending → verified → rejected)
 * - File storage orchestration
 * - Event publishing
 *
 * BUSINESS RULES:
 * - Users can only access their own documents (unless admin)
 * - Verified documents cannot be deleted
 * - File size limits enforced
 * - MIME type validation
 * - Version history maintained
 */
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  // Configuration constants (should come from ConfigService in real app)
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly storageService: StorageService,
    private readonly messagingService: MessagingService,
  ) {}

  // ========================================================================
  // CREATE OPERATIONS
  // ========================================================================

  /**
   * Upload a new document
   *
   * WORKFLOW:
   * 1. Validate file (size, type)
   * 2. Store file physically
   * 3. Create database record with initial version
   * 4. Publish DocumentUploadedEvent
   *
   * @throws BadRequestException if validation fails
   * @throws PayloadTooLargeException if file too large
   * @throws UnsupportedMediaTypeException if invalid MIME type
   */
  async createDocument(
    uploaderId: string,
    file: Express.Multer.File,
  ): Promise<Document & { versions: DocumentVersion[] }> {
    // Validate file
    this.validateFile(file);

    try {
      // Store physical file
      const storageResult = await this.storageService.storeFile(file, uploaderId);

      // Create document + first version atomically
      const document = await this.documentsRepository.createWithVersion(
        {
          filename: file.originalname,
          storagePath: storageResult.path,
          mimeType: file.mimetype,
          sizeBytes: storageResult.size,
          status: DocumentStatus.PENDING_VERIFICATION,
          uploader: { connect: { id: uploaderId } },
        },
        {
          versionNumber: 1,
          storagePath: storageResult.path,
          changeNote: 'Initial upload',
        },
      );

      // Publish domain event
      this.publishDocumentUploadedEvent(document);

      this.logger.log(
        `Document uploaded: ${document.id} by user ${uploaderId} (${file.originalname})`,
      );

      return document;
    } catch (error) {
      // If database creation fails, attempt to clean up stored file
      this.logger.error(`Document creation failed for user ${uploaderId}`, error);
      throw error;
    }
  }

  /**
   * Add a new version to existing document
   *
   * BUSINESS RULES:
   * - Only document owner can add versions
   * - Version number auto-incremented
   * - Updates document's main storagePath to new version
   */
  async addVersion(
    documentId: string,
    file: Express.Multer.File,
    changeNote: string | null,
    currentUser: JwtPayload,
  ): Promise<Document & { versions: DocumentVersion[] }> {
    // Validate file
    this.validateFile(file);

    // Check ownership

    // Store new file
    const storageResult = await this.storageService.storeFile(file, currentUser.sub);

    // Get next version number
    const versionCount = await this.documentsRepository.getVersionCount(documentId);
    const nextVersionNumber = versionCount + 1;

    // Create new version
    await this.documentsRepository.addVersion({
      documentId,
      versionNumber: nextVersionNumber,
      storagePath: storageResult.path,
      changeNote,
    });

    // Update document's main storage path to latest version
    const updatedDocument = await this.documentsRepository.updateWithVersions(documentId, {
      storagePath: storageResult.path,
      sizeBytes: storageResult.size,
      mimeType: file.mimetype,
    });

    this.logger.log(
      `Version ${nextVersionNumber} added to document ${documentId} by user ${currentUser.sub}`,
    );

    return updatedDocument;
  }

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  /**
   * Get single document with authorization check
   *
   * AUTHORIZATION:
   * - Users can access their own documents
   * - Admins can access all documents
   */
  async findOne(
    documentId: string,
    currentUser: JwtPayload,
  ): Promise<Document & { versions: DocumentVersion[] }> {
    const document = await this.documentsRepository.findOneOrFail({ id: documentId });

    // Authorization check
    if (document.uploaderId !== currentUser.sub && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to access this document');
    }

    return document;
  }

  /**
   * Get documents for current user (paginated)
   */
  async findForUser(
    uploaderId: string,
    query: DocumentQueryDto,
  ): Promise<{ documents: Document[]; total: number }> {
    const where: any = { uploaderId };

    // Filter by status if provided
    if (query.status) {
      where.status = query.status;
    }

    return this.documentsRepository.findMany(where, query);
  }

  /**
   * Get all documents (admin only)
   */
  async findAll(query: DocumentQueryDto): Promise<{ documents: Document[]; total: number }> {
    const where: any = {};

    // Filter by status if provided
    if (query.status) {
      where.status = query.status;
    }

    return this.documentsRepository.findMany(where, query);
  }

  /**
   * Download document file
   * Returns buffer and document metadata
   */
  async download(
    documentId: string,
    currentUser: JwtPayload,
  ): Promise<{ buffer: Buffer; document: Document & { versions: DocumentVersion[] } }> {
    const document = await this.findOne(documentId, currentUser);
    const buffer = await this.storageService.retrieveFile(document.storagePath);

    this.logger.log(`Document downloaded: ${documentId} by user ${currentUser.sub}`);

    return { buffer, document };
  }

  /**
   * Download specific version
   */
  async downloadVersion(
    documentId: string,
    versionNumber: number,
    currentUser: JwtPayload,
  ): Promise<{ buffer: Buffer; version: DocumentVersion }> {
    // Check authorization
    await this.findOne(documentId, currentUser);

    // Get version
    const version = await this.documentsRepository.getVersion(documentId, versionNumber);
    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} not found for document ${documentId}`);
    }

    const buffer = await this.storageService.retrieveFile(version.storagePath);

    return { buffer, version };
  }

  /**
   * Get user's storage statistics
   */
  async getUserStats(uploaderId: string) {
    const [stats, totalStorage] = await Promise.all([
      this.documentsRepository.getStatsForUploader(uploaderId),
      this.documentsRepository.getTotalStorageUsed(uploaderId),
    ]);

    return {
      totalDocuments: stats.reduce((sum, s) => sum + s._count.id, 0),
      totalStorageBytes: totalStorage,
      byStatus: stats.map((s) => ({
        status: s.status,
        mimeType: s.mimeType,
        count: s._count.id,
        sizeBytes: s._sum.sizeBytes || 0,
      })),
    };
  }

  // ========================================================================
  // UPDATE OPERATIONS
  // ========================================================================

  /**
   * Verify document (admin only)
   * Transitions status: PENDING_VERIFICATION → VERIFIED
   */
  async verifyDocument(documentId: string, adminUser: JwtPayload): Promise<Document> {
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can verify documents');
    }

    const document = await this.documentsRepository.findOneOrFail({ id: documentId });

    if (document.status !== DocumentStatus.PENDING_VERIFICATION) {
      throw new BadRequestException(
        `Document is in ${document.status} status and cannot be verified`,
      );
    }

    const updatedDocument = await this.documentsRepository.updateStatus(
      documentId,
      DocumentStatus.VERIFIED,
    );

    // Publish event
    this.publishDocumentVerifiedEvent(updatedDocument);

    this.logger.log(`Document verified: ${documentId} by admin ${adminUser.sub}`);

    return updatedDocument;
  }

  /**
   * Reject document (admin only)
   * Transitions status: PENDING_VERIFICATION → REJECTED
   */
  async rejectDocument(documentId: string, adminUser: JwtPayload): Promise<Document> {
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can reject documents');
    }

    const document = await this.documentsRepository.findOneOrFail({ id: documentId });

    if (document.status !== DocumentStatus.PENDING_VERIFICATION) {
      throw new BadRequestException(
        `Document is in ${document.status} status and cannot be rejected`,
      );
    }

    const updatedDocument = await this.documentsRepository.updateStatus(
      documentId,
      DocumentStatus.REJECTED,
    );

    this.logger.log(`Document rejected: ${documentId} by admin ${adminUser.sub}`);

    return updatedDocument;
  }

  // ========================================================================
  // DELETE OPERATIONS
  // ========================================================================

  /**
   * Delete document
   *
   * BUSINESS RULES:
   * - Only document owner can delete (or admin)
   * - Verified documents cannot be deleted
   * - Deletes all versions and physical files
   */
  async deleteDocument(documentId: string, currentUser: JwtPayload): Promise<void> {
    const document = await this.findOne(documentId, currentUser);

    // Business rule: Verified documents cannot be deleted
    if (document.status === DocumentStatus.VERIFIED) {
      throw new BadRequestException(
        'Verified documents cannot be deleted. Contact an administrator.',
      );
    }

    // Delete database record first (cascades to versions)
    await this.documentsRepository.delete(documentId);

    // Clean up physical files (best effort - log errors but don't fail)
    await this.cleanupDocumentFiles(document);

    // Publish event
    this.publishDocumentDeletedEvent(document);

    this.logger.log(`Document deleted: ${documentId} by user ${currentUser.sub}`);
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Validate uploaded file
   * @throws BadRequestException if validation fails
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new PayloadTooLargeException(
        `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new UnsupportedMediaTypeException(
        `File type '${file.mimetype}' is not supported. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
  }

  /**
   * Clean up all physical files for a document (main + versions)
   */
  private async cleanupDocumentFiles(
    document: Document & { versions: DocumentVersion[] },
  ): Promise<void> {
    const pathsToDelete = new Set<string>();

    // Add main storage path
    pathsToDelete.add(document.storagePath);

    // Add all version paths
    document.versions.forEach((v) => pathsToDelete.add(v.storagePath));

    // Delete all files (best effort)
    for (const path of pathsToDelete) {
      try {
        await this.storageService.deleteFile(path);
      } catch (error) {
        this.logger.warn(`Failed to delete file: ${path}`, error);
      }
    }
  }

  // ========================================================================
  // EVENT PUBLISHING
  // ========================================================================

  private publishDocumentUploadedEvent(document: Document): void {
    const event: DocumentUploadedEvent = {
      type: EventPattern.DOCUMENT_UPLOADED,
      timestamp: new Date(),
      version: '1.0',
      source: 'documents-service',
      data: {
        documentId: document.id,
        uploaderId: document.uploaderId,
        filename: document.filename,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        status: document.status,
      },
    };

    try {
      this.messagingService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to publish DocumentUploadedEvent`, error);
    }
  }

  private publishDocumentVerifiedEvent(document: Document): void {
    const event: DocumentVerifiedEvent = {
      type: EventPattern.DOCUMENT_VERIFIED,
      timestamp: new Date(),
      version: '1.0',
      source: 'documents-service',
      data: {
        documentId: document.id,
        uploaderId: document.uploaderId,
        filename: document.filename,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        status: document.status,
      },
    };

    try {
      this.messagingService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to publish DocumentVerifiedEvent`, error);
    }
  }

  private publishDocumentDeletedEvent(document: Document): void {
    const event: DocumentDeletedEvent = {
      type: EventPattern.DOCUMENT_DELETED,
      timestamp: new Date(),
      version: '1.0',
      source: 'documents-service',
      data: {
        documentId: document.id,
        uploaderId: document.uploaderId,
      },
    };

    try {
      this.messagingService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to publish DocumentDeletedEvent`, error);
    }
  }
}
