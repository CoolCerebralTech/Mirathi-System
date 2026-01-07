// ============================================================================
// - User Profile Validation Schemas
// ============================================================================

import { z } from 'zod';
import { AddressSchema } from './shared.types';

// ============================================================================
// REQUEST SCHEMAS (Input Validation)
// ============================================================================

/**
 * Update profile request schema
 */
export const UpdateMyProfileRequestSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+254[17]\d{8}$/, 'Please provide a valid Kenyan phone number (+254XXXXXXXXX)')
    .optional()
    .nullable(),
  address: AddressSchema.nullable().optional(),
});

/**
 * Update marketing preferences request schema
 */
export const UpdateMarketingPreferencesRequestSchema = z.object({
  marketingOptIn: z.boolean(),
});

// ============================================================================
// RESPONSE SCHEMAS (API Output)
// ============================================================================

/**
 * User profile response schema - MUST MATCH backend UserProfileResponseDto
 */
export const UserProfileResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  phoneNumber: z.string().optional(),
  // REMOVED: emailVerified: z.boolean(),
  marketingOptIn: z.boolean(),
  address: AddressSchema.optional(),
  isComplete: z.boolean(),
  completionPercentage: z.number().min(0).max(100),
  missingFields: z.array(z.string()),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
  // REMOVED: emailVerifiedAt: z.string().datetime().transform((val) => new Date(val)).optional().nullable(),
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
 * Update marketing preferences response schema
 */
export const UpdateMarketingPreferencesResponseSchema = z.object({
  message: z.string(),
  marketingOptIn: z.boolean(),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
});

/**
 * Remove address response schema
 */
export const RemoveAddressResponseSchema = z.object({
  message: z.string(),
  reason: z.string().optional(),
  newCompletionPercentage: z.number().positive(),
});

/**
 * Profile completion response schema
 */
export const ProfileCompletionResponseSchema = z.object({
  completionPercentage: z.number().positive(),
  missingFields: z.array(z.string()),
  recommendations: z.array(z.string()),
  meetsMinimumRequirements: z.boolean(),
  benefits: z.array(z.string()).optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type UpdateMyProfileInput = z.infer<typeof UpdateMyProfileRequestSchema>;
export type UpdateMarketingPreferencesInput = z.infer<typeof UpdateMarketingPreferencesRequestSchema>;

export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
export type GetMyProfileResponse = z.infer<typeof GetMyProfileResponseSchema>;
export type UpdateMyProfileResponse = z.infer<typeof UpdateMyProfileResponseSchema>;
export type UpdateMarketingPreferencesResponse = z.infer<typeof UpdateMarketingPreferencesResponseSchema>;
export type RemoveAddressResponse = z.infer<typeof RemoveAddressResponseSchema>;
export type ProfileCompletionResponse = z.infer<typeof ProfileCompletionResponseSchema>;

// ============================================================================
// UTILITY FUNCTIONS AND CONSTANTS
// ============================================================================

/**
 * Mask phone number for display (e.g., +254****5678)
 */
export const maskPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  if (phoneNumber.length < 8) return phoneNumber;
  return phoneNumber.replace(/(\+\d{3})(\d+)(\d{4})/, '$1****$3');
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
    'address'
  ] as const;

  let completedCount = 0;
  const missingFields: string[] = [];

  // Check required fields
  requiredFields.forEach(field => {
    if (field === 'address') {
      if (profile.address && Object.keys(profile.address).length > 1) { // More than just 'country'
        completedCount++;
      } else {
        missingFields.push('address');
      }
    } else if (profile[field as keyof UserProfileResponse]) {
      completedCount++;
    } else {
      missingFields.push(field);
    }
  });

  const totalWeight = requiredFields.length;
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

  if (!profile.phoneNumber) {
    recommendations.push('Add your phone number for account recovery');
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
  }

  if (!profile.address) {
    steps.push('Add your residential address');
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