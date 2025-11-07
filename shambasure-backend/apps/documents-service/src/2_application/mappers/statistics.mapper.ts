import { Injectable } from '@nestjs/common';
import {
  DocumentAnalyticsResponseDto,
  StorageAnalyticsResponseDto,
  VerificationMetricsResponseDto,
  UploadAnalyticsResponseDto,
  DashboardAnalyticsResponseDto,
} from '../dtos/analytics-response.dto';

/**
 * StatisticsMapper - Application Layer
 *
 * RESPONSIBILITIES:
 * - Map repository statistics to Response DTOs
 * - Format analytics data for presentation
 * - Calculate derived metrics
 */
@Injectable()
export class StatisticsMapper {
  // ============================================================================
  // DOCUMENT ANALYTICS
  // ============================================================================

  toDocumentAnalyticsDto(stats: {
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    totalSizeBytes: number;
    averageSizeBytes: number;
    encrypted: number;
    public: number;
    expired: number;
  }): DocumentAnalyticsResponseDto {
    return new DocumentAnalyticsResponseDto({
      total: stats.total,
      byStatus: stats.byStatus,
      byCategory: stats.byCategory,
      totalSizeBytes: stats.totalSizeBytes,
      averageSizeBytes: Math.round(stats.averageSizeBytes),
      encrypted: stats.encrypted,
      public: stats.public,
      expired: stats.expired,
    });
  }

  // ============================================================================
  // STORAGE ANALYTICS
  // ============================================================================

  toStorageAnalyticsDto(stats: {
    totalSizeBytes: number;
    byCategory: Record<string, number>;
    byStorageProvider: Record<string, number>;
    byUser: Array<{ userId: string; totalBytes: number; documentCount: number }>;
  }): StorageAnalyticsResponseDto {
    return new StorageAnalyticsResponseDto({
      totalSizeBytes: stats.totalSizeBytes,
      byCategory: stats.byCategory,
      byStorageProvider: stats.byStorageProvider,
      byUser: stats.byUser,
    });
  }

  // ============================================================================
  // VERIFICATION METRICS
  // ============================================================================

  toVerificationMetricsDto(metrics: {
    totalVerified: number;
    totalRejected: number;
    totalPending: number;
    averageVerificationTimeHours: number;
    byVerifier: Record<string, { verified: number; rejected: number }>;
  }): VerificationMetricsResponseDto {
    return new VerificationMetricsResponseDto({
      totalVerified: metrics.totalVerified,
      totalRejected: metrics.totalRejected,
      totalPending: metrics.totalPending,
      averageVerificationTimeHours: Math.round(metrics.averageVerificationTimeHours * 100) / 100,
      byVerifier: metrics.byVerifier,
    });
  }

  // ============================================================================
  // UPLOAD ANALYTICS
  // ============================================================================

  toUploadAnalyticsDto(stats: {
    totalUploads: number;
    byCategory: Record<string, number>;
    byDay: Array<{ date: string; count: number; totalBytes: number }>;
  }): UploadAnalyticsResponseDto {
    return new UploadAnalyticsResponseDto({
      totalUploads: stats.totalUploads,
      byCategory: stats.byCategory,
      byDay: stats.byDay,
    });
  }

  // ============================================================================
  // DASHBOARD ANALYTICS (COMBINED)
  // ============================================================================

  toDashboardAnalyticsDto(data: {
    documents: DocumentAnalyticsResponseDto;
    storage: StorageAnalyticsResponseDto;
    verification: VerificationMetricsResponseDto;
    uploads: UploadAnalyticsResponseDto;
  }): DashboardAnalyticsResponseDto {
    return new DashboardAnalyticsResponseDto({
      documents: data.documents,
      storage: data.storage,
      verification: data.verification,
      uploads: data.uploads,
    });
  }

  // ============================================================================
  // HELPER METHODS - DATA FORMATTING
  // ============================================================================

  /**
   * Formats bytes to human-readable format
   */
  formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Calculates percentage with 2 decimal places
   */
  calculatePercentage(part: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((part / total) * 10000) / 100;
  }

