import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService, User, UserProfile } from '@shamba/database';
import { UserQueryDto } from '@shamba/common';

/**
 * UsersRepository - Pure Data Access Layer
 *
 * ARCHITECTURAL PRINCIPLES:
 * -------------------------
 * 1. NO business logic (validation, password hashing, token generation)
 * 2. NO domain rules (checking duplicates, enforcing constraints)
 * 3. ONLY database queries and transactions
 * 4. Returns raw Prisma types (User, UserProfile)
 *
 * The SERVICE layer is responsible for:
 * - Business logic and validation
 * - Password hashing and security
 * - Duplicate checks and domain rules
 * - Event publishing
 *
 * This separation enables:
 * - Easy testing (mock repository, not database)
 * - Clear responsibilities
 * - Database-agnostic business logic
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ========================================================================
  // CREATE OPERATIONS
  // ========================================================================

  /**
   * Create a new user with optional profile data
   * @param data - User creation data (password should already be hashed)
   * @returns Created user (without relations by default)
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /**
   * Create user with profile in a single transaction
   * @param userData - User fields
   * @param profileData - Profile fields (optional)
   * @returns User with profile included
   */
  async createWithProfile(
    userData: Omit<Prisma.UserCreateInput, 'profile'>,
    profileData?: Omit<Prisma.UserProfileCreateInput, 'user'>,
  ): Promise<User & { profile: UserProfile | null }> {
    return this.prisma.user.create({
      data: {
        ...userData,
        profile: profileData ? { create: profileData } : undefined,
      },
      include: { profile: true },
    });
  }

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  /**
   * Find user by ID (returns null if not found)
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Find user by ID with profile included (returns null if not found)
   */
  async findByIdWithProfile(id: string): Promise<(User & { profile: UserProfile | null }) | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  /**
   * Find user by email (returns null if not found)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Find user by email with profile included (returns null if not found)
   */
  async findByEmailWithProfile(
    email: string,
  ): Promise<(User & { profile: UserProfile | null }) | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  /**
   * Find one user or throw NotFoundException
   * @throws NotFoundException if user not found
   */
  async findOneOrFail(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const user = await this.prisma.user.findUnique({ where });
    if (!user) {
      const identifier = where.id || where.email || 'unknown';
      throw new NotFoundException(`User with identifier '${identifier}' not found`);
    }
    return user;
  }

  /**
   * Find one user with profile or throw NotFoundException
   * @throws NotFoundException if user not found
   */
  async findOneOrFailWithProfile(
    where: Prisma.UserWhereUniqueInput,
  ): Promise<User & { profile: UserProfile | null }> {
    const user = await this.prisma.user.findUnique({
      where,
      include: { profile: true },
    });
    if (!user) {
      const identifier = where.id || where.email || 'unknown';
      throw new NotFoundException(`User with identifier '${identifier}' not found`);
    }
    return user;
  }

  /**
   * Paginated user search with filters and sorting
   * @returns Object containing users array and total count
   */
  async findMany(query: UserQueryDto): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 10, search, role, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    // Full-text search across email and names
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by role
    if (role) {
      where.role = role;
    }

    // Execute query and count in parallel for performance
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  /**
   * Check if user exists by email (efficient existence check)
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  /**
   * Check if user exists by ID (efficient existence check)
   */
  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { id } });
    return count > 0;
  }

  // ========================================================================
  // UPDATE OPERATIONS
  // ========================================================================

  /**
   * Update user by ID
   * @throws PrismaClientKnownRequestError if user not found (P2025)
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Update user and return with profile included
   */
  async updateWithProfile(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<User & { profile: UserProfile | null }> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: { profile: true },
    });
  }

  // ========================================================================
  // DELETE OPERATIONS
  // ========================================================================

  /**
   * Delete user by ID
   * Cascading deletes (profile, tokens, etc.) are handled by Prisma schema
   * @throws PrismaClientKnownRequestError if user not found (P2025)
   */
  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }

  /**
   * Soft delete user (if soft delete pattern is needed in the future)
   * NOTE: Currently not implemented in schema - placeholder for future use
   */
  // async softDelete(id: string): Promise<User> {
  //   return this.prisma.user.update({
  //     where: { id },
  //     data: { deletedAt: new Date() },
  //   });
  // }
}
