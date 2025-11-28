import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentAnalyticsResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  byStatus: Record<string, number>;

  @ApiProperty()
  byCategory: Record<string, number>;

  @ApiProperty()
  totalSizeBytes: number;

  @ApiProperty()
  averageSizeBytes: number;

  @ApiProperty()
  encrypted: number;

  @ApiProperty()
  public: number;

  @ApiProperty()
  expired: number;

  constructor(partial: Partial<DocumentAnalyticsResponseDto>) {
    Object.assign(this, partial);
  }
}

export class StorageAnalyticsResponseDto {
  @ApiProperty()
  totalSizeBytes: number;

  @ApiProperty()
  byCategory: Record<string, number>;

  @ApiProperty()
  byStorageProvider: Record<string, number>;

  @ApiProperty({ type: [Object] })
  byUser: Array<{
    userId: string;
    totalBytes: number;
    documentCount: number;
  }>;

  constructor(partial: Partial<StorageAnalyticsResponseDto>) {
    Object.assign(this, partial);
  }
}

export class VerificationMetricsResponseDto {
  @ApiProperty({
    description: 'Total documents successfully verified in the time range.',
    example: 95,
  })
  totalVerified: number;

  @ApiProperty({ description: 'Total documents rejected in the time range.', example: 5 })
  totalRejected: number;

  @ApiProperty({ description: 'Total documents still pending verification.', example: 25 })
  totalPending: number;

  @ApiProperty({
    description: 'Total verification decisions made (verified + rejected).',
    example: 100,
  })
  totalProcessed: number;
  @ApiProperty({
    description: 'The success rate of verifications (verified / totalProcessed).',
    example: 95,
  })
  successRate: number;

  @ApiProperty({
    description: 'Average time from document upload to verification decision, in hours.',
    example: 8.5,
  })
  averageVerificationTimeHours: number;

  @ApiProperty({
    description: 'Breakdown of verification activity by verifier.',
    example: { 'verifier-uuid-1': { verified: 80, rejected: 4 } },
  })
  byVerifier: Record<string, { verified: number; rejected: number }>;
  constructor(partial: Partial<VerificationMetricsResponseDto>) {
    Object.assign(this, partial);
  }
}

export class UploadAnalyticsResponseDto {
  @ApiProperty({ description: 'Total documents uploaded in the time range.', example: 120 })
  totalUploads: number;

  @ApiProperty({ description: 'Breakdown of uploads by category.' })
  byCategory: Record<string, number>;

  @ApiProperty({ description: 'Breakdown of uploads by day.' })
  byDay: Array<{ date: string; count: number; totalBytes: number }>;

  @ApiPropertyOptional({
    description: 'Average number of documents uploaded per day in the time range.',
    example: 4,
  })
  averageDailyUploads?: number;

  @ApiPropertyOptional({
    description: 'The day with the highest number of uploads in the time range.',
  })
  peakUploadDay?: { date: string; count: number; totalBytes: number };

  constructor(partial: Partial<UploadAnalyticsResponseDto>) {
    Object.assign(this, partial);
  }
}

export class DashboardAnalyticsResponseDto {
  @ApiProperty()
  documents: DocumentAnalyticsResponseDto;

  @ApiProperty()
  storage: StorageAnalyticsResponseDto;

  @ApiProperty()
  verification: VerificationMetricsResponseDto;

  @ApiProperty()
  uploads: UploadAnalyticsResponseDto;
  @ApiProperty({ description: 'The time range for which these analytics were generated.' })
  timeRange: { start: Date; end: Date };

  constructor(partial: Partial<DashboardAnalyticsResponseDto>) {
    Object.assign(this, partial);
  }
}
