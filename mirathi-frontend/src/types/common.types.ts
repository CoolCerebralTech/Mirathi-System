// FILE: src/types/common.types.ts
import { z } from 'zod';

// ============================================================================
// QUERY INPUTS
// ============================================================================

/**
 * Standard Pagination Input
 * Matches backend defaults: page=1, limit=20
 */
export const PaginationInputSchema = z.object({
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
});

// ============================================================================
// OUTPUT SCHEMAS
// ============================================================================

/**
 * Matches backend `PaginatedUsersOutput` structure fields
 */
export const PaginatedResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) => z.object({
  users: z.array(itemSchema), // Note: Backend calls the array 'users', not 'data'
  total: z.number().int(),
  page: z.number().int(),
  totalPages: z.number().int(),
});

export const BulkOperationResultSchema = z.object({
  succeeded: z.array(z.string()),
  failed: z.array(z.string()),
  totalSucceeded: z.number().int(),
  totalFailed: z.number().int(),
});

export type BulkOperationResult = z.infer<typeof BulkOperationResultSchema>;