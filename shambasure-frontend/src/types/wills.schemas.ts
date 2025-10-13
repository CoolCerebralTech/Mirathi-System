// FILE: src/types/schemas/wills.schemas.ts (Finalized)

import { z } from 'zod';
import { UserResponseSchema } from './user.schemas';
import { AssetResponseSchema } from './assets.schemas';

// ============================================================================
// ENUMS
// ============================================================================

export const WillStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'REVOKED', 'EXECUTED']);

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const BeneficiaryAssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  willId: z.string().uuid(),
  assetId: z.string().uuid(),
  beneficiaryId: z.string().uuid(),
  sharePercent: z.number().nullish(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  asset: AssetResponseSchema,
  beneficiary: UserResponseSchema,
});

export const WillResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: WillStatusSchema,
  testatorId: z.string().uuid(),
  beneficiaryAssignments: z.array(BeneficiaryAssignmentResponseSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// FORM/REQUEST SCHEMAS
// ============================================================================

export const CreateWillRequestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.').max(200),
});

export const UpdateWillRequestSchema = CreateWillRequestSchema.partial().extend({
  status: WillStatusSchema.optional(),
});

export const AssignBeneficiaryRequestSchema = z.object({
  assetId: z.string().uuid('An asset must be selected.'),
  beneficiaryId: z.string().uuid('A beneficiary must be selected.'),
  sharePercent: z.number().min(0.01).max(100).optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type WillStatus = z.infer<typeof WillStatusSchema>;
export type Will = z.infer<typeof WillResponseSchema>;
export type BeneficiaryAssignment = z.infer<typeof BeneficiaryAssignmentResponseSchema>;
export type CreateWillInput = z.infer<typeof CreateWillRequestSchema>;
export type UpdateWillInput = z.infer<typeof UpdateWillRequestSchema>;
export type AssignBeneficiaryInput = z.infer<typeof AssignBeneficiaryRequestSchema>;