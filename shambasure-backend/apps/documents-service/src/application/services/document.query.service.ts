import { Injectable, Logger, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  IDocumentRepository,
  IDocumentQueryRepository,
  IStorageService,
} from '../../domain/interfaces';
import { Document } from '../../domain/models/document.model';
import {
  Actor,
  DocumentCategory,
  DocumentId,
  DocumentStatus,
  UserId,
} from '../../domain/value-objects';
import { DocumentMapper } from '../mappers';
import { PaginatedDocumentsResponseDto, QueryDocumentsDto } from '../dtos/query-documents.dto';
import { SearchDocumentsDto } from '../dtos/search-documents.dto';
import {
  DocumentAnalyticsResponseDto,
  StorageAnalyticsResponseDto,
  VerificationMetricsResponseDto,
  UploadAnalyticsResponseDto,
  DashboardAnalyticsResponseDto,
} from '../dtos/analytics-response.dto';
import { DocumentResponseDto } from '../dtos/document-response.dto';
import {
  DOCUMENT_REPOSITORY,
  DOCUMENT_QUERY_REPOSITORY,
  STORAGE_SERVICE,
} from '../../injection.tokens';

@Injectable()
export class DocumentQueryService {
  private readonly logger = new Logger(DocumentQueryService.name);

  constructor(
    @Inject(DOCUMENT_QUERY_REPOSITORY)
    private readonly documentQueryRepository: IDocumentQueryRepository,
    @Inject(DOCUMENT_REPOSITORY) private readonly documentRepository: IDocumentRepository,
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
    private readonly documentMapper: DocumentMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // SINGLE DOCUMENT QUERIES
  // ============================================================================

  async getDocumentById(documentId: DocumentId, actor: Actor): Promise<DocumentResponseDto> {
    this.logger.debug(`Fetching document ${documentId.value} for actor ${actor.id.value}`);

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!document.canBeAccessedBy(actor.id)) {
      throw new ForbiddenException('Access denied');
    }

    // Record view event (fire and forget)
    try {
      document.recordView(actor.id, this.getClientIp(), this.getUserAgent());
      this.publishDomainEvents(document);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.warn(`Failed to record view event: ${errorMessage}`);
    }

    // Calculate permissions for response
    const permissions = this.calculateDocumentPermissions(document, actor);

    return this.documentMapper.toResponseDto(document, {
      permissions,
      totalVersions: document.versions.length,
    });
  }

  async downloadDocument(
    documentId: DocumentId,
    actor: Actor,
  ): Promise<{
    buffer: Buffer;
    fileName: string;
    mimeType: string;
  }> {
    this.logger.debug(
      `Download request for document ${documentId.value} by actor ${actor.id.value}`,
    );

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!document.canBeAccessedBy(actor.id)) {
      throw new ForbiddenException('Access denied');
    }

    // Record download event (fire and forget)
    try {
      document.recordDownload(actor.id, this.getClientIp(), this.getUserAgent());
      this.publishDomainEvents(document);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.warn(`Failed to record download event: ${errorMessage}`);
    }

    // Prepare storage options - handle null checksum
    const storageOptions = {
      validateChecksum: document.checksum !== null,
      expectedChecksum: document.checksum ?? undefined,
    };

    // Retrieve file from storage
    const fileResult = await this.storageService.retrieve(document.storagePath, storageOptions);

