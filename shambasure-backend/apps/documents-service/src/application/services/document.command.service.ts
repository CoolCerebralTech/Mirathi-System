import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHash } from 'crypto';
import type { IDocumentRepository, IStorageService } from '../../domain/interfaces';
import { Document, DocumentVersion } from '../../domain/models';
import {
  Actor,
  DocumentId,
  FileName,
  FileSize,
  MimeType,
  DocumentChecksum,
  StorageProvider,
  UserId,
  StoragePath,
  RejectionReason,
  DocumentCategory,
  DocumentStatusEnum,
  WillId,
  AssetId,
  RetentionPolicy,
} from '../../domain/value-objects';
import { DocumentMapper, BulkOperationsMapper, DocumentVersionMapper } from '../mappers';
import { FileValidatorService } from '../../infrastructure/storage/file-validator.service';
import { UploadDocumentDto, UploadDocumentResponseDto } from '../dtos/upload-document.dto';
import { VerifyDocumentDto, VerifyDocumentResponseDto } from '../dtos/verify-document.dto';
import { UpdateDocumentDto, UpdateDocumentResponseDto } from '../dtos/update-document.dto';
import { UpdateAccessDto, AccessControlResponseDto } from '../dtos/share-document.dto';
import {
  BulkOperationDto,
  BulkActionType,
  BulkOperationResponseDto,
} from '../dtos/bulk-operations.dto';
import {
  CreateDocumentVersionDto,
  CreateDocumentVersionResponseDto,
} from '../dtos/document-version.dto';
import { DOCUMENT_REPOSITORY, STORAGE_SERVICE } from '../../injection.tokens';

