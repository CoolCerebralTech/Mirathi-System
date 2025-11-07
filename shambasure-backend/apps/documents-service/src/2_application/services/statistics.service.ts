import { Injectable, Logger } from '@nestjs/common';
import { IDocumentRepository } from '../../3_domain/interfaces/document.repository.interface';
import { IDocumentVersionRepository } from '../../3_domain/interfaces/document-version.repository.interface';
import { IDocumentVerificationAttemptRepository } from '../../3_domain/interfaces/document-verification-attempt.repository.interface';
import { StatisticsMapper } from '../mappers/statistics.mapper';
import {
  DocumentAnalyticsResponseDto,
  StorageAnalyticsResponseDto,
  VerificationMetricsResponseDto,
  UploadAnalyticsResponseDto,
  DashboardAnalyticsResponseDto,
} from '../dtos/analytics-response.dto';
import { DocumentStatsResponseDto } from '../dtos/document-response.dto';
import { FindDocumentsFilters } from '../../3_domain/interfaces/document.repository.interface';

/**
 * StatisticsService - Application Service
 *
 * RESPONSIBILITIES:
 * - Aggregate statistics from multiple repositories
 * - Calculate analytics and metrics
 * - Generate dashboard data
 * - Provide reporting capabilities
 */
@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly versionRepository: IDocumentVersionRepository,
    private readonly verificationAttemptRepository: IDocumentVerificationAttemptRepository,
    private readonly statisticsMapper: StatisticsMapper,
  ) {}

  // ============================================================================
  // DOCUMENT STATISTICS
  // ============================================================================

  async getDocumentStats(filters?: FindDocumentsFilters): Promise<DocumentStatsResponseDto> {
    this.logger.debug('Fetching document statistics');

    const stats = await this.documentRepository.getStats(filters);

    return new DocumentStatsResponseDto({
      total: stats.total,
      byStatus: stats.byStatus,
      byCategory: stats.byCategory,
      totalSizeBytes: stats.totalSizeBytes,
      averageSizeBytes: stats.averageSizeBytes,
      encrypted: stats.encrypted,
      public: stats.public,
      expired: stats.expired,
    });
  }

  async getDocumentAnalytics(
    filters?: FindDocumentsFilters,
  ): Promise<DocumentAnalyticsResponseDto> {
    this.logger.debug('Fetching document analytics');

    const stats = await this.documentRepository.getStats(filters);

    return this.statisticsMapper.toDocumentAnalyticsDto(stats);
  }

  // ============================================================================
  // STORAGE STATISTICS
  // ============================================================================

  async getStorageStats(): Promise<StorageAnalyticsResponseDto> {
    this.logger.debug('Fetching storage statistics');

    const stats = await this.documentRepository.getStorageStats();

    return this.statisticsMapper.toStorageAnalyticsDto(stats);
  }

  async getGlobalStorageStats(): Promise<{
    documents: {
      totalSizeBytes: number;
      byCategory: Record<string, number>;
      byStorageProvider: Record<string, number>;
    };
    versions: {
      totalVersions: number;
      totalSizeBytes: number;
      averageVersionsPerDocument: number;
    };
    combined: {
      totalSizeBytes: number;
      totalFilesCount: number;
      formattedTotalSize: string;
    };
  }> {
    this.logger.debug('Fetching global storage statistics');

    const [documentStats, versionStats] = await Promise.all([
      this.documentRepository.getStorageStats(),
      this.versionRepository.getGlobalStorageStats(),
    ]);

    const combinedSize = documentStats.totalSizeBytes + versionStats.totalSizeBytes;
    const combinedCount =
      Object.values(documentStats.byCategory).reduce((a, b) => a + 1, 0) +
      versionStats.totalVersions;

    return {
      documents: documentStats,
      versions: {
        totalVersions: versionStats.totalVersions,
        totalSizeBytes: versionStats.totalSizeBytes,
        averageVersionsPerDocument: versionStats.averageVersionsPerDocument,
      },
      combined: {
        totalSizeBytes: combinedSize,
        totalFilesCount: combinedCount,
        formattedTotalSize: this.statisticsMapper.formatBytes(combinedSize),
      },
    };
  }

  // ============================================================================
  // VERIFICATION STATISTICS
  // ============================================================================

  async getVerificationMetrics(timeRange: {
    start: Date;
    end: Date;
  }): Promise<VerificationMetricsResponseDto> {
    this.logger.debug('Fetching verification metrics');

    const metrics = await this.documentRepository.getVerificationMetrics(timeRange);

    return this.statisticsMapper.toVerificationMetricsDto(metrics);
  }

  async getVerificationAnalytics(timeRange: { start: Date; end: Date }): Promise<{
    metrics: VerificationMetricsResponseDto;
    topRejectionReasons: Array<{ reason: string; count: number; percentage: number }>;
    turnaroundTime: {
      averageHours: number;
      medianHours: number;
      minHours: number;
      maxHours: number;
    };
    dailyStats: Array<{
      date: string;
      totalAttempts: number;
      verified: number;
      rejected: number;
      uniqueVerifiers: number;
      uniqueDocuments: number;
    }>;
  }> {
    this.logger.debug('Fetching comprehensive verification analytics');

    const [metrics, rejectionReasons, turnaroundTime, dailyStats] = await Promise.all([
      this.documentRepository.getVerificationMetrics(timeRange),
      this.verificationAttemptRepository.getTopRejectionReasons(10, timeRange),
      this.verificationAttemptRepository.getTurnaroundTimeStats(timeRange),
      this.verificationAttemptRepository.getDailyStats(timeRange),
    ]);

    return {
      metrics: this.statisticsMapper.toVerificationMetricsDto(metrics),
      topRejectionReasons: rejectionReasons,
      turnaroundTime,
      dailyStats,
    };
  }

  // ============================================================================
  // UPLOAD STATISTICS
  // ============================================================================

  async getUploadStats(timeRange: { start: Date; end: Date }): Promise<UploadAnalyticsResponseDto> {
    this.logger.debug('Fetching upload statistics');

    const stats = await this.documentRepository.getUploadStats(timeRange);

    return this.statisticsMapper.toUploadAnalyticsDto(stats);
  }

  async getUploadTrends(timeRange: { start: Date; end: Date }): Promise<{
    daily: Array<{ date: string; count: number; totalBytes: number }>;
    weekly: Array<{
      weekStart: string;
      weekEnd: string;
      count: number;
      totalBytes: number;
      averagePerDay: number;
    }>;
    byCategory: Record<string, number>;
    topUploaders: Array<{ userId: string; uploadCount: number }>;
  }> {
    this.logger.debug('Fetching upload trends');

    const stats = await this.documentRepository.getUploadStats(timeRange);

    return {
      daily: stats.byDay,
      weekly: this.statisticsMapper.groupByWeek(stats.byDay),
      byCategory: stats.byCategory,
      topUploaders: [], // TODO: Implement if needed
    };
  }

  // ============================================================================
  // DASHBOARD ANALYTICS
  // ============================================================================

  async getDashboardAnalytics(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<DashboardAnalyticsResponseDto> {
    this.logger.debug('Fetching dashboard analytics');

    const range = timeRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date(),
    };

    const [documentStats, storageStats, verificationMetrics, uploadStats] = await Promise.all([
      this.documentRepository.getStats(),
      this.documentRepository.getStorageStats(),
      this.documentRepository.getVerificationMetrics(range),
      this.documentRepository.getUploadStats(range),
    ]);

    const documents = this.statisticsMapper.toDocumentAnalyticsDto(documentStats);
    const storage = this.statisticsMapper.toStorageAnalyticsDto(storageStats);
    const verification = this.statisticsMapper.toVerificationMetricsDto(verificationMetrics);
    const uploads = this.statisticsMapper.toUploadAnalyticsDto(uploadStats);

    return this.statisticsMapper.toDashboardAnalyticsDto({
      documents,
      storage,
      verification,
      uploads,
    });
  }

  async getDashboardSummary(timeRange?: { start: Date; end: Date }): Promise<{
    totalDocuments: number;
    totalStorage: string;
    verificationRate: number;
    documentsNeedingAttention: number;
    recentActivity: {
      uploadsToday: number;
      verificationsToday: number;
      pendingVerification: number;
    };
    trends: {
      uploadsGrowth: { percentage: number; trend: 'up' | 'down' | 'stable' };
      storageGrowth: { percentage: number; trend: 'up' | 'down' | 'stable' };
    };
    storageByCategory: Array<{ category: string; size: string; percentage: number }>;
  }> {
    this.logger.debug('Generating dashboard summary');

    const range = timeRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    const [documentStats, storageStats, verificationMetrics, uploadStats] = await Promise.all([
      this.documentRepository.getStats(),
      this.documentRepository.getStorageStats(),
      this.documentRepository.getVerificationMetrics(range),
      this.documentRepository.getUploadStats(range),
    ]);

    const documents = this.statisticsMapper.toDocumentAnalyticsDto(documentStats);
    const storage = this.statisticsMapper.toStorageAnalyticsDto(storageStats);
    const verification = this.statisticsMapper.toVerificationMetricsDto(verificationMetrics);

    const summary = this.statisticsMapper.generateSummary({
      documents,
      storage,
      verification,
    });

    // Calculate today's activity
    const today = new Date().toISOString().split('T')[0];
    const todayStats = uploadStats.byDay.find((d) => d.date === today);
    const uploadsToday = todayStats?.count || 0;

    return {
      totalDocuments: summary.totalDocuments,
      totalStorage: summary.totalStorage,
      verificationRate: summary.verificationRate,
      documentsNeedingAttention: summary.documentsNeedingAttention,
      recentActivity: {
        uploadsToday,
        verificationsToday: 0, // TODO: Calculate from verification stats
        pendingVerification: documentStats.byStatus['PENDING_VERIFICATION'] || 0,
      },
      trends: {
        uploadsGrowth: { percentage: 0, trend: 'stable' }, // TODO: Calculate growth
        storageGrowth: { percentage: 0, trend: 'stable' }, // TODO: Calculate growth
      },
      storageByCategory: summary.storageByCategory,
    };
  }

  // ============================================================================
  // CUSTOM REPORTS
  // ============================================================================

  async getUserDocumentStats(userId: string): Promise<{
    totalDocuments: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    totalSizeBytes: number;
    oldestDocument: Date | null;
    newestDocument: Date | null;
  }> {
    this.logger.debug(`Fetching document stats for user: ${userId}`);

    const stats = await this.documentRepository.getStats({
      uploaderId: userId as any,
      includeDeleted: false,
    });

    const documents = await this.documentRepository.findByUploaderId(userId as any, {
      page: 1,
      limit: 1,
      sortBy: 'createdAt',
      sortOrder: 'asc',
    });

    const oldestDoc = documents.data[0];

    const recentDocs = await this.documentRepository.findByUploaderId(userId as any, {
      page: 1,
      limit: 1,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const newestDoc = recentDocs.data[0];

    return {
      totalDocuments: stats.total,
      byStatus: stats.byStatus,
      byCategory: stats.byCategory,
      totalSizeBytes: stats.totalSizeBytes,
      oldestDocument: oldestDoc?.createdAt || null,
      newestDocument: newestDoc?.createdAt || null,
    };
  }

  async getCategoryBreakdown(
    enriched: boolean = false,
  ): Promise<
    | Record<string, number>
    | Record<string, { count: number; percentage: number; totalSize: string; averageSize: string }>
  > {
    this.logger.debug('Fetching category breakdown');

    const [stats, storageStats] = await Promise.all([
      this.documentRepository.getStats(),
      this.documentRepository.getStorageStats(),
    ]);

    if (!enriched) {
      return stats.byCategory;
    }

    return this.statisticsMapper.enrichCategoryBreakdown(
      stats.byCategory,
      stats.total,
      storageStats.byCategory,
    );
  }

  async getStatusBreakdown(
    enriched: boolean = false,
  ): Promise<Record<string, number> | Record<string, { count: number; percentage: number }>> {
    this.logger.debug('Fetching status breakdown');

    const stats = await this.documentRepository.getStats();

    if (!enriched) {
      return stats.byStatus;
    }

    return this.statisticsMapper.enrichStatusBreakdown(stats.byStatus, stats.total);
  }

  // ============================================================================
  // COMPARATIVE ANALYTICS
  // ============================================================================

  async compareTimeRanges(
    currentRange: { start: Date; end: Date },
    previousRange: { start: Date; end: Date },
  ): Promise<{
    uploads: {
      current: number;
      previous: number;
      growth: { absolute: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    };
    verifications: {
      current: number;
      previous: number;
      growth: { absolute: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    };
    storage: {
      current: number;
      previous: number;
      growth: { absolute: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    };
  }> {
    this.logger.debug('Comparing time ranges');

    const [
      currentUploadStats,
      previousUploadStats,
      currentVerificationMetrics,
      previousVerificationMetrics,
    ] = await Promise.all([
      this.documentRepository.getUploadStats(currentRange),
      this.documentRepository.getUploadStats(previousRange),
      this.documentRepository.getVerificationMetrics(currentRange),
      this.documentRepository.getVerificationMetrics(previousRange),
    ]);

    const currentStorage = currentUploadStats.byDay.reduce((sum, day) => sum + day.totalBytes, 0);
    const previousStorage = previousUploadStats.byDay.reduce((sum, day) => sum + day.totalBytes, 0);

    return {
      uploads: {
        current: currentUploadStats.totalUploads,
        previous: previousUploadStats.totalUploads,
        growth: this.statisticsMapper.calculateGrowthRate(
          currentUploadStats.totalUploads,
          previousUploadStats.totalUploads,
        ),
      },
      verifications: {
        current:
          currentVerificationMetrics.totalVerified + currentVerificationMetrics.totalRejected,
        previous:
          previousVerificationMetrics.totalVerified + previousVerificationMetrics.totalRejected,
        growth: this.statisticsMapper.calculateGrowthRate(
          currentVerificationMetrics.totalVerified + currentVerificationMetrics.totalRejected,
          previousVerificationMetrics.totalVerified + previousVerificationMetrics.totalRejected,
        ),
      },
      storage: {
        current: currentStorage,
        previous: previousStorage,
        growth: this.statisticsMapper.calculateGrowthRate(currentStorage, previousStorage),
      },
    };
  }

  // ============================================================================
  // HEALTH METRICS
  // ============================================================================

  async getSystemHealthMetrics(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      pendingVerifications: { count: number; status: 'ok' | 'warning' | 'critical' };
      expiredDocuments: { count: number; status: 'ok' | 'warning' | 'critical' };
      rejectedDocuments: { count: number; status: 'ok' | 'warning' };
      storageUsage: { percentage: number; status: 'ok' | 'warning' | 'critical' };
      averageVerificationTime: { hours: number; status: 'ok' | 'warning' | 'critical' };
    };
  }> {
    this.logger.debug('Calculating system health metrics');

    const stats = await this.documentRepository.getStats();
    const verificationMetrics = await this.documentRepository.getVerificationMetrics({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    });

    const pendingCount = stats.byStatus['PENDING_VERIFICATION'] || 0;
    const expiredCount = stats.expired || 0;
    const rejectedCount = stats.byStatus['REJECTED'] || 0;

    const metrics = {
      pendingVerifications: {
        count: pendingCount,
        status: (pendingCount < 10 ? 'ok' : pendingCount < 50 ? 'warning' : 'critical') as any,
      },
      expiredDocuments: {
        count: expiredCount,
        status: (expiredCount < 5 ? 'ok' : expiredCount < 20 ? 'warning' : 'critical') as any,
      },
      rejectedDocuments: {
        count: rejectedCount,
        status: (rejectedCount < stats.total * 0.1 ? 'ok' : 'warning') as any,
      },
      storageUsage: {
        percentage: 0, // TODO: Calculate from provider info
        status: 'ok' as any,
      },
      averageVerificationTime: {
        hours: verificationMetrics.averageVerificationTimeHours,
        status: (verificationMetrics.averageVerificationTimeHours < 24
          ? 'ok'
          : verificationMetrics.averageVerificationTimeHours < 72
            ? 'warning'
            : 'critical') as any,
      },
    };

    const hasCritical = Object.values(metrics).some((m) => m.status === 'critical');
    const hasWarning = Object.values(metrics).some((m) => m.status === 'warning');

    return {
      status: hasCritical ? 'critical' : hasWarning ? 'warning' : 'healthy',
      metrics,
    };
  }
}
