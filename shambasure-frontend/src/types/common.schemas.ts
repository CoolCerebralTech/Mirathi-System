// FILE: src/types/common.schemas.ts

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
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * A generic Zod schema for a simple text search combined with pagination.
 */
export const SearchQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
});

/**
 * A generic factory function to create a Zod schema for paginated API responses.
 * @template T - A Zod schema for the items in the `data` array.
 * @param {T} itemSchema - The Zod schema for an individual item.
 * @returns A Zod schema for the complete paginated response structure.
 */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      total: z.number().int().nonnegative(),
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      totalPages: z.number().int().nonnegative(),
      hasNextPage: z.boolean(),
      hasPrevPage: z.boolean(),
    }),
  });

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * A Zod schema for a standard, generic success response from the API.
 * Often used for simple actions like DELETE that don't return a full entity.
 */
export const SuccessResponseSchema = z.object({
  message: z.string(),
  data: z.unknown().optional(),
});

/**
 * A Zod schema for a standard API error response.
 * Includes an optional `details` field for structured validation errors.
 */
export const ErrorResponseSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
  /** Optional field for detailed validation errors, e.g., { email: 'Invalid format' } */
  details: z.record(z.string(), z.any()).optional(),
});

// ============================================================================
// COMMON REUSABLE SCHEMAS
// ============================================================================

/**
 * A Zod schema for validating a standard UUID string.
 */
export const UUIDSchema = z.string().uuid('Invalid ID format provided');

/**
 * A Zod schema for validating a URL parameter that is expected to be a UUID.
 * Useful for validating router params like `/users/:id`.
 */
export const IdParamSchema = z.object({
  id: UUIDSchema,
});

/**
 * A Zod schema for a date range, ensuring `endDate` is not before `startDate`.
 */
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

/** The inferred TypeScript type for pagination query parameters. */
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/** The inferred TypeScript type for a simple search query. */
export type SearchQuery = z.infer<typeof SearchQuerySchema>;

/** The inferred TypeScript type for a standard success response. */
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

/** The inferred TypeScript type for a standard error response. */
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/** The inferred TypeScript type for a date range object. */
export type DateRange = z.infer<typeof DateRangeSchema>;

/**
 * A generic TypeScript type for paginated responses, inferred from the Zod schema factory.
 * This ensures the type is always in sync with the Zod validator.
 * @example const users: Paginated<User> = await fetchUsers();
 */
export type Paginated<T> = z.infer<
  ReturnType<typeof createPaginatedResponseSchema<z.ZodType<T>>>
>;
