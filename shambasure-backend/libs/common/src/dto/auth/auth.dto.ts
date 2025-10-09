import { IsEmail, IsString, MinLength, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../enums';
import { BaseResponseDto } from '../shared/base.response.dto';
import { IsStrongPassword } from '../../decorators/is-password.decorator';

// ============================================================================
// REQUEST DTOs (Input Validation)
// ============================================================================

export class LoginRequestDto {
  @ApiProperty({
    description: 'User email address.',
    example: 'john.mwangi@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'User password.', example: 'SecurePassword123!' })
  @IsString()
  password!: string;
}

export class RegisterRequestDto {
  @ApiProperty({ description: 'User first name.', example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ description: 'User last name.', example: 'Mwangi' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({
    description: 'User email address.',
    example: 'john.mwangi@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password. Must meet the configured security policy.',
    example: 'SecurePassword123!',
  })
  @IsStrongPassword()
  password!: string;

  @ApiPropertyOptional({
    description: 'User role. Defaults to LAND_OWNER.',
    enum: UserRole,
    default: UserRole.LAND_OWNER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.LAND_OWNER;
}

export class ChangePasswordRequestDto {
  @ApiProperty({
    description: "The user's current password.",
    example: 'OldPassword123!',
  })
  @IsString()
  currentPassword!: string;

  @ApiProperty({
    description: 'The desired new password.',
    example: 'NewSecurePassword123!',
  })
  @IsStrongPassword()
  newPassword!: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty({
    description: 'The password reset token received via email/SMS.',
    example: 'reset-token-123',
  })
  @IsString()
  token!: string;

  @ApiProperty({
    description: 'The desired new password.',
    example: 'ResetPassword123!',
  })
  @IsStrongPassword()
  newPassword!: string;
}

export class ForgotPasswordRequestDto {
  @ApiProperty({
    description: 'The email address to send a password reset link to.',
    example: 'john.mwangi@example.com',
  })
  @IsEmail()
  email!: string;
}

// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================

/**
 * Defines the shape of the User object returned upon successful authentication.
 */
class AuthUserResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'john.mwangi@example.com' })
  email!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Mwangi' })
  lastName!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.LAND_OWNER })
  role: UserRole = UserRole.LAND_OWNER;
}

/**
 * Defines the response body for a successful login or registration.
 */
export class AuthResponseDto {
  @ApiProperty({ description: 'A short-lived JSON Web Token for API access.' })
  accessToken!: string;

  @ApiProperty({
    description: 'A long-lived token used to obtain a new access token.',
  })
  refreshToken!: string;

  @ApiProperty({ type: () => AuthUserResponseDto })
  user: AuthUserResponseDto = new AuthUserResponseDto();
}
