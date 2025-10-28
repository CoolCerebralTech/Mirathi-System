import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RelationshipType } from '@shamba/common';
import { User } from '../../../3_domain/models/user.model';
import { UserProfile, Address, NextOfKin } from '../../../3_domain/models/user-profile.model';
import { Email, Password, PhoneNumber } from '../../../3_domain/value-objects';
import { UserEntity } from '../entities/user.entity';

// ============================================================================
// SAFE PARSERS & TYPE GUARDS (No changes needed here, they are correct)
// ============================================================================

function isRelationshipType(value: unknown): value is RelationshipType {
  return (
    typeof value === 'string' && Object.values(RelationshipType).includes(value as RelationshipType)
  );
}

function parseAddress(json: Prisma.JsonValue | null): Address | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;

  if (typeof obj.country !== 'string') {
    console.warn('Malformed Address JSON encountered in mapper:', json);
    return null;
  }

  return {
    street: typeof obj.street === 'string' ? obj.street : undefined,
    city: typeof obj.city === 'string' ? obj.city : undefined,
    county: typeof obj.county === 'string' ? obj.county : undefined,
    postalCode: typeof obj.postalCode === 'string' ? obj.postalCode : undefined,
    country: obj.country,
  };
}

function parseNextOfKin(json: Prisma.JsonValue | null): NextOfKin | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;

  if (
    typeof obj.fullName !== 'string' ||
    typeof obj.phoneNumber !== 'string' ||
    !isRelationshipType(obj.relationship)
  ) {
    console.warn('Malformed NextOfKin JSON encountered in mapper:', json);
    return null;
  }

  return {
    fullName: obj.fullName,
    relationship: obj.relationship,
    phoneNumber: obj.phoneNumber,
    email: typeof obj.email === 'string' ? obj.email : undefined,
    // ========================================================================
    // FIX FOR ERROR 1: Convert null to undefined to match the interface
    // ========================================================================
    address: parseAddress(obj.address as Prisma.JsonValue) ?? undefined,
  };
}

// ============================================================================
// USER MAPPER
// ============================================================================

@Injectable()
export class UserMapper {
  /**
   * Converts a Prisma UserEntity (with profile) into the rich User domain model.
   */
  toDomain(entity: UserEntity): User {
    if (!entity.profile) {
      throw new Error(`User entity with id ${entity.id} is missing its required profile relation.`);
    }

    const profile = UserProfile.fromPersistence({
      id: entity.profile.id,
      userId: entity.id,
      bio: entity.profile.bio,
      phoneNumber: entity.profile.phoneNumber
        ? PhoneNumber.create(entity.profile.phoneNumber)
        : null,
      phoneVerified: entity.profile.phoneVerified,
      emailVerified: entity.profile.emailVerified,
      marketingOptIn: entity.profile.marketingOptIn,
      address: parseAddress(entity.profile.address),
      nextOfKin: parseNextOfKin(entity.profile.nextOfKin),
      createdAt: entity.profile.createdAt,
      updatedAt: entity.profile.updatedAt,
    });

    return User.fromPersistence(
      {
        id: entity.id,
        email: Email.create(entity.email),
        password: Password.fromStoredHash(entity.password),
        firstName: entity.firstName,
        lastName: entity.lastName,
        role: entity.role,
        isActive: entity.isActive,
        lastLoginAt: entity.lastLoginAt,
        loginAttempts: entity.loginAttempts,
        lockedUntil: entity.lockedUntil,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        deletedAt: entity.deletedAt,
      },
      profile,
    );
  }

