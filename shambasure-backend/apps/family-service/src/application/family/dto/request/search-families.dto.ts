// application/family/dto/request/search-families.request.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { KenyanCounty } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

import { PaginationDto } from '../../../common/dto/pagination.dto';
import { KENYAN_VALIDATION } from './base.request';

export class SearchFamiliesRequest extends PaginationDto {
  @IsString()
  @IsOptional()
  @Length(2, 100)
  @Matches(KENYAN_VALIDATION.NAME)
  @ApiPropertyOptional({
    description: 'Search by family name',
    example: 'Mwangi',
    minLength: 2,
    maxLength: 100,
  })
  name?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @Matches(KENYAN_VALIDATION.NAME)
  @ApiPropertyOptional({
    description: 'Search by clan name',
    example: 'Anjirũ',
    minLength: 2,
    maxLength: 100,
  })
  clanName?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Search by ancestral home',
    example: 'Gatundu',
    minLength: 2,
    maxLength: 100,
  })
  ancestralHome?: string;

  @IsEnum(KenyanCounty)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Search by county',
    enum: KenyanCounty,
    example: KenyanCounty.KIAMBU,
  })
  county?: KenyanCounty;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiPropertyOptional({
    description: 'Search for polygamous families',
    example: false,
  })
  isPolygamous?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiPropertyOptional({
    description: 'Search for families with living members',
    example: true,
  })
  hasLivingMembers?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiPropertyOptional({
    description: 'Search for families with minors',
    example: false,
  })
  hasMinors?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiPropertyOptional({
    description: 'Search for active families',
    example: true,
  })
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiPropertyOptional({
    description: 'Search for archived families',
    example: false,
  })
  isArchived?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({
    description: 'Minimum member count',
    example: 5,
    minimum: 0,
  })
  minMemberCount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({
    description: 'Maximum member count',
    example: 100,
    minimum: 0,
  })
  maxMemberCount?: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Search by family ID',
    example: 'fam-1234567890',
  })
  familyId?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Search by creator user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  creatorId?: string;

  @IsArray()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional({
    description: 'Array of family IDs to search within',
    example: ['fam-1234567890', 'fam-0987654321'],
    type: [String],
  })
  familyIds?: string[];

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Search by family totem/symbol',
    example: 'Ngũ (Leopard)',
    maxLength: 50,
  })
  familyTotem?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Search by sub-county',
    example: 'Gatundu North',
    maxLength: 100,
  })
  subCounty?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Search by village',
    example: 'Kiamwangi',
    maxLength: 100,
  })
  village?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Search by ward',
    example: 'Gatundu',
    maxLength: 100,
  })
  ward?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Search by place name',
    example: 'Waiyaki Family Homestead',
    maxLength: 100,
  })
  placeName?: string;
}
