import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { RelationshipType } from '@shamba/common';

import { Address, NextOfKin, UserProfile } from '../../domain/models';
import { PhoneNumber } from '../../domain/value-objects';
import { UserProfileEntity } from '../../infrastructure/persistence/entities/account.entity';
import {
  AddressDto,
  GetMyProfileResponseDto,
  NextOfKinDto,
  ProfileCompletionResponseDto,
  RemoveAddressResponseDto,
  RemoveNextOfKinResponseDto,
  RemovePhoneNumberResponseDto,
  ResendPhoneVerificationResponseDto,
  SendPhoneVerificationResponseDto,
  UpdateMarketingPreferencesResponseDto,
  UpdateMyProfileResponseDto,
  UserProfileResponseDto,
  VerifyPhoneResponseDto,
} from '../dtos';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Defines the shape of data required for creating or updating a UserProfile in the database.
 * Uses Prisma-generated types for full type safety.
 */
export interface UserProfilePersistenceData {
  create: Prisma.UserProfileCreateInput;
  update: Prisma.UserProfileUpdateInput;
}
/**
 * Validates if a string is a valid member of the RelationshipType enum.
 * @param value The string to validate.
 * @returns The value cast as RelationshipType, or null if invalid.
 */
function toRelationshipType(value: unknown): RelationshipType | null {
  if (typeof value === 'string' && (Object.values(RelationshipType) as string[]).includes(value)) {
    return value as RelationshipType;
  }
  return null;
}

// ============================================================================
// STANDALONE PARSING HELPERS (FOR ROBUSTNESS)
// ============================================================================

function parseAddressFromPrisma(json: Prisma.JsonValue | null): Address | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;
  if (typeof obj.country !== 'string' || !obj.country.trim()) {
    Logger.warn('Malformed Address JSON in DB: missing or invalid country', { json });
    return null;
  }
  return {
    country: obj.country,
    street: typeof obj.street === 'string' ? obj.street : undefined,
    city: typeof obj.city === 'string' ? obj.city : undefined,
    county: typeof obj.county === 'string' ? obj.county : undefined,
    postalCode: typeof obj.postalCode === 'string' ? obj.postalCode : undefined,
  };
}
function parseNextOfKinFromPrisma(json: Prisma.JsonValue | null): NextOfKin | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;
  const relationship = toRelationshipType(obj.relationship);
  if (typeof obj.fullName !== 'string' || !relationship || typeof obj.phoneNumber !== 'string') {
    Logger.warn('Malformed NextOfKin JSON in DB: missing or invalid required fields', { json });
    return null;
  }
  return {
    fullName: obj.fullName,
    relationship: relationship,
    phoneNumber: obj.phoneNumber,
    email: typeof obj.email === 'string' ? obj.email : undefined,
    address: parseAddressFromPrisma(obj.address as Prisma.JsonValue) ?? undefined,
  };
}

/**
 * @Injectable
 * @class ProfileMapper
 * @description Maps between the UserProfile domain model, the persistence layer, and DTOs.
 */
@Injectable()
export class ProfileMapper {
  // ============================================================================
  // DOMAIN ↔ PERSISTENCE MAPPING
  // ============================================================================

  /**
   * Converts a UserProfile domain model to Prisma create/update inputs.
   * @param profile The UserProfile domain object.
   * @returns An object containing `create` and `update` data for Prisma.
   */
  toPersistence(profile: UserProfile): UserProfilePersistenceData {
    const primitives = profile.toPrimitives();

    const updateData: Prisma.UserProfileUpdateInput = {
      bio: primitives.bio,
      phoneNumber: primitives.phoneNumber,
      phoneVerified: primitives.phoneVerified,
      emailVerified: primitives.emailVerified,
      marketingOptIn: primitives.marketingOptIn,
      address: (primitives.address as Prisma.JsonValue) ?? Prisma.DbNull,
      nextOfKin: (primitives.nextOfKin as Prisma.JsonValue) ?? Prisma.DbNull,
      updatedAt: primitives.updatedAt,
    };

    const createData: Prisma.UserProfileCreateInput = {
      id: primitives.id,
      user: { connect: { id: primitives.userId } },
      bio: primitives.bio,
      phoneNumber: primitives.phoneNumber,
      phoneVerified: primitives.phoneVerified,
      emailVerified: primitives.emailVerified,
      marketingOptIn: primitives.marketingOptIn,
      address: (primitives.address as Prisma.JsonValue) ?? Prisma.DbNull,
      nextOfKin: (primitives.nextOfKin as Prisma.JsonValue) ?? Prisma.DbNull,
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt,
    };

    return {
      create: createData,
      update: updateData,
    };
  }

