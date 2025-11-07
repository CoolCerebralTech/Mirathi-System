import { Injectable } from '@nestjs/common';
import { BulkOperationResponseDto } from '../dtos/bulk-operations.dto';
import { DocumentId } from '../../3_domain/value-objects';

/**
 * BulkOperationsMapper - Application Layer
 *
 * RESPONSIBILITIES:
 * - Map bulk operation results to Response DTOs
 * - Format bulk operation errors
 * - Calculate bulk operation statistics
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
      successCount: result.successCount,
      failedCount: result.failedCount,
      errors: result.errors.map((error) => ({
        documentId: error.id,
        error: error.error,
      })),
    });
  }

  /**
   * Maps repository bulk delete result to DTO
   */
  fromRepositoryBulkResult(result: {
    successCount: number;
    failedItems: Array<{ path: any; error: string }>;
  }): BulkOperationResponseDto {
    return new BulkOperationResponseDto({
      successCount: result.successCount,
      failedCount: result.failedItems.length,
      errors: result.failedItems.map((item) => ({
        documentId: item.path?.value || 'unknown',
        error: item.error,
      })),
    });
  }

  // ============================================================================
  // ERROR AGGREGATION
  // ============================================================================

  /**
   * Groups errors by error type
   */
  groupErrorsByType(
    errors: Array<{ documentId: string; error: string }>,
  ): Record<string, { count: number; documentIds: string[] }> {
    const grouped: Record<string, { count: number; documentIds: string[] }> = {};

    errors.forEach(({ documentId, error }) => {
      if (!grouped[error]) {
        grouped[error] = { count: 0, documentIds: [] };
      }
      grouped[error].count++;
      grouped[error].documentIds.push(documentId);
    });

    return grouped;
  }

  /**
   * Generates a summary of bulk operation results
   */
  generateSummary(result: BulkOperationResponseDto): {
    totalProcessed: number;
    successRate: number;
    failureRate: number;
    errorTypes: Record<string, number>;
    mostCommonError?: string;
  } {
    const totalProcessed = result.successCount + result.failedCount;
    const successRate = totalProcessed > 0 ? (result.successCount / totalProcessed) * 100 : 0;
    const failureRate = 100 - successRate;

    const errorTypes: Record<string, number> = {};
    result.errors.forEach(({ error }) => {
      errorTypes[error] = (errorTypes[error] || 0) + 1;
    });

    const mostCommonError =
      Object.entries(errorTypes).length > 0
        ? Object.entries(errorTypes).sort((a, b) => b[1] - a[1])[0][0]
        : undefined;

    return {
      totalProcessed,
      successRate: Math.round(successRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      errorTypes,
      mostCommonError,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Creates a successful bulk operation response (no errors)
   */
  createSuccessResponse(count: number): BulkOperationResponseDto {
    return new BulkOperationResponseDto({
      successCount: count,
      failedCount: 0,
      errors: [],
    });
  }

  /**
   * Creates a failed bulk operation response (all failed)
   */
  createFailureResponse(documentIds: string[], errorMessage: string): BulkOperationResponseDto {
    return new BulkOperationResponseDto({
      successCount: 0,
      failedCount: documentIds.length,
      errors: documentIds.map((id) => ({
        documentId: id,
        error: errorMessage,
      })),
    });
  }

  /**
   * Merges multiple bulk operation results
   */
  mergeResults(results: BulkOperationResponseDto[]): BulkOperationResponseDto {
    const merged = results.reduce(
      (acc, result) => {
        acc.successCount += result.successCount;
        acc.failedCount += result.failedCount;
        acc.errors.push(...result.errors);
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
   * Creates a partial success response
   */
  createPartialResponse(
    successfulIds: string[],
    failedItems: Array<{ id: string; error: string }>,
  ): BulkOperationResponseDto {
    return new BulkOperationResponseDto({
      successCount: successfulIds.length,
      failedCount: failedItems.length,
      errors: failedItems.map((item) => ({
        documentId: item.id,
        error: item.error,
      })),
    });
  }
}
