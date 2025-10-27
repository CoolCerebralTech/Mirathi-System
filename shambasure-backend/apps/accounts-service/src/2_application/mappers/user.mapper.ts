import { Injectable } from '@nestjs/common';
import { User } from '../../3_domain/models/user.model';
import { UserProfile } from '../../3_domain/models/user-profile.model';
import { AuthResponseDto, RefreshTokenResponseDto, TokenMetadataDto } from '../dtos/auth.dto';
import { DetailedUserResponseDto, UserResponseDto, UserProfileResponseDto } from '../dtos/user.dto';

/**
 * UserMapper
 *
 * Maps between Domain Models (User, UserProfile) and Data Transfer Objects (DTOs).
 * This class is a crucial part of the anti-corruption layer, ensuring that
 * the internal domain logic does not leak into the presentation layer.
 */
@Injectable()
export class UserMapper {
  /**
   * Maps a User domain model to a UserResponseDto.
   */
  toUserResponse(user: User, profile?: UserProfile | null): UserResponseDto {
    return {
      id: user.id,
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: profile?.isEmailVerified ?? false,
      lastLoginAt: user.lastLoginAt ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: profile ? this.toUserProfileResponse(profile) : undefined,
    };
  }

  /**
   * Maps a User domain model to a DetailedUserResponseDto for admin contexts.
   */
  toDetailedUserResponse(user: User, profile?: UserProfile | null): DetailedUserResponseDto {
    return {
      ...this.toUserResponse(user, profile), // Reuse the base mapping
      loginAttempts: user.loginAttempts,
      lockedUntil: user.lockedUntil ?? undefined,
      deletedAt: user.deletedAt ?? undefined,
    };
  }

  /**
   * Maps a UserProfile domain model to a UserProfileResponseDto.
   * This is a private helper to keep the main mapping methods clean.
   */
  private toUserProfileResponse(profile: UserProfile): UserProfileResponseDto {
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
   * Maps a user and their tokens to a full AuthResponseDto for login/registration.
   */
  toAuthResponse(
    user: User,
    profile: UserProfile,
    tokens: { accessToken: string; refreshToken: string },
    tokenMetadata: TokenMetadataDto,
  ): AuthResponseDto {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toUserResponse(user, profile), // Reuse the standard User DTO
      tokenMetadata,
      requiresEmailVerification: !profile.isEmailVerified,
    };
  }

  /**
   * Maps new tokens to a RefreshTokenResponseDto.
   */
  toRefreshTokenResponse(
    tokens: { accessToken: string; refreshToken: string },
    tokenMetadata: TokenMetadataDto,
  ): RefreshTokenResponseDto {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenMetadata,
    };
  }
}