  /**
   * Converts a Prisma UserProfileEntity to a UserProfile domain model.
   * @param entity The UserProfileEntity from Prisma.
   * @returns A UserProfile domain object instance.
   */
  toDomain(entity: UserProfileEntity): UserProfile {
    return UserProfile.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      bio: entity.bio,
      phoneNumber: entity.phoneNumber ? PhoneNumber.create(entity.phoneNumber) : null,
      phoneVerified: entity.phoneVerified,
      emailVerified: entity.emailVerified,
      marketingOptIn: entity.marketingOptIn,
      address: parseAddressFromPrisma(entity.address),
      nextOfKin: parseNextOfKinFromPrisma(entity.nextOfKin),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  // ============================================================================
  // DOMAIN ↔ DTO MAPPING
  // ============================================================================

  /**
   * Maps a UserProfile domain object to its main response DTO.
   * @param profile The UserProfile domain object.
   * @returns A UserProfileResponseDto.
   */
  toUserProfileResponse(profile: UserProfile): UserProfileResponseDto {
    const getMissingFields = (): string[] => {
      const missing: string[] = [];
      if (!profile.bio) missing.push('bio');
      if (!profile.phoneNumber) missing.push('phoneNumber');
      if (!profile.isPhoneVerified) missing.push('phoneVerified');
      if (!profile.address) missing.push('address');
      if (!profile.nextOfKin) missing.push('nextOfKin');
      return missing;
    };

    return {
      id: profile.id,
      userId: profile.userId,
      bio: profile.bio ?? undefined,
      phoneNumber: profile.phoneNumber?.getValue() ?? undefined,
      phoneVerified: profile.isPhoneVerified,
      emailVerified: profile.isEmailVerified,
      marketingOptIn: profile.marketingOptIn,
      address: profile.address ? this.toAddressDto(profile.address) : undefined,
      nextOfKin: profile.nextOfKin ? this.toNextOfKinDto(profile.nextOfKin) : undefined,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      isComplete: profile.isComplete,
      completionPercentage: profile.completionPercentage,
      missingFields: getMissingFields(),
    };
  }

  /**
   * Maps a UserProfile to the DTO for a self-service profile update.
   * @param profile The updated UserProfile domain object.
   * @param context Additional data from the service layer.
   * @returns An UpdateMyProfileResponseDto.
   */
  toUpdateMyProfileResponse(
    profile: UserProfile,
    context: {
      updatedFields: string[];
      completionChanged: boolean;
      previousCompletion: number;
    },
  ): UpdateMyProfileResponseDto {
    return {
      message: 'Profile updated successfully.',
      profile: this.toUserProfileResponse(profile),
      updatedFields: context.updatedFields,
      completionChanged: context.completionChanged,
      previousCompletion: context.previousCompletion,
    };
  }

  /**
   * Maps a UserProfile to the DTO for the "Get My Profile" endpoint.
   * @param profile The UserProfile domain object.
   * @param context Additional data (e.g., recommendations) from the service layer.
   * @returns A GetMyProfileResponseDto.
   */
  toGetMyProfileResponse(
    profile: UserProfile,
    context: {
      securityRecommendations: string[];
      nextSteps: string[];
    },
  ): GetMyProfileResponseDto {
    return {
      ...this.toUserProfileResponse(profile),
      securityRecommendations: context.securityRecommendations,
      nextSteps: context.nextSteps,
    };
  }

  /**
   * Maps phone verification initiation data to its response DTO.
   * @param context Contextual data from the verification service.
   * @returns A SendPhoneVerificationResponseDto.
   */
  toSendPhoneVerificationResponse(context: {
    phoneNumber: string;
    provider: string;
    method: string;
    nextRetryAt: Date;
    retryAfterSeconds: number;
    expiresInMinutes: number;
    attemptsRemaining: number;
    attemptsMade: number;
  }): SendPhoneVerificationResponseDto {
    return {
      message: 'Verification code sent to your phone.',
      phoneNumber: this.maskPhoneNumber(context.phoneNumber),
      provider: context.provider,
      method: context.method,
      nextRetryAt: context.nextRetryAt,
      retryAfterSeconds: context.retryAfterSeconds,
      expiresInMinutes: context.expiresInMinutes,
      attemptsRemaining: context.attemptsRemaining,
      attemptsMade: context.attemptsMade,
    };
  }

  /**
   * Maps successful phone verification data to its response DTO.
   * @param context Contextual data from the verification service.
   * @returns A VerifyPhoneResponseDto.
   */
  toVerifyPhoneResponse(context: {
    phoneNumber: string;
    provider: string;
    verifiedAt: Date;
    updatedProfile: UserProfile;
  }): VerifyPhoneResponseDto {
    return {
      message: 'Phone number verified successfully.',
      phoneNumber: this.maskPhoneNumber(context.phoneNumber),
      provider: context.provider,
      verifiedAt: context.verifiedAt,
      profile: this.toUserProfileResponse(context.updatedProfile),
    };
  }

  /**
   * Maps phone verification resend data to its response DTO.
   * @param context Contextual data from the verification service.
   * @returns A ResendPhoneVerificationResponseDto.
   */
  toResendPhoneVerificationResponse(context: {
    phoneNumber: string;
    method: string;
    nextRetryAt: Date;
    retryAfterSeconds: number;
    resendAttempts: number;
  }): ResendPhoneVerificationResponseDto {
    return {
      message: 'Verification code resent to your phone.',
      phoneNumber: this.maskPhoneNumber(context.phoneNumber),
      method: context.method,
      nextRetryAt: context.nextRetryAt,
      retryAfterSeconds: context.retryAfterSeconds,
      resendAttempts: context.resendAttempts,
    };
  }

  /**
   * Maps an updated profile to the marketing preferences response DTO.
   * @param profile The updated UserProfile.
   * @returns An UpdateMarketingPreferencesResponseDto.
   */
  toUpdateMarketingPreferencesResponse(
    profile: UserProfile,
  ): UpdateMarketingPreferencesResponseDto {
    return {
      message: 'Marketing preferences updated successfully.',
      marketingOptIn: profile.marketingOptIn,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * Maps data to the response for removing a phone number.
   * @param context Contextual data from the service.
   * @returns A RemovePhoneNumberResponseDto.
   */
  toRemovePhoneNumberResponse(context: {
    previousPhoneNumber: string;
    reason?: string;
  }): RemovePhoneNumberResponseDto {
    return {
      message: 'Phone number removed successfully.',
      previousPhoneNumber: this.maskPhoneNumber(context.previousPhoneNumber),
      verificationReset: true,
      reason: context.reason,
    };
  }

  /**
   * Maps data to the response for removing an address.
   * @param context Contextual data from the service.
   * @returns A RemoveAddressResponseDto.
   */
  toRemoveAddressResponse(context: {
    newCompletionPercentage: number;
    reason?: string;
  }): RemoveAddressResponseDto {
    return {
      message: 'Address removed successfully.',
      newCompletionPercentage: context.newCompletionPercentage,
      reason: context.reason,
    };
  }

  /**
   * Maps data to the response for removing a next of kin.
   * @param context Contextual data from the service.
   * @returns A RemoveNextOfKinResponseDto.
   */
  toRemoveNextOfKinResponse(context: {
    newCompletionPercentage: number;
    reason?: string;
  }): RemoveNextOfKinResponseDto {
    return {
      message: 'Next of kin information removed successfully.',
      newCompletionPercentage: context.newCompletionPercentage,
      reason: context.reason,
    };
  }

  /**
   * Maps a profile to the completion status response DTO.
   * @param profile The UserProfile domain object.
   * @param context Additional data from the service layer.
   * @returns A ProfileCompletionResponseDto.
   */
  toProfileCompletionResponse(
    profile: UserProfile,
    context: {
      recommendations: string[];
      meetsMinimumRequirements: boolean;
      benefits?: string[]; // Make benefits optional
    },
  ): ProfileCompletionResponseDto {
    // This helper logic should be here or in the service, NOT the DTO.
    const getMissingFields = (): string[] => {
      const missing: string[] = [];
      if (!profile.bio) missing.push('bio');
      if (!profile.phoneNumber) missing.push('phoneNumber');
      if (!profile.isPhoneVerified) missing.push('phoneVerified');
      if (!profile.address) missing.push('address');
      if (!profile.nextOfKin) missing.push('nextOfKin');
      return missing;
    };

    return {
      completionPercentage: profile.completionPercentage,
      missingFields: getMissingFields(),
      recommendations: context.recommendations,
      meetsMinimumRequirements: context.meetsMinimumRequirements,
      benefits: context.benefits,
    };
  }

  // ============================================================================
  // PRIVATE DTO HELPERS
  // ============================================================================

  /**
   * Converts a domain Address object to an AddressDto.
   * @private
   */
  private toAddressDto(address: Address): AddressDto {
    return address;
  }

  private toNextOfKinDto(nextOfKin: NextOfKin): NextOfKinDto {
    return {
      ...nextOfKin,
      address: nextOfKin.address ? this.toAddressDto(nextOfKin.address) : undefined,
    };
  }

  /**
   * Masks a phone number for security purposes.
   * Example: +254712345678 -> +254****5678
   * @private
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length < 9) return '****';
    const start = phoneNumber.slice(0, 4);
    const end = phoneNumber.slice(-4);
    return `${start}****${end}`;
  }
}
