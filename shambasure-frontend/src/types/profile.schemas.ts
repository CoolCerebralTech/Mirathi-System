// ============================================================================
// profile.schemas.ts - User Profile Validation Schemas
// ============================================================================
// Updated to match backend profile.dto with comprehensive profile management
// ============================================================================

import { z } from 'zod';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

/**
 * Relationship types for next of kin
 */
export const RelationshipTypeSchema = z.enum([
  'SPOUSE',
  'CHILD', 
  'PARENT',
  'SIBLING',
  'OTHER'
]);

/**
 * Phone verification methods
 */
export const VerificationMethodSchema = z.enum(['sms', 'voice']);

/**
 * Marketing categories
 */
export const MarketingCategorySchema = z.enum([
  'newsletter',
  'promotions', 
  'product_updates',
  'educational',
  'events'
]);

/**
 * Communication channels
 */
export const CommunicationChannelSchema = z.enum(['email', 'sms', 'push']);

/**
 * Phone number types
 */
export const PhoneNumberTypeSchema = z.enum(['mobile', 'landline', 'voip', 'unknown']);

// ============================================================================
// NESTED SCHEMAS (For Complex Objects)
// ============================================================================

/**
 * Address structure with validation matching AddressDto
 */
export const AddressSchema = z.object({
  street: z
    .string()
    .max(255, 'Street address cannot exceed 255 characters')
    .optional(),
  city: z
    .string()
    .max(100, 'City cannot exceed 100 characters')
    .optional(),
  county: z
    .string()
    .max(100, 'County cannot exceed 100 characters')
    .optional(),
  postalCode: z
    .string()
    .max(20, 'Postal code cannot exceed 20 characters')
    .regex(/^\d{5}(-\d{4})?$/, 'Please provide a valid postal code')
    .optional(),
  country: z
    .string()
    .min(1, 'Country is required')
    .max(100, 'Country cannot exceed 100 characters')
    .default('Kenya'),
});

/**
 * Next of kin structure with validation matching NextOfKinDto
 */
export const NextOfKinSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  relationship: RelationshipTypeSchema,
  phoneNumber: z
    .string()
    .regex(/^\+254[17]\d{8}$/, 'Please provide a valid Kenyan phone number (+254XXXXXXXXX)'),
  email: z
    .string()
    .email('Please provide a valid email address')
    .optional(),
  address: AddressSchema.optional(),
  contactNotes: z
    .string()
    .max(200, 'Contact notes cannot exceed 200 characters')
    .optional(),
});

// ============================================================================
// REQUEST SCHEMAS (Input Validation)
// ============================================================================

/**
 * Update profile request schema
 */
export const UpdateMyProfileRequestSchema = z.object({
  bio: z
    .string()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional(),
  phoneNumber: z
    .string()
    .regex(/^\+254[17]\d{8}$/, 'Please provide a valid Kenyan phone number (+254XXXXXXXXX)'),
  address: AddressSchema.nullable().optional(),
  nextOfKin: NextOfKinSchema.nullable().optional(),
});

/**
 * Send phone verification request schema
 */
export const SendPhoneVerificationRequestSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+254[17]\d{8}$/, 'Please provide a valid Kenyan phone number (+254XXXXXXXXX)'),
  method: VerificationMethodSchema.default('sms').optional(),
});

/**
 * Verify phone request schema
 */
export const VerifyPhoneRequestSchema = z.object({
  code: z
    .string()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only numbers'),
  phoneNumber: z
    .string()
    .regex(/^\+254[17]\d{8}$/, 'Please provide a valid Kenyan phone number (+254XXXXXXXXX)'),
});

/**
 * Resend phone verification request schema
 */
export const ResendPhoneVerificationRequestSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+254[17]\d{8}$/, 'Please provide a valid Kenyan phone number (+254XXXXXXXXX)'),
  method: VerificationMethodSchema.default('sms').optional(),
});

/**
 * Update marketing preferences request schema
 */
export const UpdateMarketingPreferencesRequestSchema = z.object({
  marketingOptIn: z.boolean(),
  marketingCategories: z.array(MarketingCategorySchema).optional(),
  communicationChannels: z.array(CommunicationChannelSchema).default(['email']).optional(),
});

/**
 * Remove phone number request schema
 */
export const RemovePhoneNumberRequestSchema = z.object({
  reason: z
    .string()
    .max(200, 'Reason cannot exceed 200 characters')
    .optional(),
});

