// application/dependency/dto/request/create-dependency-assessment.request.ts
import { DependencyLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class EvidenceDocumentDto {
  @IsString()
  documentId: string;

  @IsString()
  evidenceType: string;

  @IsDateString()
  @IsOptional()
  addedAt?: string;
}

export class CreateDependencyAssessmentRequest {
  @IsString()
  deceasedId: string;

  @IsString()
  dependantId: string;

  @IsString()
  dependencyBasis: string; // 'SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'ADOPTED_CHILD', 'EX_SPOUSE', 'COHABITOR'

  @IsBoolean()
  isMinor: boolean;

  // Dependency details
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

  @IsOptional()
  @IsString()
  disabilityDetails?: string;

  // Financial details
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  monthlySupport?: number;

  @IsOptional()
  @IsDateString()
  supportStartDate?: string;

  @IsOptional()
  @IsDateString()
  supportEndDate?: string;

  // Assessment details
  @IsOptional()
  @IsString()
  assessmentMethod?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  dependencyPercentage?: number;

  // Custodial parent (for minors)
  @IsOptional()
  @IsString()
  custodialParentId?: string;

  // Evidence documents (optional at creation)
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EvidenceDocumentDto)
  dependencyProofDocuments?: EvidenceDocumentDto[];

  // User/System context (for audit)
  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  courtCaseReference?: string;
}
