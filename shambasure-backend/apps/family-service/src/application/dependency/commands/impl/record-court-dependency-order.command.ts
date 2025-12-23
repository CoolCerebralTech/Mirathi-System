import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

import { BaseCommand, CommandMetadata } from '../base.command';

export enum ProvisionType {
  LUMP_SUM = 'LUMP_SUM',
  MONTHLY_ALLOWANCE = 'MONTHLY_ALLOWANCE',
  PROPERTY_TRANSFER = 'PROPERTY_TRANSFER',
  TRUST_FUND = 'TRUST_FUND',
  LIFE_INTEREST = 'LIFE_INTEREST',
  EDUCATION_FUND = 'EDUCATION_FUND',
  MEDICAL_FUND = 'MEDICAL_FUND',
  SPECIFIC_ASSET = 'SPECIFIC_ASSET',
  OTHER = 'OTHER',
}

export class RecordCourtProvisionCommand extends BaseCommand {
  @IsUUID()
  dependencyAssessmentId: string;

  @IsString()
  orderNumber: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  approvedAmount: number;

  @IsEnum(ProvisionType)
  provisionType: ProvisionType;

  @IsDate()
  @Type(() => Date)
  orderDate: Date;

  @IsString()
  courtName: string;

  @IsString()
  judgeName: string;

  @IsString()
  caseNumber: string;

  @IsOptional()
  @IsString()
  paymentSchedule?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  firstPaymentDate?: Date;

  @IsOptional()
  @IsNumber()
  numberOfInstallments?: number;

  @IsOptional()
  @IsString()
  bankAccountDetails?: string;

  @IsOptional()
  @IsString()
  propertyDetails?: string;

  @IsOptional()
  @IsString()
  legalSection: string = 'S26';

  @IsOptional()
  @IsString()
  conditions?: string;

  // Ensure this property is defined if used in constructor data
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  nextReviewDate?: Date;

  @IsUUID()
  recordedBy: string;

  @IsBoolean()
  isFinalOrder: boolean = true;

  readonly metadata: CommandMetadata;

  constructor(
    data: Omit<
      RecordCourtProvisionCommand,
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
    return 'RecordCourtProvisionCommand';
  }
}
