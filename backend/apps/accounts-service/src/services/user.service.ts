import { Injectable, ConflictException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { UserEntity } from '../entities/user.entity';
import { AuthService, PasswordService } from '@shamba/auth';
import { MessagingService } from '@shamba/messaging';
import { LoggerService } from '@shamba/observability';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserQueryDto, 
  RegisterDto, 
  LoginDto, 
  ChangePasswordDto,
  ResetPasswordDto,
  ForgotPasswordDto,
  AuthResponseDto,
  UserResponseDto 
} from '@shamba/common';
import { EventType } from '@shamba/common';
import { JwtPayload } from '@shamba/auth';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private authService: AuthService,
    private passwordService: PasswordService,
    private messagingService: MessagingService,
    private logger: LoggerService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.info('Registering new user', 'UserService', { email: registerDto.email });

    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(registerDto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors,
      });
    }

    const userEntity = await this.userRepository.create(registerDto);
    
    // Generate authentication tokens
    const authResult = await this.authService.register(registerDto);

    // Publish user created event
    await this.messagingService.publish(EventType.USER_CREATED, {
      userId: userEntity.id,
      email: userEntity.email,
      firstName: userEntity.firstName,
      lastName: userEntity.lastName,
      role: userEntity.role,
      timestamp: new Date(),
    });

    this.logger.info('User registered successfully', 'UserService', { userId: userEntity.id });

    return authResult;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.info('User login attempt', 'UserService', { email: loginDto.email });

    try {
      const authResult = await this.authService.login(loginDto);
      
      this.logger.info('User login successful', 'UserService', { 
        userId: authResult.user.id,
        email: authResult.user.email,
      });

      return authResult;
    } catch (error) {
      this.logger.warn('User login failed', 'UserService', { 
        email: loginDto.email,
        error: error.message,
      });
      throw error;
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    this.logger.debug('Refreshing authentication tokens', 'UserService');

    try {
      const tokens = await this.authService.refreshTokens(refreshToken);
      
      // Get user details for response
      const user = await this.userRepository.findById(tokens.accessToken.payload.userId);
      
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error('Token refresh failed', 'UserService', { error: error.message });
      throw error;
    }
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    this.logger.debug('Fetching user profile', 'UserService', { userId });

    const user = await this.userRepository.findById(userId);
    return this.mapToResponseDto(user);
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    this.logger.info('Updating user profile', 'UserService', { userId });

    const user = await this.userRepository.update(userId, updateUserDto);

    // Publish user updated event
    await this.messagingService.publish(EventType.USER_UPDATED, {
      userId: user.id,
      ...updateUserDto,
      timestamp: new Date(),
    });

    this.logger.info('User profile updated successfully', 'UserService', { userId });

    return this.mapToResponseDto(user);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    this.logger.info('Changing user password', 'UserService', { userId });

    await this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    // Invalidate any existing reset tokens
    await this.userRepository.invalidatePasswordResetTokens(userId);

    this.logger.info('User password changed successfully', 'UserService', { userId });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    this.logger.info('Processing forgot password request', 'UserService', { email });

    const user = await this.userRepository.findByEmail(email);
    
    // For security, we don't reveal if the email exists or not
    if (!user || !user.isEligibleForPasswordReset()) {
      this.logger.warn('Password reset requested for non-existent or inactive user', 'UserService', { email });
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    const { token, expiresAt } = await this.userRepository.createPasswordResetToken(user.id);

    // Publish password reset requested event
    await this.messagingService.publish(EventType.PASSWORD_RESET_REQUESTED, {
      userId: user.id,
      email: user.email,
      resetToken: token,
      expiresAt,
      timestamp: new Date(),
    });

    this.logger.info('Password reset token generated', 'UserService', { 
      userId: user.id,
      email: user.email,
    });

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    this.logger.info('Processing password reset', 'UserService');

    // Find user by valid reset token
    const users = await this.getAllUsersWithValidResetTokens();
    
    let userToReset: UserEntity | null = null;
    for (const user of users) {
      const isValid = await this.userRepository.validatePasswordResetToken(token, user.id);
      if (isValid) {
        userToReset = user;
        break;
      }
    }

    if (!userToReset) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Validate new password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors,
      });
    }

    // Update password
    await this.userRepository.updatePassword(userToReset.id, newPassword);
    
    // Invalidate all reset tokens for this user
    await this.userRepository.invalidatePasswordResetTokens(userToReset.id);

    // Publish password reset event
    await this.messagingService.publish('user.password_reset', {
      userId: userToReset.id,
      email: userToReset.email,
      timestamp: new Date(),
    });

    this.logger.info('Password reset successfully', 'UserService', { 
      userId: userToReset.id,
      email: userToReset.email,
    });

    return { message: 'Password has been reset successfully' };
  }

  async findAllUsers(query: UserQueryDto, currentUser: JwtPayload): Promise<any> {
    this.logger.debug('Fetching users list', 'UserService', { 
      userId: currentUser.userId,
      role: currentUser.role,
    });

    // Authorization check
    if (!this.canViewUsers(currentUser.role)) {
      throw new UnauthorizedException('Insufficient permissions to view users');
    }

    const result = await this.userRepository.findAll(query);
    
    return {
      users: result.users.map(user => this.mapToResponseDto(user)),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1,
      },
    };
  }

  async getUserById(id: string, currentUser: JwtPayload): Promise<UserResponseDto> {
    this.logger.debug('Fetching user by ID', 'UserService', { 
      targetUserId: id,
      currentUserId: currentUser.userId,
    });

    // Users can only view their own profile unless they're admin
    if (currentUser.userId !== id && !this.canViewUsers(currentUser.role)) {
      throw new UnauthorizedException('Insufficient permissions to view this user');
    }

    const user = await this.userRepository.findById(id);
    return this.mapToResponseDto(user);
  }

  async deleteUser(id: string, currentUser: JwtPayload): Promise<void> {
    this.logger.info('Deleting user', 'UserService', { 
      targetUserId: id,
      currentUserId: currentUser.userId,
    });

    // Prevent users from deleting themselves
    if (currentUser.userId === id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    // Authorization check
    if (!this.canManageUsers(currentUser.role)) {
      throw new UnauthorizedException('Insufficient permissions to delete users');
    }

    const user = await this.userRepository.findById(id);
    
    await this.userRepository.delete(id);

    // Publish user deleted event
    await this.messagingService.publish(EventType.USER_DELETED, {
      userId: user.id,
      email: user.email,
      deletedBy: currentUser.userId,
      timestamp: new Date(),
    });

    this.logger.info('User deleted successfully', 'UserService', { 
      targetUserId: id,
      currentUserId: currentUser.userId,
    });
  }

  async getStats(currentUser: JwtPayload): Promise<any> {
    this.logger.debug('Fetching user statistics', 'UserService', { 
      userId: currentUser.userId,
    });

    // Only admins can view stats
    if (!this.canViewUsers(currentUser.role)) {
      throw new UnauthorizedException('Insufficient permissions to view statistics');
    }

    const stats = await this.userRepository.getStats();

    return {
      ...stats,
      generatedAt: new Date().toISOString(),
    };
  }

  private async getAllUsersWithValidResetTokens(): Promise<UserEntity[]> {
    // This is a simplified implementation
    // In production, you'd want a more efficient query
    const allUsers = await this.userRepository.findAll({ page: 1, limit: 1000 });
    return allUsers.users.filter(user => user.isEligibleForPasswordReset());
  }

  private mapToResponseDto(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private canViewUsers(role: string): boolean {
    return role === 'ADMIN';
  }

  private canManageUsers(role: string): boolean {
    return role === 'ADMIN';
  }
}