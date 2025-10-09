/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// ============================================================================
// profile.service.ts - User Profile Management
// ============================================================================

import { Injectable, NotFoundException, Logger as ProfileLogger } from '@nestjs/common';
import { PrismaService, User, UserProfile } from '@shamba/database';
import { UpdateUserProfileRequestDto, EventPattern, UserUpdatedEvent } from '@shamba/common';
import { MessagingService as ProfileMessagingService } from '@shamba/messaging';

/**
 * ProfileService - User profile management
 *
 * RESPONSIBILITIES:
 * - Managing UserProfile data (bio, phone, address, nextOfKin)
 * - Atomic upsert operations
 * - Publishing profile update events
 *
 * ARCHITECTURAL NOTE:
 * This service uses PrismaService directly for profile operations
 * since profiles are 1:1 with users and tightly coupled.
 * For more complex domains, use a ProfileRepository.
 */
@Injectable()
export class ProfileService {
  private readonly logger = new ProfileLogger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: ProfileMessagingService,
  ) {}

  /**
   * Get user with profile
   * @throws NotFoundException if user not found
   */
  async getProfile(userId: string): Promise<User & { profile: UserProfile | null }> {
    const userWithProfile = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!userWithProfile) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // NOTE: Password is present on this object.
    // Controller MUST use UserEntity for serialization to strip it.
    return userWithProfile;
  }

  /**
   * Update or create user profile (atomic upsert)
   *
   * BUSINESS RULES:
   * - Creates profile if it doesn't exist
   * - Updates existing profile atomically
   * - Publishes UserUpdatedEvent with profile changes
   *
   * @param userId - User ID
   * @param data - Profile data to update
   * @returns Updated UserProfile
   */
  async updateProfile(userId: string, data: UpdateUserProfileRequestDto): Promise<UserProfile> {
    // Validate user exists
    const userExists = await this.prisma.user.count({ where: { id: userId } });
    if (userExists === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Atomic upsert operation
    const updatedProfile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        bio: data.bio,
        phoneNumber: data.phoneNumber,
        address: data.address as any,
        nextOfKin: data.nextOfKin as any,
      },
      create: {
        bio: data.bio,
        phoneNumber: data.phoneNumber,
        address: data.address as any,
        nextOfKin: data.nextOfKin as any,
        user: { connect: { id: userId } },
      },
    });

    // Publish domain event
    const event: UserUpdatedEvent = {
      type: EventPattern.USER_UPDATED,
      timestamp: new Date(),
      version: '1.0',
      source: 'accounts-service',
      data: {
        userId,
        profile: {
          bio: updatedProfile.bio,
          phoneNumber: updatedProfile.phoneNumber,
          // Only include changed fields in event
        },
      },
    };

    try {
      this.messagingService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to publish UserUpdatedEvent for user ${userId}`, error);
    }

    this.logger.log(`Profile updated for user ${userId}`);
    return updatedProfile;
  }

  /**
   * Delete user profile (soft operation - keeps user)
   * Only used in special cases; usually profile is cascade-deleted with user
   */
  async deleteProfile(userId: string): Promise<void> {
    const deleted = await this.prisma.userProfile.deleteMany({
      where: { userId },
    });

    if (deleted.count === 0) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    this.logger.log(`Profile deleted for user ${userId}`);
  }
}