    return {
      buffer: fileResult.buffer,
      fileName: document.fileName.value,
      mimeType: document.mimeType.value,
    };
  }

  async getDocumentDownloadUrl(documentId: DocumentId, actor: Actor): Promise<string> {
    this.logger.debug(
      `Generating download URL for document ${documentId.value} by actor ${actor.id.value}`,
    );

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!document.canBeAccessedBy(actor.id)) {
      throw new ForbiddenException('Access denied');
    }

    // Generate pre-signed URL (expires in 1 hour)
    const downloadUrl = await this.storageService.getPresignedDownloadUrl(document.storagePath, {
      expiresInSeconds: 3600,
      fileNameToSuggest: document.fileName,
      disposition: 'attachment',
    });

    // Record download event
    try {
      document.recordDownload(actor.id, this.getClientIp(), this.getUserAgent());
      this.publishDomainEvents(document);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.warn(`Failed to record download event: ${errorMessage}`);
    }

    return downloadUrl;
  }

  // ============================================================================
  // BATCH DOCUMENT QUERIES
  // ============================================================================

  async queryDocuments(
    queryDto: QueryDocumentsDto,
    actor: Actor,
  ): Promise<PaginatedDocumentsResponseDto> {
    this.logger.debug(`Querying documents for actor ${actor.id.value} with filters`);

    const filters = this.mapQueryDtoToFilters(queryDto, actor);

    const pagination = {
      page: queryDto.page ?? 1,
      limit: queryDto.limit ?? 20,
      sortBy:
        (queryDto.sortBy as 'fileName' | 'createdAt' | 'updatedAt' | 'fileSize' | 'expiryDate') ??
        'createdAt',
      sortOrder: queryDto.sortOrder ?? 'desc',
    };

    const result = await this.documentQueryRepository.findMany(filters, pagination);

    const documentIds = result.data.map((doc) => new DocumentId(doc.id));
    const documents = await this.documentRepository.findByIds(documentIds);

    const accessibleDocuments = documents.filter((doc) => doc.canBeAccessedBy(actor.id));

    const permissionMap = new Map<string, ReturnType<typeof this.calculateDocumentPermissions>>();
    for (const document of accessibleDocuments) {
      permissionMap.set(document.id.value, this.calculateDocumentPermissions(document, actor));
    }

    return this.documentMapper.toPaginatedResponse(
      accessibleDocuments,
      result.total,
      result.page,
      result.limit,
      {
        permissionMap,
        versionCountsMap: await this.getVersionCountsMap(documentIds),
      },
    );
  }

  async searchDocuments(
    searchDto: SearchDocumentsDto,
    actor: Actor,
  ): Promise<PaginatedDocumentsResponseDto> {
    this.logger.debug(
      `Searching documents for actor ${actor.id.value} with query: ${searchDto.query}`,
    );

    // Convert both DocumentCategoryEnum and DocumentStatusEnum to their value objects
    const category = searchDto.category ? DocumentCategory.create(searchDto.category) : undefined;
    const status = searchDto.status ? DocumentStatus.create(searchDto.status) : undefined;

    const searchOptions = {
      query: searchDto.query || '',
      category,
      status,
      uploaderId: searchDto.uploaderId ? new UserId(searchDto.uploaderId) : undefined,
      tags: searchDto.tags,
    };

    const pagination = {
      page: searchDto.page ?? 1,
      limit: searchDto.limit ?? 20,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    };

    const result = await this.documentQueryRepository.search(searchOptions, pagination);

    const documentIds = result.data.map((doc) => new DocumentId(doc.id));
    const documents = await this.documentRepository.findByIds(documentIds);

    const accessibleDocuments = documents.filter((doc) => doc.canBeAccessedBy(actor.id));

    return this.documentMapper.toPaginatedResponse(
      accessibleDocuments,
      accessibleDocuments.length,
      result.page,
      result.limit,
      {
        versionCountsMap: await this.getVersionCountsMap(documentIds),
      },
    );
  }

  async getDocumentsAccessibleByUser(
    actor: Actor,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedDocumentsResponseDto> {
    this.logger.debug(`Fetching accessible documents for actor ${actor.id.value}`);

    const pagination = {
      page,
      limit,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    };

    const result = await this.documentQueryRepository.findAccessibleByUser(actor.id, pagination);

    const documentIds = result.data.map((doc) => new DocumentId(doc.id));
    const documents = await this.documentRepository.findByIds(documentIds);

    const validDocuments = documents.filter((doc) => !doc.isDeleted());

    const permissionMap = new Map<string, ReturnType<typeof this.calculateDocumentPermissions>>();
    for (const document of validDocuments) {
      permissionMap.set(document.id.value, this.calculateDocumentPermissions(document, actor));
    }

    return this.documentMapper.toPaginatedResponse(
      validDocuments,
      result.total,
      result.page,
      result.limit,
      {
        permissionMap,
        versionCountsMap: await this.getVersionCountsMap(documentIds),
      },
    );
  }

  // ============================================================================
  // SPECIALIZED QUERIES
  // ============================================================================

  async getPendingVerificationDocuments(
    actor: Actor,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedDocumentsResponseDto> {
    this.logger.debug(`Fetching pending verification documents for actor ${actor.id.value}`);

    if (!actor.isVerifier() && !actor.isAdmin()) {
      throw new ForbiddenException(
        'Only verifiers and admins can view pending verification documents',
      );
    }

    const pagination = {
      page,
      limit,
      sortBy: 'createdAt' as const, // Use const assertion for type safety
      sortOrder: 'desc' as const,
    };

    const result = await this.documentQueryRepository.findPendingVerification(pagination);

    const documentIds = result.data.map((doc) => new DocumentId(doc.id));
    const documents = await this.documentRepository.findByIds(documentIds);

    return this.documentMapper.toPaginatedResponse(
      documents,
      result.total,
      result.page,
      result.limit,
      {
        versionCountsMap: await this.getVersionCountsMap(documentIds),
      },
    );
  }

  async getExpiringDocuments(withinDays: number = 30, actor: Actor): Promise<any[]> {
    this.logger.debug(
      `Fetching documents expiring within ${withinDays} days for actor ${actor.id.value}`,
    );

    const expiringDocuments = await this.documentQueryRepository.findExpiringSoon(withinDays);

    if (!actor.isAdmin()) {
      // Compare UserId objects properly using equals method
      return expiringDocuments.filter((doc) => doc.uploaderId.equals(actor.id));
    }

    return expiringDocuments;
  }

  // ============================================================================
  // ANALYTICS QUERIES
  // ============================================================================

  async getDocumentAnalytics(actor: Actor): Promise<DocumentAnalyticsResponseDto> {
    this.logger.debug(`Fetching document analytics for actor ${actor.id.value}`);

    // Admins get system-wide stats, users get their own stats
    const filters = actor.isAdmin() ? {} : { uploaderId: actor.id };

    const stats = await this.documentQueryRepository.getStats(filters);
    return {
      total: stats.total,
      byStatus: stats.byStatus,
      byCategory: stats.byCategory,
      totalSizeBytes: stats.totalSizeBytes,
      averageSizeBytes: stats.averageSizeBytes,
      encrypted: stats.encrypted,
      public: stats.public,
      expired: stats.expired,
    };
  }

  async getStorageAnalytics(actor: Actor): Promise<StorageAnalyticsResponseDto> {
    this.logger.debug(`Fetching storage analytics for actor ${actor.id.value}`);

    if (!actor.isAdmin()) {
      throw new ForbiddenException('Only admins can view storage analytics');
    }

    const storageStats = await this.documentQueryRepository.getStorageStats();
    return {
      totalSizeBytes: storageStats.totalSizeBytes,
      byCategory: storageStats.byCategory,
      byStorageProvider: storageStats.byStorageProvider,
      byUser: storageStats.byUser,
    };
  }

  async getVerificationMetrics(
    timeRange: { start: Date; end: Date },
    actor: Actor,
  ): Promise<VerificationMetricsResponseDto> {
    this.logger.debug(`Fetching verification metrics for actor ${actor.id.value}`);

    if (!actor.isAdmin() && !actor.isVerifier()) {
      throw new ForbiddenException('Only admins and verifiers can view verification metrics');
    }

    const metrics = await this.documentQueryRepository.getVerificationMetrics(timeRange);

    // Calculate derived metrics
    const totalProcessed = metrics.totalVerified + metrics.totalRejected;
    const successRate = totalProcessed > 0 ? (metrics.totalVerified / totalProcessed) * 100 : 0;

    return {
      totalVerified: metrics.totalVerified,
      totalRejected: metrics.totalRejected,
      totalPending: metrics.totalPending,
      totalProcessed,
      successRate,
      averageVerificationTimeHours: metrics.averageVerificationTimeHours,
      byVerifier: metrics.byVerifier,
    };
  }

  async getDashboardAnalytics(actor: Actor): Promise<DashboardAnalyticsResponseDto> {
    this.logger.debug(`Fetching dashboard analytics for actor ${actor.id.value}`);

    const timeRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date(),
    };

    // Start with the analytics that everyone can access
    const documentsPromise = this.getDocumentAnalytics(actor);
    const uploadsPromise = this.getUploadAnalytics(timeRange, actor);

    // Conditionally include admin/verifier analytics
    const storagePromise = actor.isAdmin()
      ? this.getStorageAnalytics(actor)
      : this.getEmptyStorageAnalytics();
    const verificationPromise =
      actor.isAdmin() || actor.isVerifier()
        ? this.getVerificationMetrics(timeRange, actor)
        : this.getEmptyVerificationMetrics();

    const [documents, storage, verification, uploads] = await Promise.all([
      documentsPromise,
      storagePromise,
      verificationPromise,
      uploadsPromise,
    ]);

    return {
      timeRange,
      documents,
      storage,
      verification,
      uploads,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private calculateDocumentPermissions(
    document: Document,
    actor: Actor,
  ): {
    canEdit: boolean;
    canDelete: boolean;
    canVerify: boolean;
    canShare: boolean;
    canDownload: boolean;
    canView: boolean;
  } {
    // Safe guard
    if (!document || !actor) {
      this.logger.error('Invalid parameters in calculateDocumentPermissions', {
        documentExists: !!document,
        actorExists: !!actor,
      });
      return {
        canEdit: false,
        canDelete: false,
        canVerify: false,
        canShare: false,
        canDownload: false,
        canView: false,
      };
    }

    try {
      const canEdit = this.canEditDocument(document, actor);
      const canDelete = this.canDeleteDocument(document, actor);
      const canVerify = this.canVerifyDocument(document, actor);
      const canShare = this.canShareDocument(document, actor);

      // Additional permissions that might be useful
      const canDownload =
        canEdit ||
        document.isPublic() ||
        document.allowedViewers.toArray().some((viewerId) => viewerId.equals(actor.id));
      const canView = canDownload || canVerify; // Can view if they can download or verify

      return {
        canEdit,
        canDelete,
        canVerify,
        canShare,
        canDownload,
        canView,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Error calculating document permissions', {
        documentId: document.id?.value,
        actorId: actor.id?.value,
        error: errorMessage,
      });

      return {
        canEdit: false,
        canDelete: false,
        canVerify: false,
        canShare: false,
        canDownload: false,
        canView: false,
      };
    }
  }

  private canEditDocument(document: Document, actor: Actor): boolean {
    if (document.isDeleted()) return false;
    if (document.isExpired()) return false;

    // Verified documents can only be edited by admins
    if (document.isVerified()) {
      return actor.isAdmin();
    }

    // Ownership or admin check
    return document.isOwnedBy(actor.id) || actor.isAdmin();
  }

  private canDeleteDocument(document: Document, actor: Actor): boolean {
    if (document.isDeleted()) return false;
    if (document.isExpired()) return false;

    // Verified documents can only be deleted by admins
    if (document.isVerified()) {
      return actor.isAdmin();
    }

    // Ownership or admin check
    return document.isOwnedBy(actor.id) || actor.isAdmin();
  }

  private canVerifyDocument(document: Document, actor: Actor): boolean {
    if (document.isDeleted()) return false;
    if (document.isExpired()) return false;

    // Only pending documents can be verified
    if (!document.isPending()) return false;

    // Users cannot verify their own documents
    if (document.isOwnedBy(actor.id)) return false;

    // Only verifiers or admins can verify
    return actor.isVerifier() || actor.isAdmin();
  }

  private canShareDocument(document: Document, actor: Actor): boolean {
    if (document.isDeleted()) return false;
    if (document.isExpired()) return false;

    // Ownership or admin check
    return document.isOwnedBy(actor.id) || actor.isAdmin();
  }

  private mapQueryDtoToFilters(queryDto: QueryDocumentsDto, actor: Actor): Record<string, unknown> {
    const filters: Record<string, unknown> = {};

    // Apply access control: non-admins can only see their own documents or shared documents
    if (!actor.isAdmin()) {
      filters.uploaderId = actor.id;
    }

    // Map query fields to repository filters
    if (queryDto.uploaderIds) {
      filters.uploaderId = queryDto.uploaderIds.map((id) => new UserId(id));
    }
    if (queryDto.statuses) {
      filters.status = queryDto.statuses;
    }
    if (queryDto.categories) {
      filters.category = queryDto.categories;
    }
    if (queryDto.assetId) {
      filters.assetId = new DocumentId(queryDto.assetId);
    }
    if (queryDto.willId) {
      filters.willId = new DocumentId(queryDto.willId);
    }
    if (queryDto.identityForUserId) {
      filters.identityForUserId = new UserId(queryDto.identityForUserId);
    }
    if (queryDto.isPublic !== undefined) {
      filters.isPublic = queryDto.isPublic;
    }
    if (queryDto.createdAfter) {
      filters.createdAfter = new Date(queryDto.createdAfter);
    }
    if (queryDto.createdBefore) {
      filters.createdBefore = new Date(queryDto.createdBefore);
    }
    if (queryDto.includeDeleted !== undefined) {
      filters.includeDeleted = queryDto.includeDeleted;
    }
    if (queryDto.hasExpired !== undefined) {
      filters.hasExpired = queryDto.hasExpired;
    }

    return filters;
  }

  private async getUploadAnalytics(
    timeRange: { start: Date; end: Date },
    actor: Actor,
  ): Promise<UploadAnalyticsResponseDto> {
    // For non-admin users, return empty upload analytics
    if (!actor.isAdmin()) {
      return {
        totalUploads: 0,
        byCategory: {},
        byDay: [],
      };
    }

    const uploadStats = await this.documentQueryRepository.getUploadStats(timeRange);

    return {
      totalUploads: uploadStats.totalUploads,
      byCategory: uploadStats.byCategory,
      byDay: uploadStats.byDay,
    };
  }

  private getVersionCountsMap(documentIds: DocumentId[]): Promise<Map<string, number>> {
    const versionCounts = new Map<string, number>();

    // Simple implementation: assume 1 version per document
    // In production, you'd want to implement proper version counting
    for (const docId of documentIds) {
      versionCounts.set(docId.value, 1);
    }

    // Return a resolved promise since we're not doing any async operations
    return Promise.resolve(versionCounts);
  }

  private getClientIp(): string {
    // Implementation depends on your HTTP context
    // This is a placeholder - you'd get this from the request object
    // In NestJS, you would inject the request and get the IP from req.ip or req.connection.remoteAddress
    return '127.0.0.1';
  }

  private getUserAgent(): string {
    // Implementation depends on your HTTP context
    // This is a placeholder - you'd get this from the request object
    // In NestJS, you would inject the request and get from req.headers['user-agent']
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
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
  private getEmptyStorageAnalytics(): Promise<StorageAnalyticsResponseDto> {
    return Promise.resolve({
      totalSizeBytes: 0,
      byCategory: {},
      byStorageProvider: {},
      byUser: [],
    });
  }

  private getEmptyVerificationMetrics(): VerificationMetricsResponseDto {
    return {
      totalVerified: 0,
      totalRejected: 0,
      totalPending: 0,
      totalProcessed: 0, // Added missing property
      successRate: 0, // Added missing property
      averageVerificationTimeHours: 0,
      byVerifier: {}, // This should be Record<string, number>
    };
  }
}
