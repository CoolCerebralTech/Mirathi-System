// FILE: src/types/common.types.ts

import { z } from 'zod';

// ============================================================================
// PAGINATION AND QUERYING
// ============================================================================

/**
 * A reusable Zod schema for common pagination query parameters.
 * Uses `z.coerce.number()` to safely handle string inputs from URL search params.
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  // Note: We removed 'sortBy' default here to keep it flexible for Admin
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * A generic Zod schema for a simple text search combined with pagination.
 */
export const SearchQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
});

// ============================================================================
// META & RESPONSE SCHEMAS
// ============================================================================

/**
 * Standard Pagination Metadata
 * Exported individually so it can be reused in other schemas (like Admin).
 */
export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  hasNext: z.boolean(), // Standardized naming (was hasNextPage)
  hasPrevious: z.boolean(), // Standardized naming (was hasPrevPage)
});

/**
 * A generic factory function to create a Zod schema for paginated API responses.
 */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });

/**
 * A Zod schema for a standard, generic success response from the API.
 */
export const SuccessResponseSchema = z.object({
  message: z.string(),
  data: z.unknown().optional(),
});

/**
 * A Zod schema for a standard API error response.
 */
export const ErrorResponseSchema = z.object({
  statusCode: z.number().int().optional(), // Made optional to match client needs
  error: z.string().optional(),
  message: z.string(),
  path: z.string().optional(),
  timestamp: z.string().optional(),
  details: z.record(z.string(), z.any()).optional(),
});

// ============================================================================
// COMMON REUSABLE SCHEMAS
// ============================================================================

export const UUIDSchema = z.string().uuid('Invalid ID format provided');

export const IdParamSchema = z.object({
  id: UUIDSchema,
});

export const DateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be before the start date',
    path: ['endDate'],
  });

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type Paginated<T> = z.infer<
  ReturnType<typeof createPaginatedResponseSchema<z.ZodType<T>>>
>;
