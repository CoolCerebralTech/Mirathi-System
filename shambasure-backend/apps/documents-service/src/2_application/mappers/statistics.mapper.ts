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
 * - Handle data aggregation and enrichment
 *
 * PRODUCTION CONSIDERATIONS:
 * - Null safety for incomplete data
 * - Performance for large datasets
 * - Timezone handling for date groupings
 * - Edge cases in calculations
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
      total: stats.total || 0,
      byStatus: stats.byStatus || {},
      byCategory: stats.byCategory || {},
      totalSizeBytes: stats.totalSizeBytes || 0,
      averageSizeBytes: Math.round(stats.averageSizeBytes || 0),
      encrypted: stats.encrypted || 0,
      public: stats.public || 0,
      expired: stats.expired || 0,
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
    // Sort users by storage usage (descending) for better presentation
    const sortedByUser = [...(stats.byUser || [])].sort((a, b) => b.totalBytes - a.totalBytes);

    return new StorageAnalyticsResponseDto({
      totalSizeBytes: stats.totalSizeBytes || 0,
      byCategory: stats.byCategory || {},
      byStorageProvider: stats.byStorageProvider || {},
      byUser: sortedByUser,
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
      totalVerified: metrics.totalVerified || 0,
      totalRejected: metrics.totalRejected || 0,
      totalPending: metrics.totalPending || 0,
      averageVerificationTimeHours: this.roundToTwoDecimals(
        metrics.averageVerificationTimeHours || 0,
      ),
      byVerifier: metrics.byVerifier || {},
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
    // Ensure byDay is sorted by date
    const sortedByDay = [...(stats.byDay || [])].sort((a, b) => a.date.localeCompare(b.date));

    return new UploadAnalyticsResponseDto({
      totalUploads: stats.totalUploads || 0,
      byCategory: stats.byCategory || {},
      byDay: sortedByDay,
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
  // ENRICHED ANALYTICS (ADVANCED)
  // ============================================================================

  /**
   * Creates enriched dashboard with calculated metrics
   */
  toEnrichedDashboardDto(data: {
    documents: DocumentAnalyticsResponseDto;
    storage: StorageAnalyticsResponseDto;
    verification: VerificationMetricsResponseDto;
    uploads: UploadAnalyticsResponseDto;
    previousPeriod?: {
      documents?: DocumentAnalyticsResponseDto;
      storage?: StorageAnalyticsResponseDto;
      verification?: VerificationMetricsResponseDto;
      uploads?: UploadAnalyticsResponseDto;
    };
  }): DashboardAnalyticsResponseDto & {
    trends: {
      documentGrowth: ReturnType<typeof this.calculateGrowthRate>;
      storageGrowth: ReturnType<typeof this.calculateGrowthRate>;
      verificationGrowth: ReturnType<typeof this.calculateGrowthRate>;
      uploadGrowth: ReturnType<typeof this.calculateGrowthRate>;
    };
    summary: ReturnType<typeof this.generateSummary>;
    alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }>;
  } {
    const baseDashboard = this.toDashboardAnalyticsDto(data);
    const previous = data.previousPeriod;

    // Calculate trends
    const documentGrowth = previous?.documents
      ? this.calculateGrowthRate(data.documents.total, previous.documents.total)
      : { absolute: 0, percentage: 0, trend: 'stable' as const };

    const storageGrowth = previous?.storage
      ? this.calculateGrowthRate(data.storage.totalSizeBytes, previous.storage.totalSizeBytes)
      : { absolute: 0, percentage: 0, trend: 'stable' as const };

    const verificationGrowth = previous?.verification
      ? this.calculateGrowthRate(
          data.verification.totalVerified,
          previous.verification.totalVerified,
        )
      : { absolute: 0, percentage: 0, trend: 'stable' as const };

    const uploadGrowth = previous?.uploads
      ? this.calculateGrowthRate(data.uploads.totalUploads, previous.uploads.totalUploads)
      : { absolute: 0, percentage: 0, trend: 'stable' as const };

    // Generate summary
    const summary = this.generateSummary(data);

    // Generate alerts
    const alerts = this.generateAlerts(data);

    return {
      ...baseDashboard,
      trends: {
        documentGrowth,
        storageGrowth,
        verificationGrowth,
        uploadGrowth,
      },
      summary,
      alerts,
    };
  }

  // ============================================================================
  // HELPER METHODS - DATA FORMATTING
  // ============================================================================

  /**
   * Formats bytes to human-readable format
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, exponent)).toFixed(2);

    return `${size} ${units[exponent]}`;
  }

  /**
   * Formats bytes with precision control
   */
  formatBytesPrecise(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, exponent)).toFixed(decimals);

    return `${size} ${units[exponent]}`;
  }

  /**
   * Calculates percentage with configurable decimal places
   */
  calculatePercentage(part: number, total: number, decimals: number = 2): number {
    if (total === 0) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round((part / total) * 100 * factor) / factor;
  }

  /**
   * Rounds number to specified decimal places
   */
  roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Enriches status breakdown with percentages
   */
  enrichStatusBreakdown(
    byStatus: Record<string, number>,
    total: number,
  ): Record<string, { count: number; percentage: number }> {
    const enriched: Record<string, { count: number; percentage: number }> = {};

    for (const [status, count] of Object.entries(byStatus || {})) {
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

    for (const [category, count] of Object.entries(byCategory || {})) {
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
   * Groups daily data by week with improved timezone handling
   */
  groupByWeek(dailyData: Array<{ date: string; count: number; totalBytes?: number }>): Array<{
    weekStart: string;
    weekEnd: string;
    count: number;
    totalBytes: number;
    averagePerDay: number;
    weekNumber: number;
  }> {
    if (!dailyData || dailyData.length === 0) {
      return [];
    }

    const weeks = new Map<string, { dates: Date[]; count: number; totalBytes: number }>();

    dailyData.forEach((day) => {
      if (!day.date) return;

      try {
        const date = new Date(day.date);
        if (isNaN(date.getTime())) return;

        const weekStart = this.getWeekStart(date);
        const weekKey = weekStart.toISOString().split('T')[0];

        const existing = weeks.get(weekKey) || { dates: [], count: 0, totalBytes: 0 };
        existing.dates.push(date);
        existing.count += day.count || 0;
        existing.totalBytes += day.totalBytes || 0;
        weeks.set(weekKey, existing);
      } catch {
        // Skip invalid dates
        console.warn(`Invalid date in analytics data: ${day.date}`);
      }
    });

    return Array.from(weeks.entries()).map(([weekKey, data]) => {
      const weekStart = new Date(weekKey);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Calculate week number
      const firstDayOfYear = new Date(weekStart.getFullYear(), 0, 1);
      const pastDaysOfYear = (weekStart.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

      return {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        count: data.count,
        totalBytes: data.totalBytes,
        averagePerDay: this.roundToTwoDecimals(data.count / Math.max(data.dates.length, 1)),
        weekNumber,
      };
    });
  }

  /**
   * Groups data by month
   */
  groupByMonth(dailyData: Array<{ date: string; count: number; totalBytes?: number }>): Array<{
    month: string;
    year: number;
    monthName: string;
    count: number;
    totalBytes: number;
    averagePerDay: number;
  }> {
    if (!dailyData || dailyData.length === 0) {
      return [];
    }

    const months = new Map<string, { days: number; count: number; totalBytes: number }>();
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    dailyData.forEach((day) => {
      if (!day.date) return;

      try {
        const date = new Date(day.date);
        if (isNaN(date.getTime())) return;

        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const existing = months.get(monthKey) || { days: 0, count: 0, totalBytes: 0 };
        existing.days += 1;
        existing.count += day.count || 0;
        existing.totalBytes += day.totalBytes || 0;
        months.set(monthKey, existing);
      } catch {
        console.warn(`Invalid date in analytics data: ${day.date}`);
      }
    });

    return Array.from(months.entries()).map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-').map(Number);

      return {
        month: monthKey,
        year,
        monthName: monthNames[month - 1],
        count: data.count,
        totalBytes: data.totalBytes,
        averagePerDay: this.roundToTwoDecimals(data.count / Math.max(data.days, 1)),
      };
    });
  }

  /**
   * Gets the start of the week (Monday) for a given date
   */
  private getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
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
    significance: 'low' | 'medium' | 'high';
  } {
    const absolute = current - previous;
    const percentage = previous > 0 ? (absolute / previous) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (absolute > 0) trend = 'up';
    else if (absolute < 0) trend = 'down';

    // Determine significance based on percentage change
    let significance: 'low' | 'medium' | 'high' = 'low';
    const absPercentage = Math.abs(percentage);
    if (absPercentage >= 50) significance = 'high';
    else if (absPercentage >= 10) significance = 'medium';

    return {
      absolute,
      percentage: this.roundToTwoDecimals(percentage),
      trend,
      significance,
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
    topCategories: Array<{ category: string; count: number; percentage: number }>;
    verificationEfficiency: number;
  } {
    const totalStorage = data.storage.totalSizeBytes || 0;
    const verifiedCount = data.documents.byStatus?.['VERIFIED'] || 0;
    const totalDocuments = data.documents.total || 0;
    const verificationRate = this.calculatePercentage(verifiedCount, totalDocuments);

    const pendingCount = data.documents.byStatus?.['PENDING_VERIFICATION'] || 0;
    const rejectedCount = data.documents.byStatus?.['REJECTED'] || 0;
    const expiredCount = data.documents.expired || 0;

    // Storage by category (sorted)
    const storageByCategory = Object.entries(data.storage.byCategory || {})
      .map(([category, size]) => ({
        category,
        size: this.formatBytes(size),
        percentage: this.calculatePercentage(size, totalStorage),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Top categories by document count
    const topCategories = Object.entries(data.documents.byCategory || {})
      .map(([category, count]) => ({
        category,
        count,
        percentage: this.calculatePercentage(count, totalDocuments),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

    // Verification efficiency (successful verifications vs total attempts)
    const totalVerifications =
      (data.verification.totalVerified || 0) + (data.verification.totalRejected || 0);
    const verificationEfficiency =
      totalVerifications > 0
        ? this.calculatePercentage(data.verification.totalVerified || 0, totalVerifications)
        : 0;

    return {
      totalDocuments,
      totalStorage: this.formatBytes(totalStorage),
      verificationRate,
      documentsNeedingAttention: pendingCount + rejectedCount + expiredCount,
      storageByCategory,
      topCategories,
      verificationEfficiency,
    };
  }

  /**
   * Generates alerts based on analytics data
   */
  private generateAlerts(data: {
    documents: DocumentAnalyticsResponseDto;
    storage: StorageAnalyticsResponseDto;
    verification: VerificationMetricsResponseDto;
    uploads: UploadAnalyticsResponseDto;
  }): Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> {
    const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> =
      [];

    // Storage alerts
    const storageLimit = 100 * 1024 * 1024 * 1024; // 100GB
    if (data.storage.totalSizeBytes > storageLimit) {
      alerts.push({
        type: 'storage',
        message: `Storage usage is high: ${this.formatBytes(data.storage.totalSizeBytes)}`,
        severity: 'high',
      });
    }

    // Pending verification alerts
    const pendingCount = data.documents.byStatus?.['PENDING_VERIFICATION'] || 0;
    if (pendingCount > 50) {
      alerts.push({
        type: 'verification',
        message: `High number of documents pending verification: ${pendingCount}`,
        severity: 'medium',
      });
    }

    // Low verification rate alert
    const verifiedCount = data.documents.byStatus?.['VERIFIED'] || 0;
    const verificationRate = this.calculatePercentage(verifiedCount, data.documents.total);
    if (verificationRate < 50 && data.documents.total > 10) {
      alerts.push({
        type: 'verification',
        message: `Low verification rate: ${verificationRate}%`,
        severity: 'medium',
      });
    }

    // Expired documents alert
    if (data.documents.expired > 0) {
      alerts.push({
        type: 'compliance',
        message: `${data.documents.expired} documents have expired`,
        severity: 'high',
      });
    }

    return alerts;
  }
}
