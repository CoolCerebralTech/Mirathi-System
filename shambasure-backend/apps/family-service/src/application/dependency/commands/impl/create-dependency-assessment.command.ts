// application/dependency/commands/impl/create-dependency-assessment.command.ts
import { DependencyLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { BaseCommand, CommandMetadata } from '../base.command';

export class EvidenceDocumentCommand {
  @IsString()
  documentId: string;

  @IsString()
  evidenceType: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  addedAt?: Date;
}

export class CreateDependencyAssessmentCommand extends BaseCommand {
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
  @Min(0)
  monthlySupport?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  supportStartDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  supportEndDate?: Date;

  // Assessment details
  @IsOptional()
  @IsString()
  assessmentMethod?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  dependencyPercentage?: number;

  // Custodial parent (for minors)
  @IsOptional()
  @IsString()
  custodialParentId?: string;

  // Evidence documents
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenceDocumentCommand)
  dependencyProofDocuments?: EvidenceDocumentCommand[];

  // Court case reference (if applicable)
  @IsOptional()
  @IsString()
  courtCaseReference?: string;

  // Metadata
  readonly metadata: CommandMetadata;

  constructor(
    data: {
      deceasedId: string;
      dependantId: string;
      dependencyBasis: string;
      isMinor: boolean;
      dependencyLevel?: DependencyLevel;
      isStudent?: boolean;
      hasPhysicalDisability?: boolean;
      hasMentalDisability?: boolean;
      requiresOngoingCare?: boolean;
      disabilityDetails?: string;
      monthlySupport?: number;
      supportStartDate?: Date;
      supportEndDate?: Date;
      assessmentMethod?: string;
      dependencyPercentage?: number;
      custodialParentId?: string;
      dependencyProofDocuments?: EvidenceDocumentCommand[];
      courtCaseReference?: string;
    },
    metadata: CommandMetadata,
    correlationId?: string,
    causationId?: string,
  ) {
    super(correlationId, causationId);

    // Assign all properties
    Object.assign(this, data);
    this.metadata = metadata;

    // Validate dates
    this.validateDates();
  }

  get commandType(): string {
    return 'CreateDependencyAssessmentCommand';
  }

  private validateDates(): void {
    if (this.supportStartDate && this.supportEndDate) {
      if (this.supportStartDate > this.supportEndDate) {
        throw new Error('Support start date cannot be after end date.');
      }
    }
  }

  // Business rule validations specific to this command
  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate deceased and dependant are not the same
    if (this.deceasedId === this.dependantId) {
      errors.push('A person cannot be a dependant of themselves.');
    }

    // Validate minor status with age (if we had age, but we have isMinor flag)
    if (this.isMinor && this.isStudent === false) {
      warnings.push('Minor dependants are typically students. Please confirm student status.');
    }

    // Validate dependency basis against Kenyan law
    if (!this.isValidDependencyBasis()) {
      errors.push(
        `Invalid dependency basis: ${this.dependencyBasis}. Must be one of: SPOUSE, CHILD, PARENT, SIBLING, ADOPTED_CHILD, EX_SPOUSE, COHABITOR`,
      );
    }

    // Validate dependency level consistency
    if (this.dependencyLevel) {
      if (
        this.dependencyLevel === DependencyLevel.FULL &&
        this.dependencyPercentage !== undefined &&
        this.dependencyPercentage < 75
      ) {
        warnings.push('Dependency level FULL typically requires dependency percentage >= 75%');
      }
    }

    // Validate monthly support
    if (this.monthlySupport !== undefined && this.monthlySupport < 0) {
      errors.push('Monthly support cannot be negative.');
    }

    // Validate dependency percentage
    if (this.dependencyPercentage !== undefined) {
      if (this.dependencyPercentage < 0 || this.dependencyPercentage > 100) {
        errors.push('Dependency percentage must be between 0 and 100.');
      }
    }

    // Validate student status for adults
    if (this.isStudent && !this.isMinor && !this.supportEndDate) {
      warnings.push('Adult students should have an expected support end date.');
    }

    // Check for duplicate evidence documents
    if (this.dependencyProofDocuments) {
      const documentIds = this.dependencyProofDocuments.map((doc) => doc.documentId);
      const uniqueIds = new Set(documentIds);
      if (uniqueIds.size !== documentIds.length) {
        errors.push('Duplicate evidence document IDs found.');
      }
    }

    // Court case reference format validation
    if (this.courtCaseReference && !this.isValidCourtCaseReference()) {
      warnings.push('Court case reference format may be invalid. Expected format: CaseNumber/Year');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private isValidDependencyBasis(): boolean {
    const validBases = [
      'SPOUSE',
      'CHILD',
      'PARENT',
      'SIBLING',
      'ADOPTED_CHILD',
      'EX_SPOUSE',
      'COHABITOR',
    ];
    return validBases.includes(this.dependencyBasis);
  }

  private isValidCourtCaseReference(): boolean {
    // Simple validation for court case reference format
    // e.g., "1234/2023" or "HC Succ Cause 123/2022"
    const regex = /^[A-Za-z0-9\/\s\-]+$/;
    return regex.test(this.courtCaseReference || '');
  }

  // Helper method to get priority status based on dependency basis
  get isPriorityDependant(): boolean {
    return ['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(this.dependencyBasis);
  }

  // Generate a description for audit logging
  get description(): string {
    return `Create dependency assessment for dependant ${this.dependantId} of deceased ${this.deceasedId} under basis ${this.dependencyBasis}`;
  }
}
