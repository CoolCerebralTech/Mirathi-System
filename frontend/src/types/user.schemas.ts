// FILE: src/types/schemas/user.schemas.ts

import { z } from 'zod';
import { UserRoleSchema } from './auth.schemas';

// ============================================================================
// NESTED SCHEMAS
// ============================================================================

/**
 * Schema for user address
 */
export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  postCode: z.string().optional(),
  country: z.string().optional(),
}).optional();

/**
 * Schema for next of kin information
 */
export const NextOfKinSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
}).optional();

/**
 * Schema for user profile
 */
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  bio: z.string().max(500).nullish(),
  phoneNumber: z.string().nullish(),
  address: z.any().nullish(), // JSON field
  nextOfKin: z.any().nullish(), // JSON field
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

/**
 * Schema for complete user object from API
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: UserRoleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  profile: UserProfileSchema.nullish(),
});

/**
 * Schema for updating user profile
 */
export const UpdateUserProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  phoneNumber: z.string().optional(),
  address: AddressSchema,
  nextOfKin: NextOfKinSchema,
});

/**
 * Schema for admin user queries with pagination
 */
export const UserQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  role: UserRoleSchema.optional(),
  search: z.string().optional(), // Search by name or email
  sortBy: z.enum(['createdAt', 'email', 'firstName', 'lastName']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type Address = z.infer<typeof AddressSchema>;
export type NextOfKin = z.infer<typeof NextOfKinSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type User = z.infer<typeof UserSchema>;
export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;