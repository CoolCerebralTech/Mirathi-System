import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService, User } from '@shamba/database';
import { PaginationQueryDto, UserQueryDto } from '@shamba/common';

// ============================================================================
// ARCHITECTURAL NOTE: The Role of the Repository
// ============================================================================
// The Repository's ONLY responsibility is to query the database. It is a pure
// data access layer.
//
// - It does NOT contain business logic (e.g., checking for existing users).
// - It does NOT hash passwords.
// - It does NOT create or manage tokens.
//
// These responsibilities belong to the SERVICE layer (e.g., UsersService, AuthService).
// This separation makes our code easier to test, reason about, and maintain.
// ============================================================================

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
  
  async findOneOrFail(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const user = await this.prisma.user.findUnique({ where });
    if (!user) {
      throw new NotFoundException(`User not found.`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<User> {
    // Prisma's onDelete: Cascade handles related data deletion.
    // If more complex cleanup is needed, a transaction can be used here.
    return this.prisma.user.delete({ where: { id } });
  }

  async findMany(query: UserQueryDto): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 10, search, role, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

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

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }
}