import { AggregateRoot } from '@nestjs/cqrs';
import { ClaimPriority, ClaimStatus, DebtType } from '@prisma/client';

import { ClaimDisputedEvent } from '../events/claim-disputed.event';
// Domain Events
import { ClaimFiledEvent } from '../events/claim-filed.event';
import { ClaimPaidEvent } from '../events/claim-paid.event';
import { ClaimStatusChangedEvent } from '../events/claim-status-changed.event';

// Value Objects
export class MonetaryAmount {
  constructor(
    private readonly amount: number,
    private readonly currency: string = 'KES',
  ) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    if (!currency || currency.length !== 3) {
      throw new Error('Currency must be a 3-letter code');
    }
  }

  getAmount(): number {
    return this.amount;
  }
  getCurrency(): string {
    return this.currency;
  }

  add(amount: number): MonetaryAmount {
    return new MonetaryAmount(this.amount + amount, this.currency);
  }

  subtract(amount: number): MonetaryAmount {
    return new MonetaryAmount(this.amount - amount, this.currency);
  }

  equals(other: MonetaryAmount): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}

export class CreditorIdentification {
  constructor(
    public readonly name: string,
    public readonly contact?: string,
    public readonly kraPin?: string,
    public readonly accountNumber?: string,
  ) {
    if (!name?.trim()) {
      throw new Error('Creditor name is required');
    }
  }
}

