import { Injectable, Logger, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import type {
  IDocumentRepository,
  IDocumentVerificationAttemptQueryRepository,
} from '../../domain/interfaces';
import { Actor, DocumentId, UserId, VerificationAttemptId } from '../../domain/value-objects';
import { DocumentVerificationAttemptMapper } from '../mappers';
import {
  DocumentVerificationHistoryResponseDto,
  VerifierPerformanceResponseDto,
  VerificationAttemptDto,
} from '../dtos/verification-history-response.dto';
import { DocumentVerificationAttempt } from '../../domain/models/document-verification.model';
import {
  DOCUMENT_REPOSITORY,
  DOCUMENT_VERIFICATION_QUERY_REPOSITORY,
} from '../../injection.tokens';

// Define proper types based on the repository interface
export interface VerificationQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  sortBy: 'createdAt';
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}

@Injectable()
export class DocumentVerificationQueryService {
  private readonly logger = new Logger(DocumentVerificationQueryService.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documentRepository: IDocumentRepository,
    @Inject(DOCUMENT_VERIFICATION_QUERY_REPOSITORY)
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

    // Convert DTO to domain entity
    const attempt = this.mapAttemptDtoToDomain(attemptDto);

    // In a real application, you would fetch verifier name from user service
    const verifierNamesMap = new Map<string, string>();

    return this.verificationMapper.toDto(attempt, {
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

    // Convert DTO to domain entity
    const attempt = this.mapAttemptDtoToDomain(attemptDto);

    const verifierNamesMap = new Map<string, string>();

    return this.verificationMapper.toDto(attempt, {
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

    // Get all verification attempts for this document
    const attemptDtos = await this.attemptQueryRepository.findAllForDocument(documentId, {
      sortBy: 'createdAt',
      sortOrder: 'asc',
    });

    // Map DTOs to domain entities
    const attempts = attemptDtos.map((dto) => this.mapAttemptDtoToDomain(dto));

    // Get verifier names (in real app, batch fetch from user service)
    const verifierNamesMap = new Map<string, string>();

    return this.verificationMapper.toVerificationHistoryResponseDto(documentId, attempts, {
      verifierNamesMap,
    });
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

    const queryOptions: PaginationOptions = {
      sortBy: 'createdAt',
      sortOrder: options.sortOrder || 'desc',
      limit: options.limit || 50,
      offset: options.page ? (options.page - 1) * (options.limit || 50) : 0,
    };

    const attemptDtos = await this.attemptQueryRepository.findByVerifier(verifierId, queryOptions);

    // Map to domain entities and then to response DTOs
    const attempts = attemptDtos.map((dto) => this.mapAttemptDtoToDomain(dto));

    // Get document names for enrichment
    const documentNamesMap = new Map<string, string>();

    // Use Promise.all for parallel document fetching
    const documentPromises = attempts.map(async (attempt) => {
      try {
        const document = await this.documentRepository.findById(attempt.documentId);
        if (document) {
          documentNamesMap.set(attempt.documentId.value, document.fileName.value);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(
          `Could not fetch document ${attempt.documentId.value} for attempt ${attempt.id.value}: ${errorMessage}`,
        );
      }
    });

    await Promise.all(documentPromises);

    const verifierNamesMap = new Map<string, string>();

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
    actor: Actor,
    timeRange?: { start: Date; end: Date },
  ): Promise<VerifierPerformanceResponseDto> {
    this.logger.debug(
      `Fetching performance for verifier ${verifierId.value} for actor ${actor.id.value}`,
    );

    // Only admins or the verifier themselves can view performance
    if (!actor.isAdmin() && !actor.id.equals(verifierId)) {
      throw new ForbiddenException('Cannot view other verifiers performance');
    }

    // Define the proper type for performance data
    let performanceData: {
      verifierId: UserId;
      totalAttempts: number;
      verified: number;
      rejected: number;
      averageProcessingTimeHours: number;
      commonRejectionReasons: Array<{ reason: string; count: number }>;
      lastActive: Date;
    };

    // Get performance data from repository
    if (this.attemptQueryRepository.getVerifierPerformance) {
      const repoData = await this.attemptQueryRepository.getVerifierPerformance(
        verifierId,
        timeRange,
      );
      if (repoData) {
        // Convert repository data (which has string verifierId) to our domain format
        performanceData = {
          verifierId: new UserId(repoData.verifierId),
          totalAttempts: repoData.totalAttempts,
          verified: repoData.verified,
          rejected: repoData.rejected,
          averageProcessingTimeHours: repoData.averageProcessingTimeHours,
          commonRejectionReasons: repoData.commonRejectionReasons,
          lastActive: repoData.lastActive,
        };
      } else {
        performanceData = await this.calculateBasicPerformance(verifierId, timeRange);
      }
    } else {
      performanceData = await this.calculateBasicPerformance(verifierId, timeRange);
    }

    // Get verifier name (in real app, from user service)
    const verifierNamesMap = new Map<string, string>();

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
    totalPending: number;
    averageVerificationTimeHours: number;
    byVerifier: Record<string, { verified: number; rejected: number }>;
  }> {
    this.logger.debug(`Fetching verification metrics for time range for actor ${actor.id.value}`);

    if (!actor.isAdmin() && !actor.isVerifier()) {
      throw new ForbiddenException('Only admins and verifiers can view verification metrics');
    }

    if (this.attemptQueryRepository.getVerificationMetrics) {
      const result = await this.attemptQueryRepository.getVerificationMetrics(timeRange);
      if (result) {
        return result;
      }
    }

    // Return default structure if repository method doesn't exist or returns undefined
    return {
      totalAttempts: 0,
      totalVerified: 0,
      totalRejected: 0,
      totalPending: 0,
      averageVerificationTimeHours: 0,
      byVerifier: {},
    };
  }

  async getComplianceAudit(
    timeRange: { start: Date; end: Date },
    actor: Actor,
  ): Promise<{
    timeRange: { start: Date; end: Date };
    totalDocuments: number;
    verifiedDocuments: number;
    pendingDocuments: number;
    averageVerificationTime: number;
    complianceRate: number;
    verifierActivity: Array<{
      verifierId: string;
      activityCount: number;
      lastActivity: Date;
    }>;
  }> {
    this.logger.debug(`Fetching compliance audit for time range for actor ${actor.id.value}`);

    if (!actor.isAdmin()) {
      throw new ForbiddenException('Only admins can view compliance audits');
    }

    if (this.attemptQueryRepository.getComplianceAudit) {
      const result = await this.attemptQueryRepository.getComplianceAudit(timeRange);
      if (result) {
        return result;
      }
    }

    // Return default structure
    return {
      timeRange,
      totalDocuments: 0,
      verifiedDocuments: 0,
      pendingDocuments: 0,
      averageVerificationTime: 0,
      complianceRate: 0,
      verifierActivity: [],
    };
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

  async countForDocument(documentId: DocumentId, actor: Actor): Promise<number> {
    this.logger.debug(
      `Counting verification attempts for document ${documentId.value} for actor ${actor.id.value}`,
    );

    await this.checkDocumentAccess(documentId, actor);

    return await this.attemptQueryRepository.countForDocument(documentId);
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

  private mapAttemptDtoToDomain(attemptDto: {
    id: string;
    documentId: string;
    verifierId: string;
    status: string;
    reason: string | null;
    metadata: Record<string, any> | null;
    createdAt: Date;
  }): DocumentVerificationAttempt {
    return DocumentVerificationAttempt.fromPersistence({
      id: attemptDto.id,
      documentId: attemptDto.documentId,
      verifierId: attemptDto.verifierId,
      status: attemptDto.status,
      reason: attemptDto.reason,
      metadata: attemptDto.metadata,
      createdAt: attemptDto.createdAt,
    });
  }

  private async calculateBasicPerformance(
    verifierId: UserId,
    timeRange?: { start: Date; end: Date },
  ): Promise<{
    verifierId: UserId;
    totalAttempts: number;
    verified: number;
    rejected: number;
    averageProcessingTimeHours: number;
    commonRejectionReasons: Array<{ reason: string; count: number }>;
    lastActive: Date;
  }> {
    // Fallback method if the repository doesn't provide performance data
    const queryOptions: PaginationOptions = {
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: 1000,
      offset: 0,
    };

    const attemptDtos = await this.attemptQueryRepository.findByVerifier(verifierId, queryOptions);

    // Filter by time range if provided
    let filteredAttempts = attemptDtos;
    if (timeRange) {
      filteredAttempts = attemptDtos.filter((attempt) => {
        const attemptDate = new Date(attempt.createdAt);
        return attemptDate >= timeRange.start && attemptDate <= timeRange.end;
      });
    }

    const verified = filteredAttempts.filter((a) => a.status === 'VERIFIED').length;
    const rejected = filteredAttempts.filter((a) => a.status === 'REJECTED').length;
    const total = filteredAttempts.length;

    // Calculate common rejection reasons
    const rejectionReasons = filteredAttempts
      .filter((a) => a.status === 'REJECTED' && a.reason)
      .reduce(
        (acc, attempt) => {
          const reason = attempt.reason!;
          acc[reason] = (acc[reason] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    const commonRejectionReasons = Object.entries(rejectionReasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 reasons

    return {
      verifierId,
      totalAttempts: total,
      verified,
      rejected,
      averageProcessingTimeHours: 0, // Simplified - would need actual processing time data
      commonRejectionReasons,
      lastActive:
        filteredAttempts.length > 0
          ? new Date(Math.max(...filteredAttempts.map((a) => new Date(a.createdAt).getTime())))
          : new Date(),
    };
  }
}
