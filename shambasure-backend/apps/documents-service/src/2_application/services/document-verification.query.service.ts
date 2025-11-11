import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import type {
  IDocumentRepository,
  IDocumentVerificationAttemptQueryRepository,
} from '../../3_domain/interfaces';
import { Actor, DocumentId, UserId, VerificationAttemptId } from '../../3_domain/value-objects';
import { DocumentVerificationAttemptMapper } from '../mappers';
import {
  DocumentVerificationHistoryResponseDto,
  VerifierPerformanceResponseDto,
  VerificationAttemptDto,
} from '../dtos/verification-history-response.dto';

export interface VerificationQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class DocumentVerificationQueryService {
  private readonly logger = new Logger(DocumentVerificationQueryService.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly attemptQueryRepository: IDocumentVerificationAttemptQueryRepository,
    private readonly verificationMapper: DocumentVerificationAttemptMapper,
  ) {}

  // ============================================================================
  // SINGLE ATTEMPT QUERIES
  // ============================================================================

  async getAttemptById(
    attemptId: VerificationAttemptId,
    actor: Actor,
  ): Promise<VerificationAttemptDto> {
    this.logger.debug(
      `Fetching verification attempt ${attemptId.value} for actor ${actor.id.value}`,
    );

    const attemptDto = await this.attemptQueryRepository.findById(attemptId);
    if (!attemptDto) {
      throw new NotFoundException('Verification attempt not found');
    }

    // Check access to the parent document
    await this.checkDocumentAccess(new DocumentId(attemptDto.documentId), actor);

    // In a real application, you would fetch verifier name from user service
    const verifierNamesMap = new Map<string, string>();
    // verifierNamesMap.set(attemptDto.verifierId, 'Verifier Name');

    return this.verificationMapper.toDto(await this.mapAttemptDtoToDomain(attemptDto), {
      verifierName: verifierNamesMap.get(attemptDto.verifierId),
    });
  }

  async getLatestAttemptForDocument(
    documentId: DocumentId,
    actor: Actor,
  ): Promise<VerificationAttemptDto | null> {
    this.logger.debug(
      `Fetching latest verification attempt for document ${documentId.value} for actor ${actor.id.value}`,
    );

    await this.checkDocumentAccess(documentId, actor);

    const attemptDto = await this.attemptQueryRepository.findLatestForDocument(documentId);
    if (!attemptDto) {
      return null;
    }

    const verifierNamesMap = new Map<string, string>();
    // verifierNamesMap.set(attemptDto.verifierId, 'Verifier Name');

    return this.verificationMapper.toDto(await this.mapAttemptDtoToDomain(attemptDto), {
      verifierName: verifierNamesMap.get(attemptDto.verifierId),
    });
  }

  // ============================================================================
  // BATCH ATTEMPT QUERIES
  // ============================================================================

  async getHistoryForDocument(
    documentId: DocumentId,
    actor: Actor,
  ): Promise<DocumentVerificationHistoryResponseDto> {
    this.logger.debug(
      `Fetching verification history for document ${documentId.value} for actor ${actor.id.value}`,
    );

    const document = await this.checkDocumentAccess(documentId, actor);

    // Get all verification attempts for this document
    const attemptDtos = await this.attemptQueryRepository.findAllForDocument(documentId, {
      sortBy: 'createdAt',
      sortOrder: 'asc',
    });

    // Map DTOs to domain objects (in real app, this would be more efficient)
    const attempts = await Promise.all(attemptDtos.map((dto) => this.mapAttemptDtoToDomain(dto)));

    // Get verifier names (in real app, batch fetch from user service)
    const verifierNamesMap = new Map<string, string>();
    // This would be populated with actual user data

    return this.verificationMapper.toVerificationHistoryResponseDto(
      documentId,
      document.fileName.value,
      attempts,
      { verifierNamesMap },
    );
  }

  async getAttemptsByVerifier(
    verifierId: UserId,
    options: VerificationQueryOptions = {},
    actor: Actor,
  ): Promise<VerificationAttemptDto[]> {
    this.logger.debug(
      `Fetching verification attempts for verifier ${verifierId.value} for actor ${actor.id.value}`,
    );

    // Only admins or the verifier themselves can view their attempts
    if (!actor.isAdmin() && !actor.id.equals(verifierId)) {
      throw new ForbiddenException('Cannot view other verifiers attempts');
    }

    const queryOptions = {
      sortBy: options.sortBy || 'createdAt',
      sortOrder: options.sortOrder || 'desc',
      limit: options.limit || 50,
      offset: options.page ? (options.page - 1) * (options.limit || 50) : 0,
    };

    const filters: any = { verifierId };
    if (options.startDate) filters.createdAfter = options.startDate;
    if (options.endDate) filters.createdBefore = options.endDate;

    const attemptDtos = await this.attemptQueryRepository.findMany(filters, queryOptions);

    // Map to domain objects and then to response DTOs
    const attempts = await Promise.all(attemptDtos.map((dto) => this.mapAttemptDtoToDomain(dto)));

    // Get document names for enrichment
    const documentNamesMap = new Map<string, string>();
    for (const attempt of attempts) {
      try {
        const document = await this.documentRepository.findById(attempt.documentId);
        if (document) {
          documentNamesMap.set(attempt.documentId.value, document.fileName.value);
        }
      } catch (error) {
        this.logger.warn(
          `Could not fetch document ${attempt.documentId.value} for attempt ${attempt.id.value}`,
        );
      }
    }

    const verifierNamesMap = new Map<string, string>();
    // verifierNamesMap.set(verifierId.value, 'Verifier Name');

    return this.verificationMapper.toDtoList(attempts, {
      verifierNamesMap,
      documentNamesMap,
    });
  }

