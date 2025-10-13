// FILE: src/types/user.schemas.ts

import { z } from 'zod';

// ============================================================================
// ENUMS & SHARED PRIMITIVES
// ============================================================================

export const UserRoleSchema = z.enum(['LAND_OWNER', 'HEIR', 'ADMIN']);

// ============================================================================
// BASE SCHEMAS (Core Object Shapes)
// ============================================================================

const BaseAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  postCode: z.string().optional(),
  country: z.string().optional(),
});

const BaseNextOfKinSchema = z.object({
  fullName: z.string(),
  relationship: z.string(),
  // Enforce E.164 format for production safety
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
});

const BaseNotificationSettingsSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
});

// ============================================================================
// API RESPONSE SCHEMAS (What we get from the backend)
// ============================================================================

export const AddressResponseSchema = BaseAddressSchema.nullable(); // backend should return null if missing
export const NextOfKinResponseSchema = BaseNextOfKinSchema.nullable();

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  bio: z.string().max(500).nullable(),
  phoneNumber: z.string().nullable(),
  address: AddressResponseSchema,
  nextOfKin: NextOfKinResponseSchema,
  notificationSettings: BaseNotificationSettingsSchema.nullable().optional(),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: UserRoleSchema.default('LAND_OWNER'), // ✅ Default role aligned with auth.schemas.ts
  createdAt: z.string().datetime().transform((val) => new Date(val)), // safer runtime handling
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
  profile: UserProfileSchema.nullable(),
});

// ============================================================================
// FORM/REQUEST SCHEMAS (What we send to the backend)
// ============================================================================

export const UpdateUserProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
  address: BaseAddressSchema.partial().optional(),
  nextOfKin: BaseNextOfKinSchema.partial().optional(),
  notificationSettings: BaseNotificationSettingsSchema.partial().optional(),
});

// ============================================================================
// QUERY SCHEMA (for filtering)
// ============================================================================

export const UserQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  role: UserRoleSchema.optional(),
  search: z.string().optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type User = z.infer<typeof UserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;
