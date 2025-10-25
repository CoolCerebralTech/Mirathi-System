import {
  User as PrismaUser,
  UserProfile,
  UserRole,
  RoleChange as PrismaRoleChange,
  Prisma,
} from '@shamba/database';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressDto, NextOfKinDto } from '@shamba/common';

/**
 * Serializable user profile entity for API responses.
 * Maps Prisma UserProfile to clean DTO structure.
 */
@Exclude()
export class ProfileEntity {
  @Expose()
  @ApiProperty({ example: 'clx123456789' })
  id!: string;

  @Expose()
  @ApiPropertyOptional({
    example: 'Experienced land owner with 20+ years in agriculture',
    nullable: true,
  })
  bio?: string | null;

  @Expose()
  @ApiPropertyOptional({
    example: '+254712345678',
    nullable: true,
  })
  phoneNumber?: string | null;

  @Expose()
  @ApiProperty({
    example: false,
    description: 'Whether the phone number has been verified',
  })
  phoneVerified!: boolean;

  @Expose()
  @ApiProperty({
    example: false,
    description: 'Whether the email has been verified',
  })
  emailVerified!: boolean;

  @Expose()
  @ApiPropertyOptional({
    example: true,
    description: 'Whether the user has opted in for marketing communications',
  })
  marketingOptIn?: boolean;

  @Expose()
  @ApiPropertyOptional({
    type: AddressDto,
    example: {
      street: '123 Shamba Lane',
      city: 'Nairobi',
      postCode: '00100',
      country: 'Kenya',
    },
    nullable: true,
  })
  address?: AddressDto | null;

  @Expose()
  @ApiPropertyOptional({
    type: NextOfKinDto,
    example: {
      fullName: 'Jane Mwangi',
      relationship: 'Spouse',
      phoneNumber: '+254712345679',
      email: 'jane@example.com',
    },
    nullable: true,
  })
  nextOfKin?: NextOfKinDto | null;

  @Expose()
  @ApiProperty({ example: 'clx123456789' })
  userId!: string;

  @Expose()
  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ example: '2025-01-20T14:45:00.000Z' })
  updatedAt!: Date;

  constructor(partial: Partial<UserProfile>) {
    // 1. Copy all scalar properties (id, bio, phoneNumber, etc.)
    Object.assign(this, partial);

    // 2. Safely parse the JSON fields from the Prisma model.
    //    This handles cases where the data is already an object or a stringified JSON.
    this.address = this.parseJsonField<AddressDto>(partial.address);
    this.nextOfKin = this.parseJsonField<NextOfKinDto>(partial.nextOfKin);

    // 3. Ensure boolean fields have a default value if they are null/undefined in the DB.
    this.phoneVerified = partial.phoneVerified ?? false;
    this.emailVerified = partial.emailVerified ?? false;
    this.marketingOptIn = partial.marketingOptIn ?? false;
  }

  /**
   * Safely parses a Prisma.JsonValue field into a typed object.
   * This is the same robust helper used in the service layer.
   */
  private parseJsonField<T>(field: Prisma.JsonValue | undefined): T | null {
    if (!field) {
      return null;
    }
    // If it's already a valid object (not null, not an array), return it.
    if (typeof field === 'object' && field !== null && !Array.isArray(field)) {
      return field as T;
    }
    // If it's a string, try to parse it.
    if (typeof field === 'string') {
      try {
        return JSON.parse(field) as T;
      } catch {
        return null; // Return null if parsing fails
      }
    }
    // Return null for any other invalid type (number, array, etc.)
    return null;
  }
}

/**
 * Public-facing user entity for API responses.
 * Excludes sensitive fields (password) and provides type-safe serialization.
 */
@Exclude()
export class UserEntity implements Omit<PrismaUser, 'password'> {
  @Expose()
  @ApiProperty({ example: 'clx123456789' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'john.mwangi@example.com' })
  email!: string;

  @Expose()
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @Expose()
  @ApiProperty({ example: 'Mwangi' })
  lastName!: string;

