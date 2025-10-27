import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  IsEnum,
  ValidateNested,
  IsPhoneNumber,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsNumberString,
  Length,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, RelationshipType } from '@shamba/common';
import { BaseResponseDto } from '@shamba/common';
import { Type } from 'class-transformer';
import { PaginationQueryDto, PaginationMetaDto } from '@shamba/common';
import { object } from 'joi';

// ============================================================================
// NESTED DTOs (For Input Validation)
// ============================================================================

export class AddressDto {
  @ApiPropertyOptional({ example: '123 Shamba Lane' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string;

  @ApiPropertyOptional({ example: 'Nairobi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: '00100' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postCode?: string;

  @ApiPropertyOptional({ example: 'Kenya' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}
export class NextOfKinDto {
  @ApiProperty({ example: 'Jane Mwangi' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({
    description: 'Relationship to the user.',
    enum: RelationshipType,
    example: RelationshipType.SPOUSE,
  })
  @IsEnum(RelationshipType)
  relationship!: RelationshipType;

  @ApiProperty({ example: '+254712345678' })
  @IsPhoneNumber('KE')
  phoneNumber!: string;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}

// ============================================================================
// REQUEST DTOs (For Authenticated Users)
// ============================================================================

export class UpdateMyUserDto {
  @ApiPropertyOptional({ description: 'Updated first name.' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Updated last name.' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  // NOTE: Email changes are a high-security operation and are handled
  // through a separate, dedicated endpoint and flow, not in this DTO.
}

export class UpdateMyProfileDto {
  @ApiPropertyOptional({ description: 'A short user biography.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ description: "User's primary phone number." })
  @IsOptional()
  @IsPhoneNumber('KE')
  phoneNumber?: string | null;

  @ApiPropertyOptional({ type: object })
  @IsOptional()
  address?: AddressDto | null;

  @ApiPropertyOptional({ type: object })
  @IsOptional()
  nextOfKin?: NextOfKinDto | null;
}

export class UpdateMarketingPreferencesDto {
  @ApiProperty()
  @IsBoolean()
  marketingOptIn!: boolean;
}

// ============================================================================
// REQUEST DTOs (For Admins)
// ============================================================================

/**
 * Defines the query parameters for filtering a list of users.
 * To be used only in admin-accessible endpoints.
 */
export class UserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter users by their role.',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Search users by email or name.',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  declare search?: string;
}

/**
 * Admin DTO for updating any user's basic information.
 */
export class AdminUpdateUserDto {
  @ApiPropertyOptional({ description: 'Updated first name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Updated last name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Updated email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Account active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Lock account until date',
    example: '2023-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  lockedUntil?: string;

  @ApiPropertyOptional({
    description: 'Reset the number of failed login attempts.',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  loginAttempts?: number;
}

/**
 * Query parameters for fetching role change history.
 */
export class RoleChangeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by user ID.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by admin who made the change.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  changedBy?: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  newRole!: UserRole;

  @ApiPropertyOptional({ description: 'Reason for the role change, for auditing.' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class LockUserDto {
  @ApiPropertyOptional({ description: 'Duration of the lock in minutes. 0 for indefinite.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @ApiProperty({ description: 'Reason for locking the account.' })
  @IsString()
  reason!: string;
}
// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================

export class UserProfileResponseDto {
  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional()
  phoneNumber?: string;

  @ApiProperty({ example: false, description: 'Whether the user has verified their phone number.' })
  phoneVerified!: boolean;

  @ApiPropertyOptional({ example: false })
  emailVerified?: boolean;

  @ApiPropertyOptional({ type: AddressDto })
  address?: AddressDto;

  @ApiPropertyOptional({ type: NextOfKinDto })
  nextOfKin?: NextOfKinDto;
}

/**
 * Basic user response (excludes sensitive data like password).
 */
export class UserResponseDto extends BaseResponseDto {
  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole = UserRole.USER;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether the user has verified their email address.',
  })
  emailVerified!: boolean;

  @ApiPropertyOptional({ type: () => UserProfileResponseDto })
  profile?: UserProfileResponseDto;

  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @ApiProperty()
  declare createdAt: Date;

  @ApiProperty()
  declare updatedAt: Date;
}

/**
 * Detailed user response for admin endpoints.
 * Includes additional metadata.
 */
export class DetailedUserResponseDto extends UserResponseDto {
  @ApiProperty({ example: 0 })
  loginAttempts!: number;

  @ApiPropertyOptional()
  lockedUntil?: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;
}

export class VerifyPhoneRequestDto {
  @ApiProperty({ description: 'Phone verification code' })
  @IsString()
  @IsNumberString()
  @Length(6, 6, { message: 'Verification code must be 6 digits.' })
  code!: string;
}

export class VerifyPhoneResponseDto {
  @ApiProperty({ example: 'Phone number verified successfully' })
  message!: string;
}

export class ResendPhoneVerificationResponseDto {
  @ApiProperty({ example: 'Verification code sent to your phone' })
  message!: string;
}

/**
 * Paginated list of users (for admin).
 */
export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data!: UserResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta!: PaginationMetaDto;
}

/**
 * Role change history record.
 */
export class RoleChangeResponseDto extends BaseResponseDto {
  @ApiProperty({ description: 'User ID whose role was changed.' })
  userId!: string;

  @ApiPropertyOptional({
    description: 'The full name of the user at the time of the change.',
    example: 'John Mwangi',
  })
  userName?: string;

  @ApiPropertyOptional({
    description: 'The email address of the user at the time of the change.',
    example: 'john.mwangi@example.com',
  })
  userEmail?: string;

  @ApiProperty({ enum: UserRole, description: 'Previous role.' })
  oldRole!: UserRole;

  @ApiProperty({ enum: UserRole, description: 'New role.' })
  newRole!: UserRole;

  @ApiPropertyOptional({ description: 'Admin who made the change.' })
  changedBy?: string;

  @ApiPropertyOptional({ description: 'Reason for the change.' })
  reason?: string;

  @ApiProperty({ description: 'Timestamp of the change.' })
  declare createdAt: Date;
}

/**
 * Paginated role change history.
 */
export class PaginatedRoleChangesResponseDto {
  @ApiProperty({ type: [RoleChangeResponseDto] })
  data!: RoleChangeResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta!: PaginationMetaDto;
}

/**
 * Success response for update operations.
 */
export class UpdateUserResponseDto {
  @ApiProperty({
    description: 'Success message.',
    example: 'User updated successfully.',
  })
  message!: string;

  @ApiProperty({ type: () => UserResponseDto })
  user!: UserResponseDto;
}

/**
 * Success response for profile update operations.
 */
export class UpdateProfileResponseDto {
  @ApiProperty({
    description: 'Success message.',
    example: 'Profile updated successfully.',
  })
  message!: string;

  @ApiProperty({ type: () => UserProfileResponseDto })
  profile!: UserProfileResponseDto;
}

export class SendPhoneVerificationResponseDto {
  @ApiProperty({ example: 'Verification code sent to your phone.' })
  message!: string;

  @ApiProperty({ description: 'Timestamp when the next code can be sent.' })
  nextRetryAt!: Date;

  @ApiProperty({ description: 'Seconds to wait before the next attempt.' })
  retryAfterSeconds!: number;

  @ApiProperty({ description: 'Minutes until the sent code expires.' })
  expiresInMinutes!: number;
}

export class UpdateMarketingPreferencesResponseDto {
  @ApiProperty({ example: 'Marketing preferences updated successfully.' })
  message!: string;

  @ApiProperty()
  marketingOptIn!: boolean;
}

export class UserStatsResponseDto {
  @ApiProperty() total!: number;
  @ApiProperty() active!: number;
  @ApiProperty() inactive!: number;
  @ApiProperty() deleted!: number;
  @ApiProperty() locked!: number;
  @ApiProperty() newLast30Days!: number;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }})
  byRole!: Record<UserRole, number>;
}
