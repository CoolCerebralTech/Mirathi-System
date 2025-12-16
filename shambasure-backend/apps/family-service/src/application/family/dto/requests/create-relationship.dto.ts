import { RelationshipType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateRelationshipDto {
  @IsNotEmpty()
  @IsUUID()
  familyId: string;

  @IsNotEmpty()
  @IsUUID()
  fromMemberId: string;

  @IsNotEmpty()
  @IsUUID()
  toMemberId: string;

  @IsNotEmpty()
  @IsEnum(RelationshipType)
  type: RelationshipType;

  @IsOptional()
  @IsString()
  strength?: string; // "FULL", "HALF", "STEP"

  @IsOptional()
  @IsBoolean()
  isBiological?: boolean;

  @IsOptional()
  @IsBoolean()
  isAdopted?: boolean;

  @IsOptional()
  @IsBoolean()
  isCustomaryAdoption?: boolean;

  @IsOptional()
  @IsDateString()
  relationshipStartDate?: string;
}
