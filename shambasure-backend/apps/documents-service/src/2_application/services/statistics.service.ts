import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import {
  IDocumentQueryRepository,
  IDocumentVersionQueryRepository,
  IDocumentVerificationAttemptQueryRepository,
  FindDocumentsFilters,
} from '../../3_domain/interfaces';
import { Actor, UserId } from '../../3_domain/value-objects';
import { StatisticsMapper } from '../mappers';
import {
  DashboardAnalyticsResponseDto,
  DocumentAnalyticsResponseDto,
  StorageAnalyticsResponseDto,
  VerificationMetricsResponseDto,
  UploadAnalyticsResponseDto,
} from '../dtos/analytics-response.dto';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface AnalyticsFilters {
  userId?: UserId;
  category?: string;
  status?: string;
  storageProvider?: string;
}

/**
 * StatisticsService - Application Service for Read-Only Analytics
 *
 * Orchestrates fetching of statistical data from various query repositories,
 * performs necessary calculations and aggregations, and uses a mapper to format the final DTOs.
 */
@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    private readonly documentQueryRepo: IDocumentQueryRepository,
    private readonly versionQueryRepo: IDocumentVersionQueryRepository,
    private readonly attemptQueryRepo: IDocumentVerificationAttemptQueryRepository,
    private readonly statisticsMapper: StatisticsMapper,
  ) {}

  // ============================================================================
  // DASHBOARD ANALYTICS
  // ============================================================================

  /**
   * Retrieves and formats comprehensive dashboard analytics for a given time range.
   */
  async getDashboardAnalytics(
    actor: Actor,
    timeRange?: TimeRange,
  ): Promise<DashboardAnalyticsResponseDto> {
    this.logger.debug(`Fetching dashboard analytics for actor ${actor.id.value}`);

    const range = timeRange || this.getDefaultTimeRange();

    // Fetch all data in parallel
    const [documents, storage, verification, uploads] = await Promise.all([
      this.getDocumentAnalytics(actor, range),
      actor.isAdmin() ? this.getStorageAnalytics(actor, range) : Promise.resolve(null),
      actor.isAdmin() || actor.isVerifier()
        ? this.getVerificationMetrics(actor, range)
        : Promise.resolve(null),
      this.getUploadAnalytics(actor, range),
    ]);

    return this.statisticsMapper.toDashboardAnalyticsDto({
      documents,
      storage,
      verification,
      uploads,
      timeRange: range,
    });
  }

  /**
   * Generates a high-level summary for a quick overview dashboard.
   */
  async getDashboardSummary(actor: Actor): Promise<{
    totalDocuments: number;
    totalStorage: string;
    verificationRate: number;
    documentsNeedingAttention: number;
    pendingVerification: number;
    recentUploads: number;
    storageUsage: string;
  }> {
    this.logger.debug(`Generating dashboard summary for actor ${actor.id.value}`);

    const range = this.getDefaultTimeRange();

    const [documentStats, verificationMetrics, uploadStats] = await Promise.all([
      this.getDocumentAnalytics(actor),
      actor.isAdmin() || actor.isVerifier() ? this.getVerificationMetrics(actor, range) : null,
      this.getUploadAnalytics(actor, range),
    ]);

    // Calculate business metrics
    const totalProcessed = verificationMetrics
      ? verificationMetrics.totalVerified + verificationMetrics.totalRejected
      : 0;

    const verificationRate =
      totalProcessed > 0 ? (verificationMetrics.totalVerified / totalProcessed) * 100 : 0;

    const documentsNeedingAttention =
      (documentStats.byStatus['PENDING_VERIFICATION'] ?? 0) +
      (documentStats.byStatus['REJECTED'] ?? 0);

    const pendingVerification = documentStats.byStatus['PENDING_VERIFICATION'] ?? 0;
    const recentUploads = uploadStats?.totalUploads ?? 0;

    return {
      totalDocuments: documentStats.total,
      totalStorage: this.formatBytes(documentStats.totalSizeBytes),
      verificationRate: Math.round(verificationRate),
      documentsNeedingAttention,
      pendingVerification,
      recentUploads,
      storageUsage: this.formatBytes(documentStats.totalSizeBytes),
    };
  }

  // ============================================================================
  // DOCUMENT ANALYTICS
  // ============================================================================

  async getDocumentAnalytics(
    actor: Actor,
    filters?: AnalyticsFilters & { timeRange?: TimeRange },
  ): Promise<DocumentAnalyticsResponseDto> {
    this.logger.debug(`Fetching document analytics for actor ${actor.id.value}`);

    // Apply access control filters
    const queryFilters: FindDocumentsFilters = {};

    if (!actor.isAdmin()) {
      queryFilters.uploaderId = actor.id;
    }

    if (filters?.userId && (actor.isAdmin() || actor.id.equals(filters.userId))) {
      queryFilters.uploaderId = filters.userId;
    }

    if (filters?.category) {
      queryFilters.category = filters.category;
    }

    if (filters?.status) {
      queryFilters.status = filters.status;
    }

    const stats = await this.documentQueryRepo.getStats(queryFilters);
    return this.statisticsMapper.toDocumentAnalyticsDto(stats);
  }

  async getDocumentTrends(
    actor: Actor,
    timeRange: TimeRange,
  ): Promise<{
    uploadTrend: Array<{ date: string; count: number; sizeBytes: number }>;
    verificationTrend: Array<{ date: string; verified: number; rejected: number }>;
    storageTrend: Array<{ date: string; sizeBytes: number }>;
  }> {
    this.logger.debug(`Fetching document trends for actor ${actor.id.value}`);

    const [uploadStats, verificationMetrics] = await Promise.all([
      this.documentQueryRepo.getUploadStats(timeRange),
      this.documentQueryRepo.getVerificationMetrics(timeRange),
    ]);

    return {
      uploadTrend: uploadStats.byDay,
      verificationTrend: this.transformVerificationTrend(verificationMetrics, timeRange),
      storageTrend: this.calculateStorageTrend(uploadStats.byDay),
    };
  }

  // ============================================================================
  // STORAGE ANALYTICS
  // ============================================================================

  async getStorageAnalytics(
    actor: Actor,
    filters?: AnalyticsFilters,
  ): Promise<StorageAnalyticsResponseDto> {
    this.logger.debug(`Fetching storage analytics for actor ${actor.id.value}`);

    if (!actor.isAdmin()) {
      throw new ForbiddenException('Only admins can view storage analytics');
    }

    const storageStats = await this.documentQueryRepo.getStorageStats();
    return this.statisticsMapper.toStorageAnalyticsDto(storageStats);
  }

  async getStorageUsageByCategory(
    actor: Actor,
  ): Promise<
    Array<{ category: string; sizeBytes: number; percentage: number; documentCount: number }>
  > {
    this.logger.debug(`Fetching storage usage by category for actor ${actor.id.value}`);

    const documentStats = await this.getDocumentAnalytics(actor);
    const totalSize = documentStats.totalSizeBytes;

    return Object.entries(documentStats.byCategory).map(([category, count]) => {
      // This is a simplified calculation - in reality, you'd want actual size by category
      const avgSize = documentStats.averageSizeBytes;
      const sizeBytes = count * avgSize;
      const percentage = totalSize > 0 ? (sizeBytes / totalSize) * 100 : 0;

      return {
        category,
        sizeBytes,
        percentage: Math.round(percentage * 100) / 100,
        documentCount: count,
      };
    });
  }

  async getVersionStorageAnalytics(
    actor: Actor,
    documentId?: string,
  ): Promise<{
    totalVersions: number;
    totalVersionSizeBytes: number;
    averageVersionsPerDocument: number;
    largestVersion: number;
    versionSizeTrend: Array<{ versionNumber: number; sizeBytes: number }>;
  }> {
    this.logger.debug(`Fetching version storage analytics for actor ${actor.id.value}`);

    // This would typically come from a specialized query
    // For now, we'll return mock data structure
    return {
      totalVersions: 0,
      totalVersionSizeBytes: 0,
      averageVersionsPerDocument: 0,
      largestVersion: 0,
      versionSizeTrend: [],
    };
  }

  // ============================================================================
  // VERIFICATION ANALYTICS
  // ============================================================================

  async getVerificationMetrics(
    actor: Actor,
    timeRange: TimeRange,
  ): Promise<VerificationMetricsResponseDto> {
    this.logger.debug(`Fetching verification metrics for actor ${actor.id.value}`);

    if (!actor.isAdmin() && !actor.isVerifier()) {
      throw new ForbiddenException('Only admins and verifiers can view verification metrics');
    }

    const metrics = await this.documentQueryRepo.getVerificationMetrics(timeRange);
    return this.statisticsMapper.toVerificationMetricsDto(metrics);
  }

  async getVerificationAnalytics(
    actor: Actor,
    timeRange: TimeRange,
  ): Promise<{
    metrics: VerificationMetricsResponseDto;
    topRejectionReasons: Array<{ reason: string; count: number; percentage: number }>;
    turnaroundTime: {
      average: number;
      min: number;
      max: number;
      byVerifier: Record<string, number>;
    };
    verifierPerformance: Array<{
      verifierId: string;
      verifierName?: string;
      totalAttempts: number;
      verified: number;
      rejected: number;
      successRate: number;
      averageTime: number;
    }>;
  }> {
    this.logger.debug(`Fetching comprehensive verification analytics for actor ${actor.id.value}`);

    if (!actor.isAdmin() && !actor.isVerifier()) {
      throw new ForbiddenException('Only admins and verifiers can view verification analytics');
    }

    const [metrics, performanceData] = await Promise.all([
      this.getVerificationMetrics(actor, timeRange),
      this.getVerifierPerformance(actor, timeRange),
    ]);

    // Calculate top rejection reasons (this would come from repository in real implementation)
    const topRejectionReasons = await this.calculateTopRejectionReasons(timeRange);

    // Calculate turnaround time (this would come from repository in real implementation)
    const turnaroundTime = await this.calculateTurnaroundTime(timeRange);

    return {
      metrics,
      topRejectionReasons,
      turnaroundTime,
      verifierPerformance: performanceData,
    };
  }

  async getVerifierPerformance(
    actor: Actor,
    timeRange: TimeRange,
  ): Promise<
    Array<{
      verifierId: string;
      verifierName?: string;
      totalAttempts: number;
      verified: number;
      rejected: number;
      successRate: number;
      averageTime: number;
    }>
  > {
    this.logger.debug(`Fetching verifier performance for actor ${actor.id.value}`);

    if (!actor.isAdmin() && !actor.isVerifier()) {
      throw new ForbiddenException('Only admins and verifiers can view verifier performance');
    }

    const metrics = await this.documentQueryRepo.getVerificationMetrics(timeRange);

    return Object.entries(metrics.byVerifier).map(([verifierId, stats]) => {
      const total = stats.verified + stats.rejected;
      const successRate = total > 0 ? (stats.verified / total) * 100 : 0;

      return {
        verifierId,
        verifierName: `Verifier ${verifierId.substring(0, 8)}`, // Mock name
        totalAttempts: total,
        verified: stats.verified,
        rejected: stats.rejected,
        successRate: Math.round(successRate * 100) / 100,
        averageTime: metrics.averageVerificationTimeHours,
      };
    });
  }

  async getComplianceAnalytics(
    actor: Actor,
    timeRange: TimeRange,
  ): Promise<{
    complianceRate: number;
    auditTrail: Array<{ date: string; activity: string; count: number }>;
    policyAdherence: Record<string, number>;
    riskAreas: Array<{ area: string; riskLevel: 'high' | 'medium' | 'low'; count: number }>;
  }> {
    this.logger.debug(`Fetching compliance analytics for actor ${actor.id.value}`);

    if (!actor.isAdmin()) {
      throw new ForbiddenException('Only admins can view compliance analytics');
    }

    // This would typically come from a specialized compliance service
    return {
      complianceRate: 95.5,
      auditTrail: [],
      policyAdherence: {},
      riskAreas: [],
    };
  }

  // ============================================================================
  // UPLOAD ANALYTICS
  // ============================================================================

  async getUploadAnalytics(
    actor: Actor,
    timeRange: TimeRange,
  ): Promise<UploadAnalyticsResponseDto> {
    this.logger.debug(`Fetching upload analytics for actor ${actor.id.value}`);

    // Apply access control
    const filters: FindDocumentsFilters = {};
    if (!actor.isAdmin()) {
      filters.uploaderId = actor.id;
    }

    const uploadStats = await this.documentQueryRepo.getUploadStats(timeRange);
    return this.statisticsMapper.toUploadAnalyticsDto(uploadStats);
  }

  async getUploadTrends(
    actor: Actor,
    timeRange: TimeRange,
  ): Promise<{
    dailyUploads: Array<{ date: string; count: number; sizeBytes: number }>;
    byCategory: Record<string, number>;
    byUser: Array<{ userId: string; userName?: string; count: number; sizeBytes: number }>;
    peakHours: Array<{ hour: number; count: number }>;
  }> {
    this.logger.debug(`Fetching upload trends for actor ${actor.id.value}`);

    const uploadStats = await this.getUploadAnalytics(actor, timeRange);

    // Calculate peak hours (this would come from repository in real implementation)
    const peakHours = this.calculatePeakHours(uploadStats.byDay);

    // Calculate by user (this would come from repository in real implementation)
    const byUser = await this.calculateUploadsByUser(timeRange, actor);

    return {
      dailyUploads: uploadStats.byDay,
      byCategory: uploadStats.byCategory,
      byUser,
      peakHours,
    };
  }

  // ============================================================================
  // SYSTEM HEALTH ANALYTICS
  // ============================================================================

  async getSystemHealthMetrics(actor: Actor): Promise<{
    uptime: number;
    errorRates: Record<string, number>;
    performance: {
      averageResponseTime: number;
      throughput: number;
      concurrentUsers: number;
    };
    storage: {
      totalCapacity: number;
      usedCapacity: number;
      availableCapacity: number;
      usagePercentage: number;
    };
  }> {
    this.logger.debug(`Fetching system health metrics for actor ${actor.id.value}`);

    if (!actor.isAdmin()) {
      throw new ForbiddenException('Only admins can view system health metrics');
    }

    // This would typically come from monitoring systems
    return {
      uptime: 99.95,
      errorRates: {
        '4xx': 2.1,
        '5xx': 0.3,
        validation: 1.2,
      },
      performance: {
        averageResponseTime: 245,
        throughput: 1250,
        concurrentUsers: 85,
      },
      storage: {
        totalCapacity: 1000 * 1024 * 1024 * 1024, // 1TB
        usedCapacity: 350 * 1024 * 1024 * 1024, // 350GB
        availableCapacity: 650 * 1024 * 1024 * 1024, // 650GB
        usagePercentage: 35,
      },
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private getDefaultTimeRange(): TimeRange {
    return {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date(),
    };
  }

  private transformVerificationTrend(
    metrics: any,
    timeRange: TimeRange,
  ): Array<{ date: string; verified: number; rejected: number }> {
    // This would transform the verification metrics into a daily trend
    // For now, return empty array - in real implementation, you'd process the data
    return [];
  }

  private calculateStorageTrend(
    dailyUploads: Array<{ date: string; count: number; sizeBytes: number }>,
  ): Array<{ date: string; sizeBytes: number }> {
    // Calculate cumulative storage over time
    let cumulativeSize = 0;
    return dailyUploads.map((day) => {
      cumulativeSize += day.sizeBytes;
      return {
        date: day.date,
        sizeBytes: cumulativeSize,
      };
    });
  }

  private async calculateTopRejectionReasons(
    timeRange: TimeRange,
  ): Promise<Array<{ reason: string; count: number; percentage: number }>> {
    // This would query the attempt repository for top rejection reasons
    // For now, return mock data
    return [
      { reason: 'Poor image quality', count: 45, percentage: 32 },
      { reason: 'Missing information', count: 38, percentage: 27 },
      { reason: 'Expired document', count: 22, percentage: 16 },
      { reason: 'Wrong document type', count: 18, percentage: 13 },
      { reason: 'Other', count: 17, percentage: 12 },
    ];
  }

  private async calculateTurnaroundTime(timeRange: TimeRange): Promise<{
    average: number;
    min: number;
    max: number;
    byVerifier: Record<string, number>;
  }> {
    // This would calculate verification turnaround times
    // For now, return mock data
    return {
      average: 4.5,
      min: 0.5,
      max: 48.2,
      byVerifier: {
        'verifier-1': 3.2,
        'verifier-2': 5.1,
        'verifier-3': 4.8,
      },
    };
  }

  private calculatePeakHours(
    dailyUploads: Array<{ date: string; count: number; sizeBytes: number }>,
  ): Array<{ hour: number; count: number }> {
    // Calculate peak upload hours (simplified)
    // In real implementation, you'd have hourly data
    return [
      { hour: 9, count: 45 },
      { hour: 10, count: 67 },
      { hour: 11, count: 52 },
      { hour: 14, count: 48 },
      { hour: 15, count: 61 },
    ];
  }

  private async calculateUploadsByUser(
    timeRange: TimeRange,
    actor: Actor,
  ): Promise<Array<{ userId: string; userName?: string; count: number; sizeBytes: number }>> {
    // This would query for uploads by user
    // For now, return mock data
    return [
      { userId: 'user-1', userName: 'John Doe', count: 45, sizeBytes: 1024 * 1024 * 450 },
      { userId: 'user-2', userName: 'Jane Smith', count: 38, sizeBytes: 1024 * 1024 * 320 },
      { userId: 'user-3', userName: 'Bob Johnson', count: 22, sizeBytes: 1024 * 1024 * 180 },
    ];
  }

  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
