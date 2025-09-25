import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from '@shamba/common';
import { PasswordService } from '@shamba/auth';

@Injectable()
export class UserRepository {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const { email, password, firstName, lastName, role } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      },
      include: {
        profile: true,
      },
    });

    return new UserEntity(user);
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        passwordResetTokens: {
          where: {
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return new UserEntity(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    return user ? new UserEntity(user) : null;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    await this.findById(id); // Verify user exists

    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: {
        profile: true,
      },
    });

    return new UserEntity(user);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id); // Verify user exists

    // Use transaction to ensure all related data is deleted
    await this.prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.passwordResetToken.deleteMany({
        where: { userId: id },
      });

      await tx.userProfile.deleteMany({
        where: { userId: id },
      });

      // Then delete user
      await tx.user.delete({
        where: { id },
      });
    });
  }

  async findAll(query: UserQueryDto): Promise<{
    users: UserEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, search, role, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder || 'desc' } : { createdAt: 'desc' },
        include: {
          profile: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map(user => new UserEntity(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.passwordService.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async createPasswordResetToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Delete any existing tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId },
    });

    const hashedToken = await this.passwordService.hashPassword(token);

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash: hashedToken,
        expiresAt,
        userId,
      },
    });

    return { token, expiresAt };
  }

  async validatePasswordResetToken(token: string, userId: string): Promise<boolean> {
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetToken) {
      return false;
    }

    return this.passwordService.comparePassword(token, resetToken.tokenHash);
  }

  async invalidatePasswordResetTokens(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId },
    });
  }

  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<string, number>;
    registrationsThisMonth: number;
  }> {
    const totalUsers = await this.prisma.user.count();
    
    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const registrationsThisMonth = await this.prisma.user.count({
      where: {
        createdAt: { gte: oneMonthAgo },
      },
    });

    const roleCounts: Record<string, number> = {};
    usersByRole.forEach(({ role, _count }) => {
      roleCounts[role] = _count;
    });

    return {
      totalUsers,
      activeUsers: totalUsers, // Assuming all users are active for now
      usersByRole: roleCounts,
      registrationsThisMonth,
    };
  }
}