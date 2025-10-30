import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RelationshipType, UserRole } from '@shamba/common';
import { User } from '../../../3_domain/models/user.model';
import { UserProfile, Address, NextOfKin } from '../../../3_domain/models/user-profile.model';
import { Email, Password, PhoneNumber } from '../../../3_domain/value-objects';
import { UserEntity } from '../entities/account.entity';

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

export class UserMappingError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'UserMappingError';
  }
}

export class InvalidUserEntityError extends UserMappingError {
  constructor(entityId: string, reason: string) {
    super(`Invalid user entity ${entityId}: ${reason}`);
    this.name = 'InvalidUserEntityError';
  }
}

// ============================================================================
// SAFE PARSERS & TYPE GUARDS (Enhanced with better error handling)
// ============================================================================

function isRelationshipType(value: unknown): value is RelationshipType {
  return (
    typeof value === 'string' && Object.values(RelationshipType).includes(value as RelationshipType)
  );
}

function isValidUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && Object.values(UserRole).includes(value as UserRole);
}

function parseAddress(json: Prisma.JsonValue | null): Address | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;

  const obj = json as Record<string, unknown>;

  // Country is required for a valid address
  if (typeof obj.country !== 'string' || !obj.country.trim()) {
    Logger.warn('Malformed Address JSON encountered in mapper: missing or invalid country', {
      json,
    });
    return null;
  }

  try {
    const address: Address = {
      country: obj.country.trim(),
    };

    // Optional fields
    if (typeof obj.street === 'string' && obj.street.trim()) {
      address.street = obj.street.trim();
    }
    if (typeof obj.city === 'string' && obj.city.trim()) {
      address.city = obj.city.trim();
    }
    if (typeof obj.county === 'string' && obj.county.trim()) {
      address.county = obj.county.trim();
    }
    if (typeof obj.postalCode === 'string' && obj.postalCode.trim()) {
      address.postalCode = obj.postalCode.trim();
    }

    return address;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error('Error parsing address JSON', { json, error: errorMessage });
    return null;
  }
}

function parseNextOfKin(json: Prisma.JsonValue | null): NextOfKin | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;

  const obj = json as Record<string, unknown>;

  // Required fields validation
  if (typeof obj.fullName !== 'string' || !obj.fullName.trim()) {
    Logger.warn('Malformed NextOfKin JSON: missing or invalid fullName', { json });
    return null;
  }

  if (typeof obj.phoneNumber !== 'string' || !obj.phoneNumber.trim()) {
    Logger.warn('Malformed NextOfKin JSON: missing or invalid phoneNumber', { json });
    return null;
  }

  if (!isRelationshipType(obj.relationship)) {
    Logger.warn('Malformed NextOfKin JSON: invalid relationship type', {
      json,
      relationship: obj.relationship,
    });
    return null;
  }

  try {
    const nextOfKin: NextOfKin = {
      fullName: obj.fullName.trim(),
      relationship: obj.relationship,
      phoneNumber: obj.phoneNumber.trim(),
    };

    // Optional fields
    if (typeof obj.email === 'string' && obj.email.trim()) {
      const email = obj.email.trim();
      // Basic email validation
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        nextOfKin.email = email;
      } else {
        Logger.warn('Invalid email format in NextOfKin JSON', { email, json });
      }
    }

    if (obj.address && typeof obj.address === 'object' && !Array.isArray(obj.address)) {
      const address = parseAddress(obj.address as Prisma.JsonValue);
      if (address) {
        nextOfKin.address = address;
      }
    }

    return nextOfKin;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error('Error parsing nextOfKin JSON', { json, error: errorMessage });
    return null;
  }
}

function validateUserEntity(entity: unknown): entity is UserEntity {
  // First, prove to TypeScript that entity is a non-null object
  if (typeof entity !== 'object' || entity === null) {
    return false;
  }

  // Now that it's known to be an object, we can safely access properties
  // We cast it here for cleaner access below
  const e = entity as Record<keyof UserEntity, unknown>;

  if (typeof e.id !== 'string' || !e.id) return false;
  if (typeof e.email !== 'string' || !e.email) return false;
  if (typeof e.password !== 'string' || !e.password) return false;
  if (typeof e.firstName !== 'string' || !e.firstName.trim()) return false;
  if (typeof e.lastName !== 'string' || !e.lastName.trim()) return false;
  if (!isValidUserRole(e.role)) return false;
  if (typeof e.isActive !== 'boolean') return false;
  if (!(e.createdAt instanceof Date)) return false;
  if (!(e.updatedAt instanceof Date)) return false;
  // Check that profile is also a non-null object
  if (typeof e.profile !== 'object' || e.profile === null) return false;

  return true;
}