/**
 * Remove address request schema
 */
export const RemoveAddressRequestSchema = z.object({
  reason: z
    .string()
    .max(200, 'Reason cannot exceed 200 characters')
    .optional(),
});

/**
 * Remove next of kin request schema
 */
export const RemoveNextOfKinRequestSchema = z.object({
  reason: z
    .string()
    .max(200, 'Reason cannot exceed 200 characters')
    .optional(),
});

/**
 * Validate phone number request schema
 */
export const ValidatePhoneNumberRequestSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+254[17]\d{8}$/, 'Please provide a valid Kenyan phone number (+254XXXXXXXXX)'),
});

// ============================================================================
// RESPONSE SCHEMAS (API Output)
// ============================================================================

/**
 * User profile response schema
 */
export const UserProfileResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  bio: z.string().optional(),
  phoneNumber: z.string().optional(),
  phoneVerified: z.boolean(),
  emailVerified: z.boolean(),
  marketingOptIn: z.boolean(),
  marketingCategories: z.array(MarketingCategorySchema).optional(),
  communicationChannels: z.array(CommunicationChannelSchema).optional(),
  address: AddressSchema.optional(),
  nextOfKin: NextOfKinSchema.optional(),
  preferredLanguage: z.string().default('en'),
  timezone: z.string().default('Africa/Nairobi'),
  isComplete: z.boolean(),
  completionPercentage: z.number().min(0).max(100),
  missingFields: z.array(z.string()),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
  phoneVerifiedAt: z.string().datetime().transform((val) => new Date(val)).optional(),
  emailVerifiedAt: z.string().datetime().transform((val) => new Date(val)).optional(),
});

/**
 * Extended profile response for "me" endpoint
 */
export const GetMyProfileResponseSchema = UserProfileResponseSchema.extend({
  securityRecommendations: z.array(z.string()).optional(),
  nextSteps: z.array(z.string()).optional(),
});

/**
 * Update profile response schema
 */
export const UpdateMyProfileResponseSchema = z.object({
  message: z.string(),
  profile: UserProfileResponseSchema,
  updatedFields: z.array(z.string()).optional(),
  completionChanged: z.boolean().optional(),
  previousCompletion: z.number().optional(),
});

/**
 * Send phone verification response schema
 */
export const SendPhoneVerificationResponseSchema = z.object({
  message: z.string(),
  phoneNumber: z.string(), // masked
  provider: z.enum(['Safaricom', 'Airtel', 'Telkom', 'Unknown']),
  method: VerificationMethodSchema,
  nextRetryAt: z.string().datetime().transform((val) => new Date(val)),
  retryAfterSeconds: z.number().positive(),
  expiresInMinutes: z.number().positive(),
  attemptsRemaining: z.number().positive(),
  attemptsMade: z.number().positive(),
});

/**
 * Verify phone response schema
 */
export const VerifyPhoneResponseSchema = z.object({
  message: z.string(),
  phoneNumber: z.string(), // masked
  provider: z.enum(['Safaricom', 'Airtel', 'Telkom', 'Unknown']),
  verifiedAt: z.string().datetime().transform((val) => new Date(val)),
  profile: UserProfileResponseSchema.optional(),
});

/**
 * Resend phone verification response schema
 */
export const ResendPhoneVerificationResponseSchema = z.object({
  message: z.string(),
  phoneNumber: z.string(), // masked
  method: VerificationMethodSchema,
  nextRetryAt: z.string().datetime().transform((val) => new Date(val)),
  retryAfterSeconds: z.number().positive(),
  resendAttempts: z.number().positive(),
});

/**
 * Update marketing preferences response schema
 */
export const UpdateMarketingPreferencesResponseSchema = z.object({
  message: z.string(),
  marketingOptIn: z.boolean(),
  marketingCategories: z.array(MarketingCategorySchema).optional(),
  communicationChannels: z.array(CommunicationChannelSchema).optional(),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
});

/**
 * Remove phone number response schema
 */
export const RemovePhoneNumberResponseSchema = z.object({
  message: z.string(),
  previousPhoneNumber: z.string(), // masked
  verificationReset: z.boolean(),
  reason: z.string().optional(),
});

/**
 * Remove address response schema
 */
export const RemoveAddressResponseSchema = z.object({
  message: z.string(),
  reason: z.string().optional(),
  newCompletionPercentage: z.number().min(0).max(100),
});

/**
 * Remove next of kin response schema
 */
