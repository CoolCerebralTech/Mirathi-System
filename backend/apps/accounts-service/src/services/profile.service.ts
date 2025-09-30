import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, User, UserProfile } from '@shamba/database';
import {
  UpdateUserProfileRequestDto,
  EventPattern,
  ShambaEvent,
  UserUpdatedEvent, // Using the union type for clarity
} from '@shamba/common';
import { MessagingService } from '@shamba/messaging';

// ============================================================================
// Shamba Sure - Production-Grade Profile Service
// ============================================================================
// This service is the single source of truth for all operations related to
// a user's own profile. It is secure, efficient, and fully integrated with
// our event-driven architecture.
// ============================================================================

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
  ) {}

  /**
   * Retrieves the full profile for a given user, including the User and UserProfile models.
   * @param userId The ID of the user whose profile is to be fetched.
   * @returns The combined user and profile object.
   * @throws NotFoundException if the user does not exist.
   */
  async getProfile(userId: string): Promise<User & { profile: UserProfile | null }> {
    const userWithProfile = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!userWithProfile) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    // IMPORTANT: The password hash is still on this object. It is the
    // RESPONSIBILITY OF THE CONTROLLER to serialize this data using our
    // `UserEntity` class, which will strip the password before it is sent
    // to the client. The service layer's job is to return the complete data model.
    return userWithProfile;
  }

  /**
   * Updates a user's profile information.
   * This uses an `upsert` operation to create a profile if it doesn't exist.
   * It also publishes a `user.updated` event with the changed data.
   * @param userId The ID of the user whose profile is to be updated.
   * @param data The DTO containing the new profile data.
   * @returns The updated UserProfile object.
   */
  async updateProfile(
    userId: string,
    data: UpdateUserProfileRequestDto,
  ): Promise<UserProfile> {
    // The `upsert` operation is atomic and highly efficient.
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

    // --- FULL EVENT PUBLISHING IMPLEMENTATION ---
    // We now fully implement the event publishing logic.
    const event: UserUpdatedEvent = { // Use the correct type
      type: EventPattern.USER_UPDATED,
      timestamp: new Date(),
      version: '1.0',
      source: 'accounts-service',
      data: {
        userId: userId,
        profile: {
          bio: updatedProfile.bio,
          phoneNumber: updatedProfile.phoneNumber,
        },
      },
    };
    this.messagingService.emit(event);
    // ------------------------------------------

    return updatedProfile;
  }
}