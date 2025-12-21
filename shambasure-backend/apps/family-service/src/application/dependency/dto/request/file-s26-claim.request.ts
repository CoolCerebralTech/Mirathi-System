import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export enum S26ClaimType {
  MAINTENANCE = 'MAINTENANCE',
  EDUCATION = 'EDUCATION',
  MEDICAL = 'MEDICAL',
  HOUSING = 'HOUSING',
  LIVING_EXPENSES = 'LIVING_EXPENSES',
  OTHER = 'OTHER',
}

export class SupportingDocumentDto {
  @IsUUID()
  documentId: string;

  @IsString()
  documentType: string; // 'FINANCIAL_RECORD', 'COURT_ORDER', 'MEDICAL_REPORT', 'EDUCATION_RECORD'

  @IsString()
  description: string;

  @IsOptional()
  @IsDateString()
  documentDate?: string;
}

export class FileS26ClaimRequest {
  @IsUUID()
  dependencyAssessmentId: string;

  /**
   * The total claim amount.
   * Under S.26, this must be "reasonable" provision.
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  currency: string = 'KES';

  @IsEnum(S26ClaimType)
  claimType: S26ClaimType;

  @IsString()
  claimReason: string;

  @IsOptional()
  @IsDateString()
  claimStartDate?: string;

  @IsOptional()
  @IsDateString()
  claimEndDate?: string;

  // --- Legal Context ---

  @IsOptional()
  @IsString()
  courtCaseNumber?: string; // Link to Succession Cause No.

  @IsOptional()
  @IsUUID()
  legalRepresentativeId?: string;

  // --- Evidence (Mandatory for S.26) ---

  @IsArray()
  @ArrayNotEmpty({ message: 'S.26 Claims must be supported by evidence documents' })
  @ValidateNested({ each: true })
  @Type(() => SupportingDocumentDto)
  supportingDocuments: SupportingDocumentDto[];

  // --- Financial Breakdown ---

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  monthlyBreakdownAmount?: number;

  @IsOptional()
  @IsNumber()
  numberOfMonths?: number;

  // --- Claimant Declaration ---

  @IsUUID()
  declaredBy: string;

  @IsDateString()
  declarationDate: string;

  @IsBoolean()
  @IsOptional()
  isVerified: boolean = false;
}
