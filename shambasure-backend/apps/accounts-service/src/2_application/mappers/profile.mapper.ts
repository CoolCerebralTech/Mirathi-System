import { Injectable } from '@nestjs/common';
import { UserProfile } from '../../3_domain/models/user-profile.model';
import { Address, NextOfKin } from '../../3_domain/models/user-profile.model';
import { PhoneNumber } from '../../3_domain/value-objects';
import { AddressDto, NextOfKinDto } from '../dtos/user.dto';
import {
  UpdateMyProfileDto,
  UpdateProfileResponseDto,
  VerifyPhoneResponseDto,
  SendPhoneVerificationResponseDto,
  UpdateMarketingPreferencesResponseDto,
  UserProfileResponseDto,
} from '../dtos/user.dto';

/**
 * Defines the shape of data used to update the UserProfile domain model.
 * This provides a clean, type-safe contract between the DTO and the domain.
 */
export interface ProfileUpdateData {
  bio?: string;
  phoneNumber?: PhoneNumber | null;
  address?: Address | null;
  nextOfKin?: NextOfKin | null;
}

/**
 * ProfileMapper
 *
 * Maps between UserProfile-related DTOs and the UserProfile domain model.
 */
@Injectable()
export class ProfileMapper {
  toDomainUpdateData(dto: UpdateMyProfileDto): ProfileUpdateData {
    const updateData: ProfileUpdateData = {};

    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.phoneNumber !== undefined) {
      updateData.phoneNumber = dto.phoneNumber ? PhoneNumber.create(dto.phoneNumber) : null;
    }
    if (dto.address !== undefined) {
      updateData.address = dto.address ? this.mapAddressDtoToDomain(dto.address) : null;
    }
    if (dto.nextOfKin !== undefined) {
      updateData.nextOfKin = dto.nextOfKin ? this.mapNextOfKinDtoToDomain(dto.nextOfKin) : null;
    }

    return updateData;
  }

  // ============================================================================
  // PRIVATE MAPPING HELPERS (DTO -> Domain)
  // ============================================================================

  /**
   * Maps an AddressDto to a domain Address interface.
   * Enforces the domain rule that 'country' must be defined.
   * Throws an error if the DTO is invalid.
   */
  private mapAddressDtoToDomain(dto: AddressDto): Address {
    // This is where we enforce the domain's stricter rules.
    if (!dto.country) {
      // This would ideally be a custom, specific error class.
      throw new Error('Validation failed: Address country is required.');
    }
    return {
      street: dto.street,
      city: dto.city,
      postCode: dto.postCode,
      country: dto.country, // Now guaranteed to be a string
    };
  }

  /**
   * Maps a NextOfKinDto to a domain NextOfKin interface.
   */
  private mapNextOfKinDtoToDomain(dto: NextOfKinDto): NextOfKin {
    return {
      fullName: dto.fullName,
      relationship: dto.relationship,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      // Recursively use the address mapper
      address: dto.address ? this.mapAddressDtoToDomain(dto.address) : undefined,
    };
  }

  /**
   * Maps a UserProfile domain model to a full UpdateProfileResponseDto.
   */
  toUpdateProfileResponse(profile: UserProfile): UpdateProfileResponseDto {
    return {
      message: 'Profile updated successfully.',
      profile: this.toResponse(profile), // Reuse the base mapper
    };
  }

  /**
   * Maps a UserProfile domain model to a standard UserProfileResponseDto.
   * This is the single source of truth for this mapping.
   */
  toResponse(profile: UserProfile): UserProfileResponseDto {
    return {
      bio: profile.bio ?? undefined,
      phoneNumber: profile.phoneNumber?.getValue() ?? undefined,
      phoneVerified: profile.isPhoneVerified,
      emailVerified: profile.isEmailVerified,
      address: profile.address ?? undefined,
      nextOfKin: profile.nextOfKin ?? undefined,
    };
  }

  /**
   * Creates a standard success response for phone verification.
   */
  toVerifyPhoneResponse(): VerifyPhoneResponseDto {
    return {
      message: 'Phone number verified successfully.',
    };
  }

  /**
   * Creates a structured response after sending a phone verification code.
   */
  toSendPhoneVerificationResponse(
    nextRetryAt: Date,
    expiresInMinutes: number,
  ): SendPhoneVerificationResponseDto {
    const retryAfterSeconds = Math.max(0, Math.ceil((nextRetryAt.getTime() - Date.now()) / 1000));

    return {
      message: 'Verification code sent to your phone.',
      nextRetryAt,
      retryAfterSeconds,
      expiresInMinutes,
    };
  }

  /**
   * Creates a success response for updating marketing preferences.
   */
  toUpdateMarketingPreferencesResponse(
    marketingOptIn: boolean,
  ): UpdateMarketingPreferencesResponseDto {
    return {
      message: 'Marketing preferences updated successfully.',
      marketingOptIn,
    };
  }
}
