// FILE: src/types/schemas/succession.schemas.ts

import { z } from 'zod';
import { UserSchema } from './user.schemas';

// ============================================================================
// ENUMS
// ============================================================================

export const WillStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'REVOKED', 'EXECUTED']);
export const AssetTypeSchema = z.enum([
  'LAND_PARCEL',
  'BANK_ACCOUNT',
  'VEHICLE',
  'PROPERTY',
  'OTHER',
]);
export const RelationshipTypeSchema = z.enum([
  'SPOUSE',
  'CHILD',
  'PARENT',
  'SIBLING',
  'OTHER',
]);

// ============================================================================
// WILL SCHEMAS
// ============================================================================

export const CreateWillSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  status: WillStatusSchema.optional().default('DRAFT'),
});

export const UpdateWillSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .optional(),
  status: WillStatusSchema.optional(),
});

export const WillResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: WillStatusSchema,
  testatorId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  beneficiaryAssignments: z.array(z.any()).optional(), // Will be populated with detailed schema
});

// ============================================================================
// ASSET SCHEMAS
// ============================================================================

export const CreateAssetSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(200, 'Name cannot exceed 200 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  type: AssetTypeSchema,
});

export const UpdateAssetSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(200, 'Name cannot exceed 200 characters')
    .optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  type: AssetTypeSchema.optional(),
});

export const AssetResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullish(),
  type: AssetTypeSchema,
  ownerId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// BENEFICIARY ASSIGNMENT SCHEMAS
// ============================================================================

export const AssignBeneficiarySchema = z.object({
  assetId: z.string().uuid('Valid asset ID is required'),
  beneficiaryId: z.string().uuid('Valid beneficiary ID is required'),
  sharePercent: z
    .number()
    .min(0.01, 'Share must be at least 0.01%')
    .max(100, 'Share cannot exceed 100%')
    .optional(),
});

export const UpdateBeneficiaryAssignmentSchema = z.object({
  sharePercent: z
    .number()
    .min(0.01, 'Share must be at least 0.01%')
    .max(100, 'Share cannot exceed 100%')
    .optional(),
});

export const BeneficiaryAssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  willId: z.string().uuid(),
  assetId: z.string().uuid(),
  beneficiaryId: z.string().uuid(),
  sharePercent: z.number().nullish(),
  createdAt: z.string().datetime(),
  // Nested relations (populated when included)
  asset: AssetResponseSchema.optional(),
  beneficiary: UserSchema.optional(),
});

// ============================================================================
// FAMILY SCHEMAS
// ============================================================================

export const CreateFamilySchema = z.object({
  name: z
    .string()
    .min(2, 'Family name must be at least 2 characters')
    .max(100, 'Family name cannot exceed 100 characters'),
});

export const UpdateFamilySchema = z.object({
  name: z
    .string()
    .min(2, 'Family name must be at least 2 characters')
    .max(100, 'Family name cannot exceed 100 characters')
    .optional(),
});

export const AddFamilyMemberSchema = z.object({
  userId: z.string().uuid('Valid user ID is required'),
  role: RelationshipTypeSchema,
});

export const UpdateFamilyMemberSchema = z.object({
  role: RelationshipTypeSchema,
});

export const FamilyMemberResponseSchema = z.object({
  userId: z.string().uuid(),
  familyId: z.string().uuid(),
  role: RelationshipTypeSchema,
  // Nested user data (populated when included)
  user: UserSchema.optional(),
});

export const FamilyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  creatorId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  members: z.array(FamilyMemberResponseSchema).optional(),
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const AssetQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  type: AssetTypeSchema.optional(),
  sortBy: z.enum(['createdAt', 'name', 'type']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const WillQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  status: WillStatusSchema.optional(),
  sortBy: z.enum(['createdAt', 'title', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

// Enum types
export type WillStatus = z.infer<typeof WillStatusSchema>;
export type AssetType = z.infer<typeof AssetTypeSchema>;
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;

// Request types
export type CreateWillInput = z.infer<typeof CreateWillSchema>;
export type UpdateWillInput = z.infer<typeof UpdateWillSchema>;
export type CreateAssetInput = z.infer<typeof CreateAssetSchema>;
export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>;
export type AssignBeneficiaryInput = z.infer<typeof AssignBeneficiarySchema>;
export type UpdateBeneficiaryAssignmentInput = z.infer<typeof UpdateBeneficiaryAssignmentSchema>;
export type CreateFamilyInput = z.infer<typeof CreateFamilySchema>;
export type UpdateFamilyInput = z.infer<typeof UpdateFamilySchema>;
export type AddFamilyMemberInput = z.infer<typeof AddFamilyMemberSchema>;
export type UpdateFamilyMemberInput = z.infer<typeof UpdateFamilyMemberSchema>;

// Response types
export type Will = z.infer<typeof WillResponseSchema>;
export type Asset = z.infer<typeof AssetResponseSchema>;
export type BeneficiaryAssignment = z.infer<typeof BeneficiaryAssignmentResponseSchema>;
export type FamilyMember = z.infer<typeof FamilyMemberResponseSchema>;
export type Family = z.infer<typeof FamilyResponseSchema>;

// Query types
export type AssetQuery = z.infer<typeof AssetQuerySchema>;
export type WillQuery = z.infer<typeof WillQuerySchema>;