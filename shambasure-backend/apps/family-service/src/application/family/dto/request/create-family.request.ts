// application/family/dto/request/create-family.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KenyanCounty } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

import { KENYAN_VALIDATION } from './base.request';

export class CreateFamilyRequest {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  @Matches(KENYAN_VALIDATION.NAME, {
    message: 'Family name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @ApiProperty({
    description: 'Family name/surname (required)',
    example: 'Mwangi',
    minLength: 2,
    maxLength: 100,
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User ID of the family creator',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  creatorId: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ApiPropertyOptional({
    description: 'Family description or history',
    example: 'Descendants of Chief Waiyaki wa Hinga',
    maxLength: 500,
  })
  description?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @Matches(KENYAN_VALIDATION.NAME)
  @ApiPropertyOptional({
    description: 'Clan name (Mũhĩrĩga)',
    example: 'Anjirũ',
    maxLength: 100,
  })
  clanName?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @Matches(KENYAN_VALIDATION.NAME)
  @ApiPropertyOptional({
    description: 'Sub-clan name',
    example: 'Mũcemanio',
    maxLength: 100,
  })
  subClan?: string;

  @IsString()
  @IsOptional()
  @Length(2, 200)
  @ApiPropertyOptional({
    description: 'Ancestral home or Mũgũrũ wa baba',
    example: 'Gatũndũ, Kiambu County',
    maxLength: 200,
  })
  ancestralHome?: string;

  @IsString()
  @IsOptional()
  @Length(2, 50)
  @ApiPropertyOptional({
    description: 'Family totem or symbol',
    example: 'Ngũ (Leopard)',
    maxLength: 50,
  })
  familyTotem?: string;

  @IsEnum(KenyanCounty)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Home county for legal jurisdiction',
    enum: KenyanCounty,
    example: KenyanCounty.KIAMBU,
  })
  homeCounty?: KenyanCounty;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Sub-county within the county',
    example: 'Gatundu North',
    maxLength: 100,
  })
  subCounty?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Ward within the sub-county',
    example: 'Gatundu',
    maxLength: 100,
  })
  ward?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Village or estate',
    example: 'Kiamwangi',
    maxLength: 100,
  })
  village?: string;

  @IsString()
  @IsOptional()
  @Length(2, 200)
  @ApiPropertyOptional({
    description: 'Specific place name',
    example: 'Waiyaki Family Homestead',
    maxLength: 200,
  })
  placeName?: string;
}
