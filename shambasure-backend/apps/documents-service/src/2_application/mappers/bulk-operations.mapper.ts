import { Injectable } from '@nestjs/common';
import { BulkOperationResponseDto } from '../dtos/bulk-operations.dto';

/**
 * BulkOperationsMapper - Application Layer
 *
 * RESPONSIBILITIES:
 * - Map bulk operation results to Response DTOs
 * - Format bulk operation errors
 * - Calculate bulk operation statistics
 * - Handle bulk operation result aggregation and analysis
 *
 * PRODUCTION CONSIDERATIONS:
 * - Error categorization and prioritization
 * - Performance for large bulk operations
 * - Consistency in error reporting
 * - Support for different bulk operation types
 */
@Injectable()
export class BulkOperationsMapper {
  // ============================================================================
  // RESULT MAPPING
  // ============================================================================

  toBulkOperationResponseDto(result: {
    successCount: number;
    failedCount: number;
    errors: Array<{ id: string; error: string }>;
  }): BulkOperationResponseDto {
    return new BulkOperationResponseDto({
      successCount: result.successCount || 0,
      failedCount: result.failedCount || 0,
      errors: (result.errors || []).map((error) => ({
        documentId: error.id,
        error: this.normalizeErrorMessage(error.error),
      })),
    });
  }

  /**
   * Maps repository bulk delete result to DTO with enhanced error handling
   */
  fromRepositoryBulkResult(result: {
    successCount: number;
    failedItems: Array<{ path: unknown; error: string }>;
  }): BulkOperationResponseDto {
    const errors = (result.failedItems || []).map((item) => {
      let documentId = 'unknown';

      const path = item.path;

      // Safely extract document ID
      if (typeof path === 'string') {
        documentId = path;
      } else if (typeof path === 'object' && path !== null) {
        const pathObj = path as Record<string, unknown>;
        if (typeof pathObj.value === 'string') {
          documentId = pathObj.value;
        } else if (typeof pathObj.id === 'string') {
          documentId = pathObj.id;
        }
      }

      return {
        documentId,
        error: this.normalizeErrorMessage(item.error),
      };
    });

    return new BulkOperationResponseDto({
      successCount: result.successCount || 0,
      failedCount: errors.length,
      errors,
    });
  }

  /**
   * Creates a typed bulk operation response for specific operations
   */
  toTypedBulkResponse<T extends string>(
    result: {
      successCount: number;
      failedCount: number;
      errors: Array<{ documentId: string; error: string }>;
    },
    operationType: T,
  ): BulkOperationResponseDto & { operationType: T; timestamp: Date } {
    const baseResponse = new BulkOperationResponseDto({
      successCount: result.successCount,
      failedCount: result.failedCount,
      errors: result.errors.map((e) => ({
        documentId: e.documentId,
        error: this.normalizeErrorMessage(e.error),
      })),
    });

    return {
      ...baseResponse,
      operationType,
      timestamp: new Date(),
    };
  }

  // ============================================================================
  // ERROR AGGREGATION AND ANALYSIS
  // ============================================================================

  /**
   * Groups errors by error type with enhanced categorization
   */
  groupErrorsByType(errors: Array<{ documentId: string; error: string }>): {
    byType: Record<string, { count: number; documentIds: string[] }>;
    bySeverity: Record<'high' | 'medium' | 'low', Array<{ documentId: string; error: string }>>;
    totalUniqueErrors: number;
  } {
    const byType: Record<string, { count: number; documentIds: string[] }> = {};
    const bySeverity: Record<
      'high' | 'medium' | 'low',
      Array<{ documentId: string; error: string }>
    > = {
      high: [],
      medium: [],
      low: [],
    };

    errors.forEach(({ documentId, error }) => {
      // Group by error type
      const normalizedError = this.normalizeErrorMessage(error);
      if (!byType[normalizedError]) {
        byType[normalizedError] = { count: 0, documentIds: [] };
      }
      byType[normalizedError].count++;
      byType[normalizedError].documentIds.push(documentId);

      // Categorize by severity
      const severity = this.determineErrorSeverity(normalizedError);
      bySeverity[severity].push({ documentId, error: normalizedError });
    });

    return {
      byType,
      bySeverity,
      totalUniqueErrors: Object.keys(byType).length,
    };
  }