// Main Entity
export class CreditorClaim extends AggregateRoot {
  constructor(
    private readonly id: string,
    private readonly estateId: string,
    private creditor: CreditorIdentification,
    private claimType: DebtType,
    private description: string,
    private amountClaimed: MonetaryAmount,
    private priority: ClaimPriority,
    private status: ClaimStatus = ClaimStatus.PENDING,
    private currency: string = 'KES',
    private interestRate?: number,
    private interestType?: 'SIMPLE' | 'COMPOUND',
    private compoundingFrequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY',
    private dueDate?: Date,
    private isStatuteBarred: boolean = false,
    private statuteBarredDate?: Date,
    private isSecured: boolean = false,
    private securityDetails?: string,
    private collateralDescription?: string,
    private securedAssetId?: string,
    private supportingDocumentId?: string,
    private supportingDocuments: string[] = [],
    private courtCaseNumber?: string,
    private courtStation?: string,
    private filedByUserId?: string,
    private reviewedByUserId?: string,
    private reviewedAt?: Date,
    private rejectionReason?: string,
    private isDisputed: boolean = false,
    private disputeReason?: string,
    private disputeResolvedAt?: Date,
    private paidAmount: number = 0,
    private paymentDate?: Date,
    private paymentMethod?: string,
    private transactionReference?: string,
    private paymentNotes?: string,
    private requiresCourtApproval: boolean = false,
    private courtApprovalObtained: boolean = false,
    private courtApprovalDate?: Date,
    private resolvedAt?: Date,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {
    super();
    this.validate();
  }

  // ==========================================================================
  // FACTORY METHODS (Creation & Reconstitution)
  // ==========================================================================

  static file(
    id: string,
    estateId: string,
    creditorName: string,
    claimType: DebtType,
    description: string,
    amount: number,
    options?: {
      creditorContact?: string;
      creditorKraPin?: string;
      creditorAccountNumber?: string;
      priority?: ClaimPriority;
      currency?: string;
      interestRate?: number;
      interestType?: 'SIMPLE' | 'COMPOUND';
      compoundingFrequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
      dueDate?: Date;
      isSecured?: boolean;
      securityDetails?: string;
      collateralDescription?: string;
      securedAssetId?: string;
      supportingDocumentId?: string;
      supportingDocuments?: string[];
      courtCaseNumber?: string;
      courtStation?: string;
      filedByUserId?: string;
      requiresCourtApproval?: boolean;
    },
  ): CreditorClaim {
    // Legal Validation: Kenyan Limitation of Actions Act
    if (options?.dueDate) {
      const limitationPeriod = CreditorClaim.getLimitationPeriod(claimType);
      const yearsSinceDue = (Date.now() - options.dueDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

      if (yearsSinceDue > limitationPeriod) {
        throw new Error(
          `Claim appears to be time-barred under Kenyan Limitation of Actions Act (${limitationPeriod} years)`,
        );
      }
    }

    const creditor = new CreditorIdentification(
      creditorName,
      options?.creditorContact,
      options?.creditorKraPin,
      options?.creditorAccountNumber,
    );

    const amountClaimed = new MonetaryAmount(amount, options?.currency || 'KES');
    const priority = options?.priority || CreditorClaim.determinePriority(claimType);

    const claim = new CreditorClaim(
      id,
      estateId,
      creditor,
      claimType,
      description,
      amountClaimed,
      priority,
      ClaimStatus.PENDING,
      options?.currency || 'KES',
      options?.interestRate,
      options?.interestType,
      options?.compoundingFrequency,
      options?.dueDate,
      false, // isStatuteBarred
      undefined, // statuteBarredDate
      options?.isSecured,
      options?.securityDetails,
      options?.collateralDescription,
      options?.securedAssetId,
      options?.supportingDocumentId,
      options?.supportingDocuments,
      options?.courtCaseNumber,
      options?.courtStation,
      options?.filedByUserId,
      undefined, // reviewedByUserId
      undefined, // reviewedAt
      undefined, // rejectionReason
      false, // isDisputed
      undefined, // disputeReason
      undefined, // disputeResolvedAt
      0, // paidAmount
      undefined, // paymentDate
      undefined, // paymentMethod
      undefined, // transactionReference
      undefined, // paymentNotes
      options?.requiresCourtApproval || amount >= 1000000, // Auto-detect large claims
      false, // courtApprovalObtained
      undefined, // courtApprovalDate
      undefined, // resolvedAt
      new Date(), // createdAt
      new Date(), // updatedAt
    );

    claim.apply(new ClaimFiledEvent(claim.id, claim.estateId, creditorName, amount));
    return claim;
  }

  static reconstitute(props: {
    id: string;
    estateId: string;
    creditorName: string;
    creditorContact?: string;
    creditorKraPin?: string;
    creditorAccountNumber?: string;
    claimType: DebtType;
    description: string;
    amountClaimed: number;
    priority: ClaimPriority;
    status: ClaimStatus;
    currency?: string;
    interestRate?: number;
    interestType?: 'SIMPLE' | 'COMPOUND';
    compoundingFrequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    dueDate?: Date;
    isStatuteBarred?: boolean;
    statuteBarredDate?: Date;
    isSecured?: boolean;
    securityDetails?: string;
    collateralDescription?: string;
    securedAssetId?: string;
    supportingDocumentId?: string;
    supportingDocuments?: string[];
    courtCaseNumber?: string;
    courtStation?: string;
    filedByUserId?: string;
    reviewedByUserId?: string;
    reviewedAt?: Date;
    rejectionReason?: string;
    isDisputed?: boolean;
    disputeReason?: string;
    disputeResolvedAt?: Date;
    paidAmount?: number;
    paymentDate?: Date;
    paymentMethod?: string;
    transactionReference?: string;
    paymentNotes?: string;
    requiresCourtApproval?: boolean;
    courtApprovalObtained?: boolean;
    courtApprovalDate?: Date;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }): CreditorClaim {
    const creditor = new CreditorIdentification(
      props.creditorName,
      props.creditorContact,
      props.creditorKraPin,
      props.creditorAccountNumber,
    );

    const amountClaimed = new MonetaryAmount(props.amountClaimed, props.currency || 'KES');

    return new CreditorClaim(
      props.id,
      props.estateId,
      creditor,
      props.claimType,
      props.description,
      amountClaimed,
      props.priority,
      props.status,
      props.currency || 'KES',
      props.interestRate,
      props.interestType,
      props.compoundingFrequency,
      props.dueDate,
      props.isStatuteBarred || false,
      props.statuteBarredDate,
      props.isSecured || false,
      props.securityDetails,
      props.collateralDescription,
      props.securedAssetId,
      props.supportingDocumentId,
      props.supportingDocuments || [],
      props.courtCaseNumber,
      props.courtStation,
      props.filedByUserId,
      props.reviewedByUserId,
      props.reviewedAt,
      props.rejectionReason,
      props.isDisputed || false,
      props.disputeReason,
      props.disputeResolvedAt,
      props.paidAmount || 0,
      props.paymentDate,
      props.paymentMethod,
      props.transactionReference,
      props.paymentNotes,
      props.requiresCourtApproval || false,
      props.courtApprovalObtained || false,
      props.courtApprovalDate,
      props.resolvedAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ==========================================================================
  // BUSINESS LOGIC (Domain Behavior)
  // ==========================================================================

  // Legal Requirement: Section 83 of Law of Succession Act - Debt payment order
  accept(approvedByUserId: string, courtApprovalObtained: boolean = false): void {
    if (this.status !== ClaimStatus.PENDING) {
      throw new Error('Only pending claims can be accepted');
    }

    // Legal Requirement: Large claims require court approval
    if (this.requiresCourtApproval && !courtApprovalObtained) {
      throw new Error('Court approval required for this claim before acceptance');
    }

    this.status = ClaimStatus.ACCEPTED;
    this.reviewedByUserId = approvedByUserId;
    this.reviewedAt = new Date();
    this.resolvedAt = new Date();
    this.courtApprovalObtained = courtApprovalObtained;
    this.courtApprovalDate = courtApprovalObtained ? new Date() : undefined;
    this.updatedAt = new Date();

    this.apply(
      new ClaimStatusChangedEvent(
        this.id,
        this.estateId,
        ClaimStatus.PENDING,
        ClaimStatus.ACCEPTED,
        'Claim accepted for payment',
        approvedByUserId,
      ),
    );
  }

  reject(reason: string, rejectedByUserId: string): void {
    if (this.status !== ClaimStatus.PENDING) {
      throw new Error('Only pending claims can be rejected');
    }

    this.status = ClaimStatus.REJECTED;
    this.rejectionReason = reason;
    this.reviewedByUserId = rejectedByUserId;
    this.reviewedAt = new Date();
    this.resolvedAt = new Date();
    this.updatedAt = new Date();

    this.apply(
      new ClaimStatusChangedEvent(
        this.id,
        this.estateId,
        ClaimStatus.PENDING,
        ClaimStatus.REJECTED,
        reason,
        rejectedByUserId,
      ),
    );
  }

  // Legal Requirement: Dispute resolution process
  markAsDisputed(disputeReason: string, courtCaseNumber?: string): void {
    if (this.status !== ClaimStatus.REJECTED) {
      throw new Error('Only rejected claims can be disputed');
    }

    this.status = ClaimStatus.DISPUTED;
    this.isDisputed = true;
    this.disputeReason = disputeReason;
    this.courtCaseNumber = courtCaseNumber;
    this.updatedAt = new Date();

    this.apply(new ClaimDisputedEvent(this.id, this.estateId, disputeReason, courtCaseNumber));
  }

  resolveDispute(resolution: string, resolvedByUserId: string): void {
    if (this.status !== ClaimStatus.DISPUTED) {
      throw new Error('Only disputed claims can be resolved');
    }

    this.isDisputed = false;
    this.disputeResolvedAt = new Date();
    this.updatedAt = new Date();

    // Additional business logic for dispute resolution outcome
    this.paymentNotes = `Dispute resolved: ${resolution} (by ${resolvedByUserId})`;
  }

  // Legal Requirement: Payment tracking with Kenyan payment methods
  recordPayment(
    amount: number,
    paymentMethod: string,
    transactionReference?: string,
    paymentNotes?: string,
  ): void {
    if (![ClaimStatus.ACCEPTED, ClaimStatus.PARTIALLY_PAID].includes(this.status)) {
      throw new Error('Only accepted or partially paid claims can receive payments');
    }

    if (amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    this.validatePaymentMethod(paymentMethod, transactionReference);

    const totalPaid = this.paidAmount + amount;
    const totalClaimed = this.amountClaimed.getAmount();

    if (totalPaid > totalClaimed) {
      throw new Error('Payment amount exceeds claimed amount');
    }

    this.paidAmount = totalPaid;
    this.paymentDate = new Date();
    this.paymentMethod = paymentMethod;
    this.transactionReference = transactionReference;
    this.paymentNotes = paymentNotes;
    this.updatedAt = new Date();

    if (totalPaid === totalClaimed) {
      this.status = ClaimStatus.PAID;
      this.resolvedAt = new Date();
    } else {
      this.status = ClaimStatus.PARTIALLY_PAID;
    }

    this.apply(
      new ClaimPaidEvent(
        this.id,
        this.estateId,
        amount,
        this.paymentDate,
        paymentMethod,
        transactionReference,
      ),
    );
  }

  addSupportingDocument(documentId: string): void {
    if (this.status !== ClaimStatus.PENDING) {
      throw new Error('Cannot add documents to resolved claims');
    }
    this.supportingDocuments.push(documentId);
    this.updatedAt = new Date();
  }

  // ==========================================================================
  // LEGAL COMPLIANCE & VALIDATION
  // ==========================================================================

  private validate(): void {
    if (!this.id) throw new Error('Claim ID is required');
    if (!this.estateId) throw new Error('Estate ID is required');
    if (!this.creditor) throw new Error('Creditor information is required');
    if (!this.claimType) throw new Error('Claim type is required');
    if (!this.description?.trim()) throw new Error('Claim description is required');
    if (!this.amountClaimed) throw new Error('Claim amount is required');
    if (!this.priority) throw new Error('Claim priority is required');

    // Kenyan Legal Requirement: Currency must be KES
    if (this.currency !== 'KES') {
      throw new Error('Kenyan estate claims must be in KES');
    }

    // Validate interest rate if provided
    if (this.interestRate !== undefined) {
      this.validateInterestRate(this.interestRate);
    }
  }

  private validatePaymentMethod(method: string, reference?: string): void {
    const validMethods = ['BANK_TRANSFER', 'CHEQUE', 'MPESA', 'CASH', 'RTGS'];
    if (!validMethods.includes(method)) {
      throw new Error(`Invalid payment method: ${method}`);
    }

    // Kenyan Specific: M-PESA requires transaction reference
    if (method === 'MPESA' && !reference) {
      throw new Error('M-PESA payments require a transaction reference');
    }
  }

  private validateInterestRate(rate: number): void {
    const MAX_LEGAL_RATE = 14.0; // Kenyan Banking Act maximum
    if (rate < 0) throw new Error('Interest rate cannot be negative');
    if (rate > MAX_LEGAL_RATE) {
      throw new Error(`Interest rate ${rate}% exceeds Kenyan legal maximum of ${MAX_LEGAL_RATE}%`);
    }
  }

  private static determinePriority(claimType: DebtType): ClaimPriority {
    const priorityMap: Record<DebtType, ClaimPriority> = {
      FUNERAL_EXPENSE: ClaimPriority.PREFERRED, // Highest priority per Kenyan law
      TAX_OBLIGATION: ClaimPriority.PREFERRED,
      MEDICAL_BILL: ClaimPriority.PREFERRED,
      MORTGAGE: ClaimPriority.SECURED,
      PERSONAL_LOAN: ClaimPriority.ORDINARY,
      CREDIT_CARD: ClaimPriority.ORDINARY,
      BUSINESS_DEBT: ClaimPriority.ORDINARY,
      OTHER: ClaimPriority.UNSECURED,
    };
    return priorityMap[claimType] || ClaimPriority.UNSECURED;
  }

  private static getLimitationPeriod(claimType: DebtType): number {
    // Kenyan Limitation of Actions Act
    const limitationPeriods: Record<DebtType, number> = {
      MORTGAGE: 6,
      TAX_OBLIGATION: 6,
      FUNERAL_EXPENSE: 3,
      MEDICAL_BILL: 3,
      PERSONAL_LOAN: 3,
      CREDIT_CARD: 3,
      BUSINESS_DEBT: 3,
      OTHER: 3,
    };
    return limitationPeriods[claimType] || 3;
  }

  // ==========================================================================
  // QUERY METHODS & BUSINESS RULES
  // ==========================================================================

  calculateAccruedInterest(): number {
    if (!this.interestRate || !this.dueDate) return 0;

    const today = new Date();
    if (today <= this.dueDate) return 0;

    const daysOverdue = Math.floor(
      (today.getTime() - this.dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const dailyRate = this.interestRate / 365 / 100;

    return this.amountClaimed.getAmount() * dailyRate * daysOverdue;
  }

  getTotalAmountDue(): number {
    return this.amountClaimed.getAmount() + this.calculateAccruedInterest();
  }

  getOutstandingBalance(): number {
    return this.getTotalAmountDue() - this.paidAmount;
  }

  isTimeBarred(): boolean {
    if (!this.dueDate) return false;

    const limitationPeriod = CreditorClaim.getLimitationPeriod(this.claimType);
    const yearsSinceDue = (Date.now() - this.dueDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    return yearsSinceDue > limitationPeriod;
  }

  requiresCourtApproval(): boolean {
    return this.requiresCourtApproval || this.amountClaimed.getAmount() >= 1000000;
  }

  isFullySecured(): boolean {
    return this.isSecured && !!this.securedAssetId;
  }

  // ==========================================================================
  // GETTERS (Persistence Interface)
  // ==========================================================================

  getId(): string {
    return this.id;
  }
  getEstateId(): string {
    return this.estateId;
  }
  getCreditorName(): string {
    return this.creditor.name;
  }
  getCreditorContact(): string | undefined {
    return this.creditor.contact;
  }
  getCreditorKraPin(): string | undefined {
    return this.creditor.kraPin;
  }
  getCreditorAccountNumber(): string | undefined {
    return this.creditor.accountNumber;
  }
  getClaimType(): DebtType {
    return this.claimType;
  }
  getDescription(): string {
    return this.description;
  }
  getAmountClaimed(): number {
    return this.amountClaimed.getAmount();
  }
  getPriority(): ClaimPriority {
    return this.priority;
  }
  getStatus(): ClaimStatus {
    return this.status;
  }
  getCurrency(): string {
    return this.currency;
  }
  getInterestRate(): number | undefined {
    return this.interestRate;
  }
  getInterestType(): string | undefined {
    return this.interestType;
  }
  getCompoundingFrequency(): string | undefined {
    return this.compoundingFrequency;
  }
  getDueDate(): Date | undefined {
    return this.dueDate;
  }
  getIsStatuteBarred(): boolean {
    return this.isStatuteBarred;
  }
  getStatuteBarredDate(): Date | undefined {
    return this.statuteBarredDate;
  }
  getIsSecured(): boolean {
    return this.isSecured;
  }
  getSecurityDetails(): string | undefined {
    return this.securityDetails;
  }
  getCollateralDescription(): string | undefined {
    return this.collateralDescription;
  }
  getSecuredAssetId(): string | undefined {
    return this.securedAssetId;
  }
  getSupportingDocumentId(): string | undefined {
    return this.supportingDocumentId;
  }
  getSupportingDocuments(): string[] {
    return [...this.supportingDocuments];
  }
  getCourtCaseNumber(): string | undefined {
    return this.courtCaseNumber;
  }
  getCourtStation(): string | undefined {
    return this.courtStation;
  }
  getFiledByUserId(): string | undefined {
    return this.filedByUserId;
  }
  getReviewedByUserId(): string | undefined {
    return this.reviewedByUserId;
  }
  getReviewedAt(): Date | undefined {
    return this.reviewedAt;
  }
  getRejectionReason(): string | undefined {
    return this.rejectionReason;
  }
  getIsDisputed(): boolean {
    return this.isDisputed;
  }
  getDisputeReason(): string | undefined {
    return this.disputeReason;
  }
  getDisputeResolvedAt(): Date | undefined {
    return this.disputeResolvedAt;
  }
  getPaidAmount(): number {
    return this.paidAmount;
  }
  getPaymentDate(): Date | undefined {
    return this.paymentDate;
  }
  getPaymentMethod(): string | undefined {
    return this.paymentMethod;
  }
  getTransactionReference(): string | undefined {
    return this.transactionReference;
  }
  getPaymentNotes(): string | undefined {
    return this.paymentNotes;
  }
  getRequiresCourtApproval(): boolean {
    return this.requiresCourtApproval;
  }
  getCourtApprovalObtained(): boolean {
    return this.courtApprovalObtained;
  }
  getCourtApprovalDate(): Date | undefined {
    return this.courtApprovalDate;
  }
  getResolvedAt(): Date | undefined {
    return this.resolvedAt;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // For persistence reconstitution
  getProps() {
    return {
      id: this.id,
      estateId: this.estateId,
      creditorName: this.creditor.name,
      creditorContact: this.creditor.contact,
      creditorKraPin: this.creditor.kraPin,
      creditorAccountNumber: this.creditor.accountNumber,
      claimType: this.claimType,
      description: this.description,
      amountClaimed: this.amountClaimed.getAmount(),
      priority: this.priority,
      status: this.status,
      currency: this.currency,
      interestRate: this.interestRate,
      interestType: this.interestType,
      compoundingFrequency: this.compoundingFrequency,
      dueDate: this.dueDate,
      isStatuteBarred: this.isStatuteBarred,
      statuteBarredDate: this.statuteBarredDate,
      isSecured: this.isSecured,
      securityDetails: this.securityDetails,
      collateralDescription: this.collateralDescription,
      securedAssetId: this.securedAssetId,
      supportingDocumentId: this.supportingDocumentId,
      supportingDocuments: this.supportingDocuments,
      courtCaseNumber: this.courtCaseNumber,
      courtStation: this.courtStation,
      filedByUserId: this.filedByUserId,
      reviewedByUserId: this.reviewedByUserId,
      reviewedAt: this.reviewedAt,
      rejectionReason: this.rejectionReason,
      isDisputed: this.isDisputed,
      disputeReason: this.disputeReason,
      disputeResolvedAt: this.disputeResolvedAt,
      paidAmount: this.paidAmount,
      paymentDate: this.paymentDate,
      paymentMethod: this.paymentMethod,
      transactionReference: this.transactionReference,
      paymentNotes: this.paymentNotes,
      requiresCourtApproval: this.requiresCourtApproval,
      courtApprovalObtained: this.courtApprovalObtained,
      courtApprovalDate: this.courtApprovalDate,
      resolvedAt: this.resolvedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
