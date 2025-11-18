import { Injectable } from '@nestjs/common';
import { BulkOperationResponseDto } from '../dtos/bulk-operations.dto';
import { DocumentId } from '../../3_domain/value-objects';

export interface BulkOperationResult {
  successCount: number;
  failedCount: number;
  errors: Array<{ documentId: DocumentId; error: string }>;
}

export interface BulkDocumentOperationResult {
  processed: DocumentId[];
  failed: Array<{ documentId: DocumentId; error: string }>;
}

/**
 * Maps the results of bulk application service operations to the corresponding response DTO.
 */
@Injectable()
export class BulkOperationsMapper {
  /**
   * Maps a raw result from a bulk service operation to the standardized response DTO.
   */
  toResponseDto(result: BulkOperationResult): BulkOperationResponseDto {
    return new BulkOperationResponseDto({
      successCount: result.successCount,
      failedCount: result.failedCount,
      errors: result.errors.map((error) => ({
        documentId: error.documentId.value,
        error: error.error,
      })),
    });
  }

  /**
   * Maps document operation results to bulk response
   */
  fromDocumentOperationResult(result: BulkDocumentOperationResult): BulkOperationResponseDto {
    const successCount = result.processed.length;
    const failedCount = result.failed.length;

    return new BulkOperationResponseDto({
      successCount,
      failedCount,
      errors: result.failed.map((f) => ({
        documentId: f.documentId.value,
        error: f.error,
      })),
    });
  }

  /**
   * Combines multiple bulk operation results
   */
  combineResults(results: BulkOperationResult[]): BulkOperationResponseDto {
    const combinedResult: BulkOperationResult = {
      successCount: 0,
      failedCount: 0,
      errors: [],
    };

    for (const result of results) {
      combinedResult.successCount += result.successCount;
      combinedResult.failedCount += result.failedCount;
      combinedResult.errors.push(...result.errors);
    }

    return this.toResponseDto(combinedResult);
  }

  /**
   * Creates a successful bulk operation result
   */
  createSuccessResult(processedCount: number): BulkOperationResponseDto {
    return new BulkOperationResponseDto({
      successCount: processedCount,
      failedCount: 0,
      errors: [],
    });
  }

  /**
   * Creates a failed bulk operation result
   */
  createFailedResult(
    errors: Array<{ documentId: string; error: string }>,
  ): BulkOperationResponseDto {
    return new BulkOperationResponseDto({
      successCount: 0,
      failedCount: errors.length,
      errors,
    });
  }
}
