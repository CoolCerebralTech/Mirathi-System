// application/dependency/commands/impl/record-court-provision.command.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
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

export enum PaymentSchedule {
  IMMEDIATE = 'IMMEDIATE',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
  CUSTOM = 'CUSTOM',
}

export class InstallmentDetails {
  @IsNumber()
  @IsPositive()
  installmentNumber: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class BankAccountDetails {
  @IsString()
  accountNumber: string;

  @IsString()
  bankName: string;

  @IsString()
  branchName: string;

  @IsString()
  accountHolderName: string;

  @IsOptional()
  @IsString()
  swiftCode?: string;
}

export class RecordCourtProvisionCommand extends BaseCommand {
  @IsString()
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

  // Court details
  @IsString()
  courtName: string;

  @IsString()
  judgeName: string;

  @IsString()
  caseNumber: string;

  // Payment/Provision details
  @IsOptional()
  @IsEnum(PaymentSchedule)
  paymentSchedule?: PaymentSchedule;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  firstPaymentDate?: Date;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  numberOfInstallments?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => BankAccountDetails)
  bankAccountDetails?: BankAccountDetails;

  @IsOptional()
  @ValidateNested()
  @Type(() => InstallmentDetails)
  @IsArray()
  installmentSchedule?: InstallmentDetails[];

  @IsOptional()
  @IsString()
  propertyDetails?: string;

  // Legal basis
  @IsString()
  legalSection: string = 'S26';

  // Conditions
  @IsOptional()
  @IsString()
  conditions?: string;

  // Review and monitoring
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  nextReviewDate?: Date;

  @IsOptional()
  @IsString()
  monitoringOfficer?: string;

  // Recorded by
  @IsString()
  recordedBy: string;

  @IsBoolean()
  isFinalOrder: boolean = true;

  // Appeal information
  @IsOptional()
  @IsBoolean()
  isAppealable?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  appealDeadline?: Date;

  // Metadata
  readonly metadata: CommandMetadata;

  constructor(
    data: {
      dependencyAssessmentId: string;
      orderNumber: string;
      approvedAmount: number;
      provisionType: ProvisionType;
      orderDate: Date;
      courtName: string;
      judgeName: string;
      caseNumber: string;
      paymentSchedule?: PaymentSchedule;
      firstPaymentDate?: Date;
      numberOfInstallments?: number;
      bankAccountDetails?: BankAccountDetails;
      installmentSchedule?: InstallmentDetails[];
      propertyDetails?: string;
      legalSection?: string;
      conditions?: string;
      nextReviewDate?: Date;
      monitoringOfficer?: string;
      recordedBy: string;
      isFinalOrder?: boolean;
      isAppealable?: boolean;
      appealDeadline?: Date;
    },
    metadata: CommandMetadata,
    correlationId?: string,
    causationId?: string,
  ) {
    super(correlationId, causationId);

    Object.assign(this, data);
    this.metadata = metadata;

    // Set default legal section if not provided
    if (!this.legalSection) {
      this.legalSection = 'S26';
    }

    // Validate order date is not in the future
    if (this.orderDate > new Date()) {
      throw new Error('Order date cannot be in the future.');
    }
  }

  get commandType(): string {
    return 'RecordCourtProvisionCommand';
  }

  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate order number format
    if (!this.isValidOrderNumber()) {
      warnings.push(
        'Court order number format may be invalid. Expected format includes court code and year.',
      );
    }

    // Validate approved amount reasonableness
    if (this.approvedAmount > 100000000) {
      // 100 million KES
      warnings.push('Court approved amount exceeds typical high-value provisions. Please verify.');
    }

    // Validate payment schedule consistency
    if (this.paymentSchedule === PaymentSchedule.MONTHLY && !this.numberOfInstallments) {
      warnings.push('Monthly payment schedule should specify number of installments.');
    }