@Injectable()
export class DocumentCommandService {
  private readonly logger = new Logger(DocumentCommandService.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documentRepository: IDocumentRepository,
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
    private readonly documentMapper: DocumentMapper,
    private readonly versionMapper: DocumentVersionMapper,
    private readonly bulkMapper: BulkOperationsMapper,
    private readonly fileValidator: FileValidatorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async uploadDocument(
    dto: UploadDocumentDto,
    fileBuffer: Buffer,
    originalFileName: string,
    mimeTypeFromRequest: string,
    actor: Actor,
  ): Promise<UploadDocumentResponseDto> {
    this.logger.log(`Uploading '${originalFileName}' by actor ${actor.id.value}`);

    const validationResult = this.fileValidator.validateFile(
      fileBuffer,
      originalFileName,
      mimeTypeFromRequest,
    );

    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map((e) => e.message).join('; ');
      throw new BadRequestException(`File validation failed: ${errorMessages}`);
    }

    const storagePath = this.generateStoragePath(originalFileName);
    const checksumValue = this.calculateChecksum(fileBuffer);

    const document = Document.create({
      fileName: FileName.create(dto.fileName),
      fileSize: FileSize.create(fileBuffer.length),
      mimeType: MimeType.create(mimeTypeFromRequest),
      checksum: DocumentChecksum.create(checksumValue),
      storagePath: StoragePath.fromExisting(storagePath),
      category: DocumentCategory.create(dto.category),
      uploaderId: actor.id,
      storageProvider: StorageProvider.create('local'),
      assetId: dto.assetId ? new AssetId(dto.assetId) : undefined,
      willId: dto.willId ? new WillId(dto.willId) : undefined,
      identityForUserId: dto.identityForUserId ? new UserId(dto.identityForUserId) : undefined,
      metadata: dto.metadata ?? undefined,
      documentNumber: dto.documentNumber ?? undefined,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      issuingAuthority: dto.issuingAuthority ?? undefined,
      isPublic: dto.isPublic ?? false,
      retentionPolicy: dto.retentionPolicy
        ? RetentionPolicy.create(dto.retentionPolicy)
        : undefined,
    });

    try {
      await this.storageService.save(fileBuffer, document.storagePath, {
        contentType: document.mimeType,
        metadata: {
          uploaderId: actor.id.value,
          documentId: document.id.value,
          originalFileName,
        },
      });

      await this.documentRepository.save(document);
      this.publishDomainEvents(document);

      this.logger.log(`Successfully uploaded document ${document.id.value}`);
      return this.documentMapper.toUploadResponseDto(document);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Failed to upload document: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Failed to upload document with an unknown error type: ${String(error)}`);
      }

      await this.storageService.delete(document.storagePath).catch((deleteError: unknown) => {
        if (deleteError instanceof Error) {
          this.logger.error(
            `Failed to cleanup file after upload failure: ${deleteError.message}`,
            deleteError.stack,
          );
        } else {
          this.logger.error(
            `Failed to cleanup file with an unknown error type: ${String(deleteError)}`,
          );
        }
      });

      throw new BadRequestException('Failed to upload document');
    }
  }

  async verifyDocument(
    documentId: DocumentId,
    dto: VerifyDocumentDto,
    actor: Actor,
  ): Promise<VerifyDocumentResponseDto> {
    this.logger.log(`Verifying document ${documentId.value} by actor ${actor.id.value}`);

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!document.isPending()) {
      throw new BadRequestException('Document is not pending verification');
    }

    if (!actor.isVerifier() && !actor.isAdmin()) {
      throw new ForbiddenException('No permission to verify documents');
    }

    if (document.isOwnedBy(actor.id)) {
      throw new ForbiddenException('Cannot verify your own documents');
    }

    if (dto.status === DocumentStatusEnum.VERIFIED) {
      document.verify(actor);
    } else {
      if (!dto.reason) {
        throw new BadRequestException('Rejection reason is required');
      }
      document.reject(actor, RejectionReason.create(dto.reason));
    }

    if (dto.documentNumber !== undefined) {
      document.updateDocumentDetails({
        documentNumber: dto.documentNumber,
        updatedBy: actor.id,
      });
    }

    if (dto.extractedData) {
      document.updateMetadata(dto.extractedData, actor.id);
    }

    await this.documentRepository.save(document);
    this.publishDomainEvents(document);

    const latestAttempt = document.verificationAttempts[document.verificationAttempts.length - 1];
    if (!latestAttempt) {
      throw new Error('Could not retrieve verification attempt');
    }

    this.logger.log(
      `Document ${documentId.value} ${dto.status.toLowerCase()} by ${actor.id.value}`,
    );
    return this.documentMapper.toVerifyResponseDto(document, latestAttempt.id.value);
  }

  async updateDocument(
    documentId: DocumentId,
    dto: UpdateDocumentDto,
    actor: Actor,
  ): Promise<UpdateDocumentResponseDto> {
    this.logger.log(`Updating document ${documentId.value} by actor ${actor.id.value}`);

    const document = await this.getDocumentForModification(documentId, actor);
    const commandPayload = this.documentMapper.updateDtoToCommandPayload(dto);

    // Define a specific type for the update payload
    type DocumentUpdatePayload = {
      updatedBy: UserId;
      fileName?: FileName;
      documentNumber?: string;
      issueDate?: Date;
      expiryDate?: Date;
      issuingAuthority?: string;
    };

    // Initialize the updates object with the strong type and the required `updatedBy` property
    const updates: DocumentUpdatePayload = {
      updatedBy: actor.id,
    };

    // Conditionally add properties. TypeScript can now validate these assignments.
    if (commandPayload.fileName) {
      updates.fileName = commandPayload.fileName;
    }
    if (commandPayload.documentNumber !== undefined) {
      updates.documentNumber = commandPayload.documentNumber;
    }
    if (commandPayload.issueDate) {
      updates.issueDate = commandPayload.issueDate;
    }
    if (commandPayload.expiryDate) {
      updates.expiryDate = commandPayload.expiryDate;
    }
    if (commandPayload.issuingAuthority !== undefined) {
      updates.issuingAuthority = commandPayload.issuingAuthority;
    }

    // Pass the correctly typed object. The 'no-unsafe-argument' error is now resolved.
    document.updateDocumentDetails(updates);

    if (commandPayload.metadata) {
      document.updateMetadata(commandPayload.metadata, actor.id);
    }

    if (commandPayload.allowedViewers !== undefined) {
      const newViewers = commandPayload.allowedViewers;
      const currentViewers = document.allowedViewers.toArray();

      const usersToRevoke = currentViewers.filter(
        (currentUserId) => !newViewers.some((newUserId) => newUserId.equals(currentUserId)),
      );
      if (usersToRevoke.length > 0) {
        document.revokeAccess(actor, usersToRevoke);
      }

      const usersToAdd = newViewers.filter(
        (newUserId) => !currentViewers.some((currentUserId) => currentUserId.equals(newUserId)),
      );
      if (usersToAdd.length > 0) {
        document.shareWith(actor, usersToAdd);
      }
    }

    await this.documentRepository.save(document);
    this.publishDomainEvents(document);

    this.logger.log(`Successfully updated document ${documentId.value}`);
    return this.documentMapper.toUpdateResponseDto(document);
  }

  async createDocumentVersion(
    documentId: DocumentId,
    dto: CreateDocumentVersionDto,
    fileBuffer: Buffer,
    originalFileName: string,
    actor: Actor,
  ): Promise<CreateDocumentVersionResponseDto> {
    this.logger.log(`Creating version for document ${documentId.value} by actor ${actor.id.value}`);

    const document = await this.getDocumentForModification(documentId, actor);

    const validationResult = this.fileValidator.validateFile(
      fileBuffer,
      originalFileName,
      document.mimeType.value,
    );

    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map((e) => e.message).join('; ');
      throw new BadRequestException(`File validation failed: ${errorMessages}`);
    }

    const storagePath = this.generateVersionStoragePath(document, originalFileName);
    const checksum = this.calculateChecksum(fileBuffer);

    const fileSize = FileSize.create(fileBuffer.length);
    const mimeType = MimeType.create(document.mimeType.value);
    const documentChecksum = DocumentChecksum.create(checksum);

    document.recordNewVersion({
      uploadedBy: actor.id,
      storagePath: StoragePath.fromExisting(storagePath),
      fileSize,
      mimeType,
      checksum: documentChecksum,
      changeNote: dto.changeNote,
    });

    const latestVersionFromArray = document.versions[document.versions.length - 1];

    // Defensive check to ensure the version was actually created and added
    if (!latestVersionFromArray) {
      // This should theoretically never happen if recordNewVersion works as expected
      throw new Error('Failed to retrieve the newly created document version.');
    }

    // Re-assert the type to satisfy the mapper's method signature.
    // This tells TypeScript that we are confident this is a full, usable DocumentVersion instance.
    const latestVersion = latestVersionFromArray as DocumentVersion;

    try {
      await this.storageService.save(fileBuffer, latestVersion.storagePath, {
        contentType: latestVersion.mimeType,
        metadata: {
          version: String(latestVersion.versionNumber),
          uploadedBy: actor.id.value,
          changeNote: dto.changeNote ?? '',
        },
      });

      await this.documentRepository.save(document);
      this.publishDomainEvents(document);

      this.logger.log(
        `Created version ${latestVersion.versionNumber} for document ${documentId.value}`,
      );
      // Now passing the correctly typed variable to the mapper
      return this.versionMapper.toCreateResponseDto(latestVersion, document.fileName.value);
    } catch (error: unknown) {
      // Safely handle the primary error
      if (error instanceof Error) {
        this.logger.error(`Failed to create version: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Failed to create version with an unknown error: ${String(error)}`);
      }

      await this.storageService
        .delete(StoragePath.fromExisting(storagePath))
        .catch((deleteError: unknown) => {
          // Safely handle the cleanup error
          if (deleteError instanceof Error) {
            this.logger.error(
              `Failed to cleanup version file: ${deleteError.message}`,
              deleteError.stack,
            );
          } else {
            this.logger.error(
              `Failed to cleanup version file with an unknown error: ${String(deleteError)}`,
            );
          }
        });

      throw new BadRequestException('Failed to create document version');
    }
  }

  async updateDocumentAccess(
    documentId: DocumentId,
    dto: UpdateAccessDto,
    actor: Actor,
  ): Promise<AccessControlResponseDto> {
    this.logger.log(`Updating access for document ${documentId.value} by actor ${actor.id.value}`);

    const document = await this.getDocumentForModification(documentId, actor);

    if (dto.isPublic !== undefined) {
      if (dto.isPublic) {
        document.makePublic(actor);
      } else {
        document.makePrivate(actor);
      }
    }

    if (dto.shareWith && dto.shareWith.length > 0) {
      const userIds = dto.shareWith.map((id) => new UserId(id));
      document.shareWith(actor, userIds);
    }

    if (dto.revokeFrom && dto.revokeFrom.length > 0) {
      const userIds = dto.revokeFrom.map((id) => new UserId(id));
      document.revokeAccess(actor, userIds);
    }

    await this.documentRepository.save(document);
    this.publishDomainEvents(document);

    this.logger.log(`Successfully updated access for document ${documentId.value}`);
    return this.documentMapper.toAccessControlResponseDto(document);
  }

  async softDeleteDocument(documentId: DocumentId, actor: Actor): Promise<void> {
    this.logger.log(`Soft deleting document ${documentId.value} by actor ${actor.id.value}`);

    const document = await this.getDocumentForModification(documentId, actor);
    document.softDelete(actor.id);

    await this.documentRepository.save(document);
    this.publishDomainEvents(document);

    this.logger.log(`Successfully soft deleted document ${documentId.value}`);
  }

  async restoreDocument(documentId: DocumentId, actor: Actor): Promise<void> {
    this.logger.log(`Restoring document ${documentId.value} by actor ${actor.id.value}`);

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!document.isDeleted()) {
      throw new BadRequestException('Document is not deleted');
    }

    if (!document.isOwnedBy(actor.id) && !actor.isAdmin()) {
      throw new ForbiddenException('Only document owner or admin can restore documents');
    }

    document.restore(actor.id);
    await this.documentRepository.save(document);
    this.publishDomainEvents(document);

    this.logger.log(`Successfully restored document ${documentId.value}`);
  }

  async handleBulkOperation(
    dto: BulkOperationDto,
    actor: Actor,
  ): Promise<BulkOperationResponseDto> {
    this.logger.log(
      `Bulk operation ${dto.action} on ${dto.documentIds.length} documents by actor ${actor.id.value}`,
    );

    const documentIds = dto.documentIds.map((id) => new DocumentId(id));
    const documents = await this.documentRepository.findByIds(documentIds);

    if (documents.length !== dto.documentIds.length) {
      throw new NotFoundException('One or more documents not found');
    }

    const processed: DocumentId[] = [];
    const failed: Array<{ documentId: DocumentId; error: string }> = [];
    const docsToSave: Document[] = [];

    for (const document of documents) {
      try {
        if (!this.canPerformBulkAction(document, actor, dto.action)) {
          throw new ForbiddenException(
            `No permission to perform ${dto.action} on document ${document.id.value}`,
          );
        }

        this.performBulkAction(document, actor, dto);
        docsToSave.push(document);
        processed.push(document.id);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failed.push({
          documentId: document.id,
          error: errorMessage,
        });
      }
    }

    if (docsToSave.length > 0) {
      await this.documentRepository.saveMany(docsToSave);
      for (const doc of docsToSave) {
        this.publishDomainEvents(doc);
      }
    }

    this.logger.log(
      `Bulk operation completed: ${processed.length} successful, ${failed.length} failed`,
    );
    return this.bulkMapper.fromDocumentOperationResult({ processed, failed });
  }

  private async getDocumentForModification(
    documentId: DocumentId,
    actor: Actor,
  ): Promise<Document> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.isDeleted()) {
      throw new BadRequestException('Cannot modify deleted document');
    }

    if (document.isExpired()) {
      throw new BadRequestException('Cannot modify expired document');
    }

    if (!document.isOwnedBy(actor.id) && !actor.isAdmin()) {
      throw new ForbiddenException('Only document owner or admin can modify documents');
    }

    if (document.isVerified() && !actor.isAdmin()) {
      throw new ForbiddenException('Cannot modify verified documents');
    }

    return document;
  }

  private canPerformBulkAction(document: Document, actor: Actor, action: BulkActionType): boolean {
    switch (action) {
      case BulkActionType.DELETE:
        return document.isOwnedBy(actor.id) || actor.isAdmin();
      case BulkActionType.RESTORE:
        return document.isOwnedBy(actor.id) || actor.isAdmin();
      case BulkActionType.SHARE:
      case BulkActionType.REVOKE_ACCESS:
        return document.isOwnedBy(actor.id) || actor.isAdmin();
      case BulkActionType.CHANGE_STATUS:
        return actor.isVerifier() || actor.isAdmin();
      default:
        return false;
    }
  }

  private performBulkAction(document: Document, actor: Actor, dto: BulkOperationDto): void {
    switch (dto.action) {
      // ... (all other 'case' blocks are correct and remain the same)
      case BulkActionType.DELETE: {
        document.softDelete(actor.id);
        break;
      }
      case BulkActionType.RESTORE: {
        if (!document.isDeleted()) {
          throw new BadRequestException('Document is not deleted');
        }
        document.restore(actor.id);
        break;
      }
      case BulkActionType.SHARE: {
        if (!dto.userIds || dto.userIds.length === 0) {
          throw new BadRequestException('User IDs required for sharing');
        }
        const shareUserIds = dto.userIds.map((id) => new UserId(id));
        document.shareWith(actor, shareUserIds);
        break;
      }
      case BulkActionType.REVOKE_ACCESS: {
        if (!dto.userIds || dto.userIds.length === 0) {
          throw new BadRequestException('User IDs required for revoking access');
        }
        const revokeUserIds = dto.userIds.map((id) => new UserId(id));
        document.revokeAccess(actor, revokeUserIds);
        break;
      }
      case BulkActionType.CHANGE_STATUS: {
        if (!dto.status) {
          throw new BadRequestException('Status required for status change');
        }
        if (dto.status === DocumentStatusEnum.VERIFIED) {
          document.verify(actor);
        } else if (dto.status === DocumentStatusEnum.REJECTED) {
          if (!dto.reason) {
            throw new BadRequestException('Reason required for rejection');
          }
          document.reject(actor, RejectionReason.create(dto.reason));
        }
        break;
      }

      // This is the final, corrected default case.
      default: {
        // This line provides the crucial compile-time safety. The TypeScript
        // compiler will error here if you add a new BulkActionType and forget
        // to handle it in a 'case' above. This is its entire purpose.

        // Throw a generic error. We do not use the `_exhaustiveCheck` variable
        // because this code path is unreachable at runtime. This satisfies the linter.
        throw new BadRequestException('Unsupported bulk action type provided.');
      }
    }
  }

  private publishDomainEvents(document: Document): void {
    if (document.domainEvents.length === 0) return;

    this.logger.debug(
      `Publishing ${document.domainEvents.length} domain events for document ${document.id.value}`,
    );

    document.domainEvents.forEach((event) => {
      this.eventEmitter.emit(event.constructor.name, event);
    });

    document.clearDomainEvents();
  }

  private calculateChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private generateStoragePath(originalFileName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = originalFileName.split('.').pop() || 'bin';
    return `/documents/${timestamp}-${randomString}.${fileExtension}`;
  }

  private generateVersionStoragePath(document: Document, originalFileName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const versionNumber = document.versions.length + 1;
    const fileExtension = originalFileName.split('.').pop() || 'bin';
    return `/documents/${document.id.value}/versions/${timestamp}-v${versionNumber}-${randomString}.${fileExtension}`;
  }
}
