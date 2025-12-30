import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

// ==============================================================================
// 1. List Generated Forms (The Bundle)
// ==============================================================================
export class GetGeneratedFormsDto {
  @IsUUID()
  applicationId: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  includeSuperseded?: boolean = false; // Default: show only current versions
}

// ==============================================================================
// 2. Get Form Preview / Download
// ==============================================================================
export class GetFormPreviewDto {
  @IsUUID()
  applicationId: string;

  @IsUUID()
  formId: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  download?: boolean = false; // True = Force download, False = Inline preview
}

// ==============================================================================
// 3. Get Form Version History
// ==============================================================================
export class GetFormHistoryDto {
  @IsUUID()
  applicationId: string;

  @IsUUID()
  formId: string;
}
