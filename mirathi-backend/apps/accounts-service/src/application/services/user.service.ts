import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { DomainEvent } from '../../domain/events';
import type {
  ILoginSessionRepository,
  IRefreshTokenRepository,
  IUserRepository,
} from '../../domain/interfaces';
import type { IEventPublisher, INotificationService } from '../../domain/interfaces';
import { Address } from '../../domain/models/user-profile.model';
import { AccountLockedError, User, UserDomainError } from '../../domain/models/user.model';
import { PhoneNumber } from '../../domain/value-objects';
import {
  GetMyProfileResponseDto,
  ProfileCompletionResponseDto,
  RemoveAddressResponseDto,
  UpdateMarketingPreferencesRequestDto,
  UpdateMarketingPreferencesResponseDto,
  UpdateMyProfileRequestDto,
  UpdateMyProfileResponseDto,
} from '../dtos/profile.dto';
import {
  DeactivateMyAccountRequestDto,
  DeactivateMyAccountResponseDto,
  GetMyUserResponseDto,
  UpdateMyUserRequestDto,
  UpdateMyUserResponseDto,
} from '../dtos/user.dto';
import { ProfileMapper, UserMapper } from '../mappers';

// Custom exceptions for better error handling
export class UserServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'UserServiceError';
  }
}

export class ProfileValidationError extends UserServiceError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PROFILE_VALIDATION_ERROR', context);
    this.name = 'ProfileValidationError';
  }
}

export class AccountOperationError extends UserServiceError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'ACCOUNT_OPERATION_ERROR', context);
    this.name = 'AccountOperationError';
  }
}

