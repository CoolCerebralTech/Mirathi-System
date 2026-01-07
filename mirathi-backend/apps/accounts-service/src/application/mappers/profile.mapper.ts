import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { Address, UserProfile } from '../../domain/models';
import { PhoneNumber } from '../../domain/value-objects';
import { UserProfileEntity } from '../../infrastructure/persistence/entities/account.entity';
import {
  AddressDto,
  GetMyProfileResponseDto,
  ProfileCompletionResponseDto,
  RemoveAddressResponseDto,
  UpdateMarketingPreferencesResponseDto,
  UpdateMyProfileResponseDto,
  UserProfileResponseDto,
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
      phoneNumber: primitives.phoneNumber,
      marketingOptIn: primitives.marketingOptIn,
      address: (primitives.address as Prisma.JsonValue) ?? Prisma.DbNull,
      updatedAt: primitives.updatedAt,
    };

    const createData: Prisma.UserProfileCreateInput = {
      id: primitives.id,
      user: { connect: { id: primitives.userId } },
      phoneNumber: primitives.phoneNumber,
      marketingOptIn: primitives.marketingOptIn,
      address: (primitives.address as Prisma.JsonValue) ?? Prisma.DbNull,
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
      phoneNumber: entity.phoneNumber ? PhoneNumber.create(entity.phoneNumber) : null,
      marketingOptIn: entity.marketingOptIn,
      address: parseAddressFromPrisma(entity.address),
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
      if (!profile.phoneNumber) missing.push('phoneNumber');
      if (!profile.address) missing.push('address');
      return missing;
    };

    return {
      id: profile.id,
      userId: profile.userId,
      phoneNumber: profile.phoneNumber?.getValue() ?? undefined,
      marketingOptIn: profile.marketingOptIn,
      address: profile.address ? this.toAddressDto(profile.address) : undefined,
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
      benefits?: string[];
    },
  ): ProfileCompletionResponseDto {
    const getMissingFields = (): string[] => {
      const missing: string[] = [];
      if (!profile.phoneNumber) missing.push('phoneNumber');
      if (!profile.address) missing.push('address');
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
}
