import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserProfile, Address, NextOfKin } from '../../../3_domain/models/user-profile.model';
import { PhoneNumber } from '../../../3_domain/value-objects';
import { ProfileCreateData, ProfileEntity, ProfileUpdateData } from '../entities/user.entity';

/**
 * Persistence Mapper for the UserProfile entity.
 * Translates between the UserProfile domain model and Prisma's entity format.
 */
@Injectable()
export class ProfilePersistenceMapper {
  toDomain(entity: ProfileEntity): UserProfile {
    return UserProfile.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      bio: entity.bio,
      phoneNumber: entity.phoneNumber ? PhoneNumber.create(entity.phoneNumber) : null,
      phoneVerified: entity.phoneVerified,
      emailVerified: entity.emailVerified,
      marketingOptIn: entity.marketingOptIn,
      // Safely cast JSON fields from Prisma to our domain types
      address: entity.address as Address | null,
      nextOfKin: entity.nextOfKin as NextOfKin | null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  toCreatePersistence(profile: UserProfile): ProfileCreateData {
    return {
      id: profile.id,
      user: { connect: { id: profile.userId } }, // Connect to the parent User
      bio: profile.bio,
      phoneNumber: profile.phoneNumber?.getValue(),
      phoneVerified: profile.isPhoneVerified,
      emailVerified: profile.isEmailVerified,
      marketingOptIn: profile.marketingOptIn,
      // ✅ Explicitly cast domain objects to Prisma.InputJsonValue
      address: (profile.address as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      nextOfKin: (profile.nextOfKin as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    };
  }

  toUpdatePersistence(profile: UserProfile): ProfileUpdateData {
    return {
      bio: profile.bio,
      phoneNumber: profile.phoneNumber?.getValue(),
      phoneVerified: profile.isPhoneVerified,
      emailVerified: profile.isEmailVerified,
      marketingOptIn: profile.marketingOptIn,
      address: (profile.address as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      nextOfKin: (profile.nextOfKin as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      updatedAt: new Date(),
    };
  }
}
