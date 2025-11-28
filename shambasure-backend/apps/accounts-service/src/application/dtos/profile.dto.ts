import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsPostalCode,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { RelationshipType } from '@shamba/common';
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
  @IsPostalCode('any', { message: 'Please provide a valid postal code.' })
  postalCode?: string;

  @ApiProperty({
    example: 'Kenya',
    description: 'Country name',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Country is required.' })
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

export class NextOfKinDto {
  @ApiProperty({
    example: 'Jane Mwangi',
    description: 'Full name of next of kin',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required.' })
  @MinLength(2, { message: 'Full name must be at least 2 characters long.' })
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  @Matches(/^[a-zA-Z\s\-']+$/, {
    message: 'Full name can only contain letters, spaces, hyphens, and apostrophes.',
  })
  fullName!: string;

  @ApiProperty({
    description: 'Relationship to the user.',
    enum: RelationshipType,
    example: RelationshipType.SPOUSE,
  })
  @IsEnum(RelationshipType, { message: 'Please provide a valid relationship type.' })
  relationship!: RelationshipType;

  @ApiProperty({ description: 'Phone number in E.164 format.', example: '+254712345678' })
  @IsKenyanPhoneNumber()
  phoneNumber!: string;

  @ApiPropertyOptional({
    example: 'jane@example.com',
    description: 'Email address of next of kin',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  email?: string;

  @ApiPropertyOptional({
    type: () => AddressDto,
    description: 'Address of next of kin',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    description: 'Additional contact notes',
    example: 'Available during working hours',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Contact notes cannot exceed 200 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  contactNotes?: string;
}

// ============================================================================
// REQUEST DTOs
// ============================================================================

export class UpdateMyProfileRequestDto {
  @ApiPropertyOptional({
    description: 'A short user biography (max 500 characters).',
    example: 'Passionate about sustainable agriculture and land management.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio cannot exceed 500 characters.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  bio?: string;

  @ApiProperty({ description: 'Phone number in E.164 format.', example: '+254712345678' })
  @IsKenyanPhoneNumber()
  phoneNumber!: string;

  @ApiPropertyOptional({
    description: 'User residential address.',
    type: () => AddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto | null;

  @ApiPropertyOptional({
    description: 'Next of kin information.',
    type: () => NextOfKinDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NextOfKinDto)
  nextOfKin?: NextOfKinDto | null;
}

export class SendPhoneVerificationRequestDto {
  @ApiProperty({ description: 'Phone number in E.164 format.', example: '+254712345678' })
  @IsKenyanPhoneNumber()
  phoneNumber!: string;

  @ApiPropertyOptional({
    description: 'Preferred verification method.',
    example: 'sms',
    enum: ['sms', 'voice'],
    default: 'sms',
  })
  @IsOptional()
  @IsString()
  @IsIn(['sms', 'voice'], { message: 'Verification method must be either "sms" or "voice".' })
  method?: string;
}

export class VerifyPhoneRequestDto {
  @ApiProperty({
    description: '6-digit phone verification code.',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required.' })
  @IsNumberString({}, { message: 'Verification code must contain only numbers.' })
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits.' })
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  code!: string;

  @ApiProperty({ description: 'Phone number in E.164 format.', example: '+254712345678' })
  @IsKenyanPhoneNumber()
  phoneNumber!: string;
}

export class ResendPhoneVerificationRequestDto {
  @ApiProperty({ description: 'Phone number in E.164 format.', example: '+254712345678' })
  @IsKenyanPhoneNumber()
  phoneNumber!: string;

  @ApiPropertyOptional({
    description: 'Preferred verification method.',
    example: 'sms',
    enum: ['sms', 'voice'],
    default: 'sms',
  })
  @IsOptional()
  @IsString()
  @IsIn(['sms', 'voice'], { message: 'Verification method must be either "sms" or "voice".' })
  method?: string;
}

export class UpdateMarketingPreferencesRequestDto {
  @ApiProperty({
    description: 'Opt-in or opt-out of marketing communications.',
    example: true,
  })
  @IsBoolean({ message: 'Marketing opt-in must be a boolean value.' })
  marketingOptIn!: boolean;

  @ApiPropertyOptional({
    description: 'Opt-in to specific marketing categories.',
    example: ['newsletter', 'promotions', 'product_updates'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(['newsletter', 'promotions', 'product_updates', 'educational', 'events'], {
    each: true,
    message: 'Each marketing category must be valid.',
  })
  marketingCategories?: string[];

  @ApiPropertyOptional({
    description: 'Preferred communication channels.',
    example: ['email', 'sms'],
    default: ['email'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(['email', 'sms', 'push'], {
    each: true,
    message: 'Each communication channel must be valid.',
  })
  communicationChannels?: string[];
}

export class RemovePhoneNumberRequestDto {
  @ApiPropertyOptional({
    description: 'Reason for removing phone number (for analytics).',
    example: 'Changing phone number',
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

export class RemoveNextOfKinRequestDto {
  @ApiPropertyOptional({
    description: 'Reason for removing next of kin (for analytics).',
    example: 'Updated family information',
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

export class ValidatePhoneNumberRequestDto {
  @ApiProperty({ description: 'Phone number in E.164 format.', example: '+254712345678' })
  @IsKenyanPhoneNumber()
  phoneNumber!: string;
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
    description: 'User biography.',
    example: 'Passionate about sustainable agriculture.',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Phone number in E.164 format.',
    example: '+254712345678',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Whether the phone number has been verified.',
    example: false,
  })
  @IsBoolean()
  phoneVerified!: boolean;

  @ApiProperty({
    description: 'Whether the email has been verified.',
    example: true,
  })
  @IsBoolean()
  emailVerified!: boolean;

  @ApiProperty({
    description: 'Marketing opt-in status.',
    example: false,
  })
  @IsBoolean()
  marketingOptIn!: boolean;

  @ApiPropertyOptional({
    description: 'Marketing categories the user has opted into.',
    example: ['newsletter', 'product_updates'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  marketingCategories?: string[];

  @ApiPropertyOptional({
    description: 'Preferred communication channels.',
    example: ['email', 'sms'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  communicationChannels?: string[];

  @ApiPropertyOptional({
    description: 'User residential address.',
    type: () => AddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    description: 'Next of kin information.',
    type: () => NextOfKinDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NextOfKinDto)
  nextOfKin?: NextOfKinDto;

  @ApiPropertyOptional({
    description: 'Preferred language for communications.',
    example: 'en',
    default: 'en',
  })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @ApiPropertyOptional({
    description: 'Timezone for notifications.',
    example: 'Africa/Nairobi',
    default: 'Africa/Nairobi',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

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
  @IsArray()
  @IsString({ each: true })
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

  @ApiPropertyOptional({
    description: 'When phone was last verified.',
    example: '2024-10-25T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  phoneVerifiedAt?: Date;

  @ApiPropertyOptional({
    description: 'When email was last verified.',
    example: '2024-01-20T09:15:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  emailVerifiedAt?: Date;
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
    example: ['bio', 'address'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
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
    example: ['Add phone number for account recovery', 'Verify your phone number'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  securityRecommendations?: string[];

  @ApiPropertyOptional({
    description: 'Next steps for profile improvement.',
    example: ['Add next of kin information', 'Complete your address details'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nextSteps?: string[];
}

export class SendPhoneVerificationResponseDto {
  @ApiProperty({
    example: 'Verification code sent to your phone.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Phone number the code was sent to (masked).',
    example: '+254****5678',
  })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({
    description: 'Network provider.',
    enum: ['Safaricom', 'Airtel', 'Telkom', 'Unknown'],
    example: 'Safaricom',
  })
  @IsString()
  provider!: string;

  @ApiProperty({
    description: 'Verification method used.',
    example: 'sms',
    enum: ['sms', 'voice'],
  })
  @IsString()
  method!: string;

  @ApiProperty({
    description: 'When the next code can be requested.',
    example: '2024-10-25T10:40:00.000Z',
  })
  @IsDateString()
  nextRetryAt!: Date;

  @ApiProperty({
    description: 'Seconds to wait before next attempt.',
    example: 60,
  })
  @IsNumber()
  @IsPositive()
  retryAfterSeconds!: number;

  @ApiProperty({
    description: 'Minutes until the code expires.',
    example: 10,
  })
  @IsNumber()
  @IsPositive()
  expiresInMinutes!: number;

  @ApiProperty({
    description: 'Number of verification attempts remaining.',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  attemptsRemaining!: number;

  @ApiProperty({
    description: 'Total verification attempts made.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  attemptsMade!: number;
}

export class VerifyPhoneResponseDto {
  @ApiProperty({
    example: 'Phone number verified successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Verified phone number (masked).',
    example: '+254****5678',
  })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({
    description: 'Network provider.',
    example: 'Safaricom',
  })
  @IsString()
  provider!: string;

  @ApiProperty({
    description: 'When the verification occurred.',
    example: '2024-10-25T10:30:00.000Z',
  })
  @IsDateString()
  verifiedAt!: Date;

  @ApiPropertyOptional({
    description: 'Updated profile with verification status.',
    type: () => UserProfileResponseDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserProfileResponseDto)
  profile?: UserProfileResponseDto;
}

export class ResendPhoneVerificationResponseDto {
  @ApiProperty({
    example: 'Verification code resent to your phone.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Phone number (masked).',
    example: '+254****5678',
  })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({
    description: 'Verification method used.',
    example: 'sms',
  })
  @IsString()
  method!: string;

  @ApiProperty({
    description: 'When the next code can be requested.',
    example: '2024-10-25T10:40:00.000Z',
  })
  @IsDateString()
  nextRetryAt!: Date;

  @ApiProperty({
    description: 'Seconds to wait before next attempt.',
    example: 60,
  })
  @IsNumber()
  @IsPositive()
  retryAfterSeconds!: number;

  @ApiProperty({
    description: 'Number of resend attempts made.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  resendAttempts!: number;
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

  @ApiPropertyOptional({
    description: 'Updated marketing categories.',
    example: ['newsletter', 'product_updates'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  marketingCategories?: string[];

  @ApiPropertyOptional({
    description: 'Updated communication channels.',
    example: ['email', 'sms'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  communicationChannels?: string[];

  @ApiProperty({
    description: 'When preferences were last updated.',
    example: '2024-10-25T10:30:00.000Z',
  })
  @IsDateString()
  updatedAt!: Date;
}

export class RemovePhoneNumberResponseDto {
  @ApiProperty({
    example: 'Phone number removed successfully.',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'The removed phone number (masked).',
    example: '+254****5678',
  })
  @IsString()
  previousPhoneNumber!: string;

  @ApiProperty({
    description: 'Whether phone verification status was reset.',
    example: true,
  })
  @IsBoolean()
  verificationReset!: boolean;

  @ApiPropertyOptional({
    description: 'Reason for removal (if provided).',
    example: 'Changing phone number',
  })
  @IsOptional()
  @IsString()
  reason?: string;
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

export class RemoveNextOfKinResponseDto {
  @ApiProperty({
    example: 'Next of kin information removed successfully.',
  })
  @IsString()
  message!: string;

  @ApiPropertyOptional({
    description: 'Reason for removal (if provided).',
    example: 'Updated family information',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Profile completion percentage after removal.',
    example: 60,
  })
  @IsNumber()
  @IsPositive()
  newCompletionPercentage!: number;
}

export class ValidatePhoneNumberResponseDto {
  @ApiProperty({
    description: 'Whether the phone number is valid.',
    example: true,
  })
  @IsBoolean()
  valid!: boolean;

  @ApiProperty({
    description: 'Normalized phone number in E.164 format.',
    example: '+254712345678',
  })
  @IsString()
  normalizedNumber!: string;

  @ApiProperty({
    description: 'Network provider.',
    example: 'Safaricom',
  })
  @IsString()
  provider!: string;

  @ApiProperty({
    description: 'Phone number type.',
    example: 'mobile',
    enum: ['mobile', 'landline', 'voip', 'unknown'],
  })
  @IsString()
  type!: string;

  @ApiPropertyOptional({
    description: 'Country code.',
    example: 'KE',
  })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({
    description: 'Error message if invalid.',
    example: 'Invalid phone number format',
  })
  @IsOptional()
  @IsString()
  error?: string;
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
    example: ['phoneVerified', 'nextOfKin'],
  })
  @IsArray()
  @IsString({ each: true })
  missingFields!: string[];

  @ApiProperty({
    description: 'Recommended next steps.',
    example: ['Verify your phone number', 'Add next of kin information'],
  })
  @IsArray()
  @IsString({ each: true })
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
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];
}
