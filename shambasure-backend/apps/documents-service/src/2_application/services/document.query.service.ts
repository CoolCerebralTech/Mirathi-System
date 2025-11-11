import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  IDocumentRepository,
  IDocumentQueryRepository,
  IStorageService,
} from '../../3_domain/interfaces';
import { Actor, DocumentId, UserId } from '../../3_domain/value-objects';
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

@Injectable()
export class DocumentQueryService {
  private readonly logger = new Logger(DocumentQueryService.name);

  constructor(
    private readonly documentQueryRepository: IDocumentQueryRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly storageService: IStorageService,
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
    } catch (error) {
      this.logger.warn(`Failed to record view event: ${error.message}`);
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
    } catch (error) {
      this.logger.warn(`Failed to record download event: ${error.message}`);
    }

    // Retrieve file from storage
    const fileResult = await this.storageService.retrieve(document.storagePath, {
      validateChecksum: true,
      expectedChecksum: document.checksum,
    });

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
    } catch (error) {
      this.logger.warn(`Failed to record download event: ${error.message}`);
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

    // Convert query DTO to repository filters
    const filters = this.mapQueryDtoToFilters(queryDto, actor);

    const pagination = {
      page: queryDto.page,
      limit: queryDto.limit,
      sortBy: queryDto.sortBy,
      sortOrder: queryDto.sortOrder,
    };

    // Execute query
    const result = await this.documentQueryRepository.findMany(filters, pagination);

    // Fetch full domain objects for permission calculation
    const documentIds = result.data.map((doc) => new DocumentId(doc.id));
    const documents = await this.documentRepository.findByIds(documentIds);

    // Calculate permissions for each document
    const permissionsMap = new Map();
    for (const document of documents) {
      permissionsMap.set(document.id.value, this.calculateDocumentPermissions(document, actor));
    }

    return this.documentMapper.toPaginatedResponse(
      documents,
      result.total,
      result.page,
      result.limit,
      {
        permissionsMap,
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

    const searchOptions = {
      query: searchDto.query,
      category: searchDto.category,
      status: searchDto.status,
      uploaderId: searchDto.uploaderId ? new UserId(searchDto.uploaderId) : undefined,
      tags: searchDto.tags,
    };

    const pagination = {
      page: searchDto.page,
      limit: searchDto.limit,
      sortBy: 'createdAt', // Default for search
      sortOrder: 'desc',
    };

    const result = await this.documentQueryRepository.search(searchOptions, pagination);

    // Fetch full domain objects for permission calculation
    const documentIds = result.data.map((doc) => new DocumentId(doc.id));
    const documents = await this.documentRepository.findByIds(documentIds);

    // Filter documents by access rights
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

    const pagination = { page, limit, sortBy: 'createdAt', sortOrder: 'desc' };
    const result = await this.documentQueryRepository.findAccessibleByUser(actor.id, pagination);

    // Fetch full domain objects
    const documentIds = result.data.map((doc) => new DocumentId(doc.id));
    const documents = await this.documentRepository.findByIds(documentIds);

    // Calculate permissions
    const permissionsMap = new Map();
    for (const document of documents) {
      permissionsMap.set(document.id.value, this.calculateDocumentPermissions(document, actor));
    }

    return this.documentMapper.toPaginatedResponse(
      documents,
      result.total,
      result.page,
      result.limit,
      {
        permissionsMap,
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

    // Only verifiers and admins can see pending verification documents
    if (!actor.isVerifier() && !actor.isAdmin()) {
      throw new ForbiddenException(
        'Only verifiers and admins can view pending verification documents',
      );
    }

    const pagination = { page, limit, sortBy: 'createdAt', sortOrder: 'desc' };
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

    // Only admins can see all expiring documents
    if (!actor.isAdmin()) {
      throw new ForbiddenException('Only admins can view all expiring documents');
    }

    const expiringDocuments = await this.documentQueryRepository.findExpiringSoon(withinDays);

    // Filter by access rights for non-admins
    if (actor.isAdmin()) {
      return expiringDocuments;
    } else {
      return expiringDocuments.filter(
        (doc) => doc.uploaderId === actor.id.value, // Own documents
      );
    }
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
    return {
      totalVerified: metrics.totalVerified,
      totalRejected: metrics.totalRejected,
      totalPending: metrics.totalPending,
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

    const [documents, storage, verification, uploads] = await Promise.all([
      this.getDocumentAnalytics(actor),
      actor.isAdmin() ? this.getStorageAnalytics(actor) : Promise.resolve(null),
      actor.isAdmin() || actor.isVerifier()
        ? this.getVerificationMetrics(timeRange, actor)
        : Promise.resolve(null),
      this.getUploadAnalytics(timeRange, actor),
    ]);

    return {
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
  } {
    return {
      canEdit: this.canEditDocument(document, actor),
      canDelete: this.canDeleteDocument(document, actor),
      canVerify: this.canVerifyDocument(document, actor),
      canShare: this.canShareDocument(document, actor),
    };
  }

  private canEditDocument(document: Document, actor: Actor): boolean {
    if (document.isDeleted()) return false;
    if (document.isVerified()) return false;
    if (document.isExpired()) return false;
    return document.isOwnedBy(actor.id) || actor.isAdmin();
  }

  private canDeleteDocument(document: Document, actor: Actor): boolean {
    if (document.isDeleted()) return false;
    if (document.isVerified() && !actor.isAdmin()) return false;
    if (document.isExpired()) return false;
    return document.isOwnedBy(actor.id) || actor.isAdmin();
  }

  private canVerifyDocument(document: Document, actor: Actor): boolean {
    if (document.isDeleted()) return false;
    if (document.isExpired()) return false;
    if (!document.isPending()) return false;
    if (document.isOwnedBy(actor.id)) return false;
    return actor.isVerifier() || actor.isAdmin();
  }

  private canShareDocument(document: Document, actor: Actor): boolean {
    if (document.isDeleted()) return false;
    if (document.isExpired()) return false;
    return document.isOwnedBy(actor.id) || actor.isAdmin();
  }

  private mapQueryDtoToFilters(queryDto: QueryDocumentsDto, actor: Actor): any {
    const filters: any = {};

    // Apply access control: non-admins can only see their own documents or shared documents
    if (!actor.isAdmin()) {
      filters.uploaderId = actor.id;
    }

    // Map query fields to repository filters
    if (queryDto.uploaderIds) {
      filters.uploaderId = queryDto.uploaderIds.map((id) => new UserId(id));
    }
    if (queryDto.statuses) filters.status = queryDto.statuses;
    if (queryDto.categories) filters.category = queryDto.categories;
    if (queryDto.assetId) filters.assetId = new DocumentId(queryDto.assetId);
    if (queryDto.willId) filters.willId = new DocumentId(queryDto.willId);
    if (queryDto.identityForUserId)
      filters.identityForUserId = new UserId(queryDto.identityForUserId);
    if (queryDto.isPublic !== undefined) filters.isPublic = queryDto.isPublic;
    if (queryDto.createdAfter) filters.createdAfter = new Date(queryDto.createdAfter);
    if (queryDto.createdBefore) filters.createdBefore = new Date(queryDto.createdBefore);
    if (queryDto.includeDeleted !== undefined) filters.includeDeleted = queryDto.includeDeleted;
    if (queryDto.hasExpired !== undefined) filters.hasExpired = queryDto.hasExpired;

    return filters;
  }

  private async getUploadAnalytics(
    timeRange: { start: Date; end: Date },
    actor: Actor,
  ): Promise<UploadAnalyticsResponseDto> {
    const filters = actor.isAdmin() ? {} : { uploaderId: actor.id };
    const uploadStats = await this.documentQueryRepository.getUploadStats(timeRange);

    return {
      totalUploads: uploadStats.totalUploads,
      byCategory: uploadStats.byCategory,
      byDay: uploadStats.byDay,
    };
  }

  private async getVersionCountsMap(documentIds: DocumentId[]): Promise<Map<string, number>> {
    // This would typically come from a specialized query
    // For now, we'll return a simple map (in real implementation, query the version repository)
    const versionCounts = new Map<string, number>();
    for (const docId of documentIds) {
      versionCounts.set(docId.value, 1); // Default to 1 version
    }
    return versionCounts;
  }

  private getClientIp(): string {
    // Implementation depends on your HTTP context
    // This is a placeholder - you'd get this from the request object
    return '127.0.0.1';
  }

  private getUserAgent(): string {
    // Implementation depends on your HTTP context
    // This is a placeholder - you'd get this from the request object
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }

  private publishDomainEvents(document: Document): void {
    if (document.domainEvents.length === 0) return;

    document.domainEvents.forEach((event) => {
      this.eventEmitter.emit(event.constructor.name, event);
    });

    document.clearDomainEvents();
  }
}
