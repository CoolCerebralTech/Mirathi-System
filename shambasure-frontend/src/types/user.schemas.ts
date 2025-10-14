// FILE: src/types/user.schemas.ts

import { z } from 'zod';

// ============================================================================
// SHARED ENUMS AND REUSABLE SCHEMAS
// ============================================================================

/**
 * Defines the possible roles a user can have within the system.
 */
export const UserRoleSchema = z.enum(['LAND_OWNER', 'HEIR', 'ADMIN']);

/**
 * E.164 phone number format validation for consistency across the application.
 * Ensures phone numbers are stored in a standardized international format.
 */
const E164PhoneNumberSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    'Phone number must be in E.164 format (e.g., +254712345678)',
  );

/**
 * Base schema for a user's physical address.
 * All fields are optional, allowing for partial address information.
 */
export const AddressSchema = z.object({
  street: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  postCode: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
});

/**
 * Base schema for defining a user's next of kin.
 */
export const NextOfKinSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  relationship: z.string().trim().min(2, 'Relationship is required'),
  phoneNumber: E164PhoneNumberSchema,
});

/**
 * Defines the structure for user notification preferences.
 */
export const NotificationSettingsSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
});

// ============================================================================
// API RESPONSE SCHEMAS (Data shapes received from the server)
// ============================================================================

/**
 * Represents the user profile data as returned by the API.
 * Handles cases where nested objects might be null.
 */
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  bio: z.string().max(500).nullable(),
  phoneNumber: E164PhoneNumberSchema.nullable(),
  address: AddressSchema.nullable(),
  nextOfKin: NextOfKinSchema.nullable(),
  // Provide a default object to prevent frontend checks for null/undefined
  notificationSettings: NotificationSettingsSchema.default({
    email: true,
    sms: false,
  }),
});

/**
 * Represents the core user object as returned by the API.
 * Transforms date strings into Date objects for easier manipulation on the client.
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: UserRoleSchema,
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
  profile: UserProfileSchema.nullable(),
});

// ============================================================================
// FORM/REQUEST SCHEMAS (Data shapes sent to the server)
// ============================================================================

/**
 * Schema for creating a new user (e.g., during registration).
 */
export const CreateUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  role: UserRoleSchema.default('LAND_OWNER'),
});

/**
 * Schema for updating a user's core information.
 */
export const UpdateUserSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').optional(),
  lastName: z.string().trim().min(1, 'Last name is required').optional(),
});

/**
 * Schema for updating a user's profile information.
 * Uses .nullable() to allow fields to be explicitly cleared.
 */
export const UpdateUserProfileSchema = z.object({
  bio: z.string().max(500).nullable().optional(),
  phoneNumber: E164PhoneNumberSchema.nullable().optional(),
  address: AddressSchema.nullable().optional(),
  nextOfKin: NextOfKinSchema.nullable().optional(),
  notificationSettings: NotificationSettingsSchema.partial().optional(),
});

// ============================================================================
// API QUERY SCHEMAS (For filtering, sorting, and pagination)
// ============================================================================

/**
 * Schema for querying a list of users.
 * Supports pagination, role filtering, and text search.
 */
export const UserQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  role: UserRoleSchema.optional(),
  search: z.string().optional(),
});

// ============================================================================
// INFERRED TYPES (Automatically generated from Zod schemas)
// ============================================================================

export type User = z.infer<typeof UserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type NextOfKin = z.infer<typeof NextOfKinSchema>;
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;