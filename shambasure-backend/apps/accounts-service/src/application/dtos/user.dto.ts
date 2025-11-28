import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { UserRole } from '@shamba/common';
import { BaseResponseDto } from '@shamba/common';

// ============================================================================
// REQUEST DTOs (For Authenticated Users)
// ============================================================================
class BaseUserUpdateRequestDto {
  @ApiPropertyOptional({
    description: 'Updated first name.',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long.' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Updated last name.',
    example: 'Mwangi',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long.' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  lastName?: string;
}

export class UpdateMyUserRequestDto extends BaseUserUpdateRequestDto {}
export class GetMyUserRequestDto {
  // Empty - used for type safety in controllers
  // GET /me doesn't need request body
}

export class DeactivateMyAccountRequestDto {
  @ApiProperty({
    description: 'Current password for security verification.',
    example: 'CurrentPassword123!',
  })
  @IsString()
  @MinLength(1, { message: 'Password is required.' })
  password!: string;

  @ApiPropertyOptional({
    description: 'Optional reason for deactivation.',
    example: 'Taking a break from the platform',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  reason?: string;
}

export class ReactivateMyAccountRequestDto {
  @ApiProperty({
    description: 'Email address for account reactivation.',
    example: 'john.mwangi@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const transformed = value.toLowerCase().trim();
      return transformed.length > 0 ? transformed : undefined;
    }
    return undefined;
  })
  email!: string;

  @ApiProperty({
    description: 'Password for account verification.',
    example: 'CurrentPassword123!',
  })
  @IsString()
  @MinLength(1, { message: 'Password is required.' })
  password!: string;
}

// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================

export class UserResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'john.mwangi@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Mwangi' })
  @IsString()
  lastName!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  @IsEnum(UserRole)
  role: UserRole = UserRole.USER;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether the user has verified their email address.',
  })
  @IsBoolean()
  emailVerified!: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether the user has verified their phone number.',
  })
  @IsBoolean()
  phoneVerified!: boolean;

  @ApiPropertyOptional({ example: '2024-10-25T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  lastLoginAt?: Date;

  @ApiPropertyOptional({ example: '2024-10-25T09:15:00.000Z' })
  @IsOptional()
  @IsDateString()
  lockedUntil?: Date;

  @ApiProperty({ example: 0 })
  @IsNumber()
  loginAttempts!: number;

  @ApiProperty({ example: '2024-01-15T08:20:00.000Z' })
  @IsDateString()
  declare createdAt: Date;

  @ApiProperty({ example: '2024-10-25T10:30:00.000Z' })
  @IsDateString()
  declare updatedAt: Date;

  @ApiPropertyOptional({ example: '2024-10-25T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  deletedAt?: Date;

  @ApiProperty({
    description: 'Indicates if the user account is currently locked.',
    example: false,
  })
  @IsBoolean()
  isLocked!: boolean;

  @ApiProperty({
    description: 'Indicates if the user account has been soft-deleted.',
    example: false,
  })
  @IsBoolean()
  isDeleted!: boolean;
}

export class UpdateMyUserResponseDto {
  @ApiProperty({
    description: 'Success message.',
    example: 'User information updated successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({ type: () => UserResponseDto })
  @ValidateNested()
  @Type(() => UserResponseDto)
  user!: UserResponseDto;
}

export class GetMyUserResponseDto extends UserResponseDto {
  @ApiPropertyOptional({
    description: 'User profile completion percentage.',
    example: 75,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  profileCompletion?: number;

  @ApiPropertyOptional({
    description: 'Number of active sessions.',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  activeSessions?: number;

  @ApiPropertyOptional({
    description: 'Security recommendations for the user.',
    example: ['Enable two-factor authentication', 'Update your recovery email'],
  })
  @IsOptional()
  @IsString({ each: true })
  securityRecommendations?: string[];
}

export class DeactivateMyAccountResponseDto {
  @ApiProperty({
    example: 'Account deactivated successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'When the account was deactivated.',
    example: '2024-10-25T10:30:00.000Z',
  })
  @IsDateString()
  deactivatedAt!: Date;

  @ApiProperty({
    description: 'Number of sessions terminated.',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  sessionsTerminated!: number;

  @ApiProperty({
    description: 'When the account can be reactivated.',
    example: '2025-10-25T10:30:00.000Z',
  })
  @IsDateString()
  reactivationAvailableAt!: Date;
}

export class CreateUserResponseDto {
  @ApiProperty({
    description: 'Success message.',
    example: 'User created successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({ type: () => UserResponseDto })
  @ValidateNested()
  @Type(() => UserResponseDto)
  user!: UserResponseDto;

  @ApiPropertyOptional({
    description: 'Temporary password (only shown once).',
    example: 'TempPassword123!',
  })
  @IsOptional()
  @IsString()
  temporaryPassword?: string;

  @ApiProperty({
    description: 'Whether welcome email was sent.',
    example: true,
  })
  @IsBoolean()
  welcomeEmailSent!: boolean;
}

export class UpdateUserResponseDto {
  @ApiProperty({
    description: 'Success message.',
    example: 'User updated successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({ type: () => UserResponseDto })
  @ValidateNested()
  @Type(() => UserResponseDto)
  user!: UserResponseDto;
}

export class ChangeUserRoleResponseDto {
  @ApiProperty({
    description: 'Success message.',
    example: 'User role changed successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({ type: () => UserResponseDto })
  @ValidateNested()
  @Type(() => UserResponseDto)
  user!: UserResponseDto;

  @ApiProperty({
    description: 'Previous role.',
    example: UserRole.USER,
    enum: UserRole,
  })
  @IsEnum(UserRole)
  previousRole!: UserRole;

  @ApiProperty({
    description: 'New role.',
    example: UserRole.ADMIN,
    enum: UserRole,
  })
  @IsEnum(UserRole)
  newRole!: UserRole;

  @ApiProperty({
    description: 'Admin who performed the change.',
    example: 'admin-user-id',
  })
  @IsString()
  changedBy!: string;
}

export class BulkUpdateUsersResponseDto {
  @ApiProperty({
    description: 'Success message.',
    example: 'Bulk update completed successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Number of users successfully updated.',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  updatedCount!: number;

  @ApiProperty({
    description: 'Number of users that failed to update.',
    example: 0,
  })
  @IsNumber()
  failedCount!: number;

  @ApiPropertyOptional({
    description: 'Details of failed updates.',
    example: [
      { userId: 'user-id-1', error: 'User not found' },
      { userId: 'user-id-2', error: 'Database connection failed' },
    ],
  })
  @IsOptional()
  @IsArray()
  failures?: Array<{ userId: string; error: string }>;
}

export class UserListResponseDto {
  @ApiProperty({
    description: 'List of users.',
    type: () => [UserResponseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserResponseDto)
  data!: UserResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata.',
    example: {
      total: 100,
      page: 1,
      limit: 20,
      totalPages: 5,
      hasNext: true,
      hasPrevious: false,
    },
  })
  @IsObject()
  meta!: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class UserSessionInfoDto {
  @ApiProperty({ example: 'session-id-123' })
  @IsString()
  sessionId!: string;

  @ApiProperty({ example: '2024-10-25T10:30:00.000Z' })
  @IsDateString()
  createdAt!: Date;

  @ApiProperty({ example: '2024-10-25T11:30:00.000Z' })
  @IsDateString()
  lastActivity!: Date;

  @ApiProperty({ example: '2024-10-26T10:30:00.000Z' })
  @IsDateString()
  expiresAt!: Date;

  @ApiPropertyOptional({ example: '192.168.1.100' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Chrome on Windows' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ example: 'device-abc123' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isCurrent!: boolean;
}

export class UserSessionsResponseDto {
  @ApiProperty({
    description: 'List of user sessions.',
    type: () => [UserSessionInfoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserSessionInfoDto)
  sessions!: UserSessionInfoDto[];

  @ApiProperty({ example: 3 })
  @IsNumber()
  @IsPositive()
  totalSessions!: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsPositive()
  activeSessions!: number;
}
