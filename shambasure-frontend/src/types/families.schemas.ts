// FILE: src/types/families.schemas.ts

import { z } from 'zod';
import { UserSchema } from './user.schemas';

// ============================================================================
// ENUMS
// ============================================================================

export const RelationshipTypeSchema = z.enum([
  'SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER'
]);

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const FamilyMemberResponseSchema = z.object({
  userId: z.string().uuid(),
  role: RelationshipTypeSchema,
  user: UserSchema,
});

export const FamilyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  creatorId: z.string().uuid(),
  members: z.array(FamilyMemberResponseSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// FORM/REQUEST SCHEMAS
// ============================================================================

export const CreateFamilyRequestSchema = z.object({
  name: z.string().min(2, 'Family name must be at least 2 characters.').max(100),
});

export const AddFamilyMemberRequestSchema = z.object({
  userId: z.string().uuid('A valid user must be selected.'),
  role: RelationshipTypeSchema,
});

export const UpdateFamilyMemberRequestSchema = z.object({
  role: RelationshipTypeSchema,
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;
export type Family = z.infer<typeof FamilyResponseSchema>;
export type FamilyMember = z.infer<typeof FamilyMemberResponseSchema>;
export type CreateFamilyInput = z.infer<typeof CreateFamilyRequestSchema>;
export type AddFamilyMemberInput = z.infer<typeof AddFamilyMemberRequestSchema>;
export type UpdateFamilyMemberInput = z.infer<typeof UpdateFamilyMemberRequestSchema>;
