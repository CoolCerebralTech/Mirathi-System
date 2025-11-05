import { Injectable } from '@nestjs/common';
import { BulkOperationResponseDto } from '../dtos/bulk-operations.dto';

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

@Injectable()
export class BulkOperationsMapper {
  toBulkOperationResponseDto(result: BulkOperationResult): BulkOperationResponseDto {
    return new BulkOperationResponseDto({
      success: result.success,
      failed: result.failed,
      errors: result.errors,
    });
  }

  toBulkOperationResult(
    success: number,
    failed: number,
    errors: Array<{ id: string; error: string }> = [],
  ): BulkOperationResult {
    return {
      success,
      failed,
      errors,
    };
  }
}
