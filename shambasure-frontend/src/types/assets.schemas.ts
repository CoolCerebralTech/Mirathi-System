// FILE: src/types/assets.schemas.ts

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const AssetTypeSchema = z.enum([
  'LAND_PARCEL', 'BANK_ACCOUNT', 'VEHICLE', 'PROPERTY', 'OTHER'
]);

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

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
// FORM/REQUEST SCHEMAS
// ============================================================================

export const CreateAssetRequestSchema = z.object({
  name: z.string().min(3, 'Asset name must be at least 3 characters.').max(200),
  description: z.string().max(1000).optional(),
  type: AssetTypeSchema,
});

export const UpdateAssetRequestSchema = CreateAssetRequestSchema.partial();

// ============================================================================
// QUERY SCHEMA
// ============================================================================

// UPGRADE: Added the missing schema for query parameters.
export const AssetQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  type: AssetTypeSchema.optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type AssetType = z.infer<typeof AssetTypeSchema>;
export type Asset = z.infer<typeof AssetResponseSchema>;
export type CreateAssetInput = z.infer<typeof CreateAssetRequestSchema>;
export type UpdateAssetInput = z.infer<typeof UpdateAssetRequestSchema>;
export type AssetQuery = z.infer<typeof AssetQuerySchema>;