  // ============================================================================
  // ANALYTICS AND REPORTING
  // ============================================================================

  async getVerifierPerformance(
    verifierId: UserId,
    timeRange?: { start: Date; end: Date },
    actor: Actor,
  ): Promise<VerifierPerformanceResponseDto> {
    this.logger.debug(
      `Fetching performance for verifier ${verifierId.value} for actor ${actor.id.value}`,
    );

    // Only admins or the verifier themselves can view performance
    if (!actor.isAdmin() && !actor.id.equals(verifierId)) {
      throw new ForbiddenException('Cannot view other verifiers performance');
    }

    // Get performance data from repository
    const performanceData =
      (await this.attemptQueryRepository.getVerifierPerformance?.(verifierId, timeRange)) ||
      this.calculateBasicPerformance(verifierId, timeRange);

    // Get verifier name (in real app, from user service)
    const verifierNamesMap = new Map<string, string>();
    // verifierNamesMap.set(verifierId.value, 'Verifier Name');

    return this.verificationMapper.toVerifierPerformanceResponseDto(performanceData, {
      verifierName: verifierNamesMap.get(verifierId.value),
    });
  }

  async getVerificationMetrics(
    timeRange: { start: Date; end: Date },
    actor: Actor,
  ): Promise<{
    totalAttempts: number;
    totalVerified: number;
    totalRejected: number;
    averageProcessingTimeHours: number;
    byVerifier: Record<string, { verified: number; rejected: number }>;
  }> {
    this.logger.debug(`Fetching verification metrics for time range for actor ${actor.id.value}`);

    if (!actor.isAdmin() && !actor.isVerifier()) {
      throw new ForbiddenException('Only admins and verifiers can view verification metrics');
    }

    return (
      (await this.attemptQueryRepository.getVerificationMetrics?.(timeRange)) || {
        totalAttempts: 0,
        totalVerified: 0,
        totalRejected: 0,
        averageProcessingTimeHours: 0,
        byVerifier: {},
      }
    );
  }

  async getComplianceAudit(timeRange: { start: Date; end: Date }, actor: Actor): Promise<any> {
    this.logger.debug(`Fetching compliance audit for time range for actor ${actor.id.value}`);

    if (!actor.isAdmin()) {
      throw new ForbiddenException('Only admins can view compliance audits');
    }

    return (
      (await this.attemptQueryRepository.getComplianceAudit?.(timeRange)) || {
        timeRange,
        totalDocuments: 0,
        verifiedDocuments: 0,
        pendingDocuments: 0,
        averageVerificationTime: 0,
        complianceRate: 0,
        verifierActivity: [],
      }
    );
  }

  // ============================================================================
  // VALIDATION QUERIES
  // ============================================================================

  async hasVerifierAttempted(
    documentId: DocumentId,
    verifierId: UserId,
    actor: Actor,
  ): Promise<boolean> {
    this.logger.debug(
      `Checking if verifier ${verifierId.value} has attempted document ${documentId.value}`,
    );

    // Only admins or the verifier themselves can check this
    if (!actor.isAdmin() && !actor.id.equals(verifierId)) {
      throw new ForbiddenException('Cannot check other verifiers attempts');
    }

    await this.checkDocumentAccess(documentId, actor);

    return await this.attemptQueryRepository.hasVerifierAttempted(documentId, verifierId);
  }

  async getAttemptCountsForDocuments(
    documentIds: DocumentId[],
    actor: Actor,
  ): Promise<Map<string, number>> {
    this.logger.debug(
      `Fetching attempt counts for ${documentIds.length} documents for actor ${actor.id.value}`,
    );

    // Check access to all documents
    for (const documentId of documentIds) {
      await this.checkDocumentAccess(documentId, actor);
    }

    return await this.attemptQueryRepository.getAttemptCountsForDocuments(documentIds);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async checkDocumentAccess(documentId: DocumentId, actor: Actor) {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!document.canBeAccessedBy(actor.id)) {
      throw new ForbiddenException('Access denied to this document');
    }

    return document;
  }

  private async mapAttemptDtoToDomain(attemptDto: any): Promise<any> {
    // This is a simplified mapping. In a real application, you would have a proper
    // method to reconstruct the DocumentVerificationAttempt entity from its DTO representation.
    // For now, we return the DTO as the structure is similar enough for the mapper.
    return attemptDto;
  }

  private async calculateBasicPerformance(
    verifierId: UserId,
    timeRange?: { start: Date; end: Date },
  ): Promise<any> {
    // Fallback method if the repository doesn't provide performance data
    const filters: any = { verifierId };
    if (timeRange) {
      filters.createdAfter = timeRange.start;
      filters.createdBefore = timeRange.end;
    }

    const attempts = await this.attemptQueryRepository.findMany(filters, { limit: 1000 });

    const verified = attempts.filter((a) => a.status === 'VERIFIED').length;
    const rejected = attempts.filter((a) => a.status === 'REJECTED').length;
    const total = attempts.length;

    return {
      verifierId,
      totalAttempts: total,
      verified,
      rejected,
      averageProcessingTimeHours: 0, // Would need timestamps to calculate
      commonRejectionReasons: [], // Would need to analyze reasons
      lastActive:
        attempts.length > 0
          ? new Date(Math.max(...attempts.map((a) => new Date(a.createdAt).getTime())))
          : new Date(),
    };
  }
}
