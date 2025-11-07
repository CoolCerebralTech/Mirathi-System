import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty()
  totalVerified: number;

  @ApiProperty()
  totalRejected: number;

  @ApiProperty()
  totalPending: number;

  @ApiProperty()
  averageVerificationTimeHours: number;

  @ApiProperty()
  byVerifier: Record<string, { verified: number; rejected: number }>;

  constructor(partial: Partial<VerificationMetricsResponseDto>) {
    Object.assign(this, partial);
  }
}

export class UploadAnalyticsResponseDto {
  @ApiProperty()
  totalUploads: number;

  @ApiProperty()
  byCategory: Record<string, number>;

  @ApiProperty({ type: [Object] })
  byDay: Array<{
    date: string;
    count: number;
    totalBytes: number;
  }>;

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

  constructor(partial: Partial<DashboardAnalyticsResponseDto>) {
    Object.assign(this, partial);
  }
}