  @Expose()
  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'User role in the system',
  })
  role!: UserRole;

  @Expose()
  @ApiProperty({
    example: true,
    description: 'Whether the user account is active',
  })
  isActive!: boolean;

  @Expose()
  @ApiPropertyOptional({
    example: '2025-01-22T08:15:00.000Z',
    description: 'Last login timestamp',
  })
  lastLoginAt!: Date | null;

  @Expose()
  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ example: '2025-01-20T14:45:00.000Z' })
  updatedAt!: Date;

  // Excluded by @Exclude() decorator on class
  password?: string;
  loginAttempts!: number;
  lockedUntil!: Date | null;
  deletedAt!: Date | null;

  @Expose()
  @ApiPropertyOptional({
    type: () => ProfileEntity,
    description: 'User profile details',
  })
  @Type(() => ProfileEntity)
  profile?: ProfileEntity | null;

  constructor(partial: Partial<PrismaUser & { profile?: UserProfile | null }>) {
    Object.assign(this, partial);

    // Transform profile to ProfileEntity if present
    if (partial.profile) {
      this.profile = new ProfileEntity(partial.profile);
    }

    // Set default values for new fields
    this.isActive = partial.isActive ?? true;
  }
}

/**
 * Detailed user entity for admin endpoints.
 * Includes additional metadata not exposed to regular users.
 */
@Exclude()
export class DetailedUserEntity extends UserEntity {
  // We are simply "un-excluding" these properties from the parent.
  // We do not re-declare them. The `@Expose` decorator is enough.

  @Expose()
  @ApiProperty({ description: 'Number of consecutive failed login attempts' })
  declare loginAttempts: number;

  @Expose()
  @ApiPropertyOptional({ description: 'Account locked until timestamp', nullable: true })
  declare lockedUntil: Date | null;

  @Expose()
  @ApiPropertyOptional({ description: 'Soft delete timestamp', nullable: true })
  declare deletedAt: Date | null;

  constructor(partial: Partial<PrismaUser & { profile?: UserProfile | null }>) {
    // The super() call is the only thing needed. It initializes all properties,
    // including the ones we are exposing here.
    super(partial);
  }
}

/**
 * Role change entity for audit trail responses.
 */
@Exclude()
export class RoleChangeEntity {
  @Expose()
  @ApiProperty({ example: 'clx123456789' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'clx987654321' })
  userId!: string;

  @Expose()
  @ApiPropertyOptional({
    example: 'John Mwangi',
    description: 'User name for display purposes',
  })
  userName?: string;

  @Expose()
  @ApiPropertyOptional({
    example: 'john.mwangi@example.com',
    description: 'User email for display purposes',
  })
  userEmail?: string;

  @Expose()
  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
  })
  oldRole!: UserRole;

  @Expose()
  @ApiProperty({
    enum: UserRole,
    example: UserRole.VERIFIER,
  })
  newRole!: UserRole;

  @Expose()
  @ApiPropertyOptional({
    example: 'clx555555555',
    description: 'Admin user ID who made the change',
  })
  changedBy?: string;

  @Expose()
  @ApiPropertyOptional({
    example: 'Promoted to document verifier',
  })
  reason?: string;

  @Expose()
  @ApiProperty({ example: '2025-01-20T14:45:00.000Z' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ example: '2025-01-20T14:45:00.000Z' })
  updatedAt!: Date;

  constructor(
    partial: PrismaRoleChange & { user?: { firstName: string; lastName: string; email: string } },
  ) {
    Object.assign(this, partial);

    // Add user display information if available
    if (partial.user) {
      this.userName = `${partial.user.firstName} ${partial.user.lastName}`;
      this.userEmail = partial.user.email;
      this.updatedAt = partial.createdAt;
    }
  }
}

/**
 * Minimal user entity for basic user information in relationships
 */
@Exclude()
export class MinimalUserEntity {
  @Expose()
  @ApiProperty({ example: 'clx123456789' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'john.mwangi@example.com' })
  email!: string;

  @Expose()
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @Expose()
  @ApiProperty({ example: 'Mwangi' })
  lastName!: string;

  @Expose()
  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
  })
  role!: UserRole;

  @Expose()
  @ApiProperty({
    example: true,
  })
  isActive!: boolean;

  constructor(partial: Partial<PrismaUser>) {
    Object.assign(this, partial);
    this.isActive = partial.isActive ?? true;
  }
}
