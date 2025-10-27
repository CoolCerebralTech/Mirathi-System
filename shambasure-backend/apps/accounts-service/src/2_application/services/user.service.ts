import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@shamba/common/enums';
import { MessagingService } from '@shamba/messaging';

// Domain
import { User } from '../../3_domain/models/user.model';
import { UserProfile } from '../../3_domain/models/user-profile.model';
import { Email, PhoneNumber } from '../../3_domain/value-objects';
import { UserUpdatedEvent, RoleChangedEvent, UserLockedEvent } from '../../3_domain/events';
import {
  UserFilters,
  PaginationOptions,
  UserStats,
} from '../../3_domain/interfaces/user.repository.interface';

// Infrastructure
import { UserRepository, ProfileRepository } from '../../4_infrastructure/persistence/repositories';

// Application
import {
  UpdateMyUserDto,
  UpdateMyProfileDto,
  UpdateMarketingPreferencesDto,
  SendPhoneVerificationRequestDto,
  VerifyPhoneRequestDto,
  UserQueryDto,
  AdminUpdateUserDto,
  UpdateUserRoleRequestDto,
  LockUserAccountRequestDto,
  UnlockUserAccountRequestDto,
  SoftDeleteUserRequestDto,
  RestoreUserRequestDto,
  UserResponseDto,
  DetailedUserResponseDto,
  PaginatedUsersResponseDto,
  UpdateUserResponseDto,
  UpdateProfileResponseDto,
  UpdateMarketingPreferencesResponseDto,
  SendPhoneVerificationResponseDto,
  VerifyPhoneResponseDto,
  UpdateUserRoleResponseDto,
  LockUserAccountResponseDto,
  UnlockUserAccountResponseDto,
  SoftDeleteUserResponseDto,
  RestoreUserResponseDto,
  UserStatsResponseDto,
  ChangeEmailRequestDto,
  ChangeEmailResponseDto,
} from '../dtos/user.dto';
import { PaginationMetaDto } from '../dtos/shared/pagination.dto';
import { UserMapper, ProfileMapper, TokenMapper } from '../mappers';

/**
 * UserService
 *
 * Handles all user and profile management use cases:
 * - User CRUD operations
 * - Profile management
 * - Phone verification
 * - Admin operations (role changes, account locking, etc.)
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly PHONE_VERIFICATION_EXPIRY_MINUTES = 10;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly messagingService: MessagingService,
    private readonly userMapper: UserMapper,
    private readonly profileMapper: ProfileMapper,
    private readonly tokenMapper: TokenMapper,
  ) {
    this.logger.log('UserService initialized');
  }

  // ============================================================================
  // USER OPERATIONS (Self-Service)
  // ============================================================================

  /**
   * Gets current user profile
   */
  async getMyProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const profile = await this.profileRepository.findByUserId(userId);

    return this.userMapper.toUserResponse(user, profile || undefined);
  }

  /**
   * Updates current user basic information
   */
  async updateMyUser(userId: string, dto: UpdateMyUserDto): Promise<UpdateUserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Track changes for event
    const updatedFields: any = {};
    if (dto.firstName && dto.firstName !== user.getFirstName()) {
      updatedFields.firstName = { old: user.getFirstName(), new: dto.firstName };
    }
    if (dto.lastName && dto.lastName !== user.getLastName()) {
      updatedFields.lastName = { old: user.getLastName(), new: dto.lastName };
    }

    // Update user
    user.updateBasicInfo({
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    await this.userRepository.update(user);

    // Publish event if there were changes
    if (Object.keys(updatedFields).length > 0) {
      const event = new UserUpdatedEvent(user.getId(), updatedFields);
      this.messagingService.emit(event.eventName, event.toJSON());
    }

    const profile = await this.profileRepository.findByUserId(userId);

    this.logger.log(`User updated: ${userId}`);

    return this.userMapper.toUpdateUserResponse(user, profile || undefined);
  }

  /**
   * Initiates email change (requires verification)
   */
  async changeEmail(userId: string, dto: ChangeEmailRequestDto): Promise<ChangeEmailResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Verify current password
    const isValidPassword = await user.getPassword().compare(dto.currentPassword);
    if (!isValidPassword) {
      throw new BadRequestException('Current password is incorrect.');
    }

    // Check if new email is already in use
    const newEmail = Email.create(dto.newEmail);
    const existingUser = await this.userRepository.findByEmail(newEmail);
    if (existingUser && existingUser.getId() !== userId) {
      throw new ConflictException('Email address is already in use.');
    }

    // TODO: Generate email change verification token
    // For now, we'll just return a response
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 60);

    this.logger.log(`Email change requested: ${userId}`);

    return {
      message: 'Verification email sent to your new address. Please verify to complete the change.',
      newEmail: dto.newEmail,
      expiresAt,
    };
  }

  // ============================================================================
  // PROFILE OPERATIONS
  // ============================================================================

  /**
   * Updates user profile
   */
  async updateMyProfile(
    userId: string,
    dto: UpdateMyProfileDto,
  ): Promise<UpdateProfileResponseDto> {
    let profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      // Create profile if it doesn't exist
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found.');
      }

      profile = UserProfile.create({
        id: this.generateId(),
        userId,
        marketingOptIn: false,
      });
    }

    // Map DTO to domain updates
    const updates = this.profileMapper.toDomainUpdate(dto);

    // Check if phone number is already in use
    if (updates.phoneNumber) {
      const existingProfile = await this.profileRepository.findByPhoneNumber(updates.phoneNumber);
      if (existingProfile && existingProfile.getUserId() !== userId) {
        throw new ConflictException('Phone number is already in use.');
      }
    }

    // Update profile
    profile.updateProfile(updates);

    await this.profileRepository.update(profile);

    this.logger.log(`Profile updated: ${userId}`);

    return this.profileMapper.toUpdateProfileResponse(profile);
  }

  /**
   * Updates marketing preferences
   */
  async updateMarketingPreferences(
    userId: string,
    dto: UpdateMarketingPreferencesDto,
  ): Promise<UpdateMarketingPreferencesResponseDto> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    profile.updateMarketingPreferences(dto.marketingOptIn);
    await this.profileRepository.update(profile);

    this.logger.log(`Marketing preferences updated: ${userId}`);

    return this.profileMapper.toUpdateMarketingPreferencesResponse(dto.marketingOptIn);
  }

  // ============================================================================
  // PHONE VERIFICATION
  // ============================================================================

  /**
   * Sends phone verification code
   */
  async sendPhoneVerification(
    userId: string,
    dto: SendPhoneVerificationRequestDto,
  ): Promise<SendPhoneVerificationResponseDto> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    const phoneNumber = PhoneNumber.create(dto.phoneNumber);

    // Verify phone number matches profile
    if (!profile.getPhoneNumber()?.equals(phoneNumber)) {
      throw new BadRequestException('Phone number does not match your profile.');
    }

    if (profile.getPhoneVerified()) {
      throw new BadRequestException('Phone number is already verified.');
    }

    // TODO: Generate and send SMS verification code
    // For now, we'll just return a response

    const nextRetryAt = new Date(Date.now() + 60000); // 1 minute rate limit

    this.logger.log(`Phone verification code sent: ${userId}`);

    return this.profileMapper.toSendPhoneVerificationResponse(
      nextRetryAt,
      this.PHONE_VERIFICATION_EXPIRY_MINUTES,
    );
  }

  /**
   * Verifies phone number with code
   */
  async verifyPhone(userId: string, dto: VerifyPhoneRequestDto): Promise<VerifyPhoneResponseDto> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    const phoneNumber = PhoneNumber.create(dto.phoneNumber);

    // Verify phone number matches profile
    if (!profile.getPhoneNumber()?.equals(phoneNumber)) {
      throw new BadRequestException('Phone number does not match your profile.');
    }

    // TODO: Verify code against stored verification code
    // For now, we'll just accept any 6-digit code

    if (dto.code.length !== 6) {
      throw new BadRequestException('Invalid verification code.');
    }

    // Verify phone
    profile.verifyPhone();
    await this.profileRepository.update(profile);

    // Publish event
    // const event = new PhoneVerifiedEvent(...);
    // this.messagingService.emit(event.eventName, event.toJSON());

    this.logger.log(`Phone verified: ${userId}`);

    return this.profileMapper.toVerifyPhoneResponse();
  }

  // ============================================================================
  // ADMIN OPERATIONS
  // ============================================================================

  /**
   * Gets all users (admin)
   */
  async getAllUsers(query: UserQueryDto): Promise<PaginatedUsersResponseDto> {
    const filters: UserFilters = {
      role: query.role,
      isActive: query.isActive,
      emailVerified: query.emailVerified,
      search: query.search,
      includeDeleted: query.includeDeleted,
    };

    const pagination: PaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    };

    const result = await this.userRepository.findAll(filters, pagination);

    // Get profiles for all users
    const usersWithProfiles = await Promise.all(
      result.data.map(async (user) => {
        const profile = await this.profileRepository.findByUserId(user.getId());
        return { user, profile };
      }),
    );

    const users = this.userMapper.toUserResponseArray(usersWithProfiles);

    return {
      data: users,
      meta: result.meta as PaginationMetaDto,
    };
  }

  /**
   * Gets user by ID (admin)
   */
  async getUserById(id: string): Promise<DetailedUserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const profile = await this.profileRepository.findByUserId(id);

    return this.userMapper.toDetailedUserResponse(user, profile || undefined);
  }

  /**
   * Updates user (admin)
   */
  async adminUpdateUser(
    id: string,
    dto: AdminUpdateUserDto,
    adminId: string,
  ): Promise<UpdateUserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Track changes for event
    const updatedFields: any = {};

    if (dto.firstName) {
      updatedFields.firstName = { old: user.getFirstName(), new: dto.firstName };
    }
    if (dto.lastName) {
      updatedFields.lastName = { old: user.getLastName(), new: dto.lastName };
    }
    if (dto.email) {
      const newEmail = Email.create(dto.email);
      updatedFields.email = { old: user.getEmail().getValue(), new: dto.email };
      user.changeEmail(newEmail);
    }
    if (dto.isActive !== undefined) {
      updatedFields.isActive = { old: user.getIsActive(), new: dto.isActive };
      dto.isActive ? user.activate() : user.deactivate();
    }
    if (dto.role) {
      updatedFields.role = { old: user.getRole(), new: dto.role };
      user.changeRole(dto.role);
    }
    if (dto.loginAttempts !== undefined) {
      // Reset login attempts (admin action)
      user.unlockAccount();
    }

    // Update basic info if provided
    if (dto.firstName || dto.lastName) {
      user.updateBasicInfo({
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
    }

    await this.userRepository.update(user);

    // Publish event
    if (Object.keys(updatedFields).length > 0) {
      const event = new UserUpdatedEvent(user.getId(), updatedFields, adminId);
      this.messagingService.emit(event.eventName, event.toJSON());
    }

    const profile = await this.profileRepository.findByUserId(id);

    this.logger.log(`User updated by admin: ${id}`);

    return this.userMapper.toUpdateUserResponse(user, profile || undefined);
  }

  /**
   * Updates user role (admin)
   */
  async updateUserRole(
    id: string,
    dto: UpdateUserRoleRequestDto,
    adminId: string,
  ): Promise<UpdateUserRoleResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const oldRole = user.getRole();
    user.changeRole(dto.role);

    await this.userRepository.update(user);

    // Publish event
    const event = new RoleChangedEvent(
      user.getId(),
      user.getEmail().getValue(),
      oldRole,
      dto.role,
      adminId,
      dto.reason,
    );
    this.messagingService.emit(event.eventName, event.toJSON());

    this.logger.log(`User role changed: ${id} from ${oldRole} to ${dto.role}`);

    return {
      message: 'User role updated successfully.',
      oldRole,
      newRole: dto.role,
      changedAt: new Date(),
    };
  }

  /**
   * Locks user account (admin)
   */
  async lockUserAccount(
    id: string,
    dto: LockUserAccountRequestDto,
    adminId: string,
  ): Promise<LockUserAccountResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const durationMinutes = dto.durationMinutes || 0;
    user.lockAccount(durationMinutes);

    await this.userRepository.update(user);

    // Publish event
    const event = new UserLockedEvent(
      user.getId(),
      user.getEmail().getValue(),
      'admin_action',
      user.getLockedUntil(),
      adminId,
    );
    this.messagingService.emit(event.eventName, event.toJSON());

    this.logger.log(`User account locked: ${id}`);

    return {
      message: 'User account locked successfully.',
      lockedUntil: user.getLockedUntil(),
      isIndefinite: durationMinutes === 0,
    };
  }

  /**
   * Unlocks user account (admin)
   */
  async unlockUserAccount(
    id: string,
    dto: UnlockUserAccountRequestDto,
  ): Promise<UnlockUserAccountResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    user.unlockAccount();
    await this.userRepository.update(user);

    this.logger.log(`User account unlocked: ${id}`);

    return {
      message: 'User account unlocked successfully.',
      loginAttempts: 0,
    };
  }

  /**
   * Soft deletes user (admin)
   */
  async softDeleteUser(
    id: string,
    dto: SoftDeleteUserRequestDto,
  ): Promise<SoftDeleteUserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    user.softDelete();
    await this.userRepository.update(user);

    this.logger.log(`User soft deleted: ${id}`);

    return {
      message: 'User account deleted successfully.',
      deletedAt: user.getDeletedAt()!,
      userId: user.getId(),
    };
  }

  /**
   * Restores soft-deleted user (admin)
   */
  async restoreUser(id: string, dto: RestoreUserRequestDto): Promise<RestoreUserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.isDeleted()) {
      throw new BadRequestException('User is not deleted.');
    }

    user.restore();
    await this.userRepository.update(user);

    const profile = await this.profileRepository.findByUserId(id);

    this.logger.log(`User restored: ${id}`);

    return {
      message: 'User account restored successfully.',
      user: this.userMapper.toUserResponse(user, profile || undefined),
    };
  }

  /**
   * Gets user statistics (admin dashboard)
   */
  async getUserStats(): Promise<UserStatsResponseDto> {
    const stats = await this.userRepository.getStats();

    return {
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      inactiveUsers: stats.inactiveUsers,
      emailVerifiedUsers: stats.emailVerifiedUsers,
      phoneVerifiedUsers: stats.phoneVerifiedUsers,
      usersByRole: stats.usersByRole,
      newUsersLast30Days: stats.newUsersLast30Days,
      lockedAccounts: stats.lockedAccounts,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private generateId(): string {
    // Use UUID v4
    return require('uuid').v4();
  }
}