/**
 * UserService
 *
 * Production-ready user self-management service with comprehensive error handling,
 * security measures, and domain event coordination.
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject('IUserRepository')
    private readonly userRepo: IUserRepository,

    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepo: IRefreshTokenRepository,

    @Inject('ILoginSessionRepository')
    private readonly loginSessionRepo: ILoginSessionRepository,

    @Inject('IEventPublisher')
    private readonly eventPublisher: IEventPublisher,

    @Inject('INotificationService')
    private readonly notificationService: INotificationService,

    // These are classes decorated with @Injectable(), so no @Inject needed
    private readonly userMapper: UserMapper,
    private readonly profileMapper: ProfileMapper,
  ) {}

  // ==========================================================================
  // USER INFORMATION MANAGEMENT
  // ==========================================================================

  async getMe(userId: string): Promise<GetMyUserResponseDto> {
    try {
      this.logger.debug(`Fetching user data for: ${userId}`);

      // 1. --- UPDATED ---
      // Fetch the user WITH their profile in a single, atomic operation.
      const user = await this.userRepo.findByIdWithProfile(userId);
      if (!user) {
        throw new NotFoundException('User not found.');
      }

      // Validate user account status (this is correct)
      this.validateUserAccountStatus(user);
      const context = {
        activeSessions: await this.loginSessionRepo.countActiveByUserId(userId),
        securityRecommendations: ['Review your active sessions'],
      };

      this.logger.debug(`Successfully fetched user data for: ${userId}`);

      // 3. --- UPDATED ---
      // Call the mapper with just the user aggregate and the context.
      return this.userMapper.toGetMyUserResponse(user, context);
    } catch (error) {
      this.logger.error(`Failed to fetch user data for: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  async updateMe(userId: string, dto: UpdateMyUserRequestDto): Promise<UpdateMyUserResponseDto> {
    try {
      this.logger.log(`Updating user information for: ${userId}`);

      // 1. --- UPDATED ---
      // Fetch the user with their profile in one go.
      const user = await this.userRepo.findByIdWithProfile(userId);
      if (!user) {
        throw new NotFoundException('User not found.');
      }

      // Validate user account status (this is correct and stays)
      this.validateUserAccountStatus(user);

      // 2. --- SIMPLIFIED ---
      // Call the domain method. It is responsible for checking if there are actual changes
      // and only creating a domain event if something was modified.
      user.updateInfo({
        firstName: dto.firstName,
        lastName: dto.lastName,
      });

      // 3. --- UPDATED ---
      // Only save and publish events if the domain model recorded a change.
      if (user.domainEvents.length > 0) {
        // Save the entire aggregate. The repository handles the transaction.
        await this.userRepo.save(user);

        // Publish events
        await this.publishDomainEvents(user);

        this.logger.log(`Successfully updated user information for: ${userId}`);
      } else {
        this.logger.debug(`No changes detected for user update: ${userId}`);
      }

      // 4. --- UPDATED & SIMPLIFIED ---
      // Remove all separate profileRepo calls and use the updated mapper.
      return this.userMapper.toUpdateMyUserResponse(user);
    } catch (error) {
      this.logger.error(`Failed to update user information for: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  async deactivateMyAccount(
    userId: string,
    dto: DeactivateMyAccountRequestDto,
  ): Promise<DeactivateMyAccountResponseDto> {
    try {
      this.logger.log(`Account deactivation request for: ${userId}`);

      // A simple findById is sufficient here as we don't need the profile for this action.
      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found.');
      }

      // Verify password for security (this is correct and a crucial step)
      const isPasswordValid = await user.password.compare(dto.password);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password during account deactivation for: ${userId}`);
        throw new UnauthorizedException('Current password is incorrect.');
      }

      // Check if account is already deactivated (domain model handles this, but a service check is fine)
      if (!user.isActive) {
        throw new BadRequestException('Account is already deactivated.');
      }

      // Deactivate account using the domain method
      user.deactivate('self', dto.reason);

      // Save the updated state of the user (isActive: false)
      await this.userRepo.save(user);

      // 1. --- UPDATED & SIMPLIFIED ---
      // Revoke all sessions to log the user out everywhere.
      // Focusing on RefreshTokens is the most critical part.
      const sessionsTerminated = await this.refreshTokenRepo.revokeAllByUserId(userId);

      // Publish the UserDeactivatedEvent
      await this.publishDomainEvents(user);

      // Send confirmation email (this is correct)
      this.sendDeactivationConfirmation(user, dto.reason).catch((error) => {
        this.logger.error('Failed to send deactivation confirmation email', error);
      });

      this.logger.log(
        `Account deactivated successfully for: ${userId}, sessions terminated: ${sessionsTerminated}`,
      );

      // 2. --- UPDATED ---
      // Use the refactored mapper with a context object.
      return this.userMapper.toDeactivateMyAccountResponse({
        deactivatedAt: new Date(),
        sessionsTerminated,
      });
    } catch (error) {
      this.logger.error(`Account deactivation failed for: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  // ==========================================================================
  // PROFILE MANAGEMENT
  // ==========================================================================

  async getMyProfile(userId: string): Promise<GetMyProfileResponseDto> {
    try {
      this.logger.debug(`Fetching profile for user: ${userId}`);

      // 1. --- UPDATED ---
      // Fetch the entire User aggregate. Do not use the profileRepo directly.
      const user = await this.userRepo.findByIdWithProfile(userId);

      // 2. --- ADDED ---
      // Check for user existence and validate their account status.
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      this.validateUserAccountStatus(user);

      // The profile is now guaranteed to be on the user object.
      const profile = user.profile;
      if (!profile) {
        // This should theoretically never happen if the DB is consistent.
        throw new InternalServerErrorException('User profile data is missing or corrupt.');
      }

      // The service is responsible for generating context, like recommendations.
      const context = {
        securityRecommendations: ['Ensure your information is up-to-date.'],
        nextSteps: profile.isComplete
          ? []
          : ['Complete all missing fields to enhance your experience.'],
      };

      this.logger.debug(`Successfully fetched profile for user: ${userId}`);

      // 3. --- UPDATED ---
      // Pass the profile from the user aggregate to the mapper.
      return this.profileMapper.toGetMyProfileResponse(profile, context);
    } catch (error) {
      this.logger.error(`Failed to fetch profile for user: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateMyProfileRequestDto,
  ): Promise<UpdateMyProfileResponseDto> {
    try {
      this.logger.log(`Updating profile for user: ${userId}`);

      const user = await this.userRepo.findByIdWithProfile(userId);
      if (!user || !user.profile) {
        throw new NotFoundException('User profile not found.');
      }
      this.validateUserAccountStatus(user);

      const profile = user.profile;
      const previousCompletion = profile.completionPercentage;
      const initialEventCount = user.domainEvents.length;

      // --- 1. HANDLE PHONE NUMBER UPDATES VIA THE USER AGGREGATE ---
      if (dto.phoneNumber !== undefined) {
        if (dto.phoneNumber === null) {
          // Remove phone number if null is provided
          user.removePhoneNumber();
        } else {
          const newPhoneNumber = PhoneNumber.create(dto.phoneNumber);
          if (!profile.phoneNumber || !profile.phoneNumber.equals(newPhoneNumber)) {
            if (!(await this.userRepo.isPhoneNumberUnique(newPhoneNumber))) {
              throw new ConflictException('This phone number is already in use.');
            }
            user.updatePhoneNumber(newPhoneNumber);
          }
        }
      }

      // --- 2. USE THE EXISTING `updateProfile` METHOD FOR OTHER FIELDS ---
      user.updateProfile({
        address: dto.address as Address | null,
      });

      // --- 3. CHECK FOR CHANGES AND SAVE ---
      const hasChanges = user.domainEvents.length > initialEventCount;

      if (hasChanges) {
        await this.userRepo.save(user);
        await this.publishDomainEvents(user);
        this.logger.log(`Profile updated for user: ${userId}`);
      } else {
        this.logger.debug(`No profile changes detected for user: ${userId}`);
      }

      // --- 4. CREATE THE RESPONSE ---
      // This is a bit complex, we need to get the updated fields from the events
      const updatedFields = user.domainEvents
        .slice(initialEventCount)
        .flatMap((event: DomainEvent) => {
          if (event.eventName === 'user.profile_updated' && event.payload.updatedFields) {
            return Object.keys(event.payload.updatedFields);
          }
          if (event.eventName === 'user.phone_number_updated') {
            return ['phoneNumber'];
          }
          if (event.eventName === 'user.phone_number_removed') {
            return ['phoneNumber'];
          }
          return [];
        });

      return this.profileMapper.toUpdateMyProfileResponse(profile, {
        updatedFields: [...new Set(updatedFields)],
        completionChanged: previousCompletion !== profile.completionPercentage,
        previousCompletion,
      });
    } catch (error) {
      this.logger.error(`Profile update failed for user: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  async getProfileCompletion(userId: string): Promise<ProfileCompletionResponseDto> {
    try {
      this.logger.debug(`Fetching profile completion for user: ${userId}`);

      // 1. --- UPDATED ---
      // ALWAYS fetch the User aggregate root.
      const user = await this.userRepo.findByIdWithProfile(userId);
      if (!user) {
        throw new NotFoundException('User not found.');
      }

      // 2. --- ADDED ---
      // Validate the user's account status.
      this.validateUserAccountStatus(user);

      const profile = user.profile;
      if (!profile) {
        throw new InternalServerErrorException('User profile data is missing.');
      }

      // 3. --- UPDATED ---
      // The service is responsible for business logic, like determining recommendations.
      const recommendations: string[] = [];
      if (profile.completionPercentage < 100) {
        recommendations.push('Complete all fields to maximize your account security.');
      }

      const context = {
        recommendations,
        // UPDATED: Users are active immediately, so minimum requirements are always met
        meetsMinimumRequirements: true,
        benefits: [
          'Enhanced account security',
          'Faster support and verification',
          'Access to all platform features',
        ],
      };

      // Pass the profile from the user object and the context to the mapper.
      return this.profileMapper.toProfileCompletionResponse(profile, context);
    } catch (error) {
      this.logger.error(`Failed to fetch profile completion for user: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  // ==========================================================================
  // MARKETING PREFERENCES
  // ==========================================================================

  async updateMarketingPreferences(
    userId: string,
    dto: UpdateMarketingPreferencesRequestDto,
  ): Promise<UpdateMarketingPreferencesResponseDto> {
    try {
      this.logger.log(`Updating marketing preferences for user: ${userId}`);

      // 1. --- ALWAYS START WITH THE AGGREGATE ROOT ---
      const user = await this.userRepo.findByIdWithProfile(userId);
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      this.validateUserAccountStatus(user);

      const initialEventCount = user.domainEvents.length;

      // 2. --- USE THE AGGREGATE'S DOMAIN METHOD ---
      // Pass only the 'marketingOptIn' boolean, as that's what the model supports.
      user.updateMarketingPreferences(dto.marketingOptIn);

      // 3. --- SAVE IF CHANGES OCCURRED ---
      if (user.domainEvents.length > initialEventCount) {
        await this.userRepo.save(user);
        await this.publishDomainEvents(user);
        this.logger.log(
          `Marketing preferences updated for user: ${userId}, opt-in: ${dto.marketingOptIn}`,
        );
      } else {
        this.logger.debug(`No change in marketing preferences for user: ${userId}`);
      }

      // 4. --- ALIGN MAPPER CALL ---
      // The mapper only needs the profile object.
      return this.profileMapper.toUpdateMarketingPreferencesResponse(user.profile);
    } catch (error) {
      this.logger.error(`Failed to update marketing preferences for user: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  // ==========================================================================
  // PROFILE DATA REMOVAL
  // ==========================================================================

  async removeAddress(userId: string): Promise<RemoveAddressResponseDto> {
    try {
      this.logger.log(`Removing address for user: ${userId}`);

      // 1. --- ALWAYS START WITH THE AGGREGATE ROOT ---
      const user = await this.userRepo.findByIdWithProfile(userId);
      if (!user || !user.profile) {
        throw new NotFoundException('User profile not found.');
      }
      this.validateUserAccountStatus(user);

      const profile = user.profile;

      if (!profile.address) {
        throw new BadRequestException('No address to remove.');
      }

      // 2. --- USE THE AGGREGATE'S DOMAIN METHOD ---
      user.removeAddress();

      // 3. --- SAVE THE AGGREGATE ---
      await this.userRepo.save(user);

      // Publish events created by the domain model
      await this.publishDomainEvents(user);

      this.logger.log(`Address removed for user: ${userId}`);

      // 4. --- ALIGN MAPPER CALL ---
      return this.profileMapper.toRemoveAddressResponse({
        newCompletionPercentage: profile.completionPercentage,
      });
    } catch (error) {
      this.logger.error(`Failed to remove address for user: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  private validateUserAccountStatus(user: User): void {
    if (user.isDeleted) {
      throw new AccountOperationError('This account has been deleted.');
    }

    if (!user.isActive) {
      throw new AccountOperationError('This account is currently inactive.');
    }

    if (user.isLocked()) {
      if (user.lockedUntil) {
        throw new AccountOperationError(
          `Account is temporarily locked. Please try again after ${user.lockedUntil.toISOString()}.`,
          { lockedUntil: user.lockedUntil },
        );
      }
      throw new AccountOperationError('Account is temporarily locked.');
    }
  }

  private async sendDeactivationConfirmation(user: User, reason?: string): Promise<void> {
    try {
      await this.notificationService.sendEmail({
        to: user.email.getValue(),
        subject: 'Your account has been deactivated',
        template: 'account-deactivated',
        data: {
          firstName: user.firstName,
          reason: reason || 'Not specified',
          deactivationDate: new Date().toISOString(),
          reactivationInstructions: 'Please contact support to reactivate your account.',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send deactivation confirmation to user: ${user.id}`, error);
    }
  }

  private async publishDomainEvents(user: User): Promise<void> {
    if (user.domainEvents.length > 0) {
      try {
        await this.eventPublisher.publishBatch(user.domainEvents);
        user.clearDomainEvents();
      } catch (error) {
        this.logger.error(`Failed to publish domain events for user ${user.id}`, error);
      }
    }
  }

  private handleServiceError(error: unknown): Error {
    if (
      error instanceof UnauthorizedException ||
      error instanceof BadRequestException ||
      error instanceof NotFoundException ||
      error instanceof ConflictException
    ) {
      return error;
    }

    // Handle domain model errors
    if (error instanceof UserDomainError) {
      // Translate domain errors into user-friendly HTTP exceptions
      if (error instanceof AccountLockedError) {
        return new UnauthorizedException(error.message);
      }
      return new BadRequestException(error.message);
    }

    // Handle custom service errors
    if (error instanceof UserServiceError) {
      return new BadRequestException(error.message);
    }

    this.logger.error('Unexpected error in UserService', error);

    return new InternalServerErrorException('An unexpected error occurred. Please try again.');
  }
}