// ============================================================================
// USER MAPPER
// ============================================================================

@Injectable()
export class UserMapper {
  private readonly logger = new Logger(UserMapper.name);

  /**
   * Converts a Prisma UserEntity (with profile) into the rich User domain model.
   */
  toDomain(entity: UserEntity): User {
    const entityIdForErrorReporting = entity?.id ?? 'unknown';

    try {
      // Enhanced validation
      if (!validateUserEntity(entity)) {
        throw new InvalidUserEntityError(entityIdForErrorReporting, 'Entity validation failed');
      }

      if (!entity.profile) {
        throw new InvalidUserEntityError(
          entityIdForErrorReporting,
          'Missing required profile relation',
        );
      }

      // Create Email value object
      const email = Email.create(entity.email);

      // Create Password value object from stored hash
      const password = Password.fromStoredHash(entity.password);

      // Parse and create profile
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

      // Create user domain model
      const user = User.fromPersistence(
        {
          id: entity.id,
          email,
          password,
          firstName: entity.firstName.trim(),
          lastName: entity.lastName.trim(),
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

      this.logger.debug(`Successfully mapped user entity to domain: ${entity.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to map user entity to domain: ${entity?.id}`, error);
      if (error instanceof UserMappingError) {
        throw error;
      }
      throw new UserMappingError(`Failed to map user entity ${entity?.id} to domain model`, error);
    }
  }

  /**
   * Converts a User domain model into Prisma create data for initial creation.
   */
  toCreateData(user: User): Prisma.UserCreateInput {
    try {
      const userPrimitives = user.toPrimitives();
      const profilePrimitives = user.profile.toPrimitives();

      const createData: Prisma.UserCreateInput = {
        id: userPrimitives.id,
        email: userPrimitives.email,
        password: userPrimitives.passwordHash,
        firstName: userPrimitives.firstName,
        lastName: userPrimitives.lastName,
        role: userPrimitives.role,
        isActive: userPrimitives.isActive,
        lastLoginAt: userPrimitives.lastLoginAt,
        loginAttempts: userPrimitives.loginAttempts,
        lockedUntil: userPrimitives.lockedUntil,
        createdAt: userPrimitives.createdAt,
        updatedAt: userPrimitives.updatedAt,
        deletedAt: userPrimitives.deletedAt,
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

      return createData;
    } catch (error) {
      this.logger.error('Failed to create user persistence data', error);
      throw new UserMappingError('Failed to create user persistence data', error);
    }
  }

  /**
   * Converts a User domain model into Prisma update data for existing users.
   */
  toUpdateData(user: User): Prisma.UserUpdateInput {
    try {
      const userPrimitives = user.toPrimitives();
      const profilePrimitives = user.profile.toPrimitives();

      const updateData: Prisma.UserUpdateInput = {
        email: userPrimitives.email,
        password: userPrimitives.passwordHash,
        firstName: userPrimitives.firstName,
        lastName: userPrimitives.lastName,
        role: userPrimitives.role,
        isActive: userPrimitives.isActive,
        lastLoginAt: userPrimitives.lastLoginAt,
        loginAttempts: userPrimitives.loginAttempts,
        lockedUntil: userPrimitives.lockedUntil,
        deletedAt: userPrimitives.deletedAt,
        updatedAt: userPrimitives.updatedAt,
        profile: {
          update: {
            bio: profilePrimitives.bio,
            phoneNumber: profilePrimitives.phoneNumber,
            phoneVerified: profilePrimitives.phoneVerified,
            emailVerified: profilePrimitives.emailVerified,
            marketingOptIn: profilePrimitives.marketingOptIn,
            address: (profilePrimitives.address as Prisma.JsonValue) ?? Prisma.JsonNull,
            nextOfKin: (profilePrimitives.nextOfKin as Prisma.JsonValue) ?? Prisma.JsonNull,
            updatedAt: profilePrimitives.updatedAt,
          },
        },
      };

      return updateData;
    } catch (error) {
      this.logger.error('Failed to create user update data', error);
      throw new UserMappingError('Failed to create user update data', error);
    }
  }

  /**
   * Creates partial update data for user (without profile) for performance
   */
  toPartialUpdateData(user: User, updatedFields: string[]): Prisma.UserUpdateInput {
    try {
      const userPrimitives = user.toPrimitives();
      const updateData: Prisma.UserUpdateInput = {
        updatedAt: userPrimitives.updatedAt,
      };

      // Only include fields that are in the updatedFields array
      if (updatedFields.includes('email')) updateData.email = userPrimitives.email;
      if (updatedFields.includes('password')) updateData.password = userPrimitives.passwordHash;
      if (updatedFields.includes('firstName')) updateData.firstName = userPrimitives.firstName;
      if (updatedFields.includes('lastName')) updateData.lastName = userPrimitives.lastName;
      if (updatedFields.includes('role')) updateData.role = userPrimitives.role;
      if (updatedFields.includes('isActive')) updateData.isActive = userPrimitives.isActive;
      if (updatedFields.includes('lastLoginAt'))
        updateData.lastLoginAt = userPrimitives.lastLoginAt;
      if (updatedFields.includes('loginAttempts'))
        updateData.loginAttempts = userPrimitives.loginAttempts;
      if (updatedFields.includes('lockedUntil'))
        updateData.lockedUntil = userPrimitives.lockedUntil;
      if (updatedFields.includes('deletedAt')) updateData.deletedAt = userPrimitives.deletedAt;

      return updateData;
    } catch (error) {
      this.logger.error('Failed to create partial user update data', error);
      throw new UserMappingError('Failed to create partial user update data', error);
    }
  }

  /**
   * Converts UserProfile domain model to Prisma persistence data
   */
  profileToPersistence(profile: UserProfile): {
    create: Prisma.UserProfileUncheckedCreateInput;
    update: Prisma.UserProfileUncheckedUpdateInput;
  } {
    try {
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
    } catch (error) {
      this.logger.error('Failed to create profile persistence data', error);
      throw new UserMappingError('Failed to create profile persistence data', error);
    }
  }

  /**
   * Creates partial update data for profile only
   */
  profileToPartialUpdateData(
    profile: UserProfile,
    updatedFields: string[],
  ): Prisma.UserProfileUncheckedUpdateInput {
    try {
      const primitives = profile.toPrimitives();
      const updateData: Prisma.UserProfileUncheckedUpdateInput = {
        updatedAt: primitives.updatedAt,
      };

      // Only include fields that are in the updatedFields array
      if (updatedFields.includes('bio')) updateData.bio = primitives.bio;
      if (updatedFields.includes('phoneNumber')) updateData.phoneNumber = primitives.phoneNumber;
      if (updatedFields.includes('phoneVerified'))
        updateData.phoneVerified = primitives.phoneVerified;
      if (updatedFields.includes('emailVerified'))
        updateData.emailVerified = primitives.emailVerified;
      if (updatedFields.includes('marketingOptIn'))
        updateData.marketingOptIn = primitives.marketingOptIn;
      if (updatedFields.includes('address')) {
        updateData.address = (primitives.address as Prisma.JsonValue) ?? Prisma.JsonNull;
      }
      if (updatedFields.includes('nextOfKin')) {
        updateData.nextOfKin = (primitives.nextOfKin as Prisma.JsonValue) ?? Prisma.JsonNull;
      }

      return updateData;
    } catch (error) {
      this.logger.error('Failed to create partial profile update data', error);
      throw new UserMappingError('Failed to create partial profile update data', error);
    }
  }

  /**
   * Legacy method for backward compatibility (calls new methods)
   */
  toPersistence(user: User): {
    create: Prisma.UserCreateInput;
    update: Prisma.UserUpdateInput;
  } {
    return {
      create: this.toCreateData(user),
      update: this.toUpdateData(user),
    };
  }
}
