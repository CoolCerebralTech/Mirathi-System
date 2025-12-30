import { Injectable } from '@nestjs/common';

import { DocumentVerificationAttempt } from '../../domain/models';
import { DocumentId, UserId } from '../../domain/value-objects';
import {
  DocumentVerificationHistoryResponseDto,
  VerificationAttemptDto,
  VerifierPerformanceResponseDto,
} from '../dtos/verification-history-response.dto';

/**
 * Maps DocumentVerificationAttempt domain objects and related data to DTOs for API responses.
 */
@Injectable()
export class DocumentVerificationAttemptMapper {
  /**
   * Maps a single DocumentVerificationAttempt to its primary DTO representation.
   */
  toDto(
    attempt: DocumentVerificationAttempt,
    options: { verifierName?: string; documentName?: string } = {},
  ): VerificationAttemptDto {
    return new VerificationAttemptDto({
      id: attempt.id.value,
      documentId: attempt.documentId.value,
      verifierId: attempt.verifierId.value,
      verifierName: options.verifierName,
      status: attempt.status.value,
      reason: attempt.reason?.value ?? undefined,
      metadata: attempt.metadata ?? undefined,
      createdAt: attempt.createdAt,
      isSuccessful: attempt.isSuccessful(),
      isRejection: attempt.isRejection(),
    });
  }

  /**
   * Maps a list of domain objects to a list of DTOs.
   */
  toDtoList(
    attempts: DocumentVerificationAttempt[],
    options: {
      verifierNamesMap?: Map<string, string>;
      documentNamesMap?: Map<string, string>;
    } = {},
  ): VerificationAttemptDto[] {
    return attempts.map((attempt) =>
      this.toDto(attempt, {
        verifierName: options.verifierNamesMap?.get(attempt.verifierId.value),
        documentName: options.documentNamesMap?.get(attempt.documentId.value),
      }),
    );
  }

  /**
   * Maps the complete verification history for a document
   */
  toVerificationHistoryResponseDto(
    documentId: DocumentId,
    attempts: DocumentVerificationAttempt[],
    options: { verifierNamesMap?: Map<string, string> } = {},
  ): DocumentVerificationHistoryResponseDto {
    const sortedAttempts = [...attempts].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    const attemptDtos = this.toDtoList(sortedAttempts, options);

    // Calculate current status based on business rules
    const currentStatus = this.calculateCurrentStatus(sortedAttempts);
    const wasReverified = this.calculateWasReverified(sortedAttempts);

    return new DocumentVerificationHistoryResponseDto({
      documentId: documentId.value,
      totalAttempts: attemptDtos.length,
      currentStatus,
      wasReverified,
      attempts: attemptDtos,
      firstAttempt: attemptDtos[0],
      latestAttempt: attemptDtos[attemptDtos.length - 1],
    });
  }

  /**
   * Maps verifier performance data to DTO
   */
  toVerifierPerformanceResponseDto(
    performanceData: {
      verifierId: UserId;
      totalAttempts: number;
      verified: number;
      rejected: number;
      averageProcessingTimeHours: number;
      commonRejectionReasons: Array<{ reason: string; count: number }>;
      lastActive: Date;
    },
    options: { verifierName?: string } = {},
  ): VerifierPerformanceResponseDto {
    const verificationRate =
      performanceData.totalAttempts > 0
        ? (performanceData.verified / performanceData.totalAttempts) * 100
        : 0;

    return new VerifierPerformanceResponseDto({
      verifierId: performanceData.verifierId.value,
      verifierName: options.verifierName,
      totalAttempts: performanceData.totalAttempts,
      totalVerified: performanceData.verified,
      totalRejected: performanceData.rejected,
      verificationRate: Math.round(verificationRate * 100) / 100, // Round to 2 decimal places
      averageTimeToVerifyHours: performanceData.averageProcessingTimeHours,
      documentsVerifiedPerDay: this.calculateDailyRate(
        performanceData.verified,
        performanceData.lastActive,
      ),
    });
  }

  /**
   * Maps multiple verifier performances
   */
  toVerifierPerformanceResponseDtoList(
    performances: Array<{
      verifierId: UserId;
      totalAttempts: number;
      verified: number;
      rejected: number;
      averageProcessingTimeHours: number;
      commonRejectionReasons: Array<{ reason: string; count: number }>;
      lastActive: Date;
    }>,
    options: { verifierNamesMap?: Map<string, string> } = {},
  ): VerifierPerformanceResponseDto[] {
    return performances.map((perf) =>
      this.toVerifierPerformanceResponseDto(perf, {
        verifierName: options.verifierNamesMap?.get(perf.verifierId.value),
      }),
    );
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private calculateCurrentStatus(
    attempts: DocumentVerificationAttempt[],
  ): 'VERIFIED' | 'REJECTED' | 'PENDING' | 'MULTIPLE_ATTEMPTS' {
    if (attempts.length === 0) return 'PENDING';

    const latestAttempt = attempts[attempts.length - 1];

    if (latestAttempt.isSuccessful()) {
      return attempts.length > 1 ? 'MULTIPLE_ATTEMPTS' : 'VERIFIED';
    } else if (latestAttempt.isRejection()) {
      return attempts.length > 1 ? 'MULTIPLE_ATTEMPTS' : 'REJECTED';
    }

    return 'PENDING';
  }

  private calculateWasReverified(attempts: DocumentVerificationAttempt[]): boolean {
    if (attempts.length < 2) return false;

    let foundRejection = false;
    for (const attempt of attempts) {
      if (attempt.isRejection()) {
        foundRejection = true;
      }
      if (foundRejection && attempt.isSuccessful()) {
        return true;
      }
    }

    return false;
  }

  private calculateDailyRate(totalVerified: number, lastActive: Date): number {
    const now = new Date();
    const daysSinceLastActive = Math.max(
      1,
      Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)),
    );
    return Math.round((totalVerified / daysSinceLastActive) * 100) / 100;
  }
}
