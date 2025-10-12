// FILE: src/types/user.schemas.ts

import { z } from 'zod';

// ============================================================================
// ENUMS & SHARED PRIMITIVES
// ============================================================================

export const UserRoleSchema = z.enum(['LAND_OWNER', 'HEIR', 'ADMIN']);

// ============================================================================
// BASE SCHEMAS (Core Object Shapes)
// ============================================================================

/**
 * Defines the core, unwrapped shape of an Address object.
 * This is our single source of truth for the address fields.
 */
const BaseAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  postCode: z.string().optional(),
  country: z.string().optional(),
});

/**
 * Defines the core, unwrapped shape of a NextOfKin object.
 */
const BaseNextOfKinSchema = z.object({
  fullName: z.string(),
  relationship: z.string(),
  phoneNumber: z.string(),
});

const BaseNotificationSettingsSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
});

// ============================================================================
// API RESPONSE SCHEMAS (What we get from the backend)
// ============================================================================

/**
 * Schema for the Address object as it comes from the API.
 * The entire object can be null or undefined.
 */
export const AddressResponseSchema = BaseAddressSchema.nullable().optional();

/**
 * Schema for the NextOfKin object as it comes from the API.
 */
export const NextOfKinResponseSchema = BaseNextOfKinSchema.nullable().optional();

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
  role: UserRoleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  profile: UserProfileSchema.nullable(),
});

// ============================================================================
// FORM/REQUEST SCHEMAS (What we send to the backend)
// ============================================================================

/**
 * Schema for UPDATING a user profile.
 * All fields, including nested ones, are optional.
 */
export const UpdateUserProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  phoneNumber: z.string().optional(),

  // THIS IS THE FIX:
  // 1. Take the BaseAddressSchema (a raw z.object).
  // 2. Call .partial() on it to make ITS fields optional.
  // 3. Make the entire partial object optional for the update form.
  address: BaseAddressSchema.partial().optional(),
  nextOfKin: BaseNextOfKinSchema.partial().optional(),
  notificationSettings: BaseNotificationSettingsSchema.partial().optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type User = z.infer<typeof UserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;