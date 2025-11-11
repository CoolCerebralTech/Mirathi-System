import { Injectable } from '@nestjs/common';
import {
  DocumentAnalyticsResponseDto,
  StorageAnalyticsResponseDto,
  VerificationMetricsResponseDto,
  UploadAnalyticsResponseDto,
  DashboardAnalyticsResponseDto,
} from '../dtos/analytics-response.dto';
import { DocumentStats, VerificationMetrics } from '../../3_domain/interfaces';

/**
 * Maps various raw statistics and analytics data into their respective DTOs.
 */
@Injectable()
export class StatisticsMapper {
  // ============================================================================
  // DOCUMENT ANALYTICS
  // ============================================================================

  toDocumentAnalyticsDto(stats: DocumentStats): DocumentAnalyticsResponseDto {
    return new DocumentAnalyticsResponseDto({
      total: stats.total ?? 0,
      byStatus: stats.byStatus ?? {},
      byCategory: stats.byCategory ?? {},
      totalSizeBytes: stats.totalSizeBytes ?? 0,
      averageSizeBytes: stats.averageSizeBytes ?? 0,
      encrypted: stats.encrypted ?? 0,
      public: stats.public ?? 0,
      expired: stats.expired ?? 0,
    });
  }

  // ============================================================================
  // STORAGE ANALYTICS
  // ============================================================================

  toStorageAnalyticsDto(storageStats: {
    totalSizeBytes: number;
    byCategory: Record<string, number>;
    byStorageProvider: Record<string, number>;
    byUser: Array<{ userId: string; totalBytes: number; documentCount: number }>;
  }): StorageAnalyticsResponseDto {
    return new StorageAnalyticsResponseDto({
      totalSizeBytes: storageStats.totalSizeBytes ?? 0,
      byCategory: storageStats.byCategory ?? {},
      byStorageProvider: storageStats.byStorageProvider ?? {},
      byUser: storageStats.byUser ?? [],
    });
  }

  // ============================================================================
  // VERIFICATION METRICS
  // ============================================================================

  toVerificationMetricsDto(metrics: VerificationMetrics): VerificationMetricsResponseDto {
    const totalProcessed = (metrics.totalVerified ?? 0) + (metrics.totalRejected ?? 0);
    const averageVerificationTime = metrics.averageVerificationTimeHours ?? 0;

    return new VerificationMetricsResponseDto({
      totalVerified: metrics.totalVerified ?? 0,
      totalRejected: metrics.totalRejected ?? 0,
      totalPending: metrics.totalPending ?? 0,
      averageVerificationTimeHours: Math.round(averageVerificationTime * 100) / 100,
      byVerifier: metrics.byVerifier ?? {},
      totalProcessed,
      successRate:
        totalProcessed > 0 ? Math.round((metrics.totalVerified / totalProcessed) * 100) : 0,
    });
  }

  // ============================================================================
  // UPLOAD ANALYTICS
  // ============================================================================

  toUploadAnalyticsDto(uploadStats: {
    totalUploads: number;
    byCategory: Record<string, number>;
    byDay: Array<{ date: string; count: number; totalBytes: number }>;
    averageDailyUploads?: number;
    peakUploadDay?: { date: string; count: number };
  }): UploadAnalyticsResponseDto {
    const averageDailyUploads =
      uploadStats.byDay.length > 0 ? uploadStats.totalUploads / uploadStats.byDay.length : 0;

    const peakUploadDay = uploadStats.byDay.reduce(
      (peak, day) => (day.count > peak.count ? day : peak),
      { date: '', count: 0, totalBytes: 0 },
    );

    return new UploadAnalyticsResponseDto({
      totalUploads: uploadStats.totalUploads ?? 0,
      byCategory: uploadStats.byCategory ?? {},
      byDay: uploadStats.byDay ?? [],
      averageDailyUploads: Math.round(averageDailyUploads * 100) / 100,
      peakUploadDay: peakUploadDay.count > 0 ? peakUploadDay : undefined,
    });
  }

  // ============================================================================
  // COMPREHENSIVE DASHBOARD ANALYTICS
  // ============================================================================

  toDashboardAnalyticsDto(analytics: {
    documents: DocumentStats;
    storage: {
      totalSizeBytes: number;
      byCategory: Record<string, number>;
      byStorageProvider: Record<string, number>;
      byUser: Array<{ userId: string; totalBytes: number; documentCount: number }>;
    };
    verification: VerificationMetrics;
    uploads: {
      totalUploads: number;
      byCategory: Record<string, number>;
      byDay: Array<{ date: string; count: number; totalBytes: number }>;
    };
    timeRange: { start: Date; end: Date };
  }): DashboardAnalyticsResponseDto {
    return new DashboardAnalyticsResponseDto({
      documents: this.toDocumentAnalyticsDto(analytics.documents),
      storage: this.toStorageAnalyticsDto(analytics.storage),
      verification: this.toVerificationMetricsDto(analytics.verification),
      uploads: this.toUploadAnalyticsDto(analytics.uploads),
      timeRange: analytics.timeRange,
    });
  }

  // ============================================================================
  // COMPLIANCE AND RETENTION ANALYTICS
  // ============================================================================

  toComplianceAnalyticsDto(complianceData: {
    totalDocuments: number;
    documentsWithRetentionPolicy: number;
    expiredDocuments: number;
    documentsDueForDeletion: number;
    byRetentionPolicy: Record<string, number>;
    complianceRate: number;
  }) {
    return {
      totalDocuments: complianceData.totalDocuments,
      documentsWithRetentionPolicy: complianceData.documentsWithRetentionPolicy,
      expiredDocuments: complianceData.expiredDocuments,
      documentsDueForDeletion: complianceData.documentsDueForDeletion,
      byRetentionPolicy: complianceData.byRetentionPolicy,
      complianceRate: Math.round(complianceData.complianceRate * 100) / 100,
      nonCompliantCount:
        complianceData.totalDocuments - complianceData.documentsWithRetentionPolicy,
    };
  }

  // ============================================================================
  // PERFORMANCE METRICS
  // ============================================================================

  toPerformanceMetricsDto(performanceData: {
    averageUploadTimeMs: number;
    averageVerificationTimeMs: number;
    averageDownloadTimeMs: number;
    successRates: {
      upload: number;
      verification: number;
      download: number;
    };
    systemUptime: number;
    errorRates: Record<string, number>;
  }) {
    return {
      upload: {
        averageTimeMs: performanceData.averageUploadTimeMs,
        successRate: performanceData.successRates.upload,
      },
      verification: {
        averageTimeMs: performanceData.averageVerificationTimeMs,
        successRate: performanceData.successRates.verification,
      },
      download: {
        averageTimeMs: performanceData.averageDownloadTimeMs,
        successRate: performanceData.successRates.download,
      },
      system: {
        uptime: performanceData.systemUptime,
        errorRates: performanceData.errorRates,
      },
    };
  }
}
