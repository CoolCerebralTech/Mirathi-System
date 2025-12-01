import { DebtPriority, DebtStatus, DebtType, KenyanTaxType } from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class DebtCreditorResponseDto {
  @Expose()
  name: string;

  @Expose()
  contact: string | null;

  @Expose()
  address: Record<string, any> | null;

  @Expose()
  accountNumber: string | null;

  @Expose()
  kraPin: string | null;

  @Expose()
  get displayInfo(): string {
    return [this.name, this.contact].filter(Boolean).join(' - ');
  }
}

@Exclude()
export class DebtTermsResponseDto {
  @Expose()
  dueDate: Date | null;

  @Expose()
  interestRate: number | null;

  @Expose()
  interestType: string | null;

  @Expose()
  compoundingFrequency: string | null;

  @Expose()
  get hasInterest(): boolean {
    return Boolean(this.interestRate && this.interestRate > 0);
  }

  @Expose()
  get isOverdue(): boolean {
    if (!this.dueDate) return false;
    return this.dueDate < new Date();
  }

  @Expose()
  get daysUntilDue(): number | null {
    if (!this.dueDate) return null;
    const today = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

@Exclude()
export class DebtTaxResponseDto {
  @Expose()
  taxType: KenyanTaxType | null;

  @Expose()
  kraPin: string | null;

  @Expose()
  taxPeriod: string | null;

  @Expose()
  get isTaxDebt(): boolean {
    return Boolean(this.taxType);
  }

  @Expose()
  get taxDescription(): string {
    if (!this.isTaxDebt) return 'Non-tax debt';
    return `${this.taxType} - ${this.taxPeriod}`;
  }
}

@Exclude()
export class DebtSecurityResponseDto {
  @Expose()
  isSecured: boolean;

  @Expose()
  assetId: string | null;

  @Expose()
  securityDetails: string | null;

  @Expose()
  collateralDescription: string | null;

  @Expose()
  get hasCollateral(): boolean {
    return this.isSecured && Boolean(this.assetId);
  }

  @Expose()
  get securitySummary(): string {
    if (!this.isSecured) return 'Unsecured';
    return this.collateralDescription || this.securityDetails || 'Secured debt';
  }
}

@Exclude()
export class DebtPaymentResponseDto {
  @Expose()
  lastPaymentDate: Date | null;

  @Expose()
  lastPaymentAmount: number | null;

  @Expose()
  totalPaid: number;

  @Expose()
  get hasPaymentHistory(): boolean {
    return this.totalPaid > 0;
  }

  @Expose()
  get paymentSummary(): string {
    if (!this.hasPaymentHistory) return 'No payments made';
    return `${this.currency} ${this.totalPaid.toLocaleString()} paid`;
  }

  // This needs currency context from parent
  currency: string = 'KES';
}

@Exclude()
export class DebtLegalResponseDto {
  @Expose()
  isStatuteBarred: boolean;

  @Expose()
  statuteBarredDate: Date | null;

  @Expose()
  requiresCourtApproval: boolean;

  @Expose()
  courtApprovalObtained: boolean;

  @Expose()
  isDisputed: boolean;

  @Expose()
  disputeReason: string | null;

  @Expose()
  disputeResolvedAt: Date | null;

  @Expose()
  get canMakePayments(): boolean {
    if (this.isStatuteBarred) return false;
    if (this.requiresCourtApproval && !this.courtApprovalObtained) return false;
    return true;
  }

  @Expose()
  get legalStatus(): string {
    if (this.isStatuteBarred) return 'Statute Barred';
    if (this.isDisputed) return 'Disputed';
    if (this.requiresCourtApproval && !this.courtApprovalObtained) return 'Awaiting Court Approval';
    if (this.requiresCourtApproval) return 'Court Approved';
    return 'Legally Clear';
  }

  @Expose()
  get requiresLegalAttention(): boolean {
    return (
      this.isStatuteBarred ||
      this.isDisputed ||
      (this.requiresCourtApproval && !this.courtApprovalObtained)
    );
  }
}

@Exclude()
export class DebtResponseDto {
  @Expose()
  id: string;

  @Expose()
  ownerId: string;

  @Expose()
  type: DebtType;

  @Expose()
  description: string;

  @Expose()
  principalAmount: number;

  @Expose()
  outstandingBalance: number;

  @Expose()
  currency: string;

  // Nested DTOs
  @Expose()
  @Type(() => DebtCreditorResponseDto)
  creditor: DebtCreditorResponseDto;

  @Expose()
  @Type(() => DebtTaxResponseDto)
  tax: DebtTaxResponseDto;

  @Expose()
  @Type(() => DebtTermsResponseDto)
  terms: DebtTermsResponseDto;

  @Expose()
  @Type(() => DebtSecurityResponseDto)
  security: DebtSecurityResponseDto;

  @Expose()
  @Type(() => DebtPaymentResponseDto)
  payment: DebtPaymentResponseDto;

  @Expose()
  @Type(() => DebtLegalResponseDto)
  legal: DebtLegalResponseDto;

  // Status & Priority
  @Expose()
  priority: DebtPriority;

  @Expose()
  status: DebtStatus;

  // Settlement
  @Expose()
  isPaid: boolean;

  @Expose()
  paidAt: Date | null;

  @Expose()
  settlementMethod: string | null;

  // Domain Logic Exposed
  @Expose()
  get amountDue(): number {
    return this.outstandingBalance;
  }

  @Expose()
  get paymentProgress(): number {
    if (this.principalAmount === 0) return 100;
    return ((this.principalAmount - this.outstandingBalance) / this.principalAmount) * 100;
  }

  @Expose()
  get canBeSettled(): boolean {
    if (this.isPaid) return false;
    if (!this.legal.canMakePayments) return false;
    return true;
  }

  @Expose()
  get isHighPriority(): boolean {
    return this.priority === DebtPriority.HIGHEST || this.priority === DebtPriority.HIGH;
  }

  @Expose()
  get formattedOutstanding(): string {
    return `${this.currency} ${this.outstandingBalance.toLocaleString()}`;
  }

  @Expose()
  get formattedPrincipal(): string {
    return `${this.currency} ${this.principalAmount.toLocaleString()}`;
  }

  // Timestamps
  @Expose()
  incurredDate: Date | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // Initialize nested DTOs with currency context
  constructor(partial: Partial<DebtResponseDto>) {
    Object.assign(this, partial);
    this.payment.currency = this.currency;
  }
}
