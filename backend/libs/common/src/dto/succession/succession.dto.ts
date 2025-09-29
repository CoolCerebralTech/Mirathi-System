import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, Min, Max, IsUUID, IsNotEmptyObject, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WillStatus, AssetType, RelationshipType } from '../../enums';
import { BaseResponseDto } from '../shared/base.response.dto';
import { PaginationQueryDto } from '../shared/pagination.dto';
import { UserResponseDto } from '../users/user.dto';

// ============================================================================
// REQUEST DTOs (Input Validation)
// ============================================================================

export class CreateWillRequestDto {
  @ApiProperty({ description: 'A descriptive title for the will.', example: 'Last Will and Testament of John Mwangi' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'The initial status of the will.',
    enum: WillStatus,
    default: WillStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(WillStatus)
  status? = WillStatus.DRAFT;
}

export class UpdateWillRequestDto {
  @ApiPropertyOptional({ description: 'A new title for the will.' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'The new status of the will.', enum: WillStatus })
  @IsOptional()
  @IsEnum(WillStatus)
  status?: WillStatus;
}

export class CreateAssetRequestDto {
  @ApiProperty({ description: 'The name of the asset.', example: 'Kajiado Land Parcel' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'A detailed description of the asset.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: AssetType, description: 'The type of the asset.' })
  @IsEnum(AssetType)
  type: AssetType = "LAND_PARCEL";
}

export class AssignBeneficiaryRequestDto {
  @ApiProperty({ description: 'The ID of the asset to be assigned.' })
  @IsUUID()
  assetId!: string;

  @ApiProperty({ description: 'The ID of the user who will be the beneficiary.' })
  @IsUUID()
  beneficiaryId!: string;

  @ApiPropertyOptional({
    description: 'The percentage share of the asset to be assigned (1-100).',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(100)
  sharePercent?: number;
}

export class CreateFamilyRequestDto {
  @ApiProperty({ description: 'The name of the family group.', example: 'The Mwangi Family' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;
}

export class AddFamilyMemberRequestDto {
  @ApiProperty({ description: 'The ID of the user to add to the family.' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: RelationshipType, description: 'The relationship of this user to the family creator.' })
  @IsEnum(RelationshipType)
  role: RelationshipType = "OTHER";
}

// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================

export class AssetResponseDto extends BaseResponseDto {
  @ApiProperty()
  name!: string;
  @ApiPropertyOptional()
  description?: string;
  @ApiProperty({ enum: AssetType })
  type: AssetType = "LAND_PARCEL";
  @ApiProperty()
  ownerId!: string;
}

export class BeneficiaryAssignmentResponseDto extends BaseResponseDto {
  @ApiProperty()
  willId!: string;
  @ApiProperty()
  assetId!: string;
  @ApiProperty()
  beneficiaryId!: string;
  @ApiPropertyOptional()
  sharePercent?: number;

  @ApiProperty({ type: () => AssetResponseDto, description: 'Details of the assigned asset.' })
  asset!: AssetResponseDto;

  @ApiProperty({ type: () => UserResponseDto, description: 'Details of the beneficiary.' })
  beneficiary: UserResponseDto = new UserResponseDto;
}

export class WillResponseDto extends BaseResponseDto {
  @ApiProperty()
  title!: string;
  @ApiProperty({ enum: WillStatus })
  status: WillStatus = "DRAFT";
  @ApiProperty()
  testatorId!: string;

  @ApiProperty({
    type: [BeneficiaryAssignmentResponseDto],
    description: 'A list of all beneficiary assignments within this will.',
  })
  beneficiaryAssignments!: BeneficiaryAssignmentResponseDto[];
}

export class FamilyMemberResponseDto {
  @ApiProperty()
  userId!: string;
  @ApiProperty({ enum: RelationshipType })
  role: RelationshipType = "OTHER";
  @ApiProperty({ type: () => UserResponseDto, description: 'Details of the family member.' })
  user: UserResponseDto = new UserResponseDto;
}

export class FamilyResponseDto extends BaseResponseDto {
  @ApiProperty()
  name!: string;
  @ApiProperty()
  creatorId!: string;
  @ApiProperty({
    type: [FamilyMemberResponseDto],
    description: 'A list of all members in this family.',
  })
  members!: FamilyMemberResponseDto[];
}