// src/types/admin.types.ts
import { z } from 'zod';
import { UserRoleSchema } from './shared.types';
import { PaginatedResultSchema } from './common.types';
import { UserOutputSchema } from './user.types';

// ============================================================================
// RE-EXPORTS (Fixing the import error)
// ============================================================================
export { BulkOperationResultSchema, type BulkOperationResult } from './common.types';

// ============================================================================
// QUERY INPUTS
// ============================================================================

/** Matches `ListUsersInput` */
export const ListUsersInputSchema = z.object({
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  search: z.string().optional(),
  status: z.string().optional(), 
  role: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'email', 'role', 'status']).default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

/** Matches `SearchUsersInput` */
export const SearchUsersInputSchema = z.object({
  status: z.string().optional(),
  role: z.string().optional(),
  county: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

// ============================================================================
// MUTATION INPUTS
// ============================================================================

export const ChangeRoleInputSchema = z.object({
  userId: z.string().uuid(),
  newRole: UserRoleSchema,
  reason: z.string().optional(),
});

export const SuspendUserInputSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().optional(),
});

export const BulkSuspendUsersInputSchema = z.object({
  userIds: z.array(z.string().uuid()).nonempty(),
  reason: z.string().optional(),
});

export const BulkDeleteUsersInputSchema = z.object({
  userIds: z.array(z.string().uuid()).nonempty(),
});

// ============================================================================
// OUTPUTS
// ============================================================================

export const PaginatedUsersOutputSchema = PaginatedResultSchema(UserOutputSchema);

export const SearchUsersResultOutputSchema = z.object({
  users: z.array(UserOutputSchema),
  total: z.number().int(),
});

export const UserStatisticsOutputSchema = z.object({
  byStatus: z.array(z.object({ status: z.string(), count: z.number().int() })),
  byRole: z.array(z.object({ role: z.string(), count: z.number().int() })),
  totalUsers: z.number().int(),
});

// ============================================================================
// TYPES
// ============================================================================

export type ListUsersInput = z.infer<typeof ListUsersInputSchema>;
export type SearchUsersInput = z.infer<typeof SearchUsersInputSchema>;
export type ChangeRoleInput = z.infer<typeof ChangeRoleInputSchema>;
export type SuspendUserInput = z.infer<typeof SuspendUserInputSchema>;
export type BulkSuspendUsersInput = z.infer<typeof BulkSuspendUsersInputSchema>;
export type BulkDeleteUsersInput = z.infer<typeof BulkDeleteUsersInputSchema>;

export type PaginatedUsersOutput = z.infer<typeof PaginatedUsersOutputSchema>;
export type SearchUsersResultOutput = z.infer<typeof SearchUsersResultOutputSchema>;
export type UserStatisticsOutput = z.infer<typeof UserStatisticsOutputSchema>;