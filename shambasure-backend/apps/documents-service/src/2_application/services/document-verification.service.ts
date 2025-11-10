import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { IDocumentRepository } from '../../3_domain/interfaces/document-repository.interface';
import { IDocumentVerificationAttemptRepository } from '../../3_domain/interfaces/document-verification.query.interface';
import { DocumentVerificationAttempt } from '../../3_domain/models/document-verification.model';
import { DocumentId, UserId, DocumentStatus, RejectionReason } from '../../3_domain/value-objects';
import { DocumentVerificationAttemptMapper } from '../mappers/document-verification-attempt.mapper';
import { DocumentMapper } from '../mappers/document.mapper';
import { VerifyDocumentDto, VerifyDocumentResponseDto } from '../dtos/verify-document.dto';
import {
  DocumentVerificationHistoryResponseDto,
  VerifierPerformanceResponseDto,
} from '../dtos/verification-history-response.dto';
import { DocumentVerificationAttemptResponseDto } from '../dtos/document-response.dto';

/**
 * DocumentVerificationService - Application Service
 *
 * RESPONSIBILITIES:
 * - Handle document verification workflow
 * - Manage verification attempts
 * - Track verification history
 * - Calculate verifier performance metrics
 */
@Injectable()
export class DocumentVerificationService {
  private readonly logger = new Logger(DocumentVerificationService.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly verificationAttemptRepository: IDocumentVerificationAttemptRepository,
    private readonly verificationMapper: DocumentVerificationAttemptMapper,
    private readonly documentMapper: DocumentMapper,
  ) {}

  // ============================================================================
  // VERIFICATION OPERATIONS
  // ============================================================================

