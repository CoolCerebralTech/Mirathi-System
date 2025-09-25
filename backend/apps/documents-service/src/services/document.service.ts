import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { DocumentRepository } from '../repositories/document.repository';
import { StorageService, FileProcessingOptions } from '../storage/storage.service';
import { VerificationService } from './verification.service';
import { DocumentEntity, DocumentVersionEntity } from '../entities/document.entity';
import { MessagingService } from '@shamba/messaging';
import { LoggerService } from '@shamba/observability';
import { 
  UploadDocumentDto, 
  UpdateDocumentDto, 
  DocumentResponseDto, 
  DocumentVersionResponseDto,
  DocumentStatus,
  EventType 
} from '@shamba/common';
import { JwtPayload } from '@shamba/auth';

@Injectable()
export class DocumentService {
  constructor(
    private documentRepository: DocumentRepository,
    private storageService: StorageService,
    private verificationService: VerificationService,
    private messagingService: MessagingService,
    private logger: LoggerService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    uploadDocumentDto: UploadDocumentDto,
    uploaderId: string,
    processingOptions: FileProcessingOptions = {},
  ): Promise<DocumentResponseDto> {
    this.logger.info('Uploading document', 'DocumentService', { 
      uploaderId,
      filename: file.originalname,
      size: file.size,
    });

    // Validate file type
    if (!this.isSupportedFileType(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    // Validate file size
    const maxSize = this.getMaxFileSize(file.mimetype);
    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds maximum allowed: ${maxSize / 1024 / 1024}MB`);
    }

    // Process and store file
    const storageResult = await this.storageService.storeFile(file, uploaderId, {
      compressImages: true,
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 80,
      extractText: true,
      generateThumbnail: true,
      ...processingOptions,
    });

    // Create document record
    const documentEntity = await this.documentRepository.create(uploaderId, {
      ...uploadDocumentDto,
      filename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: storageResult.size,
    }, storageResult);

    // Start automatic verification process
    if (documentEntity.requiresOCR()) {
      this.startVerificationProcess(documentEntity.id).catch(error => {
        this.logger.error('Failed to start verification process', 'DocumentService', {
          error: error.message,
          documentId: documentEntity.id,
        });
      });
    }

    // Publish document uploaded event
    await this.messagingService.publish(EventType.DOCUMENT_UPLOADED, {
      documentId: documentEntity.id,
      uploaderId: documentEntity.uploaderId,
      filename: documentEntity.filename,
      status: documentEntity.status,
      timestamp: new Date(),
    });

    this.logger.info('Document uploaded successfully', 'DocumentService', { 
      documentId: documentEntity.id,
      uploaderId,
    });

    return this.mapToResponseDto(documentEntity);
  }

  async getDocumentById(documentId: string, currentUser: JwtPayload): Promise<DocumentResponseDto> {
    this.logger.debug('Fetching document by ID', 'DocumentService', { documentId });

    const documentEntity = await this.documentRepository.findById(documentId);

    // Authorization: Only uploader or admin can view document
    if (documentEntity.uploaderId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to this document');
    }

    return this.mapToResponseDto(documentEntity);
  }

  async getDocumentsByUploader(uploaderId: string, currentUser: JwtPayload): Promise<DocumentResponseDto[]> {
    this.logger.debug('Fetching documents for uploader', 'DocumentService', { uploaderId });

    // Authorization: Users can only view their own documents unless admin
    if (uploaderId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to these documents');
    }

    const documentEntities = await this.documentRepository.findByUploaderId(uploaderId);
    return documentEntities.map(doc => this.mapToResponseDto(doc));
  }

  async updateDocument(
    documentId: string,
    updateDocumentDto: UpdateDocumentDto,
    currentUser: JwtPayload,
  ): Promise<DocumentResponseDto> {
    this.logger.info('Updating document', 'DocumentService', { documentId });

    const existingDocument = await this.documentRepository.findById(documentId);

    // Authorization: Only uploader can update their document
    if (existingDocument.uploaderId !== currentUser.userId) {
      throw new ForbiddenException('Only the uploader can update this document');
    }

    // Business rule: Only certain documents can be modified
    if (!existingDocument.canBeModified()) {
      throw new ConflictException('This document cannot be modified in its current state');
    }

    const documentEntity = await this.documentRepository.update(documentId, updateDocumentDto);

    this.logger.info('Document updated successfully', 'DocumentService', { documentId });

    return this.mapToResponseDto(documentEntity);
  }

  async deleteDocument(documentId: string, currentUser: JwtPayload): Promise<void> {
    this.logger.info('Deleting document', 'DocumentService', { documentId });

    const existingDocument = await this.documentRepository.findById(documentId);

    // Authorization: Only uploader or admin can delete document
    if (existingDocument.uploaderId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to delete this document');
    }

    // Business rule: Only certain documents can be deleted
    if (!existingDocument.canBeDeleted()) {
      throw new ConflictException('This document cannot be deleted in its current state');
    }

    // Delete physical file first
    await this.storageService.deleteFile(existingDocument.storagePath);

    // Then delete database record
    await this.documentRepository.delete(documentId);

    this.logger.info('Document deleted successfully', 'DocumentService', { documentId });
  }

  async downloadDocument(documentId: string, currentUser: JwtPayload): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    this.logger.debug('Downloading document', 'DocumentService', { documentId });

    const documentEntity = await this.documentRepository.findById(documentId);

    // Authorization: Only uploader or admin can download document
    if (documentEntity.uploaderId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to download this document');
    }

    const buffer = await this.storageService.retrieveFile(documentEntity.storagePath);

    return {
      buffer,
      filename: documentEntity.originalFilename,
      mimeType: documentEntity.mimeType,
    };
  }

  async getDocumentThumbnail(documentId: string, currentUser: JwtPayload): Promise<Buffer> {
    this.logger.debug('Getting document thumbnail', 'DocumentService', { documentId });

    const documentEntity = await this.documentRepository.findById(documentId);

    // Authorization: Only uploader or admin can access thumbnail
    if (documentEntity.uploaderId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to this document thumbnail');
    }

    // Check if thumbnail exists
    const thumbnailPath = join(
      this.storageService['storagePath'], 
      'thumbnails', 
      `thumb_${documentEntity.filename}`
    );

    try {
      return await this.storageService.retrieveFile(thumbnailPath);
    } catch (error) {
      // If thumbnail doesn't exist, generate one on the fly for images
      if (documentEntity.isImage()) {
        const buffer = await this.storageService.retrieveFile(documentEntity.storagePath);
        const thumbnailBuffer = await sharp(buffer)
          .resize(200, 200)
          .jpeg({ quality: 70 })
          .toBuffer();
        
        // Save thumbnail for future use
        await this.storageService.storeFile(
          {
            buffer: thumbnailBuffer,
            originalname: `thumb_${documentEntity.filename}`,
            mimetype: 'image/jpeg',
            size: thumbnailBuffer.length,
          } as any,
          documentEntity.uploaderId,
        );

        return thumbnailBuffer;
      }

      throw new NotFoundException('Thumbnail not available for this document type');
    }
  }

  async verifyDocument(documentId: string, verifierId: string, force: boolean = false): Promise<DocumentResponseDto> {
    this.logger.info('Verifying document', 'DocumentService', { documentId, verifierId });

    const documentEntity = await this.documentRepository.findById(documentId);

    // If not forced, check if document is already verified
    if (!force && documentEntity.status === DocumentStatus.VERIFIED) {
      throw new ConflictException('Document is already verified');
    }

    // Perform verification checks
    const verificationResult = await this.verificationService.verifyDocument(documentEntity);

    if (verificationResult.status === DocumentStatus.VERIFIED) {
      const updatedDocument = await this.documentRepository.updateStatus(
        documentId,
        DocumentStatus.VERIFIED,
        verifierId,
      );

      // Publish document verified event
      await this.messagingService.publish(EventType.DOCUMENT_VERIFIED, {
        documentId: updatedDocument.id,
        uploaderId: updatedDocument.uploaderId,
        verifiedBy: verifierId,
        confidenceScore: verificationResult.confidenceScore,
        timestamp: new Date(),
      });

      this.logger.info('Document verified successfully', 'DocumentService', {
        documentId,
        confidenceScore: verificationResult.confidenceScore,
      });

      return this.mapToResponseDto(updatedDocument);
    } else {
      const updatedDocument = await this.documentRepository.updateStatus(
        documentId,
        DocumentStatus.REJECTED,
      );

      this.logger.warn('Document verification failed', 'DocumentService', {
        documentId,
        reasons: verificationResult.reasons,
      });

      return this.mapToResponseDto(updatedDocument);
    }
  }

  async rejectDocument(documentId: string, verifierId: string, reasons: string[]): Promise<DocumentResponseDto> {
    this.logger.info('Rejecting document', 'DocumentService', { documentId, verifierId });

    const documentEntity = await this.documentRepository.findById(documentId);

    const updatedDocument = await this.documentRepository.updateStatus(
      documentId,
      DocumentStatus.REJECTED,
    );

    // Update metadata with rejection reasons
    await this.documentRepository.update(documentId, {
      metadata: {
        ...documentEntity.metadata,
        rejectedBy: verifierId,
        rejectedAt: new Date().toISOString(),
        rejectionReasons: reasons,
      },
    });

    this.logger.info('Document rejected', 'DocumentService', {
      documentId,
      reasons,
    });

    return this.mapToResponseDto(updatedDocument);
  }

  async addDocumentVersion(
    documentId: string,
    file: Express.Multer.File,
    changeNote: string,
    uploaderId: string,
  ): Promise<DocumentVersionResponseDto> {
    this.logger.info('Adding document version', 'DocumentService', { documentId });

    const existingDocument = await this.documentRepository.findById(documentId);

    // Authorization: Only uploader can add versions
    if (existingDocument.uploaderId !== uploaderId) {
      throw new ForbiddenException('Only the uploader can add versions to this document');
    }

    // Store new version file
    const storageResult = await this.storageService.storeFile(file, uploaderId, {
      compressImages: true,
      extractText: true,
    });

    // Archive current version if it's not the first version
    if (existingDocument.versions && existingDocument.versions.length > 0) {
      await this.storageService.archiveFile(
        existingDocument.storagePath,
        existingDocument.versions[0].versionNumber,
      );
    }

    // Create new version record
    const versionEntity = await this.documentRepository.addVersion(
      documentId,
      storageResult.filePath,
      changeNote,
    );

    // Update document with new storage path
    await this.documentRepository.update(documentId, {
      storagePath: storageResult.filePath,
      sizeBytes: storageResult.size,
      status: DocumentStatus.PENDING_VERIFICATION, // Reset status for new version
      metadata: {
        ...existingDocument.metadata,
        checksum: storageResult.checksum,
      },
    });

    this.logger.info('Document version added successfully', 'DocumentService', {
      documentId,
      versionNumber: versionEntity.versionNumber,
    });

    return this.mapVersionToResponseDto(versionEntity);
  }

  async searchDocuments(
    uploaderId: string,
    query: string,
    status?: DocumentStatus,
    currentUser: JwtPayload,
  ): Promise<DocumentResponseDto[]> {
    this.logger.debug('Searching documents', 'DocumentService', { uploaderId, query, status });

    // Authorization: Users can only search their own documents unless admin
    if (uploaderId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to search these documents');
    }

    const documentEntities = await this.documentRepository.searchDocuments(uploaderId, query, status);
    return documentEntities.map(doc => this.mapToResponseDto(doc));
  }

  async getDocumentStats(uploaderId: string, currentUser: JwtPayload): Promise<any> {
    this.logger.debug('Fetching document statistics', 'DocumentService', { uploaderId });

    // Authorization: Users can only view their own stats unless admin
    if (uploaderId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to these statistics');
    }

    const stats = await this.documentRepository.getDocumentStats(uploaderId);

    return {
      ...stats,
      generatedAt: new Date().toISOString(),
    };
  }

  private async startVerificationProcess(documentId: string): Promise<void> {
    try {
      // This would be a more sophisticated process in production
      // For now, we'll simulate a delayed verification
      setTimeout(async () => {
        try {
          const document = await this.documentRepository.findById(documentId);
          if (document.status === DocumentStatus.PENDING_VERIFICATION) {
            await this.verificationService.autoVerifyDocument(document);
          }
        } catch (error) {
          this.logger.error('Auto-verification failed', 'DocumentService', {
            documentId,
            error: error.message,
          });
        }
      }, 5000); // 5 second delay for simulation
    } catch (error) {
      this.logger.error('Failed to start verification process', 'DocumentService', {
        documentId,
        error: error.message,
      });
    }
  }

  private isSupportedFileType(mimeType: string): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    return supportedTypes.includes(mimeType);
  }

  private getMaxFileSize(mimeType: string): number {
    const sizeMap: Record<string, number> = {
      'image/jpeg': 10 * 1024 * 1024, // 10MB
      'image/png': 10 * 1024 * 1024, // 10MB
      'image/gif': 5 * 1024 * 1024, // 5MB
      'application/pdf': 20 * 1024 * 1024, // 20MB
      'application/msword': 10 * 1024 * 1024, // 10MB
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10 * 1024 * 1024, // 10MB
    };

    return sizeMap[mimeType] || 5 * 1024 * 1024; // Default 5MB
  }

  private mapToResponseDto(document: DocumentEntity): DocumentResponseDto {
    return {
      id: document.id,
      filename: document.filename,
      originalFilename: document.metadata?.originalFilename || document.filename,
      storagePath: document.storagePath,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      status: document.status,
      uploaderId: document.uploaderId,
      uploader: document.uploader ? {
        id: document.uploader.id,
        email: document.uploader.email,
        firstName: document.uploader.firstName,
        lastName: document.uploader.lastName,
      } : undefined,
      metadata: document.metadata,
      versions: document.versions?.map(version => this.mapVersionToResponseDto(version)) || [],
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  private mapVersionToResponseDto(version: DocumentVersionEntity): DocumentVersionResponseDto {
    return {
      id: version.id,
      versionNumber: version.versionNumber,
      storagePath: version.storagePath,
      changeNote: version.changeNote,
      documentId: version.documentId,
      createdAt: version.createdAt,
    };
  }
}