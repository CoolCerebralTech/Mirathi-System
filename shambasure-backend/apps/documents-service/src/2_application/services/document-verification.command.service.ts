import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { IDocumentRepository } from '../../3_domain/interfaces';
import { Document } from '../../3_domain/models';
import { Actor, DocumentId, RejectionReason, UserId } from '../../3_domain/value-objects';
import { DocumentStatusEnum } from '../../3_domain/value-objects/document-status.vo';
import { DocumentMapper } from '../mappers';
import { VerifyDocumentDto, VerifyDocumentResponseDto } from '../dtos/verify-document.dto';
import { DOCUMENT_REPOSITORY } from '../../injection.tokens';

@Injectable()
export class DocumentVerificationCommandService {
  private readonly logger = new Logger(DocumentVerificationCommandService.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documentRepository: IDocumentRepository,
    private readonly documentMapper: DocumentMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Verifies or rejects a document
   */
  async verifyOrRejectDocument(
    documentId: DocumentId,
    dto: VerifyDocumentDto,
    actor: Actor,
  ): Promise<VerifyDocumentResponseDto> {
    this.logger.log(
      `Verification attempt on document ${documentId.value} by actor ${actor.id.value}`,
    );

    // 1. Authorization check
    if (!actor.isVerifier() && !actor.isAdmin()) {
      throw new ForbiddenException('Only verifiers and admins can verify documents');
    }

    // 2. Fetch the document aggregate
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId.value} not found`);
    }

    // 3. Validate document state for verification
    this.validateDocumentForVerification(document, actor);

    let verificationAttemptId: string;

    try {
      // 4. Perform verification or rejection - use DocumentStatusEnum for type-safe comparison
      if (dto.status === DocumentStatusEnum.VERIFIED) {
        document.verify(actor);
      } else if (dto.status === DocumentStatusEnum.REJECTED) {
        if (!dto.reason) {
          throw new BadRequestException('Rejection reason is required when status is REJECTED');
        }
        document.reject(actor, RejectionReason.create(dto.reason));
      } else {
        throw new BadRequestException(`Invalid verification status: ${dto.status}`);
      }

      // 5. Update document details if provided - use proper type
      if (dto.documentNumber || dto.extractedData) {
        const updates: {
          documentNumber?: string;
          updatedBy: UserId;
        } = {
          updatedBy: actor.id,
        };

        if (dto.documentNumber) {
          updates.documentNumber = dto.documentNumber;
        }

        document.updateDocumentDetails(updates);

        if (dto.extractedData) {
          document.updateMetadata(dto.extractedData, actor.id);
        }
      }

      // 6. Save the updated aggregate
      await this.documentRepository.save(document);

      // 7. Publish domain events
      this.publishDomainEvents(document);

      // 8. Get the latest verification attempt ID
      const latestAttempt = document.verificationAttempts[document.verificationAttempts.length - 1];
      verificationAttemptId = latestAttempt.id.value;

      this.logger.log(
        `Document ${documentId.value} has been ${dto.status.toLowerCase()} by ${actor.id.value}`,
      );

      // Use DocumentMapper instead of DocumentVerificationAttemptMapper
      return this.documentMapper.toVerifyResponseDto(document, verificationAttemptId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const stackTrace = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to verify document ${documentId.value}: ${errorMessage}`,
        stackTrace,
      );

      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new BadRequestException(`Failed to verify document: ${errorMessage}`);
    }
  }

  /**
   * Bulk verification/rejection of multiple documents
   */
  async bulkVerifyDocuments(
    documentIds: DocumentId[],
    status: DocumentStatusEnum.VERIFIED | DocumentStatusEnum.REJECTED,
    actor: Actor,
    reason?: string,
  ): Promise<{
    successCount: number;
    failedCount: number;
    errors: Array<{ documentId: string; error: string }>;
  }> {
    this.logger.log(
      `Bulk ${status.toLowerCase()} attempt on ${documentIds.length} documents by actor ${actor.id.value}`,
    );

    if (!actor.isVerifier() && !actor.isAdmin()) {
      throw new ForbiddenException('Only verifiers and admins can perform bulk verification');
    }

    if (status === DocumentStatusEnum.REJECTED && !reason) {
      throw new BadRequestException('Rejection reason is required for bulk rejection');
    }

    const documents = await this.documentRepository.findByIds(documentIds);
    if (documents.length !== documentIds.length) {
      throw new NotFoundException('One or more documents not found');
    }

    const processed: Document[] = [];
    const failed: Array<{ documentId: DocumentId; error: string }> = [];

    for (const document of documents) {
      try {
        // Validate document for verification
        this.validateDocumentForVerification(document, actor);

        // Perform verification or rejection
        if (status === DocumentStatusEnum.VERIFIED) {
          document.verify(actor);
        } else {
          document.reject(actor, RejectionReason.create(reason!));
        }

        processed.push(document);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        failed.push({
          documentId: document.id,
          error: errorMessage,
        });
      }
    }

    // Save all successfully processed documents
    if (processed.length > 0) {
      await this.documentRepository.saveMany(processed);

      // Publish events for all processed documents
      for (const document of processed) {
        this.publishDomainEvents(document);
      }
    }

    this.logger.log(
      `Bulk verification completed: ${processed.length} successful, ${failed.length} failed`,
    );

    return {
      successCount: processed.length,
      failedCount: failed.length,
      errors: failed.map((f) => ({
        documentId: f.documentId.value,
        error: f.error,
      })),
    };
  }

  /**
   * Re-verifies a previously rejected document
   */
  async reverifyDocument(
    documentId: DocumentId,
    actor: Actor,
    changeNote?: string,
  ): Promise<VerifyDocumentResponseDto> {
    this.logger.log(
      `Re-verification attempt on document ${documentId.value} by actor ${actor.id.value}`,
    );

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId.value} not found`);
    }

    // Only rejected documents can be re-verified
    if (!document.isRejected()) {
      throw new BadRequestException('Only rejected documents can be re-verified');
    }

    if (!actor.isVerifier() && !actor.isAdmin()) {
      throw new ForbiddenException('Only verifiers and admins can re-verify documents');
    }

    // Create a new version with the change note to trigger re-verification
    if (changeNote) {
      // This would require file upload in practice, but for re-verification we just update metadata
      document.updateMetadata(
        {
          reVerificationNote: changeNote,
          previousRejectionReason: document.rejectionReason?.value,
        },
        actor.id,
      );
    }

    // Reset status to pending for re-verification
    // Note: This is a simplification - in a real system, you might have a different workflow
    document.updateDocumentDetails({
      documentNumber: document.documentNumber ?? undefined, // Convert null to undefined
      updatedBy: actor.id,
    });

    await this.documentRepository.save(document);
    this.publishDomainEvents(document);

    this.logger.log(`Document ${documentId.value} marked for re-verification by ${actor.id.value}`);

    // Return a response indicating the document is pending verification again
    return this.documentMapper.toVerifyResponseDto(document, 're-verification-requested');
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private validateDocumentForVerification(document: Document, actor: Actor): void {
    if (document.isDeleted()) {
      throw new BadRequestException('Cannot verify a deleted document');
    }

    if (document.isExpired()) {
      throw new BadRequestException('Cannot verify an expired document');
    }

    if (document.isVerified()) {
      throw new ConflictException('Document is already verified');
    }

    // Verifiers cannot verify their own documents
    if (document.isOwnedBy(actor.id) && !actor.isAdmin()) {
      throw new ForbiddenException('Cannot verify your own documents');
    }

    // Check if this verifier has already attempted verification
    const hasPreviousAttempt = document.verificationAttempts.some((attempt) =>
      attempt.verifierId.equals(actor.id),
    );

    if (hasPreviousAttempt && !actor.isAdmin()) {
      throw new ConflictException('You have already attempted to verify this document');
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
}
