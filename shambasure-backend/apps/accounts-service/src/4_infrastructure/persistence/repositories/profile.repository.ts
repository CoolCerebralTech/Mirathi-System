import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@shamba/database';
import {
  IProfileRepository,
  ProfileFilters,
} from '../../../3_domain/interfaces/user-profile.repository.interface';
import { UserProfile } from '../../../3_domain/models/user-profile.model';
import { PhoneNumber } from '../../../3_domain/value-objects';
import { ProfilePersistenceMapper } from '../mappers/profile.mapper';

@Injectable()
export class PrismaProfileRepository implements IProfileRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: ProfilePersistenceMapper,
  ) {}

  async save(profile: UserProfile): Promise<void> {
    const createData = this.mapper.toCreatePersistence(profile);
    const updateData = this.mapper.toUpdatePersistence(profile);

    await this.prisma.userProfile.upsert({
      where: { id: profile.id },
      create: createData,
      update: updateData,
    });
  }

  async findById(id: string): Promise<UserProfile | null> {
    const entity = await this.prisma.userProfile.findUnique({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<UserProfile | null> {
    const entity = await this.prisma.userProfile.findUnique({ where: { userId } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByPhoneNumber(phoneNumber: PhoneNumber): Promise<UserProfile | null> {
    const entity = await this.prisma.userProfile.findFirst({
      where: { phoneNumber: phoneNumber.getValue() },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async isPhoneNumberUnique(phoneNumber: PhoneNumber): Promise<boolean> {
    const count = await this.prisma.userProfile.count({
      where: { phoneNumber: phoneNumber.getValue() },
    });
    return count === 0;
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.userProfile.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return; // Record to delete does not exist, which is fine.
      }
      throw error;
    }
  }

  async findAll(filters: ProfileFilters): Promise<UserProfile[]> {
    const where: Prisma.UserProfileWhereInput = this.buildWhereClause(filters);
    const entities = await this.prisma.userProfile.findMany({ where });

    // FIX: Use an arrow function to preserve the `this` context for the mapper.
    return entities.map((entity) => this.mapper.toDomain(entity));
  }

  private buildWhereClause(filters: ProfileFilters): Prisma.UserProfileWhereInput {
    const where: Prisma.UserProfileWhereInput = {};
    if (filters.isEmailVerified !== undefined) where.emailVerified = filters.isEmailVerified;
    if (filters.isPhoneVerified !== undefined) where.phoneVerified = filters.isPhoneVerified;
    if (filters.hasMarketingOptIn !== undefined) where.marketingOptIn = filters.hasMarketingOptIn;

    // Check for `isComplete` filter.
    // We assume `isComplete: false` is not a filter criteria, only `isComplete: true`.
    if (filters.isComplete === true) {
      where.AND = [
        { emailVerified: true },
        { phoneVerified: true },
        { address: { not: Prisma.JsonNull } },
        { nextOfKin: { not: Prisma.JsonNull } },
      ];
    }
    return where;
  }
}
