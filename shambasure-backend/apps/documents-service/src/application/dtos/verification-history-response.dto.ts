import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatusEnum } from '../../domain/value-objects/document-status.vo';

export class VerificationAttemptDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documentId: string;

  @ApiProperty()
  verifierId: string;

  @ApiPropertyOptional()
  verifierName?: string;

  @ApiProperty({ enum: DocumentStatusEnum })
  status: DocumentStatusEnum;

  @ApiPropertyOptional()
  reason?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  isSuccessful: boolean;

  @ApiProperty()
  isRejection: boolean;

  constructor(partial: Partial<VerificationAttemptDto>) {
    Object.assign(this, partial);
  }
}

export class DocumentVerificationHistoryResponseDto {
  @ApiProperty()
  documentId: string;

  @ApiProperty()
  totalAttempts: number;

  @ApiPropertyOptional()
  latestAttempt?: VerificationAttemptDto;

  @ApiPropertyOptional()
  firstAttempt?: VerificationAttemptDto;

  @ApiProperty({ type: [VerificationAttemptDto] })
  attempts: VerificationAttemptDto[];

  @ApiProperty({ enum: ['VERIFIED', 'REJECTED', 'PENDING', 'MULTIPLE_ATTEMPTS'] })
  currentStatus: 'VERIFIED' | 'REJECTED' | 'PENDING' | 'MULTIPLE_ATTEMPTS';

  @ApiProperty()
  wasReverified: boolean;

  constructor(partial: Partial<DocumentVerificationHistoryResponseDto>) {
    Object.assign(this, partial);
  }
}

export class VerifierPerformanceResponseDto {
  @ApiProperty()
  verifierId: string;

  @ApiPropertyOptional()
  verifierName?: string;

  @ApiProperty()
  totalAttempts: number;

  @ApiProperty()
  totalVerified: number;

  @ApiProperty()
  totalRejected: number;

  @ApiProperty()
  verificationRate: number;

  @ApiProperty()
  averageTimeToVerifyHours: number;

  @ApiProperty()
  documentsVerifiedPerDay: number;

  constructor(partial: Partial<VerifierPerformanceResponseDto>) {
    Object.assign(this, partial);
  }
}
