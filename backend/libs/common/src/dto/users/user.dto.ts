import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  IsEnum,
  ValidateNested,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../enums';
import { BaseResponseDto } from '../shared/base.response.dto';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../shared/pagination.dto';

// ============================================================================
// ARCHITECTURAL NOTE:
// `CreateUserDto` has been removed. User creation is handled exclusively
// through the public registration flow (`RegisterRequestDto` in auth.dto.ts)
// or potentially a future, separate admin flow. This prevents ambiguity.
// ============================================================================

// ============================================================================
// NESTED DTOs (For Input Validation)
// ============================================================================

class AddressDto {
  @ApiPropertyOptional({ example: '123 Shamba Lane' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ example: 'Nairobi' })
  @IsOptional()
  @IsString()
  city?: string;
  
  @ApiPropertyOptional({ example: '00100' })
  @IsOptional()
  @IsString()
  postCode?: string;

  @ApiPropertyOptional({ example: 'Kenya' })
  @IsOptional()
  @IsString()
  country?: string;
}

class NextOfKinDto {
  @ApiProperty({ example: 'Jane Mwangi' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: 'Spouse' })
  @IsString()
  relationship!: string;

  @ApiProperty({ example: '+254712345678' })
  @IsPhoneNumber('KE') // Example: Region-specific phone number validation
  phoneNumber!: string;
}

// ============================================================================
// REQUEST DTOs (Input Validation)
// ============================================================================

export class UpdateUserRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  // Note: Email changes should typically have a separate, more secure flow
  // (e.g., with verification), but is included here for basic profile updates.
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdateUserProfileRequestDto {
  @ApiPropertyOptional({ description: 'A short user biography.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ description: 'User\'s primary phone number.' })
  @IsOptional()
  @IsPhoneNumber('KE')
  phoneNumber?: string;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ type: NextOfKinDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NextOfKinDto)
  nextOfKin?: NextOfKinDto;
}

/**
 * Defines the query parameters for filtering a list of users.
 * Extends the base PaginationQueryDto.
 */
export class UserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter users by their role.',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================

class UserProfileResponseDto {
  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional()
  phoneNumber?: string;
  
  @ApiPropertyOptional({ type: 'object' })
  address?: object; // In responses, we can be less strict with the shape if needed

  @ApiPropertyOptional({ type: 'object' })
  nextOfKin?: object;
}

export class UserResponseDto extends BaseResponseDto {
  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole = "LAND_OWNER";

  @ApiPropertyOptional({ type: () => UserProfileResponseDto })
  profile?: UserProfileResponseDto;
}