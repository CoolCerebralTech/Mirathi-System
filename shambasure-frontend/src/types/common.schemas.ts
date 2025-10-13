// FILE: src/types/common.schemas.ts

import { z } from 'zod';

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

/**
 * Generic paginated response schema
 * Can be used with any data type
 */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) => {
  return z.object({
    data: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });
};

/**
 * Base pagination query parameters
 */
export const PaginationQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

/**
 * Standard success response
 */
export const SuccessResponseSchema = z.object({
  message: z.string(),
  data: z.any().optional(),
});

/**
 * Standard error response
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
  timestamp: z.string().datetime().optional(),
  path: z.string().optional(),
});

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

/**
 * UUID validation
 */
export const UUIDSchema = z.string().uuid('Invalid ID format');

/**
 * Date range schema
 */
export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * Search query schema
 */
export const SearchQuerySchema = z.object({
  query: z.string().min(1).optional(),
  ...PaginationQuerySchema.shape,
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;

/**
 * Helper type for paginated responses
 */
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};