import { Injectable } from '@nestjs/common';
import { DocumentVerificationAttempt } from '../../3_domain/models/document-verification.model';
import { DocumentVerificationAttemptResponseDto } from '../dtos/document-response.dto';
import {
  VerificationAttemptDto,
  DocumentVerificationHistoryResponseDto,
  VerifierPerformanceResponseDto,
} from '../dtos/verification-history-response.dto';

/**
 * DocumentVerificationAttemptMapper - Application Layer
 *
 * RESPONSIBILITIES:
 * - Map verification attempt domain models to Response DTOs
 * - Format verification history data
 * - Calculate verification statistics
 * - Handle verification timeline analysis
 *
 * PRODUCTION CONSIDERATIONS:
 * - Null safety for optional fields
 * - Timezone handling for date calculations
 * - Performance for bulk operations
 * - Error handling for edge cases
 */
@Injectable()
export class DocumentVerificationAttemptMapper {
  // ============================================================================
  // DOMAIN TO RESPONSE DTO
  // ============================================================================

  toResponseDto(
    attempt: DocumentVerificationAttempt,
    options: {
      verifierName?: string;
      includeDocumentInfo?: boolean;
      documentFileName?: string;
    } = {},
  ): DocumentVerificationAttemptResponseDto {
    return new DocumentVerificationAttemptResponseDto({
      id: attempt.id.value,
      documentId: attempt.documentId.value,
      verifierId: attempt.verifierId.value,
      verifierName: options.verifierName ?? undefined,
      status: attempt.status.value,
      reason: attempt.reason?.value ?? undefined,
      metadata: attempt.metadata ?? undefined,
      createdAt: attempt.createdAt,
      isSuccessful: attempt.isSuccessful(),
      isRejection: attempt.isRejection(),
    });
  }

  toVerificationAttemptDto(
    attempt: DocumentVerificationAttempt,
    options: {
      verifierName?: string;
      documentFileName?: string;
      uploaderName?: string;
    } = {},
  ): VerificationAttemptDto {
    return new VerificationAttemptDto({
      id: attempt.id.value,
      documentId: attempt.documentId.value,
      verifierId: attempt.verifierId.value,
      verifierName: options.verifierName ?? undefined,
      status: attempt.status.value,
      reason: attempt.reason?.value ?? undefined,
      metadata: attempt.metadata ?? undefined,
      createdAt: attempt.createdAt,
      isSuccessful: attempt.isSuccessful(),
      isRejection: attempt.isRejection(),
    });
  }

  // ============================================================================
  // VERIFICATION HISTORY MAPPING
  // ============================================================================

