// application/dependency/dto/request/file-s26-claim.request.ts
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
  @IsString()
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
  @IsString()
  dependencyAssessmentId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  currency: string = 'KES';

  @IsEnum(S26ClaimType)
  claimType: S26ClaimType;

  @IsString()
  claimReason: string; // Detailed reason for the claim

  @IsOptional()
  @IsDateString()
  claimStartDate?: string; // When the need started/will start

  @IsOptional()
  @IsDateString()
  claimEndDate?: string; // When the need is expected to end

  @IsOptional()
  @IsString()
  courtCaseNumber?: string; // If already part of court proceedings

  @IsOptional()
  @IsString()
  legalRepresentativeId?: string; // Lawyer/Advocate handling the claim

  // Supporting evidence
  @IsArray()
  @ArrayNotEmpty()
  supportingDocuments: SupportingDocumentDto[];

  // Financial breakdown (optional)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  monthlyBreakdownAmount?: number;

  @IsOptional()
  @IsNumber()
  numberOfMonths?: number;

  // Claimant declaration
  @IsString()
  declaredBy: string; // User ID of person filing the claim

  @IsDateString()
  declarationDate: string;

  @IsBoolean()
  @IsOptional()
  isVerified: boolean = false;
}
