import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Document, DocumentStatus } from '@shamba/database';
import { DocumentQueryDto, EventPattern, ShambaEvent } from '@shamba/common';
import { JwtPayload } from '@shamba/auth';
import { MessagingService } from '@shamba/messaging';

import { DocumentsRepository } from '../repositories/documents.repository';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly storageService: StorageService,
    private readonly messagingService: MessagingService,
  ) {}

  /**
   * Handles the entire process of uploading a new document.
   * @param uploaderId The ID of the user uploading the document.
   * @param file The file data from the request.
   * @returns The created Document database record.
   */
  async createDocument(
    uploaderId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    // 1. Store the physical file using the StorageService.
    const storageResult = await this.storageService.storeFile(file, uploaderId);

    // 2. Create the document record in the database via the repository.
    const document = await this.documentsRepository.create({
      filename: file.originalname,
      storagePath: storageResult.path,
      mimeType: file.mimetype,
      sizeBytes: storageResult.size,
      status: DocumentStatus.PENDING_VERIFICATION,
      uploader: { connect: { id: uploaderId } },
      versions: {
        create: {
          versionNumber: 1,
          storagePath: storageResult.path,
          changeNote: 'Initial upload',
        },
      },
    });

    // 3. Publish a domain event to notify other services.
    this.publishDocumentEvent(EventPattern.DOCUMENT_UPLOADED, document);

    return document;
  }

  /**
   * Retrieves a single document, ensuring the requesting user has permission.
   * @param documentId The ID of the document to retrieve.
   * @param currentUser The JWT payload of the user making the request.
   */
  async findOne(documentId: string, currentUser: JwtPayload): Promise<Document> {
    const document = await this.documentsRepository.findOneOrFail({ id: documentId });

    if (document.uploaderId !== currentUser.sub && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You do not have permission to access this document.');
    }
    return document;
  }

  /**
   * Retrieves a paginated list of documents for a specific user.
   */
  async findForUser(
    uploaderId: string,
    query: DocumentQueryDto,
  ): Promise<{ documents: Document[]; total: number }> {
    return this.documentsRepository.findMany({ uploaderId, status: query.status }, query);
  }

  /**
   * Deletes a document, including its physical file.
   * @param documentId The ID of the document to delete.
   * @param currentUser The JWT payload of the user making the request.
   */
  async deleteDocument(documentId: string, currentUser: JwtPayload): Promise<void> {
    const document = await this.findOne(documentId, currentUser); // Re-uses auth check

    if (document.status === DocumentStatus.VERIFIED) {
      throw new BadRequestException('Verified documents cannot be deleted.');
    }

    // It's safer to delete the database record first. If the file deletion fails,
    // we can have an orphan file, which is better than an orphan DB record.
    await this.documentsRepository.delete(documentId);
    await this.storageService.deleteFile(document.storagePath);

    // Publish a 'document.deleted' event if other services need to react.
    // this.publishDocumentEvent('document.deleted', document);
  }

  /**
   * Retrieves a document's content for download.
   */
  async download(
    documentId: string,
    currentUser: JwtPayload,
  ): Promise<{ buffer: Buffer; document: Document }> {
    const document = await this.findOne(documentId, currentUser); // Re-uses auth check
    const buffer = await this.storageService.retrieveFile(document.storagePath);
    return { buffer, document };
  }

  // A helper to centralize event publishing for this service.
  private publishDocumentEvent(type: EventPattern | 'anyOtherValue', document: Document): void {
    const event: ShambaEvent = {
      type: type,
      timestamp: new Date(),
      version: '1.0',
      source: 'documents-service',
      data: {
        documentId: document.id,
        uploaderId: document.uploaderId,
        filename: document.filename,
        status: document.status,
      },
    };
    this.messagingService.emit(event);
  }
}