    // Validate installment schedule if provided
    if (this.installmentSchedule && this.installmentSchedule.length > 0) {
      const totalInstallments = this.installmentSchedule.reduce(
        (sum, installment) => sum + installment.amount,
        0,
      );
      if (Math.abs(totalInstallments - this.approvedAmount) > 0.01) {
        errors.push('Installment schedule total does not match approved amount.');
      }

      // Check for duplicate installment numbers
      const installmentNumbers = this.installmentSchedule.map((i) => i.installmentNumber);
      const uniqueNumbers = new Set(installmentNumbers);
      if (uniqueNumbers.size !== installmentNumbers.length) {
        errors.push('Duplicate installment numbers found.');
      }

      // Check installment dates are in order
      const sortedInstallments = [...this.installmentSchedule].sort(
        (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
      );
      for (let i = 0; i < sortedInstallments.length - 1; i++) {
        if (sortedInstallments[i].dueDate >= sortedInstallments[i + 1].dueDate) {
          errors.push('Installment due dates must be in chronological order.');
          break;
        }
      }
    }

    // Validate bank account details for monetary provisions
    if (
      this.provisionType !== ProvisionType.PROPERTY_TRANSFER &&
      this.provisionType !== ProvisionType.SPECIFIC_ASSET &&
      !this.bankAccountDetails
    ) {
      warnings.push('Monetary provisions should include bank account details for disbursement.');
    }

    // Validate property details for property transfers
    if (
      (this.provisionType === ProvisionType.PROPERTY_TRANSFER ||
        this.provisionType === ProvisionType.SPECIFIC_ASSET) &&
      !this.propertyDetails
    ) {
      errors.push('Property transfer provisions require property details.');
    }

    // Validate conditions are clear
    if (this.conditions && this.conditions.length < 10) {
      warnings.push('Conditions should be clearly specified and descriptive.');
    }

    // Validate review date is after order date
    if (this.nextReviewDate && this.nextReviewDate <= this.orderDate) {
      errors.push('Next review date must be after order date.');
    }

    // Validate appeal deadline is after order date
    if (this.appealDeadline && this.appealDeadline <= this.orderDate) {
      errors.push('Appeal deadline must be after order date.');
    }

    // Check if provision type matches legal section
    if (this.legalSection === 'S26' && this.provisionType === ProvisionType.PROPERTY_TRANSFER) {
      warnings.push(
        'S.26 provisions typically involve monetary awards. Property transfers may fall under different sections.',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private isValidOrderNumber(): boolean {
    // Court order number format validation
    // e.g., "HC Succ Cause 123/2022" or "1234/2023" or "ELC 567/2021"
    const regex = /^[A-Za-z\s]*\d+\/\d{4}$/;
    return regex.test(this.orderNumber);
  }

  // Calculate next payment date if not specified
  get calculatedFirstPaymentDate(): Date | undefined {
    if (this.firstPaymentDate) {
      return this.firstPaymentDate;
    }

    if (this.paymentSchedule === PaymentSchedule.IMMEDIATE) {
      return new Date(); // Today
    } else if (this.orderDate) {
      const firstPayment = new Date(this.orderDate);
      firstPayment.setDate(firstPayment.getDate() + 30); // 30 days after order
      return firstPayment;
    }

    return undefined;
  }

  // Check if provision requires ongoing monitoring
  get requiresMonitoring(): boolean {
    return (
      this.provisionType === ProvisionType.MONTHLY_ALLOWANCE ||
      this.provisionType === ProvisionType.TRUST_FUND ||
      this.provisionType === ProvisionType.LIFE_INTEREST ||
      (this.conditions && this.conditions.length > 0) ||
      !!this.nextReviewDate
    );
  }

  // Determine if provision is for a minor
  get isForMinor(): boolean {
    // This would typically be determined from the dependency assessment
    // For now, we check if it's an education or trust fund
    return (
      this.provisionType === ProvisionType.EDUCATION_FUND ||
      this.provisionType === ProvisionType.TRUST_FUND
    );
  }

  get description(): string {
    return `Record court provision ${this.orderNumber} for assessment ${this.dependencyAssessmentId} - ${this.approvedAmount} ${this.provisionType}`;
  }
}