  /**
   * Generates a comprehensive summary of bulk operation results
   */
  generateSummary(result: BulkOperationResponseDto): {
    totalProcessed: number;
    successRate: number;
    failureRate: number;
    errorTypes: Record<string, number>;
    mostCommonError?: string;
    severityBreakdown: { high: number; medium: number; low: number };
    estimatedRetrySuccessRate: number;
    recommendations: string[];
  } {
    const totalProcessed = result.successCount + result.failedCount;
    const successRate = totalProcessed > 0 ? (result.successCount / totalProcessed) * 100 : 0;
    const failureRate = 100 - successRate;

    const errorTypes: Record<string, number> = {};
    result.errors.forEach(({ error }) => {
      const normalizedError = this.normalizeErrorMessage(error);
      errorTypes[normalizedError] = (errorTypes[normalizedError] || 0) + 1;
    });

    const mostCommonError =
      Object.entries(errorTypes).length > 0
        ? Object.entries(errorTypes).sort((a, b) => b[1] - a[1])[0][0]
        : undefined;

    const errorAnalysis = this.groupErrorsByType(result.errors);
    const severityBreakdown = {
      high: errorAnalysis.bySeverity.high.length,
      medium: errorAnalysis.bySeverity.medium.length,
      low: errorAnalysis.bySeverity.low.length,
    };

    // Estimate retry success rate (assume low severity errors can be fixed)
    const retryableErrors = severityBreakdown.low + severityBreakdown.medium * 0.5;
    const estimatedRetrySuccessRate =
      result.failedCount > 0 ? (retryableErrors / result.failedCount) * 100 : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations(result, severityBreakdown, successRate);

    return {
      totalProcessed,
      successRate: this.roundToTwoDecimals(successRate),
      failureRate: this.roundToTwoDecimals(failureRate),
      errorTypes,
      mostCommonError,
      severityBreakdown,
      estimatedRetrySuccessRate: this.roundToTwoDecimals(estimatedRetrySuccessRate),
      recommendations,
    };
  }

  // ============================================================================
  // HELPER METHODS - RESPONSE CREATION
  // ============================================================================

  /**
   * Creates a successful bulk operation response (no errors)
   */
  createSuccessResponse(count: number, operationType?: string): BulkOperationResponseDto {
    const response = new BulkOperationResponseDto({
      successCount: count,
      failedCount: 0,
      errors: [],
    });

    return operationType
      ? this.toTypedBulkResponse({ successCount: count, failedCount: 0, errors: [] }, operationType)
      : response;
  }

  /**
   * Creates a failed bulk operation response (all failed)
   */
  createFailureResponse(
    documentIds: string[],
    errorMessage: string,
    operationType?: string,
  ): BulkOperationResponseDto {
    const errors = documentIds.map((id) => ({
      documentId: id,
      error: errorMessage,
    }));

    const response = new BulkOperationResponseDto({
      successCount: 0,
      failedCount: documentIds.length,
      errors,
    });

    return operationType
      ? this.toTypedBulkResponse(
          { successCount: 0, failedCount: documentIds.length, errors },
          operationType,
        )
      : response;
  }

  /**
   * Creates a partial success response with enhanced metadata
   */
  createPartialResponse(
    successfulIds: string[],
    failedItems: Array<{ id: string; error: string }>,
    operationType?: string,
  ): BulkOperationResponseDto {
    const errors = failedItems.map((item) => ({
      documentId: item.id,
      error: this.normalizeErrorMessage(item.error),
    }));

    const response = new BulkOperationResponseDto({
      successCount: successfulIds.length,
      failedCount: failedItems.length,
      errors,
    });

    return operationType
      ? this.toTypedBulkResponse(
          {
            successCount: successfulIds.length,
            failedCount: failedItems.length,
            errors,
          },
          operationType,
        )
      : response;
  }

