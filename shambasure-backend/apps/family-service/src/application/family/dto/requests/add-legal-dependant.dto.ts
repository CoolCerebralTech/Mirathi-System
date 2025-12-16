import { DependencyLevel } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class AddLegalDependantDto {
  @IsNotEmpty()
  @IsUUID()
  deceasedId: string;

  @IsNotEmpty()
  @IsUUID()
  dependantId: string;

  @IsNotEmpty()
  @IsString()
  dependencyBasis: string; // "SPOUSE", "CHILD", "PARENT", etc.

  @IsNotEmpty()
  @IsBoolean()
  isMinor: boolean;

  @IsOptional()
  @IsEnum(DependencyLevel)
  dependencyLevel?: DependencyLevel;

  @IsOptional()
  @IsBoolean()
  isStudent?: boolean;

  @IsOptional()
  @IsBoolean()
  hasPhysicalDisability?: boolean;

  @IsOptional()
  @IsBoolean()
  hasMentalDisability?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresOngoingCare?: boolean;

  // Financial Evidence
  @IsOptional()
  @IsNumber()
  monthlySupport?: number;

  @IsOptional()
  @IsNumber()
  dependencyPercentage?: number;
}
