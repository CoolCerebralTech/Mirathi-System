import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  ConflictException,
  Inject,
} from '@nestjs/common';
import type {
  IUserRepository,
  IPhoneVerificationTokenRepository,
  IRefreshTokenRepository,
  ILoginSessionRepository,
} from '../../3_domain/interfaces';
import type {
  IHashingService,
  IEventPublisher,
  INotificationService,
} from '../../3_domain/interfaces';
import { AccountLockedError, User, UserDomainError } from '../../3_domain/models/user.model';
import { Address, NextOfKin } from '../../3_domain/models/user-profile.model';
import {
  InvalidOTPError,
  MaxOTPAttemptsExceededError,
  TokenFactory,
} from '../../3_domain/models/token.model';
import { PhoneNumber } from '../../3_domain/value-objects';
import { UserMapper, ProfileMapper } from '../mappers';
import {
  UpdateMyUserRequestDto,
  UpdateMyUserResponseDto,
  GetMyUserResponseDto,
  DeactivateMyAccountRequestDto,
  DeactivateMyAccountResponseDto,
} from '../dtos/user.dto';
import {
  UpdateMyProfileRequestDto,
  SendPhoneVerificationRequestDto,
  VerifyPhoneRequestDto,
  UpdateMarketingPreferencesRequestDto,
  UpdateMyProfileResponseDto,
  GetMyProfileResponseDto,
  SendPhoneVerificationResponseDto,
  VerifyPhoneResponseDto,
  ResendPhoneVerificationResponseDto,
  UpdateMarketingPreferencesResponseDto,
  RemovePhoneNumberResponseDto,
  RemoveAddressResponseDto,
  RemoveNextOfKinResponseDto,
  ValidatePhoneNumberRequestDto,
  ValidatePhoneNumberResponseDto,
  ProfileCompletionResponseDto,
} from '../dtos/profile.dto';
import { DomainEvent } from '../../3_domain/events';

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

