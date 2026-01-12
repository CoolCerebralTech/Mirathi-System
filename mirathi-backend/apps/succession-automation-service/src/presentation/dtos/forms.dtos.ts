// apps/succession-automation-service/src/presentation/dtos/forms.dtos.ts
import { ApiProperty } from '@nestjs/swagger';
import { KenyanFormType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class GeneratedFormDto {
  @ApiProperty({ enum: KenyanFormType })
  @IsEnum(KenyanFormType)
  formType: KenyanFormType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  htmlPreview: string;

  @ApiProperty()
  @IsString()
  purpose: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  instructions: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  missingFields: string[];
}

export class ProbateFormsResponseDto {
  @ApiProperty()
  @IsUUID()
  previewId: string;

  @ApiProperty()
  @IsBoolean()
  isComplete: boolean;

  @ApiProperty({ type: [GeneratedFormDto] })
  forms: GeneratedFormDto[];

  @ApiProperty({ type: [String] })
  missingRequirements: string[];

  @ApiProperty()
  @IsNumber()
  totalForms: number;

  @ApiProperty()
  @IsNumber()
  completedForms: number;
}

export class DownloadFormRequestDto {
  @ApiProperty({ enum: KenyanFormType })
  @IsEnum(KenyanFormType)
  formType: KenyanFormType;

  @ApiProperty({ required: false, description: 'Format for download' })
  @IsOptional()
  @IsString()
  format?: 'html' | 'pdf' | 'doc';
}

export class DownloadFormResponseDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty()
  @IsString()
  contentType: string;

  @ApiProperty()
  @IsString()
  filename: string;

  @ApiProperty()
  @IsNumber()
  size: number;
}

export class FormStatusResponseDto {
  @ApiProperty()
  @IsBoolean()
  isReady: boolean;

  @ApiProperty({ type: [String] })
  @IsArray()
  requiredForms: KenyanFormType[];

  @ApiProperty({ type: [String] })
  @IsArray()
  completedForms: KenyanFormType[];

  @ApiProperty({ type: [String] })
  @IsArray()
  missingForms: KenyanFormType[];

  @ApiProperty({ type: Object })
  @IsObject()
  missingFields: Record<string, string[]>;
}

export class ValidateFormRequestDto {
  @ApiProperty({ enum: KenyanFormType })
  @IsEnum(KenyanFormType)
  formType: KenyanFormType;

  @ApiProperty({ type: Object })
  @IsObject()
  formData: any;
}

export class ValidationResultDto {
  @ApiProperty()
  @IsBoolean()
  isValid: boolean;

  @ApiProperty({ type: [String] })
  @IsArray()
  errors: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  warnings: string[];
}
