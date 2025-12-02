// FILE: src/types/wills.schemas.ts

import { z } from 'zod';
import { UserResponseSchema } from './user.types';
import { AssetSchema } from './assets.schemas';

// ============================================================================
// SHARED ENUMS AND REUSABLE SCHEMAS
// ============================================================================

/**
 * Defines the lifecycle status of a will.
 */
export const WillStatusSchema = z.enum([
  'DRAFT', // Will is being created and is not yet legally active.
  'ACTIVE', // The will is finalized and considered legally binding.
  'REVOKED', // The will has been officially cancelled by the testator.
  'EXECUTED', // The terms of the will have been carried out after the testator's passing.
]);

/**
 * Defines the role of an executor for a will.
 */
export const ExecutorSchema = z.object({
  id: z.string().uuid(),
  willId: z.string().uuid(),
  // The user appointed as the executor
  executorUserId: z.string().uuid(),
  // Optionally include the full user object in API responses
  executorUser: UserResponseSchema.optional(),
});

/**
 * Defines a witness to the signing of a will.
 */
export const WitnessSchema = z.object({
  id: z.string().uuid(),
  willId: z.string().uuid(),
  fullName: z.string().trim().min(2, 'Full name is required'),
  nationalId: z.string().trim().min(1, 'National ID is required'),
});

/**
 * Defines how a single asset is distributed to a single beneficiary.
 */
export const BeneficiaryAssignmentSchema = z.object({
  id: z.string().uuid(),
  willId: z.string().uuid(),
  assetId: z.string().uuid(),
  beneficiaryId: z.string().uuid(),
  sharePercentage: z
    .coerce // Coerce input to number for flexibility
    .number()
    .min(0.01, 'Share must be at least 0.01%')
    .max(100, 'Share cannot exceed 100%'),
  // Optionally include full objects in API responses for easier display
  asset: AssetSchema.optional(),
  beneficiary: UserResponseSchema.optional(),
});

// ============================================================================
// API RESPONSE SCHEMA (The complete shape of a Will from the server)
// ============================================================================

export const WillSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: WillStatusSchema,
  testatorId: z.string().uuid(),
  testator: UserResponseSchema.optional(),
  executor: ExecutorSchema.nullable(),
  witnesses: z.array(WitnessSchema),
  assignments: z.array(BeneficiaryAssignmentSchema),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
});

// ============================================================================
// FORM/REQUEST SCHEMAS (Payloads sent to the server)
// ============================================================================

/**
 * Schema for creating a new, empty will.
 */
export const CreateWillSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  // The creator of the will must be specified
  testatorId: z.string().uuid(),
});

/**
 * A single item for the beneficiary assignment form.
 */
const AssignmentInputSchema = z.object({
  assetId: z.string().uuid('An asset must be selected'),
  beneficiaryId: z.string().uuid('A beneficiary must be selected'),
  sharePercentage: z.coerce
    .number()
    .positive('Share percentage must be positive'),
});

/**
 * A comprehensive schema for updating the entire contents of a will in one transaction.
 * This is crucial for the "Edit Will" page.
 */
export const UpdateWillContentsSchema = z
  .object({
    title: z.string().trim().min(3, 'Title is required').optional(),
    status: WillStatusSchema.optional(),
    executorUserId: z.string().uuid().nullable().optional(),
    witnesses: z
      .array(
        z.object({
          fullName: z.string().trim().min(2, 'Full name is required'),
          nationalId: z.string().trim().min(1, 'National ID is required'),
        }),
      )
      .optional(),
    assignments: z.array(AssignmentInputSchema).optional(),
  })
  .refine(
    (data) => {
      if (!data.assignments) return true; // If no assignments are being updated, validation passes.

      const assetShares = new Map<string, number>();
      for (const assignment of data.assignments) {
        const currentShare = assetShares.get(assignment.assetId) || 0;
        assetShares.set(
          assignment.assetId,
          currentShare + assignment.sharePercentage,
        );
      }

      for (const totalShare of assetShares.values()) {
        // Use a tolerance for floating point inaccuracies
        if (totalShare > 100.001) {
          return false; // Validation fails if any asset's total share exceeds 100%
        }
      }

      return true;
    },
    {
      message: 'The total share percentage for an asset cannot exceed 100%',
      path: ['assignments'], // Points the error to the entire assignment array
    },
  );

// ============================================================================
// API QUERY SCHEMA
// ============================================================================

export const WillQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: WillStatusSchema.optional(),
  testatorId: z.string().uuid().optional(),
  search: z.string().optional(), // Generic search on title
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type WillStatus = z.infer<typeof WillStatusSchema>;
export type Will = z.infer<typeof WillSchema>;
export type Executor = z.infer<typeof ExecutorSchema>;
export type Witness = z.infer<typeof WitnessSchema>;
export type BeneficiaryAssignment = z.infer<typeof BeneficiaryAssignmentSchema>;
export type CreateWillInput = z.infer<typeof CreateWillSchema>;
export type UpdateWillContentsFormInput = z.input<typeof UpdateWillContentsSchema>;
export type UpdateWillContentsInput = z.infer<
  typeof UpdateWillContentsSchema
>;
export type WillQuery = z.infer<typeof WillQuerySchema>;
