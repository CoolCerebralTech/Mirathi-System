import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WillStatus, AssetType, RelationshipType } from '../../enums';

export class CreateWillDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ enum: WillStatus })
  @IsOptional()
  @IsEnum(WillStatus)
  status?: WillStatus;
}

export class UpdateWillDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ enum: WillStatus })
  @IsOptional()
  @IsEnum(WillStatus)
  status?: WillStatus;
}

export class CreateAssetDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: AssetType })
  @IsEnum(AssetType)
  type: AssetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class BeneficiaryAssignmentDto {
  @ApiProperty()
  @IsUUID()
  assetId: string;

  @ApiProperty()
  @IsUUID()
  beneficiaryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sharePercent?: number;
}

export class CreateFamilyDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}

export class AddFamilyMemberDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: RelationshipType })
  @IsEnum(RelationshipType)
  role: RelationshipType;
}

export class WillResponseDto extends BaseDto {
  @ApiProperty()
  title: string;

  @ApiProperty({ enum: WillStatus })
  status: WillStatus;

  @ApiProperty()
  testatorId: string;

  @ApiProperty()
  beneficiaryAssignments: BeneficiaryAssignmentResponseDto[];
}

export class AssetResponseDto extends BaseDto {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: AssetType })
  type: AssetType;

  @ApiProperty()
  ownerId: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;
}

export class BeneficiaryAssignmentResponseDto extends BaseDto {
  @ApiProperty()
  willId: string;

  @ApiProperty()
  assetId: string;

  @ApiProperty()
  beneficiaryId: string;

  @ApiPropertyOptional()
  sharePercent?: number;

  @ApiProperty()
  asset: AssetResponseDto;

  @ApiProperty()
  beneficiary: UserResponseDto;
}

export class FamilyResponseDto extends BaseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  members: FamilyMemberResponseDto[];
}

export class FamilyMemberResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: RelationshipType })
  role: RelationshipType;

  @ApiProperty()
  user: UserResponseDto;
}