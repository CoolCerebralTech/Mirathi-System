import { DependencyLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
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

import { BaseCommand, CommandMetadata } from '../base.command';

export class EvidenceDocumentCommand {
  @IsUUID()
  documentId: string;

  @IsString()
  evidenceType: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  addedAt?: Date;
}

const VALID_RELATIONSHIPS = [
  'SPOUSE',
  'CHILD',
  'PARENT',
  'SIBLING',
  'ADOPTED_CHILD',
  'STEP_PARENT',
  'STEP_CHILD',
  'GRANDPARENT',
  'HALF_SIBLING',
  'COHABITOR',
  'CUSTOMARY_WIFE',
  'EX_SPOUSE',
];

export class CreateDependencyAssessmentCommand extends BaseCommand {
  @IsUUID()
  deceasedId: string;

  @IsUUID()
  dependantId: string;

  @IsString()
  @IsIn(VALID_RELATIONSHIPS)
  dependencyBasis: string;

  @IsBoolean()
  isMinor: boolean;

  @IsOptional()
  @IsEnum(DependencyLevel)
  dependencyLevel?: DependencyLevel;

  @IsOptional()
  @IsBoolean()
  isStudent?: boolean;

  @ValidateIf((o) => o.isStudent === true && !o.isMinor)
  @IsDate()
  @Type(() => Date)
  studentUntil?: Date;

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

  @IsOptional()
  @IsString()
  assessmentMethod?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dependencyPercentage?: number;

  @ValidateIf((o) => o.isMinor === true)
  @IsUUID()
  custodialParentId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenceDocumentCommand)
  dependencyProofDocuments?: EvidenceDocumentCommand[];

  @IsOptional()
  @IsString()
  courtCaseReference?: string;

  readonly metadata: CommandMetadata;

  constructor(
    data: Omit<
      CreateDependencyAssessmentCommand,
      'metadata' | 'commandType' | 'correlationId' | 'causationId' | 'commandId' | 'timestamp'
    >,
    metadata: CommandMetadata,
    correlationId?: string,
    causationId?: string,
  ) {
    super(correlationId, causationId);
    Object.assign(this, data);
    this.metadata = metadata;
  }

  get commandType(): string {
    return 'CreateDependencyAssessmentCommand';
  }
}