  async verifyDocument(
    documentId: DocumentId,
    dto: VerifyDocumentDto,
    verifierId: UserId,
  ): Promise<VerifyDocumentResponseDto> {
    this.logger.log(`Verifying document: ${documentId.value} by verifier ${verifierId.value}`);

    // 1. Get document
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    // 2. Check if document is in pending state
    if (!document.isPending()) {
      throw new BadRequestException(
        `Document is not pending verification. Current status: ${document.status.value}`,
      );
    }

    // 3. Check if verifier has already attempted
    const hasAlreadyAttempted = await this.verificationAttemptRepository.hasVerifierAttempted(
      documentId,
      verifierId,
    );

    if (hasAlreadyAttempted) {
      throw new BadRequestException('You have already attempted to verify this document');
    }

    try {
      // 4. Create verification attempt
      let attempt: DocumentVerificationAttempt;

      if (dto.status === DocumentStatus.createVerified().value) {
        // Verify document
        document.verify(verifierId);

        attempt = DocumentVerificationAttempt.createVerified({
          documentId,
          verifierId,
          metadata: dto.verificationMetadata,
        });
      } else {
        // Reject document
        if (!dto.reason) {
          throw new BadRequestException('Rejection reason is required');
        }

        const rejectionReason = RejectionReason.create(dto.reason);
        document.reject(verifierId, rejectionReason);

        attempt = DocumentVerificationAttempt.createRejected({
          documentId,
          verifierId,
          reason: rejectionReason,
          metadata: dto.verificationMetadata,
        });
      }

      // 5. Update document details if provided
      if (dto.documentNumber || dto.extractedData) {
        document.updateDocumentDetails({
          documentNumber: dto.documentNumber,
          updatedBy: verifierId,
        });

        if (dto.extractedData) {
          document.updateMetadata(dto.extractedData, verifierId);
        }
      }

      // 6. Save document and attempt
      await Promise.all([
        this.documentRepository.save(document),
        this.verificationAttemptRepository.save(attempt),
      ]);

      // 7. TODO: Publish domain events
      // await this.eventPublisher.publish(document.domainEvents);
      document.clearDomainEvents();

      this.logger.log(
        `Document ${documentId.value} ${dto.status === 'VERIFIED' ? 'verified' : 'rejected'}`,
      );

      return this.documentMapper.toVerifyResponseDto(document, attempt.id.value);
    } catch (error) {
      this.logger.error(`Failed to verify document: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  async getVerificationAttempt(attemptId: string): Promise<DocumentVerificationAttemptResponseDto> {
    this.logger.debug(`Fetching verification attempt: ${attemptId}`);

    const attempt = await this.verificationAttemptRepository.findById(
      new VerificationAttemptId(attemptId),
    );

    if (!attempt) {
      throw new NotFoundException(`Verification attempt not found: ${attemptId}`);
    }

    return this.verificationMapper.toResponseDto(attempt);
  }

  async getDocumentVerificationHistory(
    documentId: DocumentId,
  ): Promise<DocumentVerificationHistoryResponseDto> {
    this.logger.debug(`Fetching verification history for document: ${documentId.value}`);

    const history = await this.verificationAttemptRepository.getDocumentHistory(documentId);

    return this.verificationMapper.toHistoryResponseDto(history);
  }

  async getLatestVerificationAttempt(
    documentId: DocumentId,
  ): Promise<DocumentVerificationAttemptResponseDto | null> {
    const attempt = await this.verificationAttemptRepository.findLatestForDocument(documentId);

    if (!attempt) {
      return null;
    }

    return this.verificationMapper.toResponseDto(attempt);
  }

  async getAllVerificationAttempts(
    documentId: DocumentId,
  ): Promise<DocumentVerificationAttemptResponseDto[]> {
    const attempts = await this.verificationAttemptRepository.findAllForDocument(documentId);

    return this.verificationMapper.toResponseDtoList(attempts);
  }

  // ============================================================================
  // VERIFIER OPERATIONS
  // ============================================================================

  async getVerifierAttempts(
    verifierId: UserId,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<DocumentVerificationAttemptResponseDto[]> {
    this.logger.debug(`Fetching verification attempts for verifier: ${verifierId.value}`);

    const attempts = await this.verificationAttemptRepository.findByVerifier(verifierId, {
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: options?.limit,
      offset: options?.offset,
    });

    return this.verificationMapper.toResponseDtoList(attempts);
  }

  async getVerifierPerformance(
    verifierId: UserId,
    timeRange?: { start: Date; end: Date },
  ): Promise<VerifierPerformanceResponseDto> {
    this.logger.debug(`Calculating performance for verifier: ${verifierId.value}`);

    const range = timeRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date(),
    };

    const stats = await this.verificationAttemptRepository.getPerformanceStatsForVerifier(
      verifierId,
      range,
    );

    return this.verificationMapper.toPerformanceResponseDto(stats);
  }

  async getTopVerifiers(
    limit: number = 10,
    timeRange?: { start: Date; end: Date },
  ): Promise<VerifierPerformanceResponseDto[]> {
    this.logger.debug('Fetching top verifiers');

    const topVerifiers = await this.verificationAttemptRepository.getTopVerifiers(limit, timeRange);

    return this.verificationMapper.toPerformanceResponseDtoList(topVerifiers);
  }

  // ============================================================================
  // STATISTICS OPERATIONS
  // ============================================================================

  async getVerificationMetrics(timeRange: { start: Date; end: Date }): Promise<{
    totalAttempts: number;
    totalVerified: number;
    totalRejected: number;
    uniqueDocuments: number;
    uniqueVerifiers: number;
    averageAttemptsPerDocument: number;
    documentsWithMultipleAttempts: number;
    topRejectionReasons: Array<{ reason: string; count: number }>;
  }> {
    this.logger.debug('Calculating verification metrics');

    return await this.verificationAttemptRepository.getVerificationMetrics(timeRange);
  }

  async getTopRejectionReasons(
    limit: number = 10,
    timeRange?: { start: Date; end: Date },
  ): Promise<Array<{ reason: string; count: number; percentage: number }>> {
    this.logger.debug('Fetching top rejection reasons');

    return await this.verificationAttemptRepository.getTopRejectionReasons(limit, timeRange);
  }

  async getTurnaroundTimeStats(timeRange: { start: Date; end: Date }): Promise<{
    averageHours: number;
    medianHours: number;
    minHours: number;
    maxHours: number;
  }> {
    this.logger.debug('Calculating verification turnaround time stats');

    return await this.verificationAttemptRepository.getTurnaroundTimeStats(timeRange);
  }

  async getVerifierWorkload(timeRange?: { start: Date; end: Date }): Promise<
    Array<{
      verifierId: string;
      totalAttempts: number;
      verified: number;
      rejected: number;
      workloadPercentage: number;
    }>
  > {
    this.logger.debug('Calculating verifier workload distribution');

    return await this.verificationAttemptRepository.getVerifierWorkload(timeRange);
  }

  async getDailyVerificationStats(timeRange: { start: Date; end: Date }): Promise<
    Array<{
      date: string;
      totalAttempts: number;
      verified: number;
      rejected: number;
      uniqueVerifiers: number;
      uniqueDocuments: number;
    }>
  > {
    this.logger.debug('Fetching daily verification stats');

    return await this.verificationAttemptRepository.getDailyStats(timeRange);
  }

  // ============================================================================
  // VALIDATION OPERATIONS
  // ============================================================================

  async canVerifyDocument(
    documentId: DocumentId,
    verifierId: UserId,
  ): Promise<{
    canVerify: boolean;
    reason?: string;
  }> {
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      return { canVerify: false, reason: 'Document not found' };
    }

    if (!document.isPending()) {
      return {
        canVerify: false,
        reason: `Document is not pending verification (Status: ${document.status.value})`,
      };
    }

    const hasAlreadyAttempted = await this.verificationAttemptRepository.hasVerifierAttempted(
      documentId,
      verifierId,
    );

    if (hasAlreadyAttempted) {
      return { canVerify: false, reason: 'You have already attempted to verify this document' };
    }

    return { canVerify: true };
  }

  async getPendingDocumentsCount(): Promise<number> {
    const result = await this.documentRepository.findMany(
      {
        status: DocumentStatus.createPending(),
        includeDeleted: false,
      },
      {
        page: 1,
        limit: 1,
      },
    );

    return result.total;
  }

  async getRecentVerifications(
    withinHours: number = 24,
  ): Promise<DocumentVerificationAttemptResponseDto[]> {
    this.logger.debug(`Fetching verifications within last ${withinHours} hours`);

    const attempts = await this.verificationAttemptRepository.findRecentAttempts(withinHours);

    return this.verificationMapper.toResponseDtoList(attempts);
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async getVerificationHistoryForDocuments(
    documentIds: DocumentId[],
  ): Promise<Map<string, DocumentVerificationAttemptResponseDto[]>> {
    this.logger.debug(`Fetching verification history for ${documentIds.length} documents`);

    const attemptsMap = await this.verificationAttemptRepository.findForDocuments(documentIds);

    const resultMap = new Map<string, DocumentVerificationAttemptResponseDto[]>();

    attemptsMap.forEach((attempts, docId) => {
      resultMap.set(docId, this.verificationMapper.toResponseDtoList(attempts));
    });

    return resultMap;
  }

  async getAttemptCountsForDocuments(documentIds: DocumentId[]): Promise<Map<string, number>> {
    return await this.verificationAttemptRepository.getAttemptCountsForDocuments(documentIds);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private calculateVerificationTime(
    documentCreatedAt: Date,
    verifiedAt: Date,
  ): {
    hours: number;
    days: number;
    formattedTime: string;
  } {
    const diffMs = verifiedAt.getTime() - documentCreatedAt.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    const days = hours / 24;

    let formattedTime: string;
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      formattedTime = `${minutes} minutes`;
    } else if (hours < 24) {
      formattedTime = `${Math.round(hours)} hours`;
    } else {
      formattedTime = `${Math.round(days)} days`;
    }

    return {
      hours: Math.round(hours * 100) / 100,
      days: Math.round(days * 100) / 100,
      formattedTime,
    };
  }
}
