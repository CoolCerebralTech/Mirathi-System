import { Injectable } from '@nestjs/common';
import { DocumentStatsResponseDto } from '../dtos/document-response.dto';

export interface DocumentStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  totalSizeBytes: number;
  averageSizeBytes: number;
}

export interface StorageStats {
  totalSizeBytes: number;
  byCategory: Record<string, number>;
  byStorageProvider: Record<string, number>;
}

@Injectable()
export class StatisticsMapper {
  toDocumentStatsResponseDto(stats: DocumentStats): DocumentStatsResponseDto {
    return new DocumentStatsResponseDto({
      total: stats.total,
      byStatus: stats.byStatus,
      byCategory: stats.byCategory,
      totalSizeBytes: stats.totalSizeBytes,
      averageSizeBytes: stats.averageSizeBytes,
      storageUsageByProvider: {}, // This would be populated from storage stats
    });
  }

  toStorageStatsResponseDto(storageStats: StorageStats) {
    return {
      totalSizeBytes: storageStats.totalSizeBytes,
      byCategory: storageStats.byCategory,
      byStorageProvider: storageStats.byStorageProvider,
    };
  }

  toVerificationMetricsResponseDto(metrics: any) {
    return {
      totalVerified: metrics.totalVerified,
      totalRejected: metrics.totalRejected,
      averageVerificationTime: metrics.averageVerificationTime,
      byVerifier: metrics.byVerifier,
    };
  }
}
