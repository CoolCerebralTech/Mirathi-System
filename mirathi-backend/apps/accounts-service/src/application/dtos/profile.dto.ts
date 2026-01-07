import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { IsKenyanPhoneNumber } from '@shamba/common';

// ============================================================================
// NESTED DTOs (For Complex Objects)
// ============================================================================

export class AddressDto {
  @ApiPropertyOptional({
    example: '123 Shamba Lane',
    description: 'Street address',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Street address cannot exceed 255 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  street?: string;

  @ApiPropertyOptional({
    example: 'Nairobi',
    description: 'City or town',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'City cannot exceed 100 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  city?: string;

  @ApiPropertyOptional({
    example: 'Nairobi County',
    description: 'County or province',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'County cannot exceed 100 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  county?: string;

  @ApiPropertyOptional({
    example: '00100',
    description: 'Postal code',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Postal code cannot exceed 20 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  postalCode?: string;

  @ApiProperty({
    example: 'Kenya',
    description: 'Country name',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100, { message: 'Country cannot exceed 100 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  country!: string;
}

// ============================================================================
// REQUEST DTOs
// ============================================================================

export class UpdateMyProfileRequestDto {
  @ApiPropertyOptional({
    description: 'Phone number in E.164 format.',
    example: '+254712345678',
    nullable: true,
  })
  @IsOptional()
  @IsKenyanPhoneNumber()
  phoneNumber?: string | null;

  @ApiPropertyOptional({
    description: 'User residential address.',
    type: () => AddressDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto | null;
}

export class UpdateMarketingPreferencesRequestDto {
  @ApiProperty({
    description: 'Opt-in or opt-out of marketing communications.',
    example: true,
  })
  @IsBoolean({ message: 'Marketing opt-in must be a boolean value.' })
  marketingOptIn!: boolean;
}

export class RemoveAddressRequestDto {
  @ApiPropertyOptional({
    description: 'Reason for removing address (for analytics).',
    example: 'Moving to new location',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Reason cannot exceed 200 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  reason?: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class UserProfileResponseDto {
  @ApiProperty({
    description: 'Profile unique identifier.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  id!: string;

  @ApiProperty({
    description: 'User ID this profile belongs to.',
    example: '987fcdeb-51a2-43f1-9876-543210fedcba',
  })
  @IsUUID('4')
  userId!: string;

  @ApiPropertyOptional({
    description: 'Phone number in E.164 format.',
    example: '+254712345678',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  // REMOVED: emailVerified field

  @ApiProperty({
    description: 'Marketing opt-in status.',
    example: false,
  })
  @IsBoolean()
  marketingOptIn!: boolean;

  @ApiPropertyOptional({
    description: 'User residential address.',
    type: () => AddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiProperty({
    description: 'Whether the profile is complete (all required fields filled).',
    example: false,
  })
  @IsBoolean()
  isComplete!: boolean;

  @ApiProperty({
    description: 'Profile completion percentage (0-100).',
    example: 67,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsPositive()
  completionPercentage!: number;

  @ApiProperty({
    description: 'Missing required fields for profile completion.',
    example: ['phoneNumber', 'address'],
  })
  missingFields!: string[];

  @ApiProperty({
    description: 'When the profile was created.',
    example: '2024-01-15T08:20:00.000Z',
  })
  @IsDateString()
  createdAt!: Date;

  @ApiProperty({
    description: 'When the profile was last updated.',
    example: '2024-10-25T10:30:00.000Z',
  })
  @IsDateString()
  updatedAt!: Date;

  // REMOVED: emailVerifiedAt field
}

export class UpdateMyProfileResponseDto {
  @ApiProperty({
    example: 'Profile updated successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({ type: () => UserProfileResponseDto })
  @ValidateNested()
  @Type(() => UserProfileResponseDto)
  profile!: UserProfileResponseDto;

  @ApiPropertyOptional({
    description: 'Fields that were updated.',
    example: ['phoneNumber', 'address'],
  })
  @IsOptional()
  updatedFields?: string[];

  @ApiPropertyOptional({
    description: 'Whether profile completion status changed.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  completionChanged?: boolean;

  @ApiPropertyOptional({
    description: 'Previous completion percentage.',
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  previousCompletion?: number;
}

export class GetMyProfileResponseDto extends UserProfileResponseDto {
  @ApiPropertyOptional({
    description: 'Security recommendations for profile completion.',
    example: ['Add phone number for account recovery'],
  })
  @IsOptional()
  securityRecommendations?: string[];

  @ApiPropertyOptional({
    description: 'Next steps for profile improvement.',
    example: ['Complete your address details'],
  })
  @IsOptional()
  nextSteps?: string[];
}

export class UpdateMarketingPreferencesResponseDto {
  @ApiProperty({
    example: 'Marketing preferences updated successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Updated marketing opt-in status.',
    example: true,
  })
  @IsBoolean()
  marketingOptIn!: boolean;

  @ApiProperty({
    description: 'When preferences were last updated.',
    example: '2024-10-25T10:30:00.000Z',
  })
  @IsDateString()
  updatedAt!: Date;
}

export class RemoveAddressResponseDto {
  @ApiProperty({
    example: 'Address removed successfully.',
  })
  @IsString()
  message!: string;

  @ApiPropertyOptional({
    description: 'Reason for removal (if provided).',
    example: 'Moving to new location',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Profile completion percentage after removal.',
    example: 50,
  })
  @IsNumber()
  @IsPositive()
  newCompletionPercentage!: number;
}

export class ProfileCompletionResponseDto {
  @ApiProperty({
    description: 'Current completion percentage.',
    example: 75,
  })
  @IsNumber()
  @IsPositive()
  completionPercentage!: number;

  @ApiProperty({
    description: 'Missing required fields.',
    example: ['phoneNumber', 'address'],
  })
  missingFields!: string[];

  @ApiProperty({
    description: 'Recommended next steps.',
    example: ['Add your phone number', 'Complete your address'],
  })
  recommendations!: string[];

  @ApiProperty({
    description: 'Whether profile meets minimum requirements.',
    example: true,
  })
  @IsBoolean()
  meetsMinimumRequirements!: boolean;

  @ApiPropertyOptional({
    description: 'Benefits of completing profile.',
    example: ['Faster account recovery', 'Enhanced security', 'Personalized experience'],
  })
  @IsOptional()
  benefits?: string[];
}
