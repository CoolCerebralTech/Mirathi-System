import { KenyanCounty } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFamilyDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  creatorId: string; // The user creating the family tree

  @IsOptional()
  @IsString()
  clanName?: string;

  @IsOptional()
  @IsString()
  subClan?: string;

  @IsOptional()
  @IsString()
  ancestralHome?: string;

  @IsOptional()
  @IsString()
  familyTotem?: string;

  @IsOptional()
  @IsEnum(KenyanCounty)
  homeCounty?: KenyanCounty;
}
