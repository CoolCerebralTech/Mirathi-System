import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@shamba/database';
import {
  IUserRepository,
  UserFilters,
  PaginationOptions,
  PaginatedResult,
  UserStats,
  UserUpdateData,
} from '../../../3_domain/interfaces/user.repository.interface';
import { User } from '../../../3_domain/models/user.model';
import { Email } from '../../../3_domain/value-objects';
import { UserInclude } from '../entities/user.entity';
import { UserPersistenceMapper } from '../mappers/user.mapper';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserPersistenceMapper,
  ) {}

  async save(user: User): Promise<void> {
    const createData = this.mapper.toCreatePersistence(user);
    const updateData = this.mapper.toUpdatePersistence(user);

    await this.prisma.user.upsert({
      where: { id: user.id },
      create: createData,
      update: updateData,
    });
  }

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.prisma.user.findUnique({
      where: { id },
      include: UserInclude,
    });
    return userEntity ? this.mapper.toDomain(userEntity) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userEntity = await this.prisma.user.findUnique({
      where: { email: email.getValue() },
      include: UserInclude,
    });
    return userEntity ? this.mapper.toDomain(userEntity) : null;
  }

  async findAll(
    filters: UserFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<User>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filters);

    const [userEntities, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: UserInclude,
        skip,
        take: limit,
        orderBy: { [pagination.sortBy ?? 'createdAt']: pagination.sortOrder ?? 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: userEntities.map((entity) => this.mapper.toDomain(entity)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email: email.getValue() } });
    return count > 0;
  }

  async getStats(): Promise<UserStats> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedFilter = { deletedAt: { not: null } };
    const lockedFilter = { lockedUntil: { not: null }, deletedAt: null };

    const results = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.user.count({ where: deletedFilter }),
      this.prisma.user.count({ where: lockedFilter }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true },
        where: { deletedAt: null },
        orderBy: { role: 'asc' },
      }),
    ]);

    // Destructure with explicit types
    const [totalWithDeleted, active, deleted, locked, newLast30Days, byRoleRaw] = results as [
      number,
      number,
      number,
      number,
      number,
      { role: UserRole; _count: { _all: number } }[],
    ];

    const initialRoleStats: Record<UserRole, number> = {
      [UserRole.USER]: 0,
      [UserRole.ADMIN]: 0,
      [UserRole.VERIFIER]: 0,
      [UserRole.AUDITOR]: 0,
    };

    const byRoleStats = byRoleRaw.reduce<Record<UserRole, number>>((acc, group) => {
      acc[group.role] = group._count._all;
      return acc;
    }, initialRoleStats);

    const total = totalWithDeleted - deleted;

    return {
      total,
      active,
      inactive: total - active,
      deleted,
      locked,
      newLast30Days,
      byRole: byRoleStats,
    };
  }

  async bulkUpdate(userIds: string[], data: UserUpdateData): Promise<number> {
    const result = await this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data,
    });
    return result.count;
  }

  private buildWhereClause(filters: UserFilters): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (filters.isDeleted) {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.role) where.role = filters.role;
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }
}
