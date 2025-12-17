// application/dependency/commands/impl/file-s26-claim.command.ts
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { BaseCommand, CommandMetadata } from '../base.command';

export enum S26ClaimType {
  MAINTENANCE = 'MAINTENANCE',
  EDUCATION = 'EDUCATION',
  MEDICAL = 'MEDICAL',
  HOUSING = 'HOUSING',
  LIVING_EXPENSES = 'LIVING_EXPENSES',
  FUNERAL_EXPENSES = 'FUNERAL_EXPENSES',
  LEGAL_FEES = 'LEGAL_FEES',
  OTHER = 'OTHER',
}

export class SupportingDocumentCommand {
  @IsString()
  documentId: string;

  @IsString()
  documentType: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  documentDate?: Date;

  @IsOptional()
  @IsString()
  uploadedBy?: string;
}

export class FileS26ClaimCommand extends BaseCommand {
  @IsString()
  dependencyAssessmentId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsString()
  currency: string = 'KES';

  @IsEnum(S26ClaimType)
  claimType: S26ClaimType;

  @IsString()
  @MinLength(20)
  claimReason: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  claimStartDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  claimEndDate?: Date;

  @IsOptional()
  @IsString()
  courtCaseNumber?: string;

  @IsOptional()
  @IsString()
  legalRepresentativeId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SupportingDocumentCommand)
  supportingDocuments: SupportingDocumentCommand[];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monthlyBreakdownAmount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  numberOfMonths?: number;

  // Claimant declaration
  @IsString()
  declaredBy: string; // User ID

  @IsDate()
  @Type(() => Date)
  declarationDate: Date;

  @IsBoolean()
  @IsOptional()
  isVerified: boolean = false;

  // Legal requirements
  @IsOptional()
  @IsBoolean()
  hasFiledAffidavit: boolean = false;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  affidavitFilingDate?: Date;

  // Metadata
  readonly metadata: CommandMetadata;

  constructor(
    data: {
      dependencyAssessmentId: string;
      amount: number;
      currency?: string;
      claimType: S26ClaimType;
      claimReason: string;
      claimStartDate?: Date;
      claimEndDate?: Date;
      courtCaseNumber?: string;
      legalRepresentativeId?: string;
      supportingDocuments: SupportingDocumentCommand[];
      monthlyBreakdownAmount?: number;
      numberOfMonths?: number;
      declaredBy: string;
      declarationDate: Date;
      isVerified?: boolean;
      hasFiledAffidavit?: boolean;
      affidavitFilingDate?: Date;
    },
    metadata: CommandMetadata,
    correlationId?: string,
    causationId?: string,
  ) {
    super(correlationId, causationId);

    Object.assign(this, data);
    this.metadata = metadata;

    // Default currency to KES if not provided
    if (!this.currency) {
      this.currency = 'KES';
    }

    // Default declaration date to now if not provided
    if (!this.declarationDate) {
      this.declarationDate = new Date();
    }
  }

  get commandType(): string {
    return 'FileS26ClaimCommand';
  }

  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate claim amount reasonableness
    if (this.amount > 100000000) {
      // 100 million KES
      warnings.push(
        'Claim amount exceeds typical high-value claims. Please ensure this is accurate.',
      );
    }

    // Validate claim dates
    if (this.claimStartDate && this.claimEndDate) {
      if (this.claimStartDate > this.claimEndDate) {
        errors.push('Claim start date cannot be after claim end date.');
      }

      // Calculate duration
      const durationMonths = this.calculateDurationMonths();
      if (durationMonths > 60) {
        // 5 years
        warnings.push(
          'Claim duration exceeds 5 years. Long-term claims may require special consideration.',
        );
      }
    }

    // Validate supporting documents
    const requiredDocTypes = this.getRequiredDocumentTypes();
    const providedDocTypes = this.supportingDocuments.map((doc) => doc.documentType);

    for (const requiredType of requiredDocTypes) {
      if (!providedDocTypes.includes(requiredType)) {
        warnings.push(`Missing recommended document type: ${requiredType}`);
      }
    }

    // Validate monthly breakdown consistency
    if (this.monthlyBreakdownAmount && this.numberOfMonths) {
      const calculatedTotal = this.monthlyBreakdownAmount * this.numberOfMonths;
      if (Math.abs(calculatedTotal - this.amount) > 0.01) {
        errors.push('Monthly breakdown amount does not match total claim amount.');
      }
    }

    // Validate affidavit requirements for large claims
    if (this.amount > 5000000 && !this.hasFiledAffidavit) {
      // 5 million KES
      warnings.push('Claims over 5 million KSH typically require a sworn affidavit.');
    }

    // Validate currency
    if (this.currency !== 'KES' && this.currency !== 'USD') {
      warnings.push('Unusual currency detected. Most claims are in KES or USD.');
    }

    // Check for duplicate document IDs
    const documentIds = this.supportingDocuments.map((doc) => doc.documentId);
    const uniqueIds = new Set(documentIds);
    if (uniqueIds.size !== documentIds.length) {
      errors.push('Duplicate supporting document IDs found.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private calculateDurationMonths(): number {
    if (!this.claimStartDate || !this.claimEndDate) return 0;

    const months = (this.claimEndDate.getFullYear() - this.claimStartDate.getFullYear()) * 12;
    return months + (this.claimEndDate.getMonth() - this.claimStartDate.getMonth());
  }

  private getRequiredDocumentTypes(): string[] {
    const baseTypes = ['FINANCIAL_RECORD', 'IDENTIFICATION'];

    switch (this.claimType) {
      case S26ClaimType.EDUCATION:
        return [...baseTypes, 'EDUCATION_RECORD', 'FEE_STRUCTURE'];
      case S26ClaimType.MEDICAL:
        return [...baseTypes, 'MEDICAL_REPORT', 'TREATMENT_ESTIMATE'];
      case S26ClaimType.HOUSING:
        return [...baseTypes, 'HOUSING_AGREEMENT', 'RENTAL_RECEIPTS'];
      case S26ClaimType.FUNERAL_EXPENSES:
        return [...baseTypes, 'FUNERAL_RECEIPTS', 'DEATH_CERTIFICATE'];
      case S26ClaimType.LEGAL_FEES:
        return [...baseTypes, 'LEGAL_FEE_AGREEMENT', 'LAWYER_AFFIDAVIT'];
      default:
        return baseTypes;
    }
  }

  // Calculate monthly amount if not provided
  get calculatedMonthlyAmount(): number | undefined {
    if (this.monthlyBreakdownAmount) {
      return this.monthlyBreakdownAmount;
    }

    if (this.claimStartDate && this.claimEndDate && this.numberOfMonths) {
      return this.amount / this.numberOfMonths;
    }

    return undefined;
  }

  // Check if claim is for a specific period
  get isPeriodicClaim(): boolean {
    return !!(this.claimStartDate && this.claimEndDate);
  }

  get description(): string {
    return `File S.26 claim for assessment ${this.dependencyAssessmentId} for ${this.amount} ${this.currency} (${this.claimType})`;
  }
}