  toHistoryResponseDto(
    history: {
      documentId: string;
      totalAttempts: number;
      latestAttempt: DocumentVerificationAttempt | null;
      firstAttempt: DocumentVerificationAttempt | null;
      attempts: DocumentVerificationAttempt[];
      currentStatus: 'VERIFIED' | 'REJECTED' | 'PENDING' | 'MULTIPLE_ATTEMPTS';
      wasReverified: boolean;
    },
    options: {
      verifierNamesMap?: Map<string, string>;
      documentFileName?: string;
    } = {},
  ): DocumentVerificationHistoryResponseDto {
    return new DocumentVerificationHistoryResponseDto({
      documentId: history.documentId,
      totalAttempts: history.totalAttempts,
      latestAttempt: history.latestAttempt
        ? this.toVerificationAttemptDto(history.latestAttempt, {
            verifierName: options.verifierNamesMap?.get(history.latestAttempt.verifierId.value),
            documentFileName: options.documentFileName,
          })
        : undefined,
      firstAttempt: history.firstAttempt
        ? this.toVerificationAttemptDto(history.firstAttempt, {
            verifierName: options.verifierNamesMap?.get(history.firstAttempt.verifierId.value),
            documentFileName: options.documentFileName,
          })
        : undefined,
      attempts: history.attempts.map((attempt) =>
        this.toVerificationAttemptDto(attempt, {
          verifierName: options.verifierNamesMap?.get(attempt.verifierId.value),
          documentFileName: options.documentFileName,
        }),
      ),
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
    options: {
      verifierName?: string;
      periodDays?: number;
    } = {},
  ): VerifierPerformanceResponseDto {
    return new VerifierPerformanceResponseDto({
      verifierId: stats.verifierId,
      verifierName: options.verifierName ?? undefined,
      totalAttempts: stats.totalAttempts,
      totalVerified: stats.totalVerified,
      totalRejected: stats.totalRejected,
      verificationRate: this.roundToTwoDecimals(stats.verificationRate),
      averageTimeToVerifyHours: this.roundToTwoDecimals(stats.averageTimeToVerifyHours),
      documentsVerifiedPerDay: this.roundToTwoDecimals(stats.documentsVerifiedPerDay),
    });
  }

  // ============================================================================
  // BULK MAPPING
  // ============================================================================

  toResponseDtoList(
    attempts: DocumentVerificationAttempt[],
    options: {
      verifierNamesMap?: Map<string, string>;
      documentFileNamesMap?: Map<string, string>;
    } = {},
  ): DocumentVerificationAttemptResponseDto[] {
    return attempts.map((attempt) =>
      this.toResponseDto(attempt, {
        verifierName: options.verifierNamesMap?.get(attempt.verifierId.value),
        documentFileName: options.documentFileNamesMap?.get(attempt.documentId.value),
      }),
    );
  }

  toVerificationAttemptDtoList(
    attempts: DocumentVerificationAttempt[],
    options: {
      verifierNamesMap?: Map<string, string>;
      documentFileNamesMap?: Map<string, string>;
      uploaderNamesMap?: Map<string, string>;
    } = {},
  ): VerificationAttemptDto[] {
    return attempts.map((attempt) =>
      this.toVerificationAttemptDto(attempt, {
        verifierName: options.verifierNamesMap?.get(attempt.verifierId.value),
        documentFileName: options.documentFileNamesMap?.get(attempt.documentId.value),
        uploaderName: options.uploaderNamesMap?.get(attempt.documentId.value), // This would need document uploader mapping
      }),
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
    options: {
      verifierNamesMap?: Map<string, string>;
      periodDays?: number;
    } = {},
  ): VerifierPerformanceResponseDto[] {
    return statsList.map((stats) =>
      this.toPerformanceResponseDto(stats, {
        verifierName: options.verifierNamesMap?.get(stats.verifierId),
        periodDays: options.periodDays,
      }),
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
    totalHours: number;
    totalDays: number;
    businessHours: number;
    formattedTime: string;
    isWithinSLA: boolean;
    slaThresholdHours: number;
  } {
    // Handle edge case where verification is before document creation
    if (verificationAttempt.createdAt < documentCreatedAt) {
      return {
        totalHours: 0,
        totalDays: 0,
        businessHours: 0,
        formattedTime: 'Invalid timeline',
        isWithinSLA: false,
        slaThresholdHours: 24,
      };
    }

    const diffMs = verificationAttempt.createdAt.getTime() - documentCreatedAt.getTime();
    const totalHours = diffMs / (1000 * 60 * 60);
    const totalDays = totalHours / 24;

    // Simple business hours calculation (8 hours per day, 5 days per week)
    const businessDays = Math.floor(totalDays);
    const remainingHours = totalHours % 24;
    const businessHours = businessDays * 8 + Math.min(remainingHours, 8);

    let formattedTime: string;
    if (totalHours < 1) {
      const minutes = Math.round(totalHours * 60);
      formattedTime = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (totalHours < 24) {
      const hours = Math.round(totalHours);
      formattedTime = `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.round(totalDays);
      formattedTime = `${days} day${days !== 1 ? 's' : ''}`;
    }

    const slaThresholdHours = 24; // 24-hour SLA
    const isWithinSLA = totalHours <= slaThresholdHours;

    return {
      totalHours: this.roundToTwoDecimals(totalHours),
      totalDays: this.roundToTwoDecimals(totalDays),
      businessHours: this.roundToTwoDecimals(businessHours),
      formattedTime,
      isWithinSLA,
      slaThresholdHours,
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
    successRate: number;
    rejectionRate: number;
    mostCommonRejectionReason?: string;
    timeline: {
      firstAttempt: Date | null;
      lastAttempt: Date | null;
      totalDurationHours: number;
    };
  } {
    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        rejectedAttempts: 0,
        uniqueVerifiers: 0,
        averageTimeToDecisionHours: 0,
        successRate: 0,
        rejectionRate: 0,
        timeline: {
          firstAttempt: null,
          lastAttempt: null,
          totalDurationHours: 0,
        },
      };
    }

    const uniqueVerifierIds = new Set(attempts.map((a) => a.verifierId.value));

    // Calculate time between consecutive attempts
    const sortedAttempts = [...attempts].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    const timeDiffs = sortedAttempts.slice(1).map((attempt, index) => {
      const prevAttempt = sortedAttempts[index];
      return (attempt.createdAt.getTime() - prevAttempt.createdAt.getTime()) / (1000 * 60 * 60);
    });

    const totalDurationHours =
      sortedAttempts.length > 1
        ? (sortedAttempts[sortedAttempts.length - 1].createdAt.getTime() -
            sortedAttempts[0].createdAt.getTime()) /
          (1000 * 60 * 60)
        : 0;

    const avgTime =
      timeDiffs.length > 0 ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length : 0;

    // Find most common rejection reason
    const rejectionReasons = attempts
      .filter((a) => a.isRejection() && a.reason)
      .map((a) => a.reason!.value);

    const reasonCounts = rejectionReasons.reduce(
      (acc, reason) => {
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostCommonRejectionReason =
      Object.keys(reasonCounts).length > 0
        ? Object.keys(reasonCounts).reduce((a, b) => (reasonCounts[a] > reasonCounts[b] ? a : b))
        : undefined;

    const successRate =
      attempts.length > 0
        ? (attempts.filter((a) => a.isSuccessful()).length / attempts.length) * 100
        : 0;

    const rejectionRate =
      attempts.length > 0
        ? (attempts.filter((a) => a.isRejection()).length / attempts.length) * 100
        : 0;

    return {
      totalAttempts: attempts.length,
      successfulAttempts: attempts.filter((a) => a.isSuccessful()).length,
      rejectedAttempts: attempts.filter((a) => a.isRejection()).length,
      uniqueVerifiers: uniqueVerifierIds.size,
      averageTimeToDecisionHours: this.roundToTwoDecimals(avgTime),
      successRate: this.roundToTwoDecimals(successRate),
      rejectionRate: this.roundToTwoDecimals(rejectionRate),
      mostCommonRejectionReason,
      timeline: {
        firstAttempt: sortedAttempts[0].createdAt,
        lastAttempt: sortedAttempts[sortedAttempts.length - 1].createdAt,
        totalDurationHours: this.roundToTwoDecimals(totalDurationHours),
      },
    };
  }

  /**
   * Validates if an attempt can be mapped to response DTO
   */
  isValidForMapping(attempt: DocumentVerificationAttempt): boolean {
    return !!(
      attempt?.id &&
      attempt.documentId &&
      attempt.verifierId &&
      attempt.status &&
      attempt.createdAt
    );
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