export const RemoveNextOfKinResponseSchema = z.object({
  message: z.string(),
  reason: z.string().optional(),
  newCompletionPercentage: z.number().min(0).max(100),
});

/**
 * Validate phone number response schema
 */
export const ValidatePhoneNumberResponseSchema = z.object({
  valid: z.boolean(),
  normalizedNumber: z.string(),
  provider: z.enum(['Safaricom', 'Airtel', 'Telkom', 'Unknown']),
  type: PhoneNumberTypeSchema,
  countryCode: z.string().optional(),
  error: z.string().optional(),
});

/**
 * Profile completion response schema
 */
export const ProfileCompletionResponseSchema = z.object({
  completionPercentage: z.number().min(0).max(100),
  missingFields: z.array(z.string()),
  recommendations: z.array(z.string()),
  meetsMinimumRequirements: z.boolean(),
  benefits: z.array(z.string()).optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;
export type VerificationMethod = z.infer<typeof VerificationMethodSchema>;
export type MarketingCategory = z.infer<typeof MarketingCategorySchema>;
export type CommunicationChannel = z.infer<typeof CommunicationChannelSchema>;
export type PhoneNumberType = z.infer<typeof PhoneNumberTypeSchema>;

export type Address = z.infer<typeof AddressSchema>;
export type NextOfKin = z.infer<typeof NextOfKinSchema>;

export type UpdateMyProfileInput = z.infer<typeof UpdateMyProfileRequestSchema>;
export type SendPhoneVerificationInput = z.infer<typeof SendPhoneVerificationRequestSchema>;
export type VerifyPhoneInput = z.infer<typeof VerifyPhoneRequestSchema>;
export type ResendPhoneVerificationInput = z.infer<typeof ResendPhoneVerificationRequestSchema>;
export type UpdateMarketingPreferencesInput = z.infer<typeof UpdateMarketingPreferencesRequestSchema>;
export type RemovePhoneNumberInput = z.infer<typeof RemovePhoneNumberRequestSchema>;
export type RemoveAddressInput = z.infer<typeof RemoveAddressRequestSchema>;
export type RemoveNextOfKinInput = z.infer<typeof RemoveNextOfKinRequestSchema>;
export type ValidatePhoneNumberInput = z.infer<typeof ValidatePhoneNumberRequestSchema>;

export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
export type GetMyProfileResponse = z.infer<typeof GetMyProfileResponseSchema>;
export type UpdateMyProfileResponse = z.infer<typeof UpdateMyProfileResponseSchema>;
export type SendPhoneVerificationResponse = z.infer<typeof SendPhoneVerificationResponseSchema>;
export type VerifyPhoneResponse = z.infer<typeof VerifyPhoneResponseSchema>;
export type ResendPhoneVerificationResponse = z.infer<typeof ResendPhoneVerificationResponseSchema>;
export type UpdateMarketingPreferencesResponse = z.infer<typeof UpdateMarketingPreferencesResponseSchema>;
export type RemovePhoneNumberResponse = z.infer<typeof RemovePhoneNumberResponseSchema>;
export type RemoveAddressResponse = z.infer<typeof RemoveAddressResponseSchema>;
export type RemoveNextOfKinResponse = z.infer<typeof RemoveNextOfKinResponseSchema>;
export type ValidatePhoneNumberResponse = z.infer<typeof ValidatePhoneNumberResponseSchema>;
export type ProfileCompletionResponse = z.infer<typeof ProfileCompletionResponseSchema>;

// ============================================================================
// UTILITY FUNCTIONS AND CONSTANTS
// ============================================================================

/**
 * Human-readable labels for relationship types
 */
export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  SPOUSE: 'Spouse',
  CHILD: 'Child',
  PARENT: 'Parent',
  SIBLING: 'Sibling',
  OTHER: 'Other',
} as const;

/**
 * Human-readable labels for marketing categories
 */
export const MARKETING_CATEGORY_LABELS: Record<MarketingCategory, string> = {
  newsletter: 'Newsletter',
  promotions: 'Promotions',
  product_updates: 'Product Updates',
  educational: 'Educational Content',
  events: 'Events',
} as const;

/**
 * Human-readable labels for communication channels
 */
export const COMMUNICATION_CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  email: 'Email',
  sms: 'SMS',
  push: 'Push Notifications',
} as const;

/**
 * Mask phone number for display (e.g., +254****5678)
 */
