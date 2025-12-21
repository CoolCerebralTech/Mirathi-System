import { KenyanLawSection } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsJSON,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export enum ProvisionType {
  LUMP_SUM = 'LUMP_SUM',
  MONTHLY_ALLOWANCE = 'MONTHLY_ALLOWANCE',
  PROPERTY_TRANSFER = 'PROPERTY_TRANSFER',
  TRUST_FUND = 'TRUST_FUND', // Common for minors (S.27)
  LIFE_INTEREST = 'LIFE_INTEREST', // Common for spouses (S.35)
  EDUCATION_FUND = 'EDUCATION_FUND',
  MEDICAL_FUND = 'MEDICAL_FUND',
  OTHER = 'OTHER',
}

export class RecordCourtProvisionRequest {
  @IsUUID()
  dependencyAssessmentId: string;

  @IsString()
  orderNumber: string; // e.g., "Ruling on App No. 4 of 2024"

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  approvedAmount: number;

  @IsEnum(ProvisionType)
  provisionType: ProvisionType;

  @IsDateString()
  orderDate: string;

  // --- Court Details ---

  @IsString()
  courtName: string; // e.g., "High Court at Nairobi (Family Division)"

  @IsString()
  judgeName: string;

  @IsString()
  caseNumber: string;

  // --- Provision Execution Details ---

  @IsOptional()
  @IsString()
  paymentSchedule?: string;

  @IsOptional()
  @IsDateString()
  firstPaymentDate?: string;

  @IsOptional()
  @IsNumber()
  numberOfInstallments?: number;

  @IsOptional()
  @IsJSON()
  bankAccountDetails?: string;

  @IsOptional()
  @IsString()
  propertyDetails?: string;

  // --- Legal Basis ---

  @IsOptional()
  @IsEnum(KenyanLawSection)
  legalSection: KenyanLawSection = KenyanLawSection.S26_DEPENDANT_PROVISION;

  // --- Conditions (S.27/S.28) ---

  @IsOptional()
  @IsString()
  conditions?: string; // e.g., "Until marriage", "Until 18 years"

  @IsOptional()
  @IsDateString()
  nextReviewDate?: string;

  // --- Audit ---

  @IsUUID()
  recordedBy: string;

  @IsOptional()
  @IsBoolean()
  isFinalOrder: boolean = true;
}
