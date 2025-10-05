// ============================================================================
// users.service.ts - User Management Business Logic
// ============================================================================

import { 
  Injectable, 
  ConflictException, 
  BadRequestException,
  Logger 
} from '@nestjs/common';
import { User, UserRole } from '@shamba/database';
import { 
  UserQueryDto, 
  EventPattern, 
  UserCreatedEvent,
  UserDeletedEvent,
  RegisterRequestDto
} from '@shamba/common';
import { UsersRepository } from '../repositories/users.repository';
import { MessagingService } from '@shamba/messaging';
import  bcrypt from 'bcrypt';

/**
 * UsersService - Core user management business logic
 * 
 * RESPONSIBILITIES:
 * - User CRUD operations with business rule validation
 * - Password hashing and security
 * - Duplicate email validation
 * - Event publishing for domain events
 * - Orchestrating repository calls
 * 
 * DOES NOT:
 * - Handle HTTP concerns (controllers do this)
 * - Query database directly (repository does this)
 * - Serialize responses (entities do this)
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly messagingService: MessagingService,
  ) {}

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  /**
   * Find user by ID (with profile)
   * @throws NotFoundException if user not found
   */
  async findOne(id: string): Promise<User & { profile: any }> {
    return this.usersRepository.findOneOrFailWithProfile({ id });
  }

  /**
   * Find user by ID (without profile) - for internal use
   * @throws NotFoundException if user not found
   */
  async findOneBasic(id: string): Promise<User> {
    return this.usersRepository.findOneOrFail({ id });
  }

  /**
   * Find user by email (returns null if not found)
   * Used by AuthService for login
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  /**
   * Paginated user listing with search and filters
   */
  async findMany(query: UserQueryDto): Promise<{ users: User[]; total: number }> {
    return this.usersRepository.findMany(query);
  }

  // ========================================================================
  // CREATE OPERATIONS
  // ========================================================================

  /**
   * Create a new user (called by AuthService during registration)
   * 
   * BUSINESS RULES:
   * - Email must be unique
   * - Password must be hashed
   * - Publishes UserCreatedEvent
   * 
   * @param data - User creation data with plain-text password
   * @returns Created user (with hashed password)
   * @throws ConflictException if email already exists
   */
  async createUserForRegistration(data: RegisterRequestDto): Promise<User> {
    // Validate email uniqueness
    const existingUser = await this.usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException(`Email '${data.email}' is already registered`);
    }

    // Hash password before storage
    const hashedPassword = await bcrypt.hash(data.password, this.BCRYPT_ROUNDS);

    // Create user
    const user = await this.usersRepository.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || UserRole.LAND_OWNER,
    });

    // Publish domain event
    const event: UserCreatedEvent = {
      type: EventPattern.USER_CREATED,
      timestamp: new Date(),
      version: '1.0',
      source: 'accounts-service',
      data: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };

    try {
      this.messagingService.emit(event);
    } catch (error) {
      // Log but don't fail the operation - event delivery is eventually consistent
      this.logger.error(
        `Failed to publish UserCreatedEvent for user ${user.id}`,
        error
      );
    }

    this.logger.log(`User created successfully: ${user.id} (${user.email})`);
    return user;
  }

  // ========================================================================
  // UPDATE OPERATIONS
  // ========================================================================

  /**
   * Update user password
   * @param userId - User ID
   * @param newPassword - Plain-text new password
   * @throws NotFoundException if user not found
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    // Ensure user exists
    await this.usersRepository.findOneOrFail({ id: userId });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

    // Update password
    await this.usersRepository.update(userId, {
      password: hashedPassword,
    });

    this.logger.log(`Password updated for user ${userId}`);
  }

  /**
   * Update user role (admin operation)
   * @throws NotFoundException if user not found
   * @throws BadRequestException if trying to change own role
   */
  async updateRole(
    userId: string, 
    newRole: UserRole, 
    actorId: string
  ): Promise<User> {
    // Prevent self-role modification
    if (userId === actorId) {
      throw new BadRequestException('Cannot modify your own role');
    }

    // Update role
    const updatedUser = await this.usersRepository.update(userId, {
      role: newRole,
    });

    this.logger.log(`User ${userId} role updated to ${newRole} by ${actorId}`);
    return updatedUser;
  }

  // ========================================================================
  // DELETE OPERATIONS
  // ========================================================================

  /**
   * Delete user and all associated data
   * 
   * BUSINESS RULES:
   * - Cascading deletes handled by Prisma schema
   * - Publishes UserDeletedEvent
   * 
   * @throws NotFoundException if user not found
   */
  async delete(id: string): Promise<User> {
    // Ensure user exists
    await this.usersRepository.findOneOrFail({ id });

    // Delete user (cascades to profile, tokens, etc.)
    const deletedUser = await this.usersRepository.delete(id);

    // Publish domain event
    const event: UserDeletedEvent = {
      type: EventPattern.USER_DELETED,
      timestamp: new Date(),
      version: '1.0',
      source: 'accounts-service',
      data: {
        userId: deletedUser.id,
        email: deletedUser.email,
      },
    };

    try {
      this.messagingService.emit(event);
    } catch (error) {
      this.logger.error(
        `Failed to publish UserDeletedEvent for user ${id}`,
        error
      );
    }

    this.logger.log(`User deleted: ${id} (${deletedUser.email})`);
    return deletedUser;
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Verify password against stored hash
   * Used by AuthService during login
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Check if email is available for registration
   */
  async isEmailAvailable(email: string): Promise<boolean> {
    return !(await this.usersRepository.existsByEmail(email));
  }
}

