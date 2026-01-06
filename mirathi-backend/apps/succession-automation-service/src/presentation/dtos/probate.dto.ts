import { ApiProperty } from '@nestjs/swagger';
import { KenyanFormType } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

// --- REQUESTS ---

export class GetFormPreviewParamDto {
  @ApiProperty({
    enum: KenyanFormType,
    description: 'The specific form code (e.g., PA80_INTESTATE)',
  })
  @IsNotEmpty()
  @IsEnum(KenyanFormType)
  formType: KenyanFormType;
}

// --- RESPONSES ---

export class FormMetadataDto {
  @ApiProperty({ enum: KenyanFormType })
  type: KenyanFormType;

  @ApiProperty({ example: 'Petition for Letters of Administration' })
  title: string;

  @ApiProperty({ example: 'P&A 80' })
  code: string;

  @ApiProperty()
  purpose: string;

  @ApiProperty({ type: [String] })
  instructions: string[];
}

export class ProbateDashboardDto {
  @ApiProperty({ example: 'uuid-string' })
  previewId: string;

  @ApiProperty({ description: 'If true, readiness score is > 80% and forms can be generated' })
  canGenerate: boolean;

  @ApiProperty({
    type: [FormMetadataDto],
    description: 'List of forms required for this specific case',
  })
  requiredForms: FormMetadataDto[];

  @ApiProperty({ type: [String], description: 'Reasons why generation might be blocked' })
  warnings: string[];
}

export class FormPreviewResponseDto {
  @ApiProperty({ enum: KenyanFormType })
  formType: KenyanFormType;

  @ApiProperty({ description: 'The raw HTML string of the form' })
  html: string;

  @ApiProperty({ example: 'EDUCATIONAL USE ONLY' })
  disclaimer: string;

  @ApiProperty()
  generatedAt: Date;
}
