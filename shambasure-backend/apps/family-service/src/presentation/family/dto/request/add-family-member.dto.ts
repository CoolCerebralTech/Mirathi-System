import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import {
  Gender,
  KenyanCounty,
  RelationshipType,
} from '../../../../domain/value-objects/family-enums.vo';

export class AddFamilyMemberDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dateOfBirthEstimated?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ enum: KenyanCounty })
  @IsOptional()
  @IsEnum(KenyanCounty)
  placeOfBirth?: KenyanCounty;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tribe?: string;

  // --- Smart Link Features ---

  @ApiPropertyOptional({ description: 'ID of an existing relative to link to immediately' })
  @IsOptional()
  @IsUUID()
  relativeId?: string;

  @ApiPropertyOptional({
    enum: RelationshipType,
    description: 'How is the new member related to the relativeId? (e.g. CHILD of relativeId)',
  })
  @IsOptional()
  @IsEnum(RelationshipType)
  relationshipToRelative?: RelationshipType;
}
