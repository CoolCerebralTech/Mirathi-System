// application/dependency/dto/request/record-court-provision.request.ts
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export enum ProvisionType {
  LUMP_SUM = 'LUMP_SUM',
  MONTHLY_ALLOWANCE = 'MONTHLY_ALLOWANCE',
  PROPERTY_TRANSFER = 'PROPERTY_TRANSFER',
  TRUST_FUND = 'TRUST_FUND',
  LIFE_INTEREST = 'LIFE_INTEREST',
  EDUCATION_FUND = 'EDUCATION_FUND',
  MEDICAL_FUND = 'MEDICAL_FUND',
  OTHER = 'OTHER',
}

export class CourtOrderDetailsDto {
  @IsString()
  courtName: string;

  @IsString()
  judgeName: string;

  @IsString()
  caseNumber: string;

  @IsDateString()
  hearingDate: string;

  @IsOptional()
  @IsString()
  registrarName?: string;
}

export class RecordCourtProvisionRequest {
  @IsString()
  dependencyAssessmentId: string;

  @IsString()
  orderNumber: string; // Court order reference number

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  approvedAmount: number;

  @IsEnum(ProvisionType)
  provisionType: ProvisionType;

  @IsDateString()
  orderDate: string;

  // Court details
  @IsString()
  courtName: string;

  @IsString()
  judgeName: string;

  @IsString()
  caseNumber: string;

  // Payment/Provision details
  @IsOptional()
  @IsString()
  paymentSchedule?: string; // 'IMMEDIATE', 'MONTHLY', 'QUARTERLY', 'ANNUAL'

  @IsOptional()
  @IsDateString()
  firstPaymentDate?: string;

  @IsOptional()
  @IsNumber()
  numberOfInstallments?: number;

  @IsOptional()
  @IsString()
  bankAccountDetails?: string; // JSON string of bank details

  @IsOptional()
  @IsString()
  propertyDetails?: string; // If provision is property transfer

  // Legal basis
  @IsOptional()
  @IsString()
  legalSection: string = 'S26'; // Default to S26, could be S27, S28

  // Conditions attached
  @IsOptional()
  @IsString()
  conditions?: string; // Any conditions attached to the provision

  // Review period
  @IsOptional()
  @IsDateString()
  nextReviewDate?: string;

  // Recorded by
  @IsString()
  recordedBy: string; // User ID of court clerk/officer

  @IsOptional()
  @IsBoolean()
  isFinalOrder: boolean = true;
}
