import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { Gender, KenyanCounty } from '../../../../domain/value-objects/family-enums.vo';

class CreatorProfileDto {
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

  @ApiPropertyOptional({ description: 'Kenyan National ID Number' })
  @IsOptional()
  @IsString()
  nationalId?: string;
}

export class CreateFamilyDto {
  @ApiProperty({ example: 'The Omondi Family' })
  @IsString()
  @MinLength(2)
  familyName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: KenyanCounty })
  @IsOptional()
  @IsEnum(KenyanCounty)
  homeCounty?: KenyanCounty;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clanName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subClan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  totem?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => CreatorProfileDto)
  creatorProfile: CreatorProfileDto;
}