  /**
   * Enriches status breakdown with percentages
   */
  enrichStatusBreakdown(
    byStatus: Record<string, number>,
    total: number,
  ): Record<string, { count: number; percentage: number }> {
    const enriched: Record<string, { count: number; percentage: number }> = {};

    for (const [status, count] of Object.entries(byStatus)) {
      enriched[status] = {
        count,
        percentage: this.calculatePercentage(count, total),
      };
    }

    return enriched;
  }

  /**
   * Enriches category breakdown with percentages and formatted sizes
   */
  enrichCategoryBreakdown(
    byCategory: Record<string, number>,
    total: number,
    byCategorySize?: Record<string, number>,
  ): Record<
    string,
    { count: number; percentage: number; totalSize?: string; averageSize?: string }
  > {
    const enriched: Record<
      string,
      { count: number; percentage: number; totalSize?: string; averageSize?: string }
    > = {};

    for (const [category, count] of Object.entries(byCategory)) {
      const totalSize = byCategorySize?.[category] || 0;
      const averageSize = count > 0 ? totalSize / count : 0;

      enriched[category] = {
        count,
        percentage: this.calculatePercentage(count, total),
        totalSize: totalSize > 0 ? this.formatBytes(totalSize) : undefined,
        averageSize: averageSize > 0 ? this.formatBytes(averageSize) : undefined,
      };
    }

    return enriched;
  }

  /**
   * Groups daily data by week
   */
  groupByWeek(dailyData: Array<{ date: string; count: number; totalBytes?: number }>): Array<{
    weekStart: string;
    weekEnd: string;
    count: number;
    totalBytes: number;
    averagePerDay: number;
  }> {
    const weeks = new Map<string, { dates: Date[]; count: number; totalBytes: number }>();

    dailyData.forEach((day) => {
      const date = new Date(day.date);
      const weekStart = this.getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];

      const existing = weeks.get(weekKey) || { dates: [], count: 0, totalBytes: 0 };
      existing.dates.push(date);
      existing.count += day.count;
      existing.totalBytes += day.totalBytes || 0;
      weeks.set(weekKey, existing);
    });

    return Array.from(weeks.entries()).map(([weekKey, data]) => {
      const weekStart = new Date(weekKey);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      return {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        count: data.count,
        totalBytes: data.totalBytes,
        averagePerDay: Math.round((data.count / data.dates.length) * 100) / 100,
      };
    });
  }

  /**
   * Gets the start of the week (Monday) for a given date
   */
  private getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(date);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  /**
   * Calculates growth rate between two periods
   */
  calculateGrowthRate(
    current: number,
    previous: number,
  ): {
    absolute: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  } {
    const absolute = current - previous;
    const percentage = previous > 0 ? (absolute / previous) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (absolute > 0) trend = 'up';
    else if (absolute < 0) trend = 'down';

    return {
      absolute,
      percentage: Math.round(percentage * 100) / 100,
      trend,
    };
  }

  /**
   * Generates summary statistics
   */
  generateSummary(data: {
    documents: DocumentAnalyticsResponseDto;
    storage: StorageAnalyticsResponseDto;
    verification: VerificationMetricsResponseDto;
  }): {
    totalDocuments: number;
    totalStorage: string;
    verificationRate: number;
    documentsNeedingAttention: number;
    storageByCategory: Array<{ category: string; size: string; percentage: number }>;
  } {
    const totalStorage = data.storage.totalSizeBytes;
    const verifiedCount = data.documents.byStatus['VERIFIED'] || 0;
    const verificationRate = this.calculatePercentage(verifiedCount, data.documents.total);

    const pendingCount = data.documents.byStatus['PENDING_VERIFICATION'] || 0;
    const rejectedCount = data.documents.byStatus['REJECTED'] || 0;
    const expiredCount = data.documents.expired || 0;

    const storageByCategory = Object.entries(data.storage.byCategory)
      .map(([category, size]) => ({
        category,
        size: this.formatBytes(size),
        percentage: this.calculatePercentage(size, totalStorage),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      totalDocuments: data.documents.total,
      totalStorage: this.formatBytes(totalStorage),
      verificationRate,
      documentsNeedingAttention: pendingCount + rejectedCount + expiredCount,
      storageByCategory,
    };
  }
}