export class PhoneVerificationError extends UserServiceError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PHONE_VERIFICATION_ERROR', context);
    this.name = 'PhoneVerificationError';
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

  // Configuration - should ideally come from config service
  private readonly PHONE_OTP_LENGTH = 6;
  private readonly PHONE_OTP_EXPIRY_MINUTES = 10;
  private readonly OTP_RETRY_SECONDS = 60;

  constructor(
    @Inject('IUserRepository')
    private readonly userRepo: IUserRepository,

    @Inject('IPhoneVerificationTokenRepository')
    private readonly phoneVerificationTokenRepo: IPhoneVerificationTokenRepository,

    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepo: IRefreshTokenRepository,

    @Inject('ILoginSessionRepository')
    private readonly loginSessionRepo: ILoginSessionRepository,

    @Inject('IHashingService')
    private readonly hashingService: IHashingService,

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
      // You can also add this line if you manage sessions separately and want to be thorough:
      // await this.loginSessionRepo.revokeAllByUserId(userId);

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
        securityRecommendations: ['Ensure your next of kin information is up-to-date.'],
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
          user.removePhoneNumber(); // Call the new method on the User
        } else {
          const newPhoneNumber = PhoneNumber.create(dto.phoneNumber);
          if (!profile.phoneNumber || !profile.phoneNumber.equals(newPhoneNumber)) {
            if (!(await this.userRepo.isPhoneNumberUnique(newPhoneNumber))) {
              throw new ConflictException('This phone number is already in use.');
            }
            user.updatePhoneNumber(newPhoneNumber); // Call the existing method on the User
          }
        }
      }

      // --- 2. USE THE EXISTING `updateProfile` METHOD FOR OTHER FIELDS ---
      user.updateProfile({
        bio: dto.bio,
        address: dto.address as Address | null,
        nextOfKin: dto.nextOfKin as NextOfKin | null,
        // The DTO doesn't have marketingOptIn, so we don't pass it. This is fine.
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
          // <-- CHANGE `any` TO `DomainEvent`
          // Now TypeScript knows that `eventName` and `payload` should exist
          if (event.eventName === 'user.profile_updated' && event.payload.updatedFields) {
            return Object.keys(event.payload.updatedFields);
          }
          if (event.eventName === 'user.phone_number_updated') {
            return ['phoneNumber'];
          }
          if (event.eventName === 'user.phone_number_removed') {
            // Add a case for removal
            return ['phoneNumber'];
          }
          return [];
        });

      return this.profileMapper.toUpdateMyProfileResponse(profile, {
        updatedFields: [...new Set(updatedFields)], // Get unique field names
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
      if (!profile.isPhoneVerified) {
        recommendations.push('Verify your phone number for account recovery options.');
      }

      const context = {
        recommendations,
        // Example business rule: profile is minimally viable if email and phone are verified.
        meetsMinimumRequirements: profile.isEmailVerified && profile.isPhoneVerified,
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
  // PHONE VERIFICATION
  // ==========================================================================

  async sendPhoneVerification(
    userId: string,
    dto: SendPhoneVerificationRequestDto,
  ): Promise<SendPhoneVerificationResponseDto> {
    try {
      this.logger.log(`Sending phone verification for user: ${userId}`);

      // 1. --- ALWAYS START WITH THE AGGREGATE ROOT ---
      const user = await this.userRepo.findByIdWithProfile(userId);
      if (!user || !user.profile) {
        throw new NotFoundException('User profile not found.');
      }
      this.validateUserAccountStatus(user);

      let phoneToVerify: PhoneNumber;

      // 2. --- HANDLE PHONE NUMBER UPDATE VIA THE AGGREGATE ---
      if (dto.phoneNumber) {
        const newPhoneNumber = PhoneNumber.create(dto.phoneNumber);
        // Check if the number has actually changed before doing a DB check
        if (!user.profile.phoneNumber || !user.profile.phoneNumber.equals(newPhoneNumber)) {
          if (!(await this.userRepo.isPhoneNumberUnique(newPhoneNumber))) {
            throw new ConflictException('This phone number is already in use by another account.');
          }
          // Use the method on the User aggregate to update the phone number
          user.updatePhoneNumber(newPhoneNumber);
        }
        phoneToVerify = newPhoneNumber;
      } else {
        if (!user.profile.phoneNumber) {
          throw new BadRequestException('No phone number is saved to your profile to verify.');
        }
        phoneToVerify = user.profile.phoneNumber;
      }

      // Check for existing active OTP and rate limiting
      const activeOTP = await this.phoneVerificationTokenRepo.findActiveByUserId(userId);
      if (activeOTP && activeOTP.canBeUsed()) {
        const remainingTime = activeOTP.getRemainingTime() / 1000;
        if (remainingTime > 0) {
          throw new PhoneVerificationError(
            `An OTP was recently sent. Please try again in a moment.`,
            { retryAfterSeconds: remainingTime },
          );
        }
      }

      // Clean up any old, invalid tokens for this user
      await this.phoneVerificationTokenRepo.deleteByUserId(userId);

      // Generate OTP and create the token domain object
      const otp = this.generateOTP();
      const verificationToken = TokenFactory.createPhoneVerificationToken(
        userId,
        await this.hashingService.hash(otp),
        this.PHONE_OTP_EXPIRY_MINUTES,
      );

      // The user aggregate is responsible for requesting the verification
      user.requestPhoneVerification();

      // 3. --- SAVE AGGREGATE AND NEW TOKEN ---
      // This should ideally be a transaction, handled by the userRepo.save method if possible.
      await this.userRepo.save(user); // Saves potential phone number change
      await this.phoneVerificationTokenRepo.save(verificationToken); // Saves the new OTP token

      // Publish events from the user object
      await this.publishDomainEvents(user);

      // Send OTP via SMS (fire and forget)
      this.sendVerificationSMS(phoneToVerify, otp).catch((error) => {
        this.logger.error('Failed to send verification SMS', error);
      });

      this.logger.log(`Phone verification OTP sent to user: ${userId}`);

      // 4. --- USE REFACTORED MAPPER ---
      return this.profileMapper.toSendPhoneVerificationResponse({
        phoneNumber: phoneToVerify.getValue(),
        provider: phoneToVerify.getProvider(),
        method: dto.method || 'sms',
        nextRetryAt: new Date(Date.now() + this.OTP_RETRY_SECONDS * 1000),
        retryAfterSeconds: this.OTP_RETRY_SECONDS,
        expiresInMinutes: this.PHONE_OTP_EXPIRY_MINUTES,
        attemptsRemaining: verificationToken.getRemainingAttempts(),
        attemptsMade: verificationToken.attempts,
      });
    } catch (error) {
      this.logger.error(`Failed to send phone verification for user: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  async verifyPhone(userId: string, dto: VerifyPhoneRequestDto): Promise<VerifyPhoneResponseDto> {
    try {
      this.logger.log(`Phone verification attempt for user: ${userId}`);

      // 1. --- ALWAYS START WITH THE AGGREGATE ROOT ---
      const user = await this.userRepo.findByIdWithProfile(userId);
      if (!user || !user.profile) {
        throw new NotFoundException('User profile not found.');
      }
      this.validateUserAccountStatus(user);

      if (!user.profile.phoneNumber) {
        throw new BadRequestException('No phone number is set on your profile to verify.');
      }

      // Get the active verification token for the user
      const activeToken = await this.phoneVerificationTokenRepo.findActiveByUserId(userId);
      if (!activeToken) {
        throw new PhoneVerificationError(
          'No active verification code found or it has expired. Please request a new one.',
        );
      }

      // 2. --- USE THE TOKEN'S DOMAIN LOGIC ---
      // Hash the incoming code to compare it with the stored hash
      const otpHash = await this.hashingService.hash(dto.code);

      try {
        // The verify method on the token model will throw an error if it fails,
        // which we can catch and handle.
        activeToken.verify(otpHash);
      } catch (error) {
        // Save the token to persist the incremented attempt count.
        await this.phoneVerificationTokenRepo.save(activeToken);
        this.logger.warn(`Invalid OTP for user ${userId}. Attempts: ${activeToken.attempts}`);
        // Re-throw the original error from the domain model (e.g., MaxOTPAttemptsExceededError)
        throw error;
      }

      // 3. --- USE THE AGGREGATE'S DOMAIN LOGIC ---
      // If verify() was successful, we proceed to update the user.
      user.verifyPhone();

      // 4. --- SAVE AGGREGATE AND TOKEN IN ONE GO ---
      // The user object (and its profile) and the token object have both been modified.
      // We save them both. This should ideally be a transaction.
      await this.userRepo.save(user);
      await this.phoneVerificationTokenRepo.save(activeToken); // Saves the 'used: true' state

      // Publish events (if any were added to the user model)
      await this.publishDomainEvents(user);

      this.logger.log(`Phone verified successfully for user: ${userId}`);

      // 5. --- USE REFACTORED MAPPER ---
      return this.profileMapper.toVerifyPhoneResponse({
        phoneNumber: user.profile.phoneNumber.getValue(),
        provider: user.profile.phoneNumber.getProvider(),
        verifiedAt: new Date(),
        updatedProfile: user.profile,
      });
    } catch (error) {
      this.logger.error(`Phone verification failed for user: ${userId}`, error);
      // Let the handleServiceError method translate domain errors (like MaxOTPAttemptsExceededError)
      // into appropriate HTTP responses.
      throw this.handleServiceError(error);
    }
  }

  async resendPhoneVerification(userId: string): Promise<ResendPhoneVerificationResponseDto> {
    try {
      this.logger.log(`Resending phone verification for user: ${userId}`);

      // 1. --- ALWAYS START WITH THE AGGREGATE ROOT ---
      const user = await this.userRepo.findByIdWithProfile(userId);
      if (!user || !user.profile) {
        throw new NotFoundException('User profile not found.');
      }
      this.validateUserAccountStatus(user);

      const profile = user.profile;

      if (!profile.phoneNumber) {
        throw new BadRequestException('No phone number found on your profile to verify.');
      }

      if (profile.isPhoneVerified) {
        throw new BadRequestException('Your phone number is already verified.');
      }

      // 2. --- SIMPLIFIED RATE LIMITING ---
      // Check if there's an active token that was created very recently.
      const activeToken = await this.phoneVerificationTokenRepo.findActiveByUserId(userId);
      if (activeToken) {
        const timeSinceCreation = Date.now() - activeToken.createdAt.getTime();
        if (timeSinceCreation < this.OTP_RETRY_SECONDS * 1000) {
          const retryAfter = Math.ceil((this.OTP_RETRY_SECONDS * 1000 - timeSinceCreation) / 1000);
          throw new PhoneVerificationError(
            `You must wait ${retryAfter} seconds before requesting a new code.`,
            { retryAfterSeconds: retryAfter },
          );
        }
      }

      // Delete all previous tokens for this user to ensure a clean slate.
      await this.phoneVerificationTokenRepo.deleteByUserId(userId);

      // Generate new OTP and token
      const otp = this.generateOTP();
      const verificationToken = TokenFactory.createPhoneVerificationToken(
        userId,
        await this.hashingService.hash(otp),
        this.PHONE_OTP_EXPIRY_MINUTES,
      );
      await this.phoneVerificationTokenRepo.save(verificationToken);

      // 3. --- USE AGGREGATE DOMAIN METHOD ---
      user.requestPhoneVerification();
      await this.publishDomainEvents(user);

      // Send OTP via SMS
      this.sendVerificationSMS(profile.phoneNumber, otp).catch((error) => {
        this.logger.error('Failed to send verification SMS during resend', error);
      });

      this.logger.log(`Phone verification OTP resent for user: ${userId}`);

      // 4. --- ALIGN MAPPER CALL ---
      return this.profileMapper.toResendPhoneVerificationResponse({
        phoneNumber: profile.phoneNumber.getValue(),
        method: 'sms', // Assuming SMS is the only method for now
        nextRetryAt: new Date(Date.now() + this.OTP_RETRY_SECONDS * 1000),
        retryAfterSeconds: this.OTP_RETRY_SECONDS,
        resendAttempts: await this.phoneVerificationTokenRepo.countByUserId(userId), // More accurate count
      });
    } catch (error) {
      this.logger.error(`Failed to resend phone verification for user: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  async validatePhoneNumber(
    dto: ValidatePhoneNumberRequestDto,
  ): Promise<ValidatePhoneNumberResponseDto> {
    try {
      this.logger.debug(`Validating phone number: ${dto.phoneNumber}`);

      // The PhoneNumber value object handles format validation.
      // If the format is invalid, it will throw an error which is caught below.
      const phoneNumber = PhoneNumber.create(dto.phoneNumber);

      // 1. --- UPDATED ---
      // Use the userRepo to check for uniqueness, as it is the gateway for the aggregate.
      const isUnique = await this.userRepo.isPhoneNumberUnique(phoneNumber);

      // This is a great use of the spread operator to conditionally add a property.
      return {
        valid: true,
        normalizedNumber: phoneNumber.getValue(),
        provider: phoneNumber.getProvider(),
        type: 'mobile', // Assuming mobile for now, a library could provide more detail.
        countryCode: 'KE',
        ...(isUnique ? {} : { error: 'This phone number is already in use.' }),
      };
    } catch (error: unknown) {
      // This catch block will trigger if PhoneNumber.create() fails due to invalid format.
      if (error instanceof Error) {
        this.logger.warn(
          `Phone number validation failed for: ${dto.phoneNumber} — ${error.message}`,
        );
      } else {
        this.logger.warn(
          `Phone number validation failed for: ${dto.phoneNumber} — ${String(error)}`,
        );
      }

      return {
        valid: false,
        normalizedNumber: dto.phoneNumber,
        provider: 'Unknown',
        type: 'unknown',
        error: 'The phone number format is invalid.',
      };
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

  async removePhoneNumber(userId: string): Promise<RemovePhoneNumberResponseDto> {
    try {
      this.logger.log(`Removing phone number for user: ${userId}`);

      // 1. --- ALWAYS START WITH THE AGGREGATE ROOT ---
      const user = await this.userRepo.findByIdWithProfile(userId);
      if (!user || !user.profile) {
        throw new NotFoundException('User profile not found.');
      }
      this.validateUserAccountStatus(user);

      const profile = user.profile;

      if (!profile.phoneNumber) {
        throw new BadRequestException('No phone number to remove.');
      }

      const previousPhone = profile.phoneNumber.getValue();

      // 2. --- USE THE AGGREGATE'S DOMAIN METHOD ---
      user.removePhoneNumber();

      // 3. --- SAVE THE AGGREGATE ---
      await this.userRepo.save(user);

      // Clean up any related phone verification tokens
      await this.phoneVerificationTokenRepo.deleteByUserId(userId);

      // Publish events (if the domain model created any)
      await this.publishDomainEvents(user);

      this.logger.log(`Phone number removed for user: ${userId}`);

      // 4. --- ALIGN MAPPER CALL ---
      return this.profileMapper.toRemovePhoneNumberResponse({
        previousPhoneNumber: previousPhone,
        // The reason is not part of the domain logic, so it's not included here.
        // It could be added to the event payload if needed for auditing.
      });
    } catch (error) {
      this.logger.error(`Failed to remove phone number for user: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

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
        // The reason is not part of the domain logic, it's transient data.
        // It could be passed to the domain event if needed for auditing.
      });
    } catch (error) {
      this.logger.error(`Failed to remove address for user: ${userId}`, error);
      throw this.handleServiceError(error);
    }
  }

  async removeNextOfKin(userId: string): Promise<RemoveNextOfKinResponseDto> {
    try {
      this.logger.log(`Removing next of kin for user: ${userId}`);

      // 1. --- ALWAYS START WITH THE AGGREGATE ROOT ---
      const user = await this.userRepo.findByIdWithProfile(userId);
      if (!user || !user.profile) {
        throw new NotFoundException('User profile not found.');
      }
      this.validateUserAccountStatus(user);

      const profile = user.profile;

      if (!profile.nextOfKin) {
        throw new BadRequestException('No next of kin information to remove.');
      }

      // 2. --- USE THE AGGREGATE'S DOMAIN METHOD ---
      user.removeNextOfKin();

      // 3. --- SAVE THE AGGREGATE ---
      await this.userRepo.save(user);

      // Publish events created by the domain model
      await this.publishDomainEvents(user);

      this.logger.log(`Next of kin removed for user: ${userId}`);

      // 4. --- ALIGN MAPPER CALL ---
      return this.profileMapper.toRemoveNextOfKinResponse({
        newCompletionPercentage: profile.completionPercentage,
      });
    } catch (error) {
      this.logger.error(`Failed to remove next of kin for user: ${userId}`, error);
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
      // FIX: Check for the existence of user.lockedUntil before calling .toISOString()
      // The `isLocked()` method already confirms it's a future date.
      if (user.lockedUntil) {
        throw new AccountOperationError(
          `Account is temporarily locked. Please try again after ${user.lockedUntil.toISOString()}.`,
          { lockedUntil: user.lockedUntil },
        );
      }
      // This case is unlikely but handles a locked user without an expiry.
      throw new AccountOperationError('Account is temporarily locked.');
    }
  }

  private async sendDeactivationConfirmation(user: User, reason?: string): Promise<void> {
    // This method is well-written and requires no changes.
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

  private async sendVerificationSMS(phoneNumber: PhoneNumber, otp: string): Promise<void> {
    // This method is well-written and requires no changes.
    try {
      await this.notificationService.sendSMS({
        to: phoneNumber.getValue(),
        message: `Your Shamba Sure verification code is: ${otp}. Valid for ${this.PHONE_OTP_EXPIRY_MINUTES} minutes.`,
      });
    } catch (error) {
      this.logger.error(`Failed to send verification SMS to: ${phoneNumber.getValue()}`, error);
    }
  }

  private generateOTP(): string {
    // This method is correct.
    return this.hashingService.generateOTP(this.PHONE_OTP_LENGTH);
  }

  /**
   * FIX: This method now only accepts the User aggregate root.
   */
  private async publishDomainEvents(user: User): Promise<void> {
    if (user.domainEvents.length > 0) {
      try {
        // We publish the events from the root. If the profile had events,
        // they should have been bubbled up to the user.
        await this.eventPublisher.publishBatch(user.domainEvents);
        user.clearDomainEvents();
      } catch (error) {
        this.logger.error(`Failed to publish domain events for user ${user.id}`, error);
      }
    }
  }

  private handleServiceError(error: unknown): Error {
    // This method is well-written and handles our custom errors correctly.
    // We will add the domain model errors to it for even better handling.
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
      if (error instanceof MaxOTPAttemptsExceededError || error instanceof InvalidOTPError) {
        return new BadRequestException(error.message);
      }
      if (error instanceof AccountLockedError) {
        // You could create a custom exception filter for this to return a 423 Locked status
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