  /**
   * Creates a response from individual operation results
   */
  createFromIndividualResults<T>(
    items: T[],
    results: Array<{ success: boolean; error?: string }>,
    idExtractor: (item: T) => string,
  ): BulkOperationResponseDto {
    const successfulIds: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    items.forEach((item, index) => {
      const result = results[index];
      const id = idExtractor(item);

      if (result.success) {
        successfulIds.push(id);
      } else {
        errors.push({
          id,
          error: result.error || 'Unknown error',
        });
      }
    });

    return this.createPartialResponse(successfulIds, errors);
  }

  // ============================================================================
  // AGGREGATION AND UTILITY METHODS
  // ============================================================================

  /**
   * Merges multiple bulk operation results with conflict resolution
   */
  mergeResults(results: BulkOperationResponseDto[]): BulkOperationResponseDto {
    if (!results || results.length === 0) {
      return this.createSuccessResponse(0);
    }

    const merged = results.reduce(
      (acc, result) => {
        acc.successCount += result.successCount || 0;
        acc.failedCount += result.failedCount || 0;

        // Merge errors, handling duplicates
        const existingErrors = new Map(acc.errors.map((e) => [e.documentId, e.error]));
        result.errors.forEach((error) => {
          // Prefer the first error encountered for a document
          if (!existingErrors.has(error.documentId)) {
            acc.errors.push(error);
            existingErrors.set(error.documentId, error.error);
          }
        });

        return acc;
      },
      {
        successCount: 0,
        failedCount: 0,
        errors: [] as Array<{ documentId: string; error: string }>,
      },
    );

    return new BulkOperationResponseDto(merged);
  }

  /**
   * Filters out successful operations from a mixed result
   */
  extractSuccessfulIds(allIds: string[], result: BulkOperationResponseDto): string[] {
    const failedIds = new Set(result.errors.map((e) => e.documentId));
    return allIds.filter((id) => !failedIds.has(id));
  }

  /**
   * Extracts failed operations with enhanced error information
   */
  extractFailedOperations(
    allIds: string[],
    result: BulkOperationResponseDto,
  ): Array<{ documentId: string; error: string; severity: 'high' | 'medium' | 'low' }> {
    const errorMap = new Map(result.errors.map((e) => [e.documentId, e.error]));

    return allIds
      .filter((id) => errorMap.has(id))
      .map((id) => ({
        documentId: id,
        error: errorMap.get(id)!,
        severity: this.determineErrorSeverity(errorMap.get(id)!),
      }));
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Normalizes error messages for consistent reporting
   */
  private normalizeErrorMessage(error: string): string {
    if (!error) return 'Unknown error';

    // Remove redundant information and standardize
    return error
      .replace(/^Error:\s*/i, '')
      .replace(/\s+\([^)]*\)$/, '') // Remove trailing context in parentheses
      .trim();
  }

  /**
   * Determines error severity based on error message content
   */
  private determineErrorSeverity(error: string): 'high' | 'medium' | 'low' {
    const normalizedError = error.toLowerCase();

    // High severity - critical failures
    if (
      normalizedError.includes('not found') ||
      normalizedError.includes('permission denied') ||
      normalizedError.includes('access denied') ||
      normalizedError.includes('unauthorized')
    ) {
      return 'high';
    }

    // Medium severity - business logic failures
    if (
      normalizedError.includes('already exists') ||
      normalizedError.includes('invalid') ||
      normalizedError.includes('validation failed') ||
      normalizedError.includes('constraint')
    ) {
      return 'medium';
    }

    // Low severity - temporary or minor issues
    return 'low';
  }

  /**
   * Generates recommendations based on operation results
   */
  private generateRecommendations(
    result: BulkOperationResponseDto,
    severityBreakdown: { high: number; medium: number; low: number },
    successRate: number,
  ): string[] {
    const recommendations: string[] = [];

    if (successRate < 50) {
      recommendations.push('Consider splitting the operation into smaller batches');
    }

    if (severityBreakdown.high > 0) {
      recommendations.push('Address high-severity errors before retrying');
    }

    if (severityBreakdown.low > result.failedCount * 0.7) {
      recommendations.push('Most failures are low-severity; consider automatic retry');
    }

    if (result.failedCount > 10) {
      recommendations.push('Review the most common error types for systemic issues');
    }

    if (successRate > 90) {
      recommendations.push('Operation was highly successful; consider increasing batch size');
    }

    return recommendations;
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
