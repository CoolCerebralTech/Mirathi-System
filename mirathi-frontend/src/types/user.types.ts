// FILE: src/types/user.types.ts
import { z } from 'zod';
import { 
  UserRoleSchema, 
  AccountStatusSchema, 
  AuthProviderSchema, 
  KenyanCountySchema, 
  LanguageSchema, 
  ThemeSchema 
} from './shared.types';

// ============================================================================
// SUB-OBJECT SCHEMAS (Outputs)
// ============================================================================

/** Matches `UserIdentityOutput` */
export const UserIdentityOutputSchema = z.object({
  id: z.string().uuid(),
  provider: AuthProviderSchema,
  email: z.string().email(),
  isPrimary: z.boolean(),
  linkedAt: z.coerce.date(),
  lastUsedAt: z.coerce.date(),
});

/** Matches `UserProfileOutput` */
export const UserProfileOutputSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  avatarUrl: z.string().url().nullable().optional(),
  phoneNumber: z.string().nullable().optional(), // E.164
  phoneVerified: z.boolean(),
  county: KenyanCountySchema.nullable().optional(),
  physicalAddress: z.string().nullable().optional(),
  postalAddress: z.string().nullable().optional(),
  updatedAt: z.coerce.date(),
});

/** Matches `UserSettingsOutput` */
export const UserSettingsOutputSchema = z.object({
  id: z.string().uuid(),
  language: LanguageSchema,
  theme: ThemeSchema,
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  marketingOptIn: z.boolean(),
  updatedAt: z.coerce.date(),
});

/** Matches `OnboardingStatusOutput` */
export const OnboardingStatusOutputSchema = z.object({
  isComplete: z.boolean(),
  needsOnboarding: z.boolean(),
  hasProfile: z.boolean(),
  hasSettings: z.boolean(),
});

// ============================================================================
// MAIN AGGREGATE SCHEMAS
// ============================================================================

/** Matches `UserOutput` */
export const UserOutputSchema = z.object({
  id: z.string().uuid(),
  role: UserRoleSchema,
  status: AccountStatusSchema,
  identities: z.array(UserIdentityOutputSchema),
  profile: UserProfileOutputSchema.nullable().optional(),
  settings: UserSettingsOutputSchema.nullable().optional(),
  
  // Timestamps
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
  
  // Computed Fields
  displayName: z.string(),
  isActive: z.boolean(),
  isSuspended: z.boolean(),
  isDeleted: z.boolean(),
  isPendingOnboarding: z.boolean(),
  hasCompletedOnboarding: z.boolean(),
  needsOnboarding: z.boolean(),
});

// ============================================================================
// INPUT SCHEMAS (Mutations)
// ============================================================================

/** Matches `UpdateProfileInput` */
export const UpdateProfileInputSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  phoneNumber: z.string().optional(), // E.164 validation can happen here if needed
  county: KenyanCountySchema.optional(),
  physicalAddress: z.string().max(500).optional(),
  postalAddress: z.string().max(100).optional(),
});

/** Matches `UpdateSettingsInput` */
export const UpdateSettingsInputSchema = z.object({
  language: LanguageSchema.optional(),
  theme: ThemeSchema.optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  marketingOptIn: z.boolean().optional(),
});

/** Matches `UpdatePhoneInput` */
export const UpdatePhoneInputSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
});

// ============================================================================
// TYPES
// ============================================================================

export type UserOutput = z.infer<typeof UserOutputSchema>;
export type UserProfileOutput = z.infer<typeof UserProfileOutputSchema>;
export type UserSettingsOutput = z.infer<typeof UserSettingsOutputSchema>;
export type OnboardingStatusOutput = z.infer<typeof OnboardingStatusOutputSchema>;

export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsInputSchema>;
export type UpdatePhoneInput = z.infer<typeof UpdatePhoneInputSchema>;