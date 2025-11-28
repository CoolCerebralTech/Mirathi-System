import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsNumber,
  IsPositive,
  IsObject,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import { UserRole } from '@shamba/common';
import { BaseResponseDto, PaginationQueryDto, PaginationMetaDto } from '@shamba/common';

// ============================================================================
// QUERY DTOs (For Filtering/Pagination)
// ============================================================================

export class UserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter users by their role.',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by active status.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by email verification status.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  emailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by phone verification status.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  phoneVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by locked status.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  isLocked?: boolean;

  @ApiPropertyOptional({
    description: 'Include deleted users.',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeleted?: boolean;

  @ApiPropertyOptional({
    description: 'Search users by email, first name, or last name.',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  declare search?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date from (ISO 8601).',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date to (ISO 8601).',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by last login date from (ISO 8601).',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  lastLoginFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by last login date to (ISO 8601).',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  lastLoginTo?: string;
}

export class RoleChangeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by user ID.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by admin who made the change.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  changedBy?: string;

  @ApiPropertyOptional({
    description: 'Filter by role changed from.',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  oldRole?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by role changed to.',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @IsOptional()
  @IsEnum(UserRole)
  newRole?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by date from (ISO 8601).',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by date to (ISO 8601).',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class AdminAuditLogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by admin user ID.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  adminId?: string;

  @ApiPropertyOptional({
    description: 'Filter by target user ID.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  targetUserId?: string;

  @ApiPropertyOptional({
    description: 'Filter by action type.',
    example: 'user.role_changed',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  action?: string;

  @ApiPropertyOptional({
    description: 'Filter by date from (ISO 8601).',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by date to (ISO 8601).',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by IP address.',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  ipAddress?: string;
}

export class SystemStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Time period for statistics (days).',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  @Transform(({ value }): number | undefined => {
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  periodDays?: number = 30;

  @ApiPropertyOptional({
    description: 'Include detailed breakdown by role.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false && value !== 0)
  includeRoleBreakdown?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include growth metrics.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false && value !== 0)
  includeGrowthMetrics?: boolean = true;
}

// ============================================================================
// REQUEST DTOs (Admin Actions)
// ============================================================================

export class AdminUpdateUserRequestDto {
  @ApiPropertyOptional({
    description: 'Updated first name',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters.' })
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
    description: 'Updated last name',
    example: 'Mwangi',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters.' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Updated email address',
    example: 'john.mwangi@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    return undefined;
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Account active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Email verification status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Phone verification status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  phoneVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Lock account until date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  lockedUntil?: string;

  @ApiPropertyOptional({
    description: 'Reset the number of failed login attempts.',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }): number | undefined => {
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  loginAttempts?: number;

  @ApiPropertyOptional({
    description: 'Marketing preferences opt-in status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}

export class UpdateUserRoleRequestDto {
  @ApiProperty({
    description: 'The new role to assign to the user.',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @IsEnum(UserRole, { message: 'Please provide a valid user role.' })
  newRole!: UserRole;

  @ApiPropertyOptional({
    description: 'Reason for the role change (for audit trail).',
    example: 'Promoted to admin for project management duties.',
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

  @ApiPropertyOptional({
    description: 'Notify user about role change via email.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false && value !== 0)
  notifyUser?: boolean = true;
}

export class LockUserAccountRequestDto {
  @ApiPropertyOptional({
    description: 'Duration of the lock in minutes. If not provided, locks indefinitely.',
    example: 60,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }): number | undefined => {
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  durationMinutes?: number;

  @ApiProperty({
    description: 'Reason for locking the account.',
    example: 'Suspicious activity detected.',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @MinLength(1, { message: 'Reason is required.' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  reason!: string;

  @ApiPropertyOptional({
    description: 'Notify user about account lock via email.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false && value !== 0)
  notifyUser?: boolean = true;
}

export class UnlockUserAccountRequestDto {
  @ApiPropertyOptional({
    description: 'Reason for unlocking the account.',
    example: 'Issue resolved after investigation.',
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

  @ApiPropertyOptional({
    description: 'Notify user about account unlock via email.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false && value !== 0)
  notifyUser?: boolean = true;
}

export class SoftDeleteUserRequestDto {
  @ApiProperty({
    description: 'Reason for deleting the user account.',
    example: 'User requested account deletion.',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @MinLength(1, { message: 'Reason is required.' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  reason!: string;

  @ApiPropertyOptional({
    description: 'Permanently delete user data (irreversible).',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  permanent?: boolean = false;

  @ApiPropertyOptional({
    description: 'Notify user about account deletion via email.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false && value !== 0)
  notifyUser?: boolean = true;
}

export class RestoreUserRequestDto {
  @ApiPropertyOptional({
    description: 'Reason for restoring the user account.',
    example: 'User requested account restoration.',
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

  @ApiPropertyOptional({
    description: 'Reactivate account upon restoration.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false && value !== 0)
  reactivate?: boolean = true;
}

export class AdminCreateUserRequestDto {
  @ApiProperty({
    description: 'User first name.',
    example: 'Jane',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters.' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  firstName!: string;

  @ApiProperty({
    description: 'User last name.',
    example: 'Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters.' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  lastName!: string;

  @ApiProperty({
    description: 'User email address.',
    example: 'jane.doe@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    return undefined;
  })
  email!: string;

  @ApiPropertyOptional({
    description: 'User role.',
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.USER;

  @ApiPropertyOptional({
    description: 'Whether to send welcome email with temporary password.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false && value !== 0)
  sendWelcomeEmail?: boolean = true;

  @ApiPropertyOptional({
    description: 'Mark email as verified upon creation.',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  emailVerified?: boolean = false;

  @ApiPropertyOptional({
    description: 'Account active status upon creation.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false && value !== 0)
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Marketing preferences opt-in.',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean = false;
}

export class AdminBulkUpdateUsersRequestDto {
  @ApiProperty({
    description: 'Array of user IDs to update.',
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one user ID is required.' })
  @IsUUID('4', { each: true, message: 'Each user ID must be a valid UUID.' })
  userIds!: string[];

  @ApiPropertyOptional({
    description: 'New role to apply to all selected users.',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Set active status for all selected users.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Set email verified status for all selected users.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Lock until date for all selected users (ISO 8601).',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  lockedUntil?: string;

  @ApiPropertyOptional({
    description: 'Reset login attempts for all selected users.',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }): number | undefined => {
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  loginAttempts?: number;

  @ApiPropertyOptional({
    description: 'Reason for bulk update (for audit trail).',
    example: 'Security policy update',
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

export class AdminSendNotificationRequestDto {
  @ApiProperty({
    description: 'User IDs to send notification to.',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one user ID is required.' })
  @IsUUID('4', { each: true, message: 'Each user ID must be a valid UUID.' })
  userIds!: string[];

  @ApiProperty({
    description: 'Notification subject.',
    example: 'Important System Update',
    maxLength: 200,
  })
  @IsString()
  @MinLength(1, { message: 'Subject is required.' })
  @MaxLength(200, { message: 'Subject cannot exceed 200 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  subject!: string;

  @ApiProperty({
    description: 'Notification message.',
    example: 'We will be performing system maintenance on...',
    maxLength: 2000,
  })
  @IsString()
  @MinLength(1, { message: 'Message is required.' })
  @MaxLength(2000, { message: 'Message cannot exceed 2000 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Notification type.',
    example: 'system_announcement',
    default: 'system_announcement',
  })
  @IsOptional()
  @IsString()
  @IsIn(['system_announcement', 'security_alert', 'feature_update', 'general'], {
    message: 'Invalid notification type.',
  })
  type?: string = 'system_announcement';

  @ApiPropertyOptional({
    description: 'Send as email notification.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean = true;

  @ApiPropertyOptional({
    description: 'Send as in-app notification.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  sendInApp?: boolean = true;
}

export class AdminSystemMaintenanceRequestDto {
  @ApiProperty({
    description: 'Maintenance mode enabled.',
    example: true,
  })
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({
    description: 'Maintenance message to display to users.',
    example: 'System is undergoing maintenance. We will be back shortly.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'Estimated completion time (ISO 8601).',
    example: '2024-10-25T14:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  estimatedCompletion?: string;

  @ApiPropertyOptional({
    description: 'Allow admin users to access during maintenance.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowAdminAccess?: boolean = true;
}

// ============================================================================
// RESPONSE DTOs (Admin Outputs)
// ============================================================================

export class DetailedUserResponseDto extends BaseResponseDto {
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
  role!: UserRole;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  emailVerified!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  phoneVerified!: boolean;

  @ApiPropertyOptional({ example: '2024-10-25T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  lastLoginAt?: Date;

  @ApiProperty({ example: 0 })
  @IsNumber()
  loginAttempts!: number;

  @ApiPropertyOptional({ example: '2024-10-25T11:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  lockedUntil?: Date;

  @ApiProperty({ example: '2024-01-15T08:20:00.000Z' })
  @IsDateString()
  declare createdAt: Date;

  @ApiProperty({ example: '2024-10-25T10:30:00.000Z' })
  @IsDateString()
  declare updatedAt: Date;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsDateString()
  deletedAt?: Date;

  @ApiProperty({ example: false })
  @IsBoolean()
  marketingOptIn!: boolean;

  @ApiProperty({ example: 75 })
  @IsNumber()
  @Min(0)
  @Max(100)
  profileCompletion!: number;

  @ApiProperty({ example: 3 })
  @IsNumber()
  activeSessions!: number;

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

export class AdminUpdateUserResponseDto {
  @ApiProperty({
    example: 'User updated successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({ type: () => DetailedUserResponseDto })
  @ValidateNested()
  @Type(() => DetailedUserResponseDto)
  user!: DetailedUserResponseDto;

  @ApiProperty({
    description: 'Fields that were updated.',
    example: ['firstName', 'emailVerified'],
  })
  @IsArray()
  @IsString({ each: true })
  updatedFields!: string[];
}

export class UpdateUserRoleResponseDto {
  @ApiProperty({
    example: 'User role updated successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'The user whose role was changed.',
    type: () => DetailedUserResponseDto,
  })
  @ValidateNested()
  @Type(() => DetailedUserResponseDto)
  user!: DetailedUserResponseDto;

  @ApiProperty({
    description: 'Previous role.',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsEnum(UserRole)
  previousRole!: UserRole;

  @ApiProperty({
    description: 'New role.',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @IsEnum(UserRole)
  newRole!: UserRole;

  @ApiProperty({
    description: 'Admin who made the change.',
    example: 'admin@example.com',
  })
  @IsString()
  changedBy!: string;

  @ApiPropertyOptional({
    description: 'Reason for the change.',
    example: 'Promoted to admin for project management duties.',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Whether user was notified.',
    example: true,
  })
  @IsBoolean()
  userNotified!: boolean;
}

export class LockUserAccountResponseDto {
  @ApiProperty({
    example: 'User account locked successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'User ID of the locked account.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  userId!: string;

  @ApiProperty({
    description: 'When the account will be unlocked (if temporary lock).',
    example: '2024-10-25T11:00:00.000Z',
  })
  @IsDateString()
  lockedUntil!: Date;

  @ApiProperty({
    description: 'Reason for locking.',
    example: 'Suspicious activity detected.',
  })
  @IsString()
  reason!: string;

  @ApiProperty({
    description: 'Admin who locked the account.',
    example: 'admin@example.com',
  })
  @IsString()
  lockedBy!: string;

  @ApiProperty({
    description: 'Whether user was notified.',
    example: true,
  })
  @IsBoolean()
  userNotified!: boolean;

  @ApiProperty({
    description: 'Number of active sessions terminated.',
    example: 3,
  })
  @IsNumber()
  sessionsTerminated!: number;
}

export class UnlockUserAccountResponseDto {
  @ApiProperty({
    example: 'User account unlocked successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'User ID of the unlocked account.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  userId!: string;

  @ApiProperty({
    description: 'Login attempts have been reset to 0.',
    example: 0,
  })
  @IsNumber()
  loginAttempts!: number;

  @ApiPropertyOptional({
    description: 'Reason for unlocking.',
    example: 'Issue resolved.',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Admin who unlocked the account.',
    example: 'admin@example.com',
  })
  @IsString()
  unlockedBy!: string;

  @ApiProperty({
    description: 'Whether user was notified.',
    example: true,
  })
  @IsBoolean()
  userNotified!: boolean;
}

export class SoftDeleteUserResponseDto {
  @ApiProperty({
    example: 'User account deleted successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'User ID of the deleted account.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  userId!: string;

  @ApiProperty({
    description: 'When the account was deleted.',
    example: '2024-10-25T10:30:00.000Z',
  })
  @IsDateString()
  deletedAt!: Date;

  @ApiProperty({
    description: 'Reason for deletion.',
    example: 'User requested account deletion.',
  })
  @IsString()
  reason!: string;

  @ApiProperty({
    description: 'Admin who deleted the account.',
    example: 'admin@example.com',
  })
  @IsString()
  deletedBy!: string;

  @ApiProperty({
    description: 'Whether deletion is permanent.',
    example: false,
  })
  @IsBoolean()
  permanent!: boolean;

  @ApiProperty({
    description: 'Whether user was notified.',
    example: true,
  })
  @IsBoolean()
  userNotified!: boolean;

  @ApiProperty({
    description: 'Number of sessions terminated.',
    example: 3,
  })
  @IsNumber()
  sessionsTerminated!: number;

  @ApiProperty({
    description: 'Data that will be permanently deleted after retention period.',
    example: ['personal_data', 'profile_information', 'sessions'],
  })
  @IsArray()
  @IsString({ each: true })
  dataScheduledForDeletion!: string[];
}

export class RestoreUserResponseDto {
  @ApiProperty({
    example: 'User account restored successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({ type: () => DetailedUserResponseDto })
  @ValidateNested()
  @Type(() => DetailedUserResponseDto)
  user!: DetailedUserResponseDto;

  @ApiPropertyOptional({
    description: 'Reason for restoration.',
    example: 'User requested account restoration.',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Admin who restored the account.',
    example: 'admin@example.com',
  })
  @IsString()
  restoredBy!: string;

  @ApiProperty({
    description: 'Whether account was reactivated.',
    example: true,
  })
  @IsBoolean()
  reactivated!: boolean;
}

export class AdminCreateUserResponseDto {
  @ApiProperty({
    example: 'User created successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({ type: () => DetailedUserResponseDto })
  @ValidateNested()
  @Type(() => DetailedUserResponseDto)
  user!: DetailedUserResponseDto;

  @ApiProperty({
    description: 'Temporary password generated for the user.',
    example: 'TempPass123!',
  })
  @IsString()
  temporaryPassword!: string;

  @ApiProperty({
    description: 'Whether welcome email was sent.',
    example: true,
  })
  @IsBoolean()
  emailSent!: boolean;

  @ApiProperty({
    description: 'Account activation status.',
    example: true,
  })
  @IsBoolean()
  isActive!: boolean;

  @ApiProperty({
    description: 'Email verification status.',
    example: false,
  })
  @IsBoolean()
  emailVerified!: boolean;
}

export class AdminBulkUpdateUsersResponseDto {
  @ApiProperty({
    example: 'Bulk update completed successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Number of users updated.',
    example: 15,
  })
  @IsNumber()
  @IsPositive()
  usersUpdated!: number;

  @ApiProperty({
    description: 'User IDs that were updated.',
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  updatedUserIds!: string[];

  @ApiPropertyOptional({
    description: 'User IDs that failed to update.',
    example: ['123e4567-e89b-12d3-a456-426614174002'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  failedUserIds?: string[];

  @ApiPropertyOptional({
    description: 'Details of failures.',
    example: [{ userId: '123e4567-e89b-12d3-a456-426614174002', error: 'User not found' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  failures?: Array<{ userId: string; error: string }>;

  @ApiPropertyOptional({
    description: 'Reason for bulk update.',
    example: 'Security policy update',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [DetailedUserResponseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetailedUserResponseDto)
  data!: DetailedUserResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  @ValidateNested()
  @Type(() => PaginationMetaDto)
  meta!: PaginationMetaDto;
}

export class RoleChangeResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'User ID whose role was changed.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  userId!: string;

  @ApiProperty({
    description: 'User email at the time of change.',
    example: 'john.mwangi@example.com',
  })
  @IsEmail()
  userEmail!: string;

  @ApiProperty({
    description: 'User full name at the time of change.',
    example: 'John Mwangi',
  })
  @IsString()
  userName!: string;

  @ApiProperty({
    enum: UserRole,
    description: 'Previous role.',
    example: UserRole.USER,
  })
  @IsEnum(UserRole)
  oldRole!: UserRole;

  @ApiProperty({
    enum: UserRole,
    description: 'New role.',
    example: UserRole.ADMIN,
  })
  @IsEnum(UserRole)
  newRole!: UserRole;

  @ApiPropertyOptional({
    description: 'Admin who made the change.',
    example: 'admin@example.com',
  })
  @IsOptional()
  @IsString()
  changedBy?: string;

  @ApiPropertyOptional({
    description: 'Reason for the change.',
    example: 'Promoted to admin',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Timestamp of the change.',
    example: '2024-10-25T10:30:00.000Z',
  })
  @IsDateString()
  declare createdAt: Date;
}

export class PaginatedRoleChangesResponseDto {
  @ApiProperty({ type: [RoleChangeResponseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleChangeResponseDto)
  data!: RoleChangeResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  @ValidateNested()
  @Type(() => PaginationMetaDto)
  meta!: PaginationMetaDto;
}

export class UserStatsResponseDto {
  @ApiProperty({
    description: 'Total number of users (excluding deleted).',
    example: 1250,
  })
  @IsNumber()
  @IsPositive()
  total!: number;

  @ApiProperty({
    description: 'Number of active users.',
    example: 1100,
  })
  @IsNumber()
  @IsPositive()
  active!: number;

  @ApiProperty({
    description: 'Number of inactive users.',
    example: 150,
  })
  @IsNumber()
  inactive!: number;

  @ApiProperty({
    description: 'Number of deleted users.',
    example: 50,
  })
  @IsNumber()
  deleted!: number;

  @ApiProperty({
    description: 'Number of locked users.',
    example: 25,
  })
  @IsNumber()
  locked!: number;

  @ApiProperty({
    description: 'Number of users created in the last 30 days.',
    example: 120,
  })
  @IsNumber()
  newLast30Days!: number;

  @ApiProperty({
    description: 'User count by role.',
    example: {
      [UserRole.USER]: 1000,
      [UserRole.ADMIN]: 10,
      [UserRole.VERIFIER]: 5,
      [UserRole.AUDITOR]: 5,
    },
  })
  @IsObject()
  byRole!: Record<UserRole, number>;

  @ApiProperty({
    description: 'Number of email verified users.',
    example: 1000,
  })
  @IsNumber()
  emailVerified!: number;

  @ApiProperty({
    description: 'Number of phone verified users.',
    example: 800,
  })
  @IsNumber()
  phoneVerified!: number;

  @ApiProperty({
    description: 'Average profile completion percentage.',
    example: 75,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  averageProfileCompletion!: number;

  @ApiProperty({
    description: 'Users with active sessions in last 24 hours.',
    example: 300,
  })
  @IsNumber()
  activeLast24Hours!: number;

  @ApiProperty({
    description: 'Growth rate compared to previous period.',
    example: 12.5,
  })
  @IsNumber()
  growthRate!: number;
}

export class GetUserResponseDto extends DetailedUserResponseDto {
  @ApiPropertyOptional({
    description: 'User sessions information.',
    type: () => [Object],
  })
  @IsOptional()
  @IsArray()
  sessions?: Array<{
    id: string;
    createdAt: Date;
    lastActivity: Date;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Role change history.',
    type: () => [Object],
  })
  @IsOptional()
  @IsArray()
  roleHistory?: Array<{
    oldRole: UserRole;
    newRole: UserRole;
    changedBy: string;
    reason?: string;
    changedAt: Date;
  }>;
}

export class AdminAuditLogResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Admin user ID who performed the action.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  adminId!: string;

  @ApiProperty({
    description: 'Admin email who performed the action.',
    example: 'admin@example.com',
  })
  @IsEmail()
  adminEmail!: string;

  @ApiPropertyOptional({
    description: 'Target user ID (if applicable).',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID('4')
  targetUserId?: string;

  @ApiPropertyOptional({
    description: 'Target user email (if applicable).',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  targetUserEmail?: string;

  @ApiProperty({
    description: 'Action performed.',
    example: 'user.role_changed',
  })
  @IsString()
  action!: string;

  @ApiProperty({
    description: 'Action description.',
    example: 'Changed user role from USER to ADMIN',
  })
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    description: 'IP address where action was performed.',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent of the admin.',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({
    description: 'Additional metadata about the action.',
    example: { previousRole: 'USER', newRole: 'ADMIN', reason: 'Promotion' },
  })
  @IsObject()
  metadata!: Record<string, any>;

  @ApiProperty({
    description: 'Timestamp of the action.',
    example: '2024-10-25T10:30:00.000Z',
  })
  @IsDateString()
  declare createdAt: Date;
}

export class PaginatedAuditLogResponseDto {
  @ApiProperty({ type: [AdminAuditLogResponseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminAuditLogResponseDto)
  data!: AdminAuditLogResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  @ValidateNested()
  @Type(() => PaginationMetaDto)
  meta!: PaginationMetaDto;
}

export class AdminSendNotificationResponseDto {
  @ApiProperty({
    example: 'Notifications sent successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Number of users notified.',
    example: 15,
  })
  @IsNumber()
  @IsPositive()
  usersNotified!: number;

  @ApiProperty({
    description: 'Number of emails sent.',
    example: 15,
  })
  @IsNumber()
  @IsPositive()
  emailsSent!: number;

  @ApiProperty({
    description: 'Number of in-app notifications sent.',
    example: 15,
  })
  @IsNumber()
  @IsPositive()
  inAppNotificationsSent!: number;

  @ApiPropertyOptional({
    description: 'Users that failed to notify.',
    example: ['123e4567-e89b-12d3-a456-426614174002'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  failedUsers?: string[];
}

export class SystemMaintenanceResponseDto {
  @ApiProperty({
    description: 'Maintenance mode status.',
    example: true,
  })
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({
    description: 'Maintenance message.',
    example: 'System is undergoing maintenance. We will be back shortly.',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    description: 'Estimated completion time.',
    example: '2024-10-25T14:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  estimatedCompletion?: string;

  @ApiProperty({
    description: 'Whether admin access is allowed.',
    example: true,
  })
  @IsBoolean()
  allowAdminAccess!: boolean;

  @ApiProperty({
    description: 'When maintenance mode was enabled.',
    example: '2024-10-25T10:00:00.000Z',
  })
  @IsDateString()
  enabledAt!: Date;

  @ApiProperty({
    description: 'Admin who enabled maintenance mode.',
    example: 'admin@example.com',
  })
  @IsString()
  enabledBy!: string;
}

export class SystemHealthResponseDto {
  @ApiProperty({
    description: 'Overall system status.',
    example: 'healthy',
    enum: ['healthy', 'degraded', 'unhealthy'],
  })
  @IsString()
  status!: string;

  @ApiProperty({
    description: 'Database connection status.',
    example: true,
  })
  @IsBoolean()
  database!: boolean;

  @ApiProperty({
    description: 'Redis cache status.',
    example: true,
  })
  @IsBoolean()
  cache!: boolean;

  @ApiProperty({
    description: 'Message broker status.',
    example: true,
  })
  @IsBoolean()
  messageBroker!: boolean;

  @ApiProperty({
    description: 'External service status.',
    example: true,
  })
  @IsBoolean()
  externalServices!: boolean;

  @ApiProperty({
    description: 'System uptime in seconds.',
    example: 86400,
  })
  @IsNumber()
  @IsPositive()
  uptime!: number;

  @ApiProperty({
    description: 'Memory usage percentage.',
    example: 45.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  memoryUsage!: number;

  @ApiProperty({
    description: 'CPU usage percentage.',
    example: 25.3,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  cpuUsage!: number;

  @ApiProperty({
    description: 'Active database connections.',
    example: 15,
  })
  @IsNumber()
  @IsPositive()
  activeConnections!: number;

  @ApiProperty({
    description: 'Response time in milliseconds.',
    example: 125,
  })
  @IsNumber()
  @IsPositive()
  responseTime!: number;

  @ApiProperty({
    description: 'Last health check timestamp.',
    example: '2024-10-25T10:30:00.000Z',
  })
  @IsDateString()
  lastChecked!: Date;
}
