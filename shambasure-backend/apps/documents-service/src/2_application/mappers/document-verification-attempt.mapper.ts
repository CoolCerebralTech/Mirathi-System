import { Injectable } from '@nestjs/common';
import { DocumentVerificationAttempt } from '../../3_domain/models/document-verification-attempt.model';
import { DocumentVerificationAttemptResponseDto } from '../dtos/document-response.dto';
import {
  VerificationAttemptDto,
  DocumentVerificationHistoryResponseDto,
  VerifierPerformanceResponseDto,
} from '../dtos/verification-history-response.dto';
import { VerificationAttemptId, DocumentId, UserId } from '../../3_domain/value-objects';

/**
 * DocumentVerificationAttemptMapper - Application Layer
 *
 * RESPONSIBILITIES:
 * - Map verification attempt domain models to Response DTOs
 * - Format verification history data
 * - Calculate verification statistics
 */
@Injectable()
export class DocumentVerificationAttemptMapper {
  // ============================================================================
  // DOMAIN TO RESPONSE DTO
  // ============================================================================

  toResponseDto(
    attempt: DocumentVerificationAttempt,
    verifierName?: string,
  ): DocumentVerificationAttemptResponseDto {
    return new DocumentVerificationAttemptResponseDto({
      id: attempt.id.value,
      documentId: attempt.documentId.value,
      verifierId: attempt.verifierId.value,
      verifierName,
      status: attempt.status.value,
      reason: attempt.reason?.value,
      metadata: attempt.metadata,
      createdAt: attempt.createdAt,
      isSuccessful: attempt.isSuccessful(),
      isRejection: attempt.isRejection(),
    });
  }

  toVerificationAttemptDto(
    attempt: DocumentVerificationAttempt,
    verifierName?: string,
  ): VerificationAttemptDto {
    return new VerificationAttemptDto({
      id: attempt.id.value,
      documentId: attempt.documentId.value,
      verifierId: attempt.verifierId.value,
      verifierName,
      status: attempt.status.value,
      reason: attempt.reason?.value,
      metadata: attempt.metadata,
      createdAt: attempt.createdAt,
      isSuccessful: attempt.isSuccessful(),
      isRejection: attempt.isRejection(),
    });
  }

  // ============================================================================
  // VERIFICATION HISTORY MAPPING
  // ============================================================================

  toHistoryResponseDto(history: {
    documentId: string;
    totalAttempts: number;
    latestAttempt: DocumentVerificationAttempt | null;
    firstAttempt: DocumentVerificationAttempt | null;
    attempts: DocumentVerificationAttempt[];
    currentStatus: 'VERIFIED' | 'REJECTED' | 'PENDING' | 'MULTIPLE_ATTEMPTS';
    wasReverified: boolean;
  }): DocumentVerificationHistoryResponseDto {
    return new DocumentVerificationHistoryResponseDto({
      documentId: history.documentId,
      totalAttempts: history.totalAttempts,
      latestAttempt: history.latestAttempt
        ? this.toVerificationAttemptDto(history.latestAttempt)
        : undefined,
      firstAttempt: history.firstAttempt
        ? this.toVerificationAttemptDto(history.firstAttempt)
        : undefined,
      attempts: history.attempts.map((attempt) => this.toVerificationAttemptDto(attempt)),
      currentStatus: history.currentStatus,
      wasReverified: history.wasReverified,
    });
  }

  // ============================================================================
  // PERFORMANCE METRICS MAPPING
  // ============================================================================

  toPerformanceResponseDto(
    stats: {
      verifierId: string;
      totalAttempts: number;
      totalVerified: number;
      totalRejected: number;
      verificationRate: number;
      averageTimeToVerifyHours: number;
      documentsVerifiedPerDay: number;
    },
    verifierName?: string,
  ): VerifierPerformanceResponseDto {
    return new VerifierPerformanceResponseDto({
      verifierId: stats.verifierId,
      verifierName,
      totalAttempts: stats.totalAttempts,
      totalVerified: stats.totalVerified,
      totalRejected: stats.totalRejected,
      verificationRate: Math.round(stats.verificationRate * 100) / 100,
      averageTimeToVerifyHours: Math.round(stats.averageTimeToVerifyHours * 100) / 100,
      documentsVerifiedPerDay: Math.round(stats.documentsVerifiedPerDay * 100) / 100,
    });
  }

  // ============================================================================
  // BULK MAPPING
  // ============================================================================

  toResponseDtoList(
    attempts: DocumentVerificationAttempt[],
    verifierNamesMap?: Map<string, string>,
  ): DocumentVerificationAttemptResponseDto[] {
    return attempts.map((attempt) =>
      this.toResponseDto(attempt, verifierNamesMap?.get(attempt.verifierId.value)),
    );
  }

  toVerificationAttemptDtoList(
    attempts: DocumentVerificationAttempt[],
    verifierNamesMap?: Map<string, string>,
  ): VerificationAttemptDto[] {
    return attempts.map((attempt) =>
      this.toVerificationAttemptDto(attempt, verifierNamesMap?.get(attempt.verifierId.value)),
    );
  }

  toPerformanceResponseDtoList(
    statsList: Array<{
      verifierId: string;
      totalAttempts: number;
      totalVerified: number;
      totalRejected: number;
      verificationRate: number;
      averageTimeToVerifyHours: number;
      documentsVerifiedPerDay: number;
    }>,
    verifierNamesMap?: Map<string, string>,
  ): VerifierPerformanceResponseDto[] {
    return statsList.map((stats) =>
      this.toPerformanceResponseDto(stats, verifierNamesMap?.get(stats.verifierId)),
    );
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculates the time between document creation and verification
   */
  calculateVerificationTime(
    documentCreatedAt: Date,
    verificationAttempt: DocumentVerificationAttempt,
  ): {
    hours: number;
    days: number;
    formattedTime: string;
  } {
    const diffMs = verificationAttempt.createdAt.getTime() - documentCreatedAt.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    const days = hours / 24;

    let formattedTime: string;
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      formattedTime = `${minutes} minutes`;
    } else if (hours < 24) {
      formattedTime = `${Math.round(hours)} hours`;
    } else {
      formattedTime = `${Math.round(days)} days`;
    }

    return {
      hours: Math.round(hours * 100) / 100,
      days: Math.round(days * 100) / 100,
      formattedTime,
    };
  }

  /**
   * Summarizes multiple attempts for a document
   */
  summarizeAttempts(attempts: DocumentVerificationAttempt[]): {
    totalAttempts: number;
    successfulAttempts: number;
    rejectedAttempts: number;
    uniqueVerifiers: number;
    averageTimeToDecisionHours: number;
  } {
    const uniqueVerifierIds = new Set(attempts.map((a) => a.verifierId.value));

    const timeDiffs = attempts.slice(1).map((attempt, index) => {
      const prevAttempt = attempts[index];
      return (attempt.createdAt.getTime() - prevAttempt.createdAt.getTime()) / (1000 * 60 * 60);
    });

    const avgTime =
      timeDiffs.length > 0 ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length : 0;

    return {
      totalAttempts: attempts.length,
      successfulAttempts: attempts.filter((a) => a.isSuccessful()).length,
      rejectedAttempts: attempts.filter((a) => a.isRejection()).length,
      uniqueVerifiers: uniqueVerifierIds.size,
      averageTimeToDecisionHours: Math.round(avgTime * 100) / 100,
    };
  }
}
