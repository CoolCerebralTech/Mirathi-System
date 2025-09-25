import { IsEmail, IsString, MinLength, MaxLength, Matches, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../enums';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.mwangi@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.mwangi@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (min 8 chars, with uppercase, lowercase, number, special char)',
    example: 'SecurePassword123!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Mwangi',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    default: UserRole.LAND_OWNER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'User email address',
  })
  @IsEmail()
  email: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'User information',
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}