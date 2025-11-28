import { AggregateRoot } from '@nestjs/cqrs';

import { AssetValue } from '../../../estate-planning/domain/value-objects/asset-value.vo';
import { ClaimDisputedEvent } from '../events/claim-disputed.event';
import { ClaimFiledEvent } from '../events/claim-filed.event';
import { ClaimPaidEvent } from '../events/claim-paid.event';
import { ClaimStatusChangedEvent } from '../events/claim-status-changed.event';

export type ClaimStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'DISPUTED'
  | 'PAID'
  | 'PARTIALLY_PAID';
export type ClaimPriority = 'PREFERRED' | 'ORDINARY' | 'SECURED' | 'UNSECURED';
export type DebtType =
  | 'MORTGAGE'
  | 'PERSONAL_LOAN'
  | 'CREDIT_CARD'
  | 'BUSINESS_DEBT'
  | 'TAX_OBLIGATION'
  | 'FUNERAL_EXPENSE'
  | 'MEDICAL_BILL'
  | 'OTHER';

// Safe interface for reconstitution
export interface CreditorClaimProps {
  id: string;
  estateId: string;
  creditorName: string;
  // amountClaimed can be the object from Prisma JSON or the class instance
  amountClaimed: AssetValue | { amount: number; currency: string; valuationDate?: Date | string };
  documentId?: string | null;
  status: ClaimStatus;
  resolvedAt?: Date | string | null;
  rejectionReason?: string | null;
  claimType: DebtType;
  priority: ClaimPriority;
  dueDate?: Date | string | null;
  interestRate?: number;
  supportingDocuments?: string[];
  courtCaseNumber?: string | null;
  filedByUserId?: string | null;
  approvedByUserId?: string | null;
  paidAmount?: number;
  paymentDate?: Date | string | null;
  paymentMethod?: string | null;
  transactionReference?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class CreditorClaim extends AggregateRoot {
  private id: string;
  private estateId: string;

  // Claimant Details
  private creditorName: string;
  private amountClaimed: AssetValue;
  private documentId: string | null;
  private claimType: DebtType;
  private priority: ClaimPriority;
  private dueDate: Date | null;
  private interestRate: number;
  private supportingDocuments: string[];
  private courtCaseNumber: string | null;
  private filedByUserId: string | null;

  // Workflow
  private status: ClaimStatus;
  private resolvedAt: Date | null;
  private rejectionReason: string | null;
  private approvedByUserId: string | null;

  // Payment Tracking
  private paidAmount: number;
  private paymentDate: Date | null;
  private paymentMethod: string | null;
  private transactionReference: string | null;

  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    estateId: string,
    creditorName: string,
    amountClaimed: AssetValue,
    claimType: DebtType,
  ) {
    super();
    this.id = id;
    this.estateId = estateId;
    this.creditorName = creditorName;
    this.amountClaimed = amountClaimed;
    this.claimType = claimType;

    // Set priority based on claim type (Kenyan law priorities)
    this.priority = this.determinePriority(claimType);

    this.status = 'PENDING';
    this.documentId = null;
    this.dueDate = null;
    this.interestRate = 0;
    this.supportingDocuments = [];
    this.courtCaseNumber = null;
    this.filedByUserId = null;
    this.approvedByUserId = null;
    this.resolvedAt = null;
    this.rejectionReason = null;
    this.paidAmount = 0;
    this.paymentDate = null;
    this.paymentMethod = null;
    this.transactionReference = null;

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static file(
    id: string,
    estateId: string,
    creditorName: string,
    amount: AssetValue,
    claimType: DebtType,
    options?: {
      documentId?: string;
      dueDate?: Date;
      interestRate?: number;
      supportingDocuments?: string[];
      filedByUserId?: string;
    },
  ): CreditorClaim {
    if (amount.getAmount() <= 0) {
      throw new Error('Claim amount must be positive.');
    }

    if (amount.getCurrency() !== 'KES') {
      throw new Error('Kenyan estate claims must be in KES.');
    }

    if (options?.interestRate && options.interestRate < 0) {
      throw new Error('Interest rate cannot be negative.');
    }

    if (options?.dueDate) {
      const dueDate = new Date(options.dueDate);
      const now = new Date();
      const yearsSinceDue = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

      if (yearsSinceDue > 6) {
        throw new Error('Claim appears to be time-barred under Kenyan Limitation of Actions Act.');
      }
    }

    const claim = new CreditorClaim(id, estateId, creditorName, amount, claimType);

    if (options) {
      if (options.documentId) claim.documentId = options.documentId;
      if (options.dueDate) claim.dueDate = options.dueDate;
      if (options.interestRate) {
        claim.validateInterestRate(options.interestRate);
        claim.interestRate = options.interestRate;
      }
      if (options.supportingDocuments) claim.supportingDocuments = options.supportingDocuments;
      if (options.filedByUserId) claim.filedByUserId = options.filedByUserId;
    }

    claim.apply(
      new ClaimFiledEvent(
        id,
        estateId,
        creditorName,
        amount,
        claim.documentId ?? undefined,
        claimType,
      ),
    );
    return claim;
  }

  static reconstitute(props: CreditorClaimProps): CreditorClaim {
    if (
      !props.id ||
      !props.estateId ||
      !props.creditorName ||
      !props.amountClaimed ||
      !props.claimType
    ) {
      throw new Error('Missing required properties for CreditorClaim reconstitution');
    }

    // Reconstruct AssetValue safely
    let amountClaimed: AssetValue;
    if (props.amountClaimed instanceof AssetValue) {
      amountClaimed = props.amountClaimed;
    } else {
      const valDate = props.amountClaimed.valuationDate
        ? props.amountClaimed.valuationDate instanceof Date
          ? props.amountClaimed.valuationDate
          : new Date(props.amountClaimed.valuationDate)
        : new Date();

      amountClaimed = new AssetValue(
        Number(props.amountClaimed.amount),
        props.amountClaimed.currency || 'KES',
        valDate,
      );
    }

    const claim = new CreditorClaim(
      props.id,
      props.estateId,
      props.creditorName,
      amountClaimed,
      props.claimType,
    );

    claim.documentId = props.documentId ?? null;
    claim.priority = props.priority || claim.determinePriority(props.claimType);
    claim.status = props.status;

    claim.dueDate = props.dueDate ? new Date(props.dueDate) : null;
    claim.interestRate = props.interestRate || 0;
    claim.supportingDocuments = props.supportingDocuments || [];
    claim.courtCaseNumber = props.courtCaseNumber ?? null;
    claim.filedByUserId = props.filedByUserId ?? null;
    claim.approvedByUserId = props.approvedByUserId ?? null;

    claim.resolvedAt = props.resolvedAt ? new Date(props.resolvedAt) : null;
    claim.rejectionReason = props.rejectionReason ?? null;
    claim.paidAmount = props.paidAmount || 0;

    claim.paymentDate = props.paymentDate ? new Date(props.paymentDate) : null;
    claim.paymentMethod = props.paymentMethod ?? null;
    claim.transactionReference = props.transactionReference ?? null;
    claim.createdAt = new Date(props.createdAt);
    claim.updatedAt = new Date(props.updatedAt);

    return claim;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  accept(approvedByUserId: string): void {
    if (this.status !== 'PENDING') throw new Error('Only pending claims can be accepted.');
    this.status = 'ACCEPTED';
    this.approvedByUserId = approvedByUserId;
    this.resolvedAt = new Date();
    this.updatedAt = new Date();
    this.apply(
      new ClaimStatusChangedEvent(
        this.id,
        this.estateId,
        'PENDING',
        'ACCEPTED',
        'Claim accepted for payment',
        approvedByUserId,
      ),
    );
  }

  reject(reason: string, rejectedByUserId: string): void {
    if (this.status !== 'PENDING') throw new Error('Only pending claims can be rejected.');
    this.status = 'REJECTED';
    this.rejectionReason = reason;
    this.resolvedAt = new Date();
    this.updatedAt = new Date();
    this.apply(
      new ClaimStatusChangedEvent(
        this.id,
        this.estateId,
        'PENDING',
        'REJECTED',
        reason,
        rejectedByUserId,
      ),
    );
  }

  markAsDisputed(disputeReason: string, courtCaseNumber?: string): void {
    if (this.status !== 'REJECTED') throw new Error('Only rejected claims can be disputed.');
    this.status = 'DISPUTED';
    this.courtCaseNumber = courtCaseNumber || null;
    this.updatedAt = new Date();
    this.apply(new ClaimDisputedEvent(this.id, this.estateId, disputeReason, courtCaseNumber));
  }

  markAsPaid(amountPaid: number, paymentMethod: string, transactionReference?: string): void {
    if (!['ACCEPTED', 'PARTIALLY_PAID'].includes(this.status)) {
      throw new Error('Only accepted or partially paid claims can be marked as paid.');
    }
    if (amountPaid <= 0) throw new Error('Payment amount must be positive.');

    const validPaymentMethods = ['BANK_TRANSFER', 'CHEQUE', 'MPESA', 'CASH', 'RTGS'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      throw new Error(`Invalid payment method: ${paymentMethod}`);
    }

    const totalPaid = this.paidAmount + amountPaid;
    const totalClaimed = this.amountClaimed.getAmount();

    if (totalPaid > totalClaimed) throw new Error('Payment amount exceeds claimed amount.');
    if (paymentMethod === 'MPESA' && !transactionReference)
      throw new Error('M-PESA payments require a transaction reference.');

    this.paidAmount = totalPaid;
    this.paymentDate = new Date();
    this.paymentMethod = paymentMethod;
    this.transactionReference = transactionReference || null;
    this.updatedAt = new Date();

    if (totalPaid === totalClaimed) {
      this.status = 'PAID';
    } else {
      this.status = 'PARTIALLY_PAID';
    }

    this.apply(
      new ClaimPaidEvent(
        this.id,
        this.estateId,
        amountPaid,
        this.paymentDate,
        paymentMethod,
        transactionReference,
      ),
    );
  }

  addSupportingDocument(documentId: string): void {
    if (this.status !== 'PENDING') throw new Error('Cannot add documents to resolved claims.');
    this.supportingDocuments.push(documentId);
    this.updatedAt = new Date();
  }

  isTimeBarred(): boolean {
    const claimDate = this.createdAt;
    const now = new Date();
    let limitationPeriod = 3;
    if (this.claimType === 'MORTGAGE') limitationPeriod = 6;
    const yearsDifference = (now.getTime() - claimDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return yearsDifference > limitationPeriod;
  }

  getCourtSummary(): { description: string; amount: number; priority: string } {
    return {
      description: `${this.claimType} claim by ${this.creditorName}`,
      amount: this.getTotalAmountDue(),
      priority: this.priority,
    };
  }

  requiresCourtApproval(): boolean {
    return this.amountClaimed.getAmount() >= 1000000;
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private validateInterestRate(rate: number): void {
    const MAX_ALLOWED_RATE = 14.0;
    if (rate > MAX_ALLOWED_RATE)
      throw new Error(
        `Interest rate ${rate}% exceeds Kenyan legal maximum of ${MAX_ALLOWED_RATE}%`,
      );
    if (rate < 0) throw new Error('Interest rate cannot be negative');
  }

  private determinePriority(claimType: DebtType): ClaimPriority {
    const priorityMap: Record<DebtType, ClaimPriority> = {
      FUNERAL_EXPENSE: 'PREFERRED',
      TAX_OBLIGATION: 'PREFERRED',
      MEDICAL_BILL: 'PREFERRED',
      MORTGAGE: 'SECURED',
      PERSONAL_LOAN: 'ORDINARY',
      CREDIT_CARD: 'ORDINARY',
      BUSINESS_DEBT: 'ORDINARY',
      OTHER: 'UNSECURED',
    };
    return priorityMap[claimType] || 'UNSECURED';
  }

  calculateAccruedInterest(): number {
    if (!this.dueDate || this.interestRate === 0) return 0;
    const today = new Date();
    const due = new Date(this.dueDate);
    if (today <= due) return 0;

    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    const dailyInterestRate = this.interestRate / 365 / 100;
    return this.amountClaimed.getAmount() * dailyInterestRate * daysOverdue;
  }

  getTotalAmountDue(): number {
    return this.amountClaimed.getAmount() + this.calculateAccruedInterest();
  }

  isOverdue(): boolean {
    if (!this.dueDate) return false;
    return new Date() > new Date(this.dueDate);
  }

  getOutstandingBalance(): number {
    return this.getTotalAmountDue() - this.paidAmount;
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getEstateId(): string {
    return this.estateId;
  }
  getCreditorName(): string {
    return this.creditorName;
  }
  getAmountClaimed(): AssetValue {
    return this.amountClaimed;
  }
  getStatus(): ClaimStatus {
    return this.status;
  }
  getDocumentId(): string | null {
    return this.documentId;
  }
  getResolvedAt(): Date | null {
    return this.resolvedAt;
  }
  getClaimType(): DebtType {
    return this.claimType;
  }
  getPriority(): ClaimPriority {
    return this.priority;
  }
  getDueDate(): Date | null {
    return this.dueDate;
  }
  getInterestRate(): number {
    return this.interestRate;
  }
  getSupportingDocuments(): string[] {
    return [...this.supportingDocuments];
  }
  getCourtCaseNumber(): string | null {
    return this.courtCaseNumber;
  }
  getFiledByUserId(): string | null {
    return this.filedByUserId;
  }
  getApprovedByUserId(): string | null {
    return this.approvedByUserId;
  }
  getPaidAmount(): number {
    return this.paidAmount;
  }
  getPaymentDate(): Date | null {
    return this.paymentDate;
  }
  getPaymentMethod(): string | null {
    return this.paymentMethod;
  }
  getTransactionReference(): string | null {
    return this.transactionReference;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getProps(): CreditorClaimProps {
    return {
      id: this.id,
      estateId: this.estateId,
      creditorName: this.creditorName,
      amountClaimed: this.amountClaimed,
      documentId: this.documentId,
      status: this.status,
      resolvedAt: this.resolvedAt,
      rejectionReason: this.rejectionReason,
      claimType: this.claimType,
      priority: this.priority,
      dueDate: this.dueDate,
      interestRate: this.interestRate,
      supportingDocuments: this.supportingDocuments,
      courtCaseNumber: this.courtCaseNumber,
      filedByUserId: this.filedByUserId,
      approvedByUserId: this.approvedByUserId,
      paidAmount: this.paidAmount,
      paymentDate: this.paymentDate,
      paymentMethod: this.paymentMethod,
      transactionReference: this.transactionReference,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
