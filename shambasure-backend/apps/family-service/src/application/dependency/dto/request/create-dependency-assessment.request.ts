import { DependencyLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class EvidenceDocumentDto {
  @IsUUID()
  documentId: string;

  @IsString()
  evidenceType: string;

  @IsDateString()
  @IsOptional()
  addedAt?: string;
}

// Valid Section 29 Relationship Categories
const S29_A_RELATIONSHIPS = ['SPOUSE', 'CHILD', 'ADOPTED_CHILD']; // Automatic dependants
const S29_B_RELATIONSHIPS = [
  'PARENT',
  'STEP_PARENT',
  'GRANDPARENT',
  'STEP_CHILD',
  'SIBLING',
  'HALF_SIBLING',
]; // Must prove maintenance
const S29_C_RELATIONSHIPS = ['COHABITOR', 'CUSTOMARY_WIFE']; // "Woman living as wife"

export class CreateDependencyAssessmentRequest {
  @IsUUID()
  deceasedId: string;

  @IsUUID()
  dependantId: string;

  /**
   * Strictly validated against Section 29 categories.
   * - S.29(a): Spouse, Child (Automatic FULL)
   * - S.29(b): Parents, Siblings (Conditional PARTIAL - requires proof of maintenance)
   * - S.29(c): Cohabitor (Requires proof of duration/children)
   */
  @IsString()
  @IsIn([...S29_A_RELATIONSHIPS, ...S29_B_RELATIONSHIPS, ...S29_C_RELATIONSHIPS], {
    message: 'Dependency basis must be a valid relationship under S.29 Law of Succession Act',
  })
  dependencyBasis: string;

  @IsBoolean()
  isMinor: boolean;

  // --- Dependency Status Details ---

  @IsOptional()
  @IsEnum(DependencyLevel)
  dependencyLevel?: DependencyLevel;

  @IsOptional()
  @IsBoolean()
  isStudent?: boolean;

  // Students over 18 must provide expected completion date
  @ValidateIf((o) => o.isStudent === true && !o.isMinor)
  @IsDateString()
  studentUntil?: string;

  // --- Disability (S.29(2) Special Provision) ---

  @IsOptional()
  @IsBoolean()
  hasPhysicalDisability?: boolean;

  @IsOptional()
  @IsBoolean()
  hasMentalDisability?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresOngoingCare?: boolean;

  @ValidateIf((o) => o.hasPhysicalDisability === true || o.hasMentalDisability === true)
  @IsString()
  disabilityDetails?: string;

  // --- Financial Evidence (Critical for S.29(b) - Parents/Siblings) ---

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlySupport?: number;

  @IsOptional()
  @IsDateString()
  supportStartDate?: string;

  @IsOptional()
  @IsDateString()
  supportEndDate?: string;

  // --- Assessment Configuration ---

  @IsOptional()
  @IsString()
  assessmentMethod?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  dependencyPercentage?: number;

  // --- Custodial Context ---

  // Required if the dependant is a minor to link S.26 claims properly
  @ValidateIf((o) => o.isMinor === true)
  @IsUUID()
  custodialParentId?: string;

  // --- Evidence ---

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EvidenceDocumentDto)
  dependencyProofDocuments?: EvidenceDocumentDto[];

  // --- Audit ---

  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @IsOptional()
  @IsString()
  courtCaseReference?: string;
}
