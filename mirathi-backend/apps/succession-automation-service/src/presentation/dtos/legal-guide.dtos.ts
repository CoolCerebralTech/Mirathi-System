// apps/succession-automation-service/src/presentation/dtos/legal-guide.dtos.ts
import { ApiProperty } from '@nestjs/swagger';
import { KenyanFormType, SuccessionRegime, SuccessionReligion } from '@prisma/client';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class LegalGuideDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsString()
  summary: string;

  @ApiProperty()
  @IsString()
  fullContent: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  appliesToRegime: SuccessionRegime[];

  @ApiProperty({ type: [String] })
  @IsArray()
  appliesToReligion: SuccessionReligion[];

  @ApiProperty({ type: [String] })
  @IsArray()
  legalSections: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  relatedFormTypes: KenyanFormType[];

  @ApiProperty({ type: [String] })
  @IsArray()
  relatedTasks: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  keywords: string[];

  @ApiProperty()
  @IsNumber()
  viewCount: number;

  @ApiProperty()
  @IsString()
  createdAt: string;
}

export class GetLegalGuidesQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, enum: SuccessionRegime })
  @IsOptional()
  @IsEnum(SuccessionRegime)
  regime?: SuccessionRegime;

  @ApiProperty({ required: false, enum: SuccessionReligion })
  @IsOptional()
  @IsEnum(SuccessionReligion)
  religion?: SuccessionReligion;
}