  profileToPersistence(profile: UserProfile): {
    create: Prisma.UserProfileUncheckedCreateInput;
    update: Prisma.UserProfileUncheckedUpdateInput;
  } {
    const primitives = profile.toPrimitives();

    const createData: Prisma.UserProfileUncheckedCreateInput = {
      id: primitives.id,
      userId: primitives.userId,
      bio: primitives.bio,
      phoneNumber: primitives.phoneNumber,
      phoneVerified: primitives.phoneVerified,
      emailVerified: primitives.emailVerified,
      marketingOptIn: primitives.marketingOptIn,
      address: (primitives.address as Prisma.JsonValue) ?? Prisma.JsonNull,
      nextOfKin: (primitives.nextOfKin as Prisma.JsonValue) ?? Prisma.JsonNull,
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt,
    };

    const updateData: Prisma.UserProfileUncheckedUpdateInput = {
      bio: primitives.bio,
      phoneNumber: primitives.phoneNumber,
      phoneVerified: primitives.phoneVerified,
      emailVerified: primitives.emailVerified,
      marketingOptIn: primitives.marketingOptIn,
      address: (primitives.address as Prisma.JsonValue) ?? Prisma.JsonNull,
      nextOfKin: (primitives.nextOfKin as Prisma.JsonValue) ?? Prisma.JsonNull,
      updatedAt: primitives.updatedAt,
    };

    return { create: createData, update: updateData };
  }
  /**
   * Converts a User domain model into Prisma upsert data.
   */
  toPersistence(user: User): {
    create: Prisma.UserCreateInput;
    update: Prisma.UserUpdateInput;
  } {
    const userPrimitives = user.toPrimitives();
    const profilePrimitives = user.profile.toPrimitives();

    const createData: Prisma.UserCreateInput = {
      id: userPrimitives.id,
      email: userPrimitives.email,
      password: userPrimitives.passwordHash, // This now correctly uses the property from toPrimitives()
      firstName: userPrimitives.firstName,
      lastName: userPrimitives.lastName,
      role: userPrimitives.role,
      isActive: userPrimitives.isActive,
      // Timestamps are managed by the domain model, so they are included here.
      createdAt: userPrimitives.createdAt,
      updatedAt: userPrimitives.updatedAt,
      profile: {
        create: {
          id: profilePrimitives.id,
          bio: profilePrimitives.bio,
          phoneNumber: profilePrimitives.phoneNumber,
          phoneVerified: profilePrimitives.phoneVerified,
          emailVerified: profilePrimitives.emailVerified,
          marketingOptIn: profilePrimitives.marketingOptIn,
          address: (profilePrimitives.address as Prisma.JsonValue) ?? Prisma.JsonNull,
          nextOfKin: (profilePrimitives.nextOfKin as Prisma.JsonValue) ?? Prisma.JsonNull,
          createdAt: profilePrimitives.createdAt,
          updatedAt: profilePrimitives.updatedAt,
        },
      },
    };

    const updateData: Prisma.UserUpdateInput = {
      email: userPrimitives.email,
      password: userPrimitives.passwordHash, // This also uses the correct property now
      firstName: userPrimitives.firstName,
      lastName: userPrimitives.lastName,
      role: userPrimitives.role,
      isActive: userPrimitives.isActive,
      lastLoginAt: userPrimitives.lastLoginAt,
      loginAttempts: userPrimitives.loginAttempts,
      lockedUntil: userPrimitives.lockedUntil,
      deletedAt: userPrimitives.deletedAt,
      updatedAt: userPrimitives.updatedAt, // Use the timestamp from the domain model for consistency
      profile: {
        update: {
          bio: profilePrimitives.bio,
          phoneNumber: profilePrimitives.phoneNumber,
          phoneVerified: profilePrimitives.phoneVerified,
          emailVerified: profilePrimitives.emailVerified,
          marketingOptIn: profilePrimitives.marketingOptIn,
          address: (profilePrimitives.address as Prisma.JsonValue) ?? Prisma.JsonNull,
          nextOfKin: (profilePrimitives.nextOfKin as Prisma.JsonValue) ?? Prisma.JsonNull,
          updatedAt: profilePrimitives.updatedAt, // Use the timestamp from the domain model
        },
      },
    };

    return { create: createData, update: updateData };
  }
}