export const maskPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  return phoneNumber.replace(/(\+\d{3})(\d{3})(\d{3})/, '$1***$3');
};

/**
 * Calculate profile completion percentage based on required fields
 */
export const calculateProfileCompletion = (profile: Partial<UserProfileResponse>): {
  completionPercentage: number;
  missingFields: string[];
  isComplete: boolean;
} => {
  const requiredFields = [
    'phoneNumber',
    'phoneVerified', 
    'address',
    'nextOfKin'
  ] as const;

  const optionalFields = [
    'bio'
  ] as const;

  let completedCount = 0;
  const missingFields: string[] = [];

  // Check required fields
  requiredFields.forEach(field => {
    if (field === 'phoneVerified') {
      if (profile.phoneVerified) {
        completedCount++;
      } else {
        missingFields.push('phoneVerified');
      }
    } else if (field === 'address') {
      if (profile.address && Object.keys(profile.address).length > 0) {
        completedCount++;
      } else {
        missingFields.push('address');
      }
    } else if (field === 'nextOfKin') {
      if (profile.nextOfKin && profile.nextOfKin.fullName) {
        completedCount++;
      } else {
        missingFields.push('nextOfKin');
      }
    } else if (profile[field as keyof UserProfileResponse]) {
      completedCount++;
    } else {
      missingFields.push(field);
    }
  });

  // Check optional fields (weighted less)
  optionalFields.forEach(field => {
    if (profile[field as keyof UserProfileResponse]) {
      completedCount += 0.5; // Half weight for optional fields
    }
  });

  const totalWeight = requiredFields.length + (optionalFields.length * 0.5);
  const completionPercentage = Math.round((completedCount / totalWeight) * 100);
  const isComplete = missingFields.length === 0;

  return {
    completionPercentage,
    missingFields,
    isComplete
  };
};

/**
 * Get security recommendations based on profile completeness
 */
export const getSecurityRecommendations = (profile: UserProfileResponse): string[] => {
  const recommendations: string[] = [];

  if (!profile.phoneVerified) {
    recommendations.push('Verify your phone number for account recovery');
  }

  if (!profile.nextOfKin) {
    recommendations.push('Add next of kin information for emergency contacts');
  }

  if (!profile.address) {
    recommendations.push('Complete your address for better service delivery');
  }

  return recommendations;
};

/**
 * Get next steps for profile improvement
 */
export const getNextSteps = (profile: UserProfileResponse): string[] => {
  const steps: string[] = [];

  if (!profile.phoneNumber) {
    steps.push('Add your phone number');
  } else if (!profile.phoneVerified) {
    steps.push('Verify your phone number');
  }

  if (!profile.address) {
    steps.push('Add your residential address');
  }

  if (!profile.nextOfKin) {
    steps.push('Add next of kin information');
  }

  if (!profile.bio) {
    steps.push('Add a bio to personalize your profile');
  }

  return steps;
};

/**
 * Validate Kenyan phone number format
 */
export const isValidKenyanPhoneNumber = (phoneNumber: string): boolean => {
  const kenyanPhoneRegex = /^\+254[17]\d{8}$/;
  return kenyanPhoneRegex.test(phoneNumber);
};

/**
 * Get phone number provider based on prefix
 */
export const getPhoneProvider = (phoneNumber: string): string => {
  if (!phoneNumber) return 'Unknown';
  
  const safaricomPrefixes = ['+2547', '+25411', '+25410'];
  const airtelPrefixes = ['+2541', '+25401'];
  const telkomPrefixes = ['+25477'];
  
  if (safaricomPrefixes.some(prefix => phoneNumber.startsWith(prefix))) {
    return 'Safaricom';
  } else if (airtelPrefixes.some(prefix => phoneNumber.startsWith(prefix))) {
    return 'Airtel';
  } else if (telkomPrefixes.some(prefix => phoneNumber.startsWith(prefix))) {
    return 'Telkom';
  }
  
  return 'Unknown';
};

/**
 * Check if profile meets minimum requirements for full platform access
 */
export const meetsMinimumProfileRequirements = (profile: UserProfileResponse): boolean => {
  const { completionPercentage, missingFields } = calculateProfileCompletion(profile);
  
  // Minimum: phone number and address
  const criticalFields = ['phoneNumber', 'address'];
  const hasCriticalFields = !criticalFields.some(field => missingFields.includes(field));
  
  return completionPercentage >= 60 && hasCriticalFields;
};