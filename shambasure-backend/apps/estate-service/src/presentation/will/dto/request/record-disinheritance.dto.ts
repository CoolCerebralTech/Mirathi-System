import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import type {
  DisinheritanceEvidenceType,
  DisinheritanceReasonCategory,
} from '../../../../domain/entities/disinheritance-record.entity';

class DisinheritedPersonDto {
  @ApiProperty({ enum: ['USER', 'FAMILY_MEMBER', 'EXTERNAL'] })
  @IsEnum(['USER', 'FAMILY_MEMBER', 'EXTERNAL'])
  type: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  familyMemberId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalRelationship?: string;
}

class EvidenceDto {
  @ApiProperty({
    enum: [
      'AFFIDAVIT',
      'WILL_CLARIFICATION',
      'PRIOR_GIFT_DOCUMENTATION',
      'FAMILY_AGREEMENT',
      'COURT_ORDER',
      'MEDICAL_REPORT',
      'OTHER',
    ],
  })
  @IsString() // Match entity type
  type: DisinheritanceEvidenceType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  documentId?: string;
}

export class RecordDisinheritanceRequestDto {
  @ApiProperty({ type: DisinheritedPersonDto })
  @ValidateNested()
  @Type(() => DisinheritedPersonDto)
  disinheritedPerson: DisinheritedPersonDto;

  @ApiProperty({ description: 'Legal category for the exclusion' })
  @IsString()
  reasonCategory: DisinheritanceReasonCategory;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reasonDescription: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalBasis?: string;

  @ApiProperty({ type: [EvidenceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenceDto)
  evidence: EvidenceDto[];

  @ApiProperty()
  @IsBoolean()
  isCompleteDisinheritance: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  appliesToBequests?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riskMitigationSteps?: string[];
}
