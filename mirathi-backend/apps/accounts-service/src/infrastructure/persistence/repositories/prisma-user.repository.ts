// src/infrastructure/persistence/repositories/prisma-user.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { AuthProvider, Prisma } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { User } from '../../../domain/aggregates/user.aggregate';
import { UserRepositoryPort } from '../../../domain/ports';
import { PrismaUserModel, UserMapper } from '../mappers/user.mapper';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  private readonly logger = new Logger(PrismaUserRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userMapper: UserMapper,
  ) {}

  async findById(id: string): Promise<User | null> {
    try {
      const prismaUser = await this.prisma.user.findUnique({
        where: { id, deletedAt: null },
        include: {
          identities: true,
          profile: true,
          settings: true,
        },
      });

      if (!prismaUser) {
        return null;
      }

      // Cast to the Mapper's expected interface (Prisma types are compatible)
      return this.userMapper.toDomain(prismaUser as unknown as PrismaUserModel);
    } catch (error) {
      this.logger.error(`Failed to find user by id ${id}:`, error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const prismaUser = await this.prisma.user.findFirst({
        where: {
          deletedAt: null,
          identities: {
            some: {
              email: {
                equals: email,
                mode: 'insensitive',
              },
            },
          },
        },
        include: {
          identities: true,
          profile: true,
          settings: true,
        },
      });

      if (!prismaUser) {
        return null;
      }

      return this.userMapper.toDomain(prismaUser as unknown as PrismaUserModel);
    } catch (error) {
      this.logger.error(`Failed to find user by email ${email}:`, error);
      throw error;
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    try {
      const prismaUser = await this.prisma.user.findFirst({
        where: {
          deletedAt: null,
          profile: {
            phoneNumber: phoneNumber,
          },
        },
        include: {
          identities: true,
          profile: true,
          settings: true,
        },
      });

      if (!prismaUser) {
        return null;
      }

      return this.userMapper.toDomain(prismaUser as unknown as PrismaUserModel);
    } catch (error) {
      this.logger.error(`Failed to find user by phone number ${phoneNumber}:`, error);
      throw error;
    }
  }

  async findByProviderIdentity(provider: string, providerUserId: string): Promise<User | null> {
    try {
      // FIX: Ensure provider string matches the Enum type for the query
      const providerEnum = provider as AuthProvider;

      const prismaUser = await this.prisma.user.findFirst({
        where: {
          deletedAt: null,
          identities: {
            some: {
              provider: providerEnum,
              providerUserId,
            },
          },
        },
        include: {
          identities: true,
          profile: true,
          settings: true,
        },
      });

      if (!prismaUser) {
        return null;
      }

      return this.userMapper.toDomain(prismaUser as unknown as PrismaUserModel);
    } catch (error) {
      this.logger.error(
        `Failed to find user by provider ${provider}, userId ${providerUserId}:`,
        error,
      );
      throw error;
    }
  }

  async findByCriteria(criteria: {
    status?: string;
    role?: string;
    county?: string;
    createdAtFrom?: Date;
    createdAtTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; total: number }> {
    try {
      const where: Prisma.UserWhereInput = { deletedAt: null };

      if (criteria.status) {
        where.status = criteria.status as any; // Cast to Enum
      }

      if (criteria.role) {
        where.role = criteria.role as any; // Cast to Enum
      }

      if (criteria.county) {
        where.profile = {
          county: criteria.county as any, // Cast to Enum
        };
      }

      if (criteria.createdAtFrom || criteria.createdAtTo) {
        where.createdAt = {};
        if (criteria.createdAtFrom) {
          where.createdAt.gte = criteria.createdAtFrom;
        }
        if (criteria.createdAtTo) {
          where.createdAt.lte = criteria.createdAtTo;
        }
      }

      const [prismaUsers, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: {
            identities: true,
            profile: true,
            settings: true,
          },
          skip: criteria.offset,
          take: criteria.limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      const users = prismaUsers.map((prismaUser) =>
        this.userMapper.toDomain(prismaUser as unknown as PrismaUserModel),
      );

      return { users, total };
    } catch (error) {
      this.logger.error('Failed to find users by criteria:', error);
      throw error;
    }
  }

  async save(user: User): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      const { userData, identitiesData, profileData, settingsData } =
        this.userMapper.toPersistence(user);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userData.id },
      });

      if (existingUser) {
        // Update existing user
        await prisma.user.update({
          where: { id: userData.id },
          data: {
            role: userData.role,
            status: userData.status,
            updatedAt: userData.updatedAt,
            deletedAt: userData.deletedAt,
          },
        });

        // Update identities
        await this.updateIdentities(prisma, userData.id, identitiesData);

        // Update profile
        if (profileData && user.profile) {
          // FIX: Explicit typing for upsert inputs
          // Cast the profileData to satisfy Prisma's strict input types
          // The Mapper returns interfaces with 'string | null', but Prisma update inputs
          // might require omitting keys or specific structures.
          // Using explicit casts or mapped types solves this.
          const updateInput: Prisma.UserProfileUpdateInput = {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            avatarUrl: user.profile.avatarUrl ?? null,
            phoneNumber: user.profile.phoneNumber?.value ?? null,
            phoneVerified: user.profile.phoneVerified,
            county: (user.profile.county?.value as any) ?? null,
            physicalAddress: user.profile.physicalAddress ?? null,
            postalAddress: user.profile.postalAddress ?? null,
            updatedAt: user.profile.updatedAt.value,
          };

          const createInput: Prisma.UserProfileCreateInput = {
            id: profileData.id,
            user: { connect: { id: userData.id } }, // Connect to user
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            avatarUrl: profileData.avatarUrl,
            phoneNumber: profileData.phoneNumber,
            phoneVerified: profileData.phoneVerified,
            county: profileData.county as any,
            physicalAddress: profileData.physicalAddress,
            postalAddress: profileData.postalAddress,
            updatedAt: profileData.updatedAt,
          };

          await prisma.userProfile.upsert({
            where: { userId: userData.id },
            update: updateInput,
            create: createInput,
          });
        }

        // Update settings
        if (settingsData && user.settings) {
          const updateInput: Prisma.UserSettingsUpdateInput = {
            language: user.settings.language,
            theme: user.settings.theme,
            emailNotifications: user.settings.emailNotifications,
            smsNotifications: user.settings.smsNotifications,
            pushNotifications: user.settings.pushNotifications,
            marketingOptIn: user.settings.marketingOptIn,
            updatedAt: user.settings.updatedAt.value,
          };

          const createInput: Prisma.UserSettingsCreateInput = {
            id: settingsData.id,
            user: { connect: { id: userData.id } },
            language: settingsData.language as any,
            theme: settingsData.theme as any,
            emailNotifications: settingsData.emailNotifications,
            smsNotifications: settingsData.smsNotifications,
            pushNotifications: settingsData.pushNotifications,
            marketingOptIn: settingsData.marketingOptIn,
            updatedAt: settingsData.updatedAt,
          };

          await prisma.userSettings.upsert({
            where: { userId: userData.id },
            update: updateInput,
            create: createInput,
          });
        }
      } else {
        // Create new user with nested writes
        // FIX: Cast identitiesData to proper create inputs
        const identitiesCreate = identitiesData.map((id) => ({
          id: id.id,
          provider: id.provider as AuthProvider,
          providerUserId: id.providerUserId,
          email: id.email,
          isPrimary: id.isPrimary,
          linkedAt: id.linkedAt,
          lastUsedAt: id.lastUsedAt,
        }));

        const profileCreate = profileData
          ? {
              create: {
                id: profileData.id,
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                avatarUrl: profileData.avatarUrl,
                phoneNumber: profileData.phoneNumber,
                phoneVerified: profileData.phoneVerified,
                county: profileData.county as any,
                physicalAddress: profileData.physicalAddress,
                postalAddress: profileData.postalAddress,
                updatedAt: profileData.updatedAt,
              },
            }
          : undefined;

        const settingsCreate = settingsData
          ? {
              create: {
                id: settingsData.id,
                language: settingsData.language as any,
                theme: settingsData.theme as any,
                emailNotifications: settingsData.emailNotifications,
                smsNotifications: settingsData.smsNotifications,
                pushNotifications: settingsData.pushNotifications,
                marketingOptIn: settingsData.marketingOptIn,
                updatedAt: settingsData.updatedAt,
              },
            }
          : undefined;

        await prisma.user.create({
          data: {
            ...userData,
            identities: {
              create: identitiesCreate,
            },
            profile: profileCreate,
            settings: settingsCreate,
          },
        });
      }
    });

    user.clearDomainEvents();
  }

  private async updateIdentities(
    prisma: Prisma.TransactionClient,
    userId: string,
    identitiesData: any[],
  ): Promise<void> {
    // Get existing identities
    const existingIdentities = await prisma.userIdentity.findMany({
      where: { userId },
    });

    // Identify identities to create, update, or delete
    const existingMap = new Map(existingIdentities.map((id) => [id.id, id]));
    const newMap = new Map(identitiesData.map((id) => [id.id, id]));

    // Delete identities not in new data
    const toDelete = existingIdentities.filter((id) => !newMap.has(id.id));
    if (toDelete.length > 0) {
      await prisma.userIdentity.deleteMany({
        where: {
          id: { in: toDelete.map((id) => id.id) },
        },
      });
    }

    // Create or update identities
    for (const identityData of identitiesData) {
      if (existingMap.has(identityData.id)) {
        // Update existing
        await prisma.userIdentity.update({
          where: { id: identityData.id },
          data: {
            provider: identityData.provider as AuthProvider,
            providerUserId: identityData.providerUserId,
            email: identityData.email,
            isPrimary: identityData.isPrimary,
            lastUsedAt: identityData.lastUsedAt,
          },
        });
      } else {
        // Create new
        await prisma.userIdentity.create({
          data: {
            id: identityData.id,
            userId,
            provider: identityData.provider as AuthProvider,
            providerUserId: identityData.providerUserId,
            email: identityData.email,
            isPrimary: identityData.isPrimary,
            linkedAt: identityData.linkedAt,
            lastUsedAt: identityData.lastUsedAt,
          },
        });
      }
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: 'ARCHIVED',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to delete user ${id}:`, error);
      throw error;
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    try {
      const count = await this.prisma.userIdentity.count({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
          user: {
            deletedAt: null,
          },
        },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check if email exists ${email}:`, error);
      throw error;
    }
  }

  async existsByPhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      const count = await this.prisma.userProfile.count({
        where: {
          phoneNumber,
          user: {
            deletedAt: null,
          },
        },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check if phone number exists ${phoneNumber}:`, error);
      throw error;
    }
  }

  async existsByProviderIdentity(provider: string, providerUserId: string): Promise<boolean> {
    try {
      const count = await this.prisma.userIdentity.count({
        where: {
          provider: provider as AuthProvider,
          providerUserId,
          user: {
            deletedAt: null,
          },
        },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(
        `Failed to check if provider identity exists ${provider}/${providerUserId}:`,
        error,
      );
      throw error;
    }
  }

  async getPaginatedUsers(options: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    try {
      const {
        page,
        limit,
        search,
        status,
        role,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;
      const skip = (page - 1) * limit;

      const where: Prisma.UserWhereInput = { deletedAt: null };

      if (status) {
        where.status = status as any;
      }

      if (role) {
        where.role = role as any;
      }

      if (search) {
        where.OR = [
          {
            profile: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
          {
            identities: {
              some: {
                email: { contains: search, mode: 'insensitive' },
              },
            },
          },
        ];
      }

      const [prismaUsers, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: {
            identities: true,
            profile: true,
            settings: true,
          },
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        this.prisma.user.count({ where }),
      ]);

      const users = prismaUsers.map((prismaUser) =>
        this.userMapper.toDomain(prismaUser as unknown as PrismaUserModel),
      );

      const totalPages = Math.ceil(total / limit);

      return { users, total, page, totalPages };
    } catch (error) {
      this.logger.error('Failed to get paginated users:', error);
      throw error;
    }
  }

  async countByStatus(): Promise<{ [status: string]: number }> {
    try {
      const counts = await this.prisma.user.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: {
          _all: true,
        },
      });

      return counts.reduce(
        (acc, { status, _count }) => {
          acc[status] = _count._all;
          return acc;
        },
        {} as Record<string, number>,
      );
    } catch (error) {
      this.logger.error('Failed to count users by status:', error);
      throw error;
    }
  }

  async countByRole(): Promise<{ [role: string]: number }> {
    try {
      const counts = await this.prisma.user.groupBy({
        by: ['role'],
        where: { deletedAt: null },
        _count: {
          _all: true,
        },
      });

      return counts.reduce(
        (acc, { role, _count }) => {
          acc[role] = _count._all;
          return acc;
        },
        {} as Record<string, number>,
      );
    } catch (error) {
      this.logger.error('Failed to count users by role:', error);
      throw error;
    }
  }
}
