// src/domain/aggregates/estate/entities/debt.entity.ts
import { Entity } from '../../../base/entity';
import { UniqueEntityID } from '../../../base/unique-entity-id';
import { Guard } from '../../../core/guard';
import { Result } from '../../../core/result';
import { KenyanId } from '../../../shared/kenyan-id.vo';
import { Money } from '../../../shared/money.vo';
import { DebtTerms, LiabilityTier, Section45Tier } from '../value-objects/debt-terms.vo';

export enum DebtType {
  MORTGAGE = 'MORTGAGE',
  PERSONAL_LOAN = 'PERSONAL_LOAN',
  CREDIT_CARD = 'CREDIT_CARD',
  BUSINESS_DEBT = 'BUSINESS_DEBT',
  TAX_OBLIGATION = 'TAX_OBLIGATION',
  FUNERAL_EXPENSE = 'FUNERAL_EXPENSE',
  MEDICAL_BILL = 'MEDICAL_BILL',
  LAND_RATES = 'LAND_RATES',
  UTILITY_BILLS = 'UTILITY_BILLS',
  EMPLOYEE_WAGES = 'EMPLOYEE_WAGES',
  COURT_FINES = 'COURT_FINES',
  TESTAMENTARY_EXPENSES = 'TESTAMENTARY_EXPENSES',
  LEGAL_FEES = 'LEGAL_FEES',
  VALUATION_FEES = 'VALUATION_FEES',
  ADMINISTRATION_EXPENSES = 'ADMINISTRATION_EXPENSES',
  OTHER = 'OTHER',
}

export enum KenyanTaxType {
  INCOME_TAX = 'INCOME_TAX',
  CAPITAL_GAINS_TAX = 'CAPITAL_GAINS_TAX',
  STAMP_DUTY = 'STAMP_DUTY',
  WITHHOLDING_TAX = 'WITHHOLDING_TAX',
  VALUE_ADDED_TAX = 'VALUE_ADDED_TAX',
  EXCISE_DUTY = 'EXCISE_DUTY',
  CUSTOMS_DUTY = 'CUSTOMS_DUTY',
  INSTALMENT_TAX = 'INSTALMENT_TAX',
  CORPORATE_TAX = 'CORPORATE_TAX',
  OTHER = 'OTHER',
}

export enum DebtStatus {
  OUTSTANDING = 'OUTSTANDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  SETTLED = 'SETTLED',
  WRITTEN_OFF = 'WRITTEN_OFF',
  DISPUTED = 'DISPUTED',
  STATUTE_BARRED = 'STATUTE_BARRED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  UNDER_COURT_REVIEW = 'UNDER_COURT_REVIEW',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
}

export enum DebtPriority {
  HIGHEST = 'HIGHEST', // S.45(a): Funeral & Testamentary expenses
  HIGH = 'HIGH', // S.45(b): Secured debts
  MEDIUM = 'MEDIUM', // S.45(c): Taxes, rates, wages
  LOW = 'LOW', // S.45(d): Unsecured general debts
}

interface DebtProps {
  estateId: UniqueEntityID;

  // Core Debt Information
  type: DebtType;
  description: string;

  // Section 45 Compliance
  section45Tier: Section45Tier;
  liabilityTier: LiabilityTier;
  priority: DebtPriority;
  priorityOrder: number; // 1, 2, 3, 4 for payment sequence
  isMandatoryPayment: boolean; // Must be paid before distribution

  // Financial Details
  principalAmount: Money;
  outstandingBalance: Money;
  claimedAmount: Money; // Amount claimed by creditor (may differ)
  maximumPayableAmount: Money; // Cap on payment (e.g., statutory limits)

  // Debt Terms & Conditions
  terms: DebtTerms;

  // Status & Workflow
  status: DebtStatus;
  verificationStatus: 'UNVERIFIED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  verificationNotes: string | null;
  verifiedBy: UniqueEntityID | null;
  verifiedAt: Date | null;

  // Kenyan Tax-Specific Fields
  taxType: KenyanTaxType | null;
  kraPin: KenyanId | null;
  taxPeriod: string | null; // "2023-2024", "Q1 2024", "January 2024"
  taxAssessmentNumber: string | null;
  taxOffice: string | null;

  // Creditor Information (Kenyan Context)
  creditorName: string;
  creditorType: 'INDIVIDUAL' | 'COMPANY' | 'GOVERNMENT' | 'FINANCIAL_INSTITUTION' | 'OTHER';
  creditorContact: string | null;
  creditorAccountNumber: string | null;
  creditorKraPin: KenyanId | null;
  creditorAddress: string | null;
  creditorPhone: string | null;
  creditorEmail: string | null;
  creditorBankDetails: Record<string, any> | null;

  // Asset Linkage (for secured debts)
  securedAssetId: UniqueEntityID | null;
  securityDetails: string | null;
  securityDocumentId: string | null;
  securityRegistrationNumber: string | null; // Charge/Mortgage registration number

  // Payment Tracking (Kenyan Banking)
  lastPaymentDate: Date | null;
  lastPaymentAmount: Money | null;
  lastPaymentMethod: string | null; // "MPESA", "BANK_TRANSFER", "CHEQUE", "CASH"
  lastPaymentReference: string | null;
  totalPaid: Money;
  paymentHistory: Array<{
    date: Date;
    amount: Money;
    method: string;
    reference: string;
    paidBy: string;
    notes?: string;
  }>;

  // Legal & Compliance (Kenyan Law)
  isStatuteBarred: boolean;
  statuteBarredDate: Date | null;
  limitationPeriodYears: number; // Kenyan Limitation Act
  requiresCourtApproval: boolean;
  courtApprovalObtained: boolean;
  courtApprovalDate: Date | null;
  courtOrderReference: string | null;
  courtStation: string | null;
  judgeName: string | null;

  // Dispute & Claim Management
  isDisputed: boolean;
  disputeReason: string | null;
  disputeFiledBy: string | null;
  disputeFiledDate: Date | null;
  disputeResolvedAt: Date | null;
  disputeResolution: string | null;
  claimRejectionReason: string | null;

  // Documentary Evidence
  supportingDocuments: string[]; // Array of document IDs
  proofOfDebtSubmitted: boolean;
  proofOfDebtDocumentId: string | null;
  creditorAffidavitSubmitted: boolean;
  affidavitDocumentId: string | null;

  // Timeline & Deadlines
  incurredDate: Date;
  dueDate: Date | null;
  noticeDate: Date | null; // Date creditor notified of death
  claimSubmissionDate: Date | null;
  claimVerificationDeadline: Date | null;
  paymentDeadline: Date | null;

  // Estate Administration Context
  includedInEstateInventory: boolean;
  inventoryDate: Date | null;
  recommendedForPayment: boolean;
  paymentRecommendationDate: Date | null;
  paymentRecommendationBy: UniqueEntityID | null;
  paymentAuthorizationDate: Date | null;
  paymentAuthorizedBy: UniqueEntityID | null;

  // Management & Audit
  isActive: boolean;
  requiresExecutorAttention: boolean;
  executorNotes: string | null;
  lastModifiedBy: UniqueEntityID | null;
  notes: string | null;
}

export class Debt extends Entity<DebtProps> {
  private constructor(props: DebtProps, id?: UniqueEntityID) {
    super(id, props);
  }

  public static create(
    props: {
      estateId: string;
      type: DebtType;
      description: string;
      principalAmount: Money;
      creditorName: string;
      incurredDate: Date;
      terms: DebtTerms;
      section45Tier?: Section45Tier;
      liabilityTier?: LiabilityTier;
      taxType?: KenyanTaxType;
      kraPin?: KenyanId;
      taxPeriod?: string;
      creditorContact?: string;
      creditorAccountNumber?: string;
      creditorKraPin?: KenyanId;
      creditorAddress?: string;
      securedAssetId?: string;
      dueDate?: Date;
      createdBy?: string;
    },
    id?: string,
  ): Result<Debt> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.estateId, argumentName: 'estateId' },
      { argument: props.type, argumentName: 'type' },
      { argument: props.description, argumentName: 'description' },
      { argument: props.principalAmount, argumentName: 'principalAmount' },
      { argument: props.creditorName, argumentName: 'creditorName' },
      { argument: props.incurredDate, argumentName: 'incurredDate' },
      { argument: props.terms, argumentName: 'terms' },
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<Debt>(guardResult.message);
    }

    // Validate description
    if (props.description.trim().length < 5) {
      return Result.fail<Debt>('Debt description must be at least 5 characters');
    }

    // Validate principal amount
    if (props.principalAmount.amount <= 0) {
      return Result.fail<Debt>('Principal amount must be positive');
    }

    // Validate incurred date is not in the future
    if (props.incurredDate > new Date()) {
      return Result.fail<Debt>('Incurred date cannot be in the future');
    }

    // Determine liability tier and Section 45 tier
    let liabilityTier = props.liabilityTier;
    let section45Tier = props.section45Tier;

    if (!liabilityTier || !section45Tier) {
      const priorityResult = props.terms.getSection45Priority();
      liabilityTier = liabilityTier || priorityResult.liabilityTier;
      section45Tier = section45Tier || priorityResult.section45Tier;
    }

    // Determine priority based on tier
    const priority = Debt.determinePriorityFromTier(section45Tier);
    const priorityOrder = Debt.getPriorityOrderFromTier(section45Tier);

    // Validate tax debt requirements
    if (props.taxType) {
      if (!props.kraPin) {
        return Result.fail<Debt>('Tax debts require KRA PIN');
      }
      if (!props.taxPeriod) {
        return Result.warn<Debt>('Tax period is recommended for tax debts');
      }
    }

    // Validate secured debt requirements
    if (props.terms.isSecured && !props.securedAssetId) {
      return Result.fail<Debt>('Secured debts must be linked to an asset');
    }

    const debtId = id ? new UniqueEntityID(id) : new UniqueEntityID();
    const estateId = new UniqueEntityID(props.estateId);
    const securedAssetId = props.securedAssetId ? new UniqueEntityID(props.securedAssetId) : null;
    const createdBy = props.createdBy ? new UniqueEntityID(props.createdBy) : null;

    // Determine creditor type based on context
    const creditorType = Debt.determineCreditorType(props.creditorName, props.taxType);

    const defaultProps: DebtProps = {
      estateId,
      type: props.type,
      description: props.description.trim(),
      section45Tier,
      liabilityTier,
      priority,
      priorityOrder,
      isMandatoryPayment: priorityOrder <= 3, // First three tiers are mandatory
      principalAmount: props.principalAmount,
      outstandingBalance: props.principalAmount,
      claimedAmount: props.principalAmount,
      maximumPayableAmount: props.principalAmount, // Can be adjusted later
      terms: props.terms,
      status: DebtStatus.OUTSTANDING,
      verificationStatus: 'UNVERIFIED',
      verificationNotes: null,
      verifiedBy: null,
      verifiedAt: null,
      taxType: props.taxType || null,
      kraPin: props.kraPin || null,
      taxPeriod: props.taxPeriod || null,
      taxAssessmentNumber: null,
      taxOffice: null,
      creditorName: props.creditorName.trim(),
      creditorType,
      creditorContact: props.creditorContact?.trim() || null,
      creditorAccountNumber: props.creditorAccountNumber?.trim() || null,
      creditorKraPin: props.creditorKraPin || null,
      creditorAddress: props.creditorAddress?.trim() || null,
      creditorPhone: null,
      creditorEmail: null,
      creditorBankDetails: null,
      securedAssetId,
      securityDetails: null,
      securityDocumentId: null,
      securityRegistrationNumber: null,
      lastPaymentDate: null,
      lastPaymentAmount: null,
      lastPaymentMethod: null,
      lastPaymentReference: null,
      totalPaid: Money.zero(props.principalAmount.currency),
      paymentHistory: [],
      isStatuteBarred: false,
      statuteBarredDate: null,
      limitationPeriodYears: props.terms.isSecured ? 12 : 6, // Kenyan Limitation Act
      requiresCourtApproval: props.type === DebtType.COURT_FINES || false,
      courtApprovalObtained: false,
      courtApprovalDate: null,
      courtOrderReference: null,
      courtStation: null,
      judgeName: null,
      isDisputed: false,
      disputeReason: null,
      disputeFiledBy: null,
      disputeFiledDate: null,
      disputeResolvedAt: null,
      disputeResolution: null,
      claimRejectionReason: null,
      supportingDocuments: [],
      proofOfDebtSubmitted: false,
      proofOfDebtDocumentId: null,
      creditorAffidavitSubmitted: false,
      affidavitDocumentId: null,
      incurredDate: props.incurredDate,
      dueDate: props.dueDate || null,
      noticeDate: null,
      claimSubmissionDate: null,
      claimVerificationDeadline: null,
      paymentDeadline: null,
      includedInEstateInventory: false,
      inventoryDate: null,
      recommendedForPayment: false,
      paymentRecommendationDate: null,
      paymentRecommendationBy: null,
      paymentAuthorizationDate: null,
      paymentAuthorizedBy: null,
      isActive: true,
      requiresExecutorAttention: false,
      executorNotes: null,
      lastModifiedBy: createdBy,
      notes: null,
    };

    const debt = new Debt(defaultProps, debtId);
    return Result.ok<Debt>(debt);
  }

  // ==================== BUSINESS METHODS ====================

  // PAYMENT PROCESSING (Section 45 Compliance)
  public recordPayment(
    amount: Money,
    paymentDetails: {
      date?: Date;
      method: string;
      reference: string;
      paidBy: string;
      notes?: string;
    },
  ): Result<void> {
    // Validate payment
    if (amount.amount <= 0) {
      return Result.fail('Payment amount must be positive');
    }

    const paymentDate = paymentDetails.date || new Date();

    if (paymentDate > new Date()) {
      return Result.fail('Payment date cannot be in the future');
    }

    if (this.props.status === DebtStatus.SETTLED) {
      return Result.fail('Debt is already settled');
    }

    if (this.props.status === DebtStatus.STATUTE_BARRED) {
      return Result.fail('Cannot make payments on statute-barred debt');
    }

    if (this.props.status === DebtStatus.WRITTEN_OFF) {
      return Result.fail('Cannot make payments on written-off debt');
    }

    // Check if payment exceeds outstanding balance
    if (amount.amount > this.props.outstandingBalance.amount) {
      return Result.warn(
        `Payment (${amount.amount}) exceeds outstanding balance (${this.props.outstandingBalance.amount}). Adjusting to balance.`,
      );
      amount = this.props.outstandingBalance; // Adjust to outstanding balance
    }

    // Process payment
    this.props.outstandingBalance = this.props.outstandingBalance.subtract(amount);
    this.props.totalPaid = this.props.totalPaid.add(amount);
    this.props.lastPaymentDate = paymentDate;
    this.props.lastPaymentAmount = amount;
    this.props.lastPaymentMethod = paymentDetails.method;
    this.props.lastPaymentReference = paymentDetails.reference;

    // Record in payment history
    this.props.paymentHistory.push({
      date: paymentDate,
      amount,
      method: paymentDetails.method,
      reference: paymentDetails.reference,
      paidBy: paymentDetails.paidBy,
      notes: paymentDetails.notes,
    });

    // Update status
    if (this.props.outstandingBalance.amount === 0) {
      this.props.status = DebtStatus.SETTLED;
      this.addNote(
        `Debt fully settled on ${paymentDate.toISOString()}. Reference: ${paymentDetails.reference}`,
      );
    } else {
      this.props.status = DebtStatus.PARTIALLY_PAID;
      this.addNote(
        `Partial payment of ${amount.amount} ${amount.currency} on ${paymentDate.toISOString()}. Outstanding: ${this.props.outstandingBalance.amount}`,
      );
    }

    this.props.lastModifiedBy = new UniqueEntityID(paymentDetails.paidBy);

    return Result.ok();
  }

  // SECTION 45 PRIORITY MANAGEMENT
  public updateSection45Classification(
    section45Tier: Section45Tier,
    updatedBy: string,
    reason?: string,
  ): Result<void> {
    if (section45Tier === this.props.section45Tier) {
      return Result.ok(); // No change needed
    }

    // Special validations for tier changes
    if (this.props.section45Tier === Section45Tier.S45_A_FUNERAL_TESTAMENTARY) {
      return Result.fail('Cannot change classification of S.45(a) funeral/testamentary expenses');
    }

    // Update tiers and priority
    const oldTier = this.props.section45Tier;
    this.props.section45Tier = section45Tier;
    this.props.liabilityTier = Debt.mapSection45ToLiabilityTier(section45Tier);
    this.props.priority = Debt.determinePriorityFromTier(section45Tier);
    this.props.priorityOrder = Debt.getPriorityOrderFromTier(section45Tier);
    this.props.isMandatoryPayment = this.props.priorityOrder <= 3;

    this.props.lastModifiedBy = new UniqueEntityID(updatedBy);

    const changeNote = `Section 45 tier changed from ${oldTier} to ${section45Tier}`;
    if (reason) {
      this.addNote(`${changeNote}. Reason: ${reason}`);
    } else {
      this.addNote(changeNote);
    }

    return Result.ok();
  }

  // STATUTE OF LIMITATIONS (Limitation Act, Cap 22)
  public checkStatuteBarredStatus(checkDate: Date = new Date()): Result<boolean> {
    if (this.props.isStatuteBarred) {
      return Result.ok(true);
    }

    // Calculate limitation period
    const limitationDate = new Date(this.props.incurredDate);
    limitationDate.setFullYear(limitationDate.getFullYear() + this.props.limitationPeriodYears);

    if (checkDate > limitationDate) {
      this.props.isStatuteBarred = true;
      this.props.statuteBarredDate = checkDate;
      this.props.status = DebtStatus.STATUTE_BARRED;
      this.addNote(
        `Debt became statute-barred on ${checkDate.toISOString()} (Limitation period: ${this.props.limitationPeriodYears} years)`,
      );
      return Result.ok(true);
    }

    return Result.ok(false);
  }

  // COURT APPROVAL MANAGEMENT (For court-ordered debts)
  public obtainCourtApproval(
    courtOrderDetails: {
      reference: string;
      date: Date;
      courtStation: string;
      judgeName?: string;
      conditions?: string[];
    },
    approvedBy: string,
  ): Result<void> {
    if (!this.props.requiresCourtApproval) {
      return Result.fail('This debt does not require court approval');
    }

    if (this.props.courtApprovalObtained) {
      return Result.fail('Court approval already obtained');
    }

    this.props.courtApprovalObtained = true;
    this.props.courtApprovalDate = courtOrderDetails.date;
    this.props.courtOrderReference = courtOrderDetails.reference;
    this.props.courtStation = courtOrderDetails.courtStation;
    this.props.judgeName = courtOrderDetails.judgeName || null;
    this.props.lastModifiedBy = new UniqueEntityID(approvedBy);

    let approvalNote = `Court approval obtained: ${courtOrderDetails.reference} from ${courtOrderDetails.courtStation}`;
    if (courtOrderDetails.conditions && courtOrderDetails.conditions.length > 0) {
      approvalNote += `. Conditions: ${courtOrderDetails.conditions.join(', ')}`;
    }

    this.addNote(approvalNote);

    return Result.ok();
  }

  // DISPUTE MANAGEMENT
  public disputeDebt(
    disputedBy: string,
    reason: string,
    supportingDocuments?: string[],
  ): Result<void> {
    if (this.props.isDisputed) {
      return Result.fail('Debt is already disputed');
    }

    if (!reason || reason.trim().length < 10) {
      return Result.fail('Dispute reason must be at least 10 characters');
    }

    this.props.isDisputed = true;
    this.props.disputeReason = reason.trim();
    this.props.disputeFiledBy = disputedBy;
    this.props.disputeFiledDate = new Date();
    this.props.status = DebtStatus.DISPUTED;
    this.props.lastModifiedBy = new UniqueEntityID(disputedBy);

    if (supportingDocuments && supportingDocuments.length > 0) {
      this.props.supportingDocuments.push(...supportingDocuments);
    }

    this.addNote(`Debt disputed by ${disputedBy}: ${reason}`);

    return Result.ok();
  }

  public resolveDispute(
    resolution: string,
    resolvedBy: string,
    outcome: 'UPHELD' | 'DISMISSED' | 'SETTLED',
  ): Result<void> {
    if (!this.props.isDisputed) {
      return Result.fail('Debt is not disputed');
    }

    this.props.isDisputed = false;
    this.props.disputeResolvedAt = new Date();
    this.props.disputeResolution = `${outcome}: ${resolution}`;
    this.props.lastModifiedBy = new UniqueEntityID(resolvedBy);

    // Update status based on dispute outcome
    if (outcome === 'UPHELD') {
      this.props.status = DebtStatus.OUTSTANDING;
    } else if (outcome === 'DISMISSED') {
      // Dispute dismissed, debt remains valid
      this.props.status = DebtStatus.OUTSTANDING;
    } else if (outcome === 'SETTLED') {
      // Settled through dispute resolution
      this.props.status = DebtStatus.SETTLED;
      this.props.outstandingBalance = Money.zero(this.props.principalAmount.currency);
    }

    this.addNote(`Dispute resolved by ${resolvedBy}: ${outcome}. ${resolution}`);

    return Result.ok();
  }

  // DEBT WRITE-OFF (With Kenyan Legal Restrictions)
  public writeOffDebt(
    writtenOffBy: string,
    reason: string,
    requiresKRAApproval: boolean = false,
    kraApprovalReference?: string,
  ): Result<void> {
    if (this.props.status === DebtStatus.SETTLED) {
      return Result.fail('Cannot write off settled debt');
    }

    if (this.props.status === DebtStatus.WRITTEN_OFF) {
      return Result.fail('Debt is already written off');
    }

    if (!reason || reason.trim().length < 10) {
      return Result.fail('Write-off reason must be at least 10 characters');
    }

    // Kenyan legal restrictions
    if (this.props.section45Tier === Section45Tier.S45_A_FUNERAL_TESTAMENTARY) {
      return Result.fail('Funeral and testamentary expenses cannot be written off under S.45(a)');
    }

    if (this.props.taxType) {
      if (!requiresKRAApproval) {
        return Result.fail('Tax debts require KRA approval for write-off');
      }
      if (!kraApprovalReference) {
        return Result.fail('KRA approval reference is required for tax debt write-off');
      }
    }

    const previousStatus = this.props.status;
    this.props.status = DebtStatus.WRITTEN_OFF;
    this.props.outstandingBalance = Money.zero(this.props.principalAmount.currency);
    this.props.lastModifiedBy = new UniqueEntityID(writtenOffBy);

    let writeOffNote = `Debt written off by ${writtenOffBy}: ${reason}`;
    if (kraApprovalReference) {
      writeOffNote += ` (KRA Approval: ${kraApprovalReference})`;
    }

    this.addNote(writeOffNote);

    return Result.ok();
  }

  // VERIFICATION WORKFLOW
  public verifyDebt(
    verifiedBy: string,
    verificationMethod: string,
    documentId?: string,
    notes?: string,
  ): Result<void> {
    if (this.props.verificationStatus === 'VERIFIED') {
      return Result.fail('Debt is already verified');
    }

    // Specific verification requirements by debt type
    if (this.props.taxType && !this.props.taxAssessmentNumber) {
      return Result.warn('Verifying tax debt without assessment number');
    }

    if (this.props.terms.isSecured && !this.props.securityRegistrationNumber) {
      return Result.warn('Verifying secured debt without registration number');
    }

    this.props.verificationStatus = 'VERIFIED';
    this.props.verifiedBy = new UniqueEntityID(verifiedBy);
    this.props.verifiedAt = new Date();
    this.props.verificationNotes = notes || null;
    this.props.lastModifiedBy = new UniqueEntityID(verifiedBy);

    if (documentId) {
      this.props.supportingDocuments.push(documentId);
    }

    this.addNote(`Debt verified by ${verifiedBy} using ${verificationMethod}`);

    return Result.ok();
  }

  public rejectVerification(
    rejectedBy: string,
    reason: string,
    suggestedAction?: string,
  ): Result<void> {
    if (this.props.verificationStatus === 'REJECTED') {
      return Result.fail('Debt verification is already rejected');
    }

    this.props.verificationStatus = 'REJECTED';
    this.props.verifiedBy = new UniqueEntityID(rejectedBy);
    this.props.verifiedAt = new Date();
    this.props.claimRejectionReason = reason;
    this.props.status = DebtStatus.CLAIM_REJECTED;
    this.props.lastModifiedBy = new UniqueEntityID(rejectedBy);

    const rejectionNote = `Verification rejected by ${rejectedBy}: ${reason}`;
    if (suggestedAction) {
      this.addNote(`${rejectionNote}. Suggested action: ${suggestedAction}`);
    } else {
      this.addNote(rejectionNote);
    }

    return Result.ok();
  }

  // ESTATE ADMINISTRATION METHODS
  public includeInEstateInventory(
    inventoryDate: Date = new Date(),
    includedBy: string,
  ): Result<void> {
    if (this.props.includedInEstateInventory) {
      return Result.fail('Debt already included in estate inventory');
    }

    this.props.includedInEstateInventory = true;
    this.props.inventoryDate = inventoryDate;
    this.props.lastModifiedBy = new UniqueEntityID(includedBy);

    this.addNote(`Included in estate inventory on ${inventoryDate.toISOString()}`);

    return Result.ok();
  }

  public recommendForPayment(
    recommendedBy: string,
    reason: string,
    recommendedAmount?: Money,
  ): Result<void> {
    if (!this.props.includedInEstateInventory) {
      return Result.fail('Debt must be included in estate inventory before recommendation');
    }

    if (this.props.recommendedForPayment) {
      return Result.fail('Debt already recommended for payment');
    }

    this.props.recommendedForPayment = true;
    this.props.paymentRecommendationDate = new Date();
    this.props.paymentRecommendationBy = new UniqueEntityID(recommendedBy);
    this.props.lastModifiedBy = new UniqueEntityID(recommendedBy);

    if (recommendedAmount) {
      this.props.maximumPayableAmount = recommendedAmount;
    }

    this.addNote(`Recommended for payment by ${recommendedBy}: ${reason}`);

    return Result.ok();
  }

  public authorizePayment(
    authorizedBy: string,
    authorizedAmount: Money,
    paymentDeadline?: Date,
  ): Result<void> {
    if (!this.props.recommendedForPayment) {
      return Result.fail('Debt must be recommended before authorization');
    }

    this.props.paymentAuthorizationDate = new Date();
    this.props.paymentAuthorizedBy = new UniqueEntityID(authorizedBy);
    this.props.maximumPayableAmount = authorizedAmount;
    this.props.paymentDeadline = paymentDeadline || null;
    this.props.lastModifiedBy = new UniqueEntityID(authorizedBy);

    let authNote = `Payment authorized by ${authorizedBy} for amount ${authorizedAmount.amount} ${authorizedAmount.currency}`;
    if (paymentDeadline) {
      authNote += `, deadline: ${paymentDeadline.toISOString()}`;
    }

    this.addNote(authNote);

    return Result.ok();
  }

  // CREDITOR INFORMATION MANAGEMENT
  public updateCreditorInformation(
    updates: Partial<{
      contact: string;
      phone: string;
      email: string;
      address: string;
      bankDetails: Record<string, any>;
    }>,
    updatedBy: string,
  ): Result<void> {
    if (updates.contact) this.props.creditorContact = updates.contact;
    if (updates.phone) this.props.creditorPhone = updates.phone;
    if (updates.email) this.props.creditorEmail = updates.email;
    if (updates.address) this.props.creditorAddress = updates.address;
    if (updates.bankDetails) this.props.creditorBankDetails = updates.bankDetails;

    this.props.lastModifiedBy = new UniqueEntityID(updatedBy);
    this.addNote(`Creditor information updated by ${updatedBy}`);

    return Result.ok();
  }

  // SECURITY REGISTRATION
  public registerSecurity(
    registrationNumber: string,
    documentId: string,
    registrationDate: Date = new Date(),
    registeredBy: string,
  ): Result<void> {
    if (!this.props.terms.isSecured) {
      return Result.fail('Only secured debts can have security registration');
    }

    this.props.securityRegistrationNumber = registrationNumber;
    this.props.securityDocumentId = documentId;
    this.props.lastModifiedBy = new UniqueEntityID(registeredBy);

    this.addNote(`Security registered: ${registrationNumber} on ${registrationDate.toISOString()}`);

    return Result.ok();
  }

  // TAX DEBT SPECIFIC METHODS
  public recordTaxAssessment(
    assessmentNumber: string,
    taxOffice: string,
    assessedBy: string,
  ): Result<void> {
    if (!this.props.taxType) {
      return Result.fail('Only tax debts can have assessment records');
    }

    this.props.taxAssessmentNumber = assessmentNumber;
    this.props.taxOffice = taxOffice;
    this.props.lastModifiedBy = new UniqueEntityID(assessedBy);

    this.addNote(`Tax assessment recorded: ${assessmentNumber} from ${taxOffice}`);

    return Result.ok();
  }

  // VALIDATION METHODS
  public validateForPayment(): Result<{
    canPay: boolean;
    reasons: string[];
    requirements: string[];
    maximumAmount: Money;
  }> {
    const reasons: string[] = [];
    const requirements: string[] = [];

    // Check status
    if (this.props.status === DebtStatus.SETTLED) {
      reasons.push('Debt is already settled');
    }

    if (this.props.status === DebtStatus.STATUTE_BARRED) {
      reasons.push('Debt is statute-barred');
    }

    if (this.props.status === DebtStatus.WRITTEN_OFF) {
      reasons.push('Debt has been written off');
    }

    if (this.props.isDisputed) {
      reasons.push('Debt is under dispute');
    }

    // Check verification
    if (this.props.verificationStatus !== 'VERIFIED') {
      reasons.push('Debt is not verified');
      requirements.push('Debt verification required');
    }

    // Check court approval
    if (this.props.requiresCourtApproval && !this.props.courtApprovalObtained) {
      reasons.push('Requires court approval');
      requirements.push('Court order for payment');
    }

    // Check if included in inventory
    if (!this.props.includedInEstateInventory) {
      reasons.push('Debt not included in estate inventory');
      requirements.push('Include in estate inventory first');
    }

    // Check authorization
    if (this.props.requiresCourtApproval && !this.props.paymentAuthorizationDate) {
      reasons.push('Payment not authorized');
      requirements.push('Payment authorization required');
    }

    // S.45 Compliance requirements
    const compliance = this.getSection45Compliance();
    if (!compliance.isCompliant) {
      reasons.push('Not S.45 compliant');
      requirements.push(
        ...compliance.requirements.filter((r) => r.startsWith('Requires') || r.startsWith('Must')),
      );
    }

    const canPay = reasons.length === 0;
    const maximumAmount = this.props.maximumPayableAmount;

    return Result.ok({ canPay, reasons, requirements, maximumAmount });
  }

  public getSection45Compliance(): {
    tier: Section45Tier;
    liabilityTier: LiabilityTier;
    priority: number;
    requirements: string[];
    isCompliant: boolean;
  } {
    const requirements: string[] = [];
    let isCompliant = true;

    // S.45(a) Funeral and testamentary expenses
    if (this.props.section45Tier === Section45Tier.S45_A_FUNERAL_TESTAMENTARY) {
      requirements.push('Must be reasonable and customary');
      requirements.push('Requires receipts for verification');
      requirements.push('Priority over all other debts (S.45(a))');

      if (
        this.props.type !== DebtType.FUNERAL_EXPENSE &&
        this.props.type !== DebtType.TESTAMENTARY_EXPENSES
      ) {
        isCompliant = false;
        requirements.push('Must be clearly identified as funeral or testamentary expense');
      }
    }

    // S.45(b) Secured debts
    if (this.props.section45Tier === Section45Tier.S45_B_SECURED) {
      requirements.push('Must have valid security documentation');
      requirements.push('Asset-backed verification required');
      requirements.push('Security must be properly registered');

      if (!this.props.securedAssetId) {
        isCompliant = false;
        requirements.push('Secured debts must be linked to an asset');
      }

      if (!this.props.securityRegistrationNumber) {
        isCompliant = false;
        requirements.push('Security registration number required');
      }
    }

    // S.45(c) Taxes, rates, wages
    if (this.props.section45Tier === Section45Tier.S45_C_TAXES_RATES_WAGES) {
      requirements.push('KRA tax clearance required for tax debts');
      requirements.push('County government rates receipts');
      requirements.push('Employee wage documentation for wage debts');
      requirements.push('Proof of arrears required');

      if (this.props.taxType && !this.props.kraPin) {
        isCompliant = false;
        requirements.push('Tax debts require KRA PIN');
      }

      if (this.props.type === DebtType.EMPLOYEE_WAGES) {
        requirements.push('NSSF compliance certificate required');
        requirements.push('NHIF deductions proof required');
      }
    }

    // S.45(d) Unsecured general debts
    if (this.props.section45Tier === Section45Tier.S45_D_UNSECURED_GENERAL) {
      requirements.push('Proof of debt documentation');
      requirements.push('Creditor affidavit may be required');
      requirements.push('Subject to available estate funds');

      if (!this.props.proofOfDebtSubmitted) {
        requirements.push('Proof of debt submission recommended');
      }
    }

    return {
      tier: this.props.section45Tier,
      liabilityTier: this.props.liabilityTier,
      priority: this.props.priorityOrder,
      requirements,
      isCompliant,
    };
  }

  // INTEREST CALCULATION
  public calculateAccruedInterest(asOfDate: Date = new Date()): Money {
    return this.props.terms.calculateOutstanding(asOfDate);
  }

  // HELPER METHODS
  private addNote(note: string): void {
    if (this.props.notes) {
      this.props.notes += `\n${new Date().toISOString()}: ${note}`;
    } else {
      this.props.notes = `${new Date().toISOString()}: ${note}`;
    }
  }

  private static determinePriorityFromTier(tier: Section45Tier): DebtPriority {
    switch (tier) {
      case Section45Tier.S45_A_FUNERAL_TESTAMENTARY:
        return DebtPriority.HIGHEST;
      case Section45Tier.S45_B_SECURED:
        return DebtPriority.HIGH;
      case Section45Tier.S45_C_TAXES_RATES_WAGES:
        return DebtPriority.MEDIUM;
      case Section45Tier.S45_D_UNSECURED_GENERAL:
        return DebtPriority.LOW;
      default:
        return DebtPriority.LOW;
    }
  }

  private static getPriorityOrderFromTier(tier: Section45Tier): number {
    switch (tier) {
      case Section45Tier.S45_A_FUNERAL_TESTAMENTARY:
        return 1;
      case Section45Tier.S45_B_SECURED:
        return 2;
      case Section45Tier.S45_C_TAXES_RATES_WAGES:
        return 3;
      case Section45Tier.S45_D_UNSECURED_GENERAL:
        return 4;
      default:
        return 4;
    }
  }

  private static mapSection45ToLiabilityTier(section45Tier: Section45Tier): LiabilityTier {
    switch (section45Tier) {
      case Section45Tier.S45_A_FUNERAL_TESTAMENTARY:
        return LiabilityTier.FUNERAL_EXPENSES;
      case Section45Tier.S45_B_SECURED:
        return LiabilityTier.SECURED_DEBTS;
      case Section45Tier.S45_C_TAXES_RATES_WAGES:
        return LiabilityTier.TAXES_RATES_WAGES;
      case Section45Tier.S45_D_UNSECURED_GENERAL:
        return LiabilityTier.UNSECURED_GENERAL;
      default:
        return LiabilityTier.UNSECURED_GENERAL;
    }
  }

  private static determineCreditorType(
    creditorName: string,
    taxType?: KenyanTaxType,
  ): 'INDIVIDUAL' | 'COMPANY' | 'GOVERNMENT' | 'FINANCIAL_INSTITUTION' | 'OTHER' {
    if (taxType) return 'GOVERNMENT';

    const nameLower = creditorName.toLowerCase();

    if (
      nameLower.includes('bank') ||
      nameLower.includes('sacco') ||
      nameLower.includes('finance') ||
      nameLower.includes('credit')
    ) {
      return 'FINANCIAL_INSTITUTION';
    }

    if (
      nameLower.includes('ltd') ||
      nameLower.includes('limited') ||
      nameLower.includes('company') ||
      nameLower.includes('co.')
    ) {
      return 'COMPANY';
    }

    if (
      nameLower.includes('government') ||
      nameLower.includes('county') ||
      nameLower.includes('ministry') ||
      nameLower.includes('authority')
    ) {
      return 'GOVERNMENT';
    }

    return 'INDIVIDUAL';
  }

  // ==================== GETTERS ====================

  get id(): UniqueEntityID {
    return this._id;
  }

  get estateId(): UniqueEntityID {
    return this.props.estateId;
  }

  get type(): DebtType {
    return this.props.type;
  }

  get description(): string {
    return this.props.description;
  }

  get section45Tier(): Section45Tier {
    return this.props.section45Tier;
  }

  get priority(): DebtPriority {
    return this.props.priority;
  }

  get priorityOrder(): number {
    return this.props.priorityOrder;
  }

  get principalAmount(): Money {
    return this.props.principalAmount;
  }

  get outstandingBalance(): Money {
    return this.props.outstandingBalance;
  }

  get status(): DebtStatus {
    return this.props.status;
  }

  get creditorName(): string {
    return this.props.creditorName;
  }

  get isSecured(): boolean {
    return this.props.terms.isSecured;
  }

  get securedAssetId(): UniqueEntityID | null {
    return this.props.securedAssetId;
  }

  get isStatuteBarred(): boolean {
    return this.props.isStatuteBarred;
  }

  get isDisputed(): boolean {
    return this.props.isDisputed;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get verificationStatus(): string {
    return this.props.verificationStatus;
  }

  get includedInEstateInventory(): boolean {
    return this.props.includedInEstateInventory;
  }

  get recommendedForPayment(): boolean {
    return this.props.recommendedForPayment;
  }

  get paymentAuthorized(): boolean {
    return !!this.props.paymentAuthorizationDate;
  }

  // COMPUTED PROPERTIES
  get canBePaid(): boolean {
    const validation = this.validateForPayment();
    return validation.isSuccess && validation.getValue().canPay;
  }

  get requiresCourtApproval(): boolean {
    return this.props.requiresCourtApproval && !this.props.courtApprovalObtained;
  }

  get isHighPriority(): boolean {
    return [DebtPriority.HIGHEST, DebtPriority.HIGH].includes(this.props.priority);
  }

  get isMandatory(): boolean {
    return this.props.isMandatoryPayment;
  }

  get interestAccrued(): Money {
    return this.calculateAccruedInterest();
  }

  get totalOwed(): Money {
    return this.props.outstandingBalance.add(this.calculateAccruedInterest());
  }

  get isFullyPaid(): boolean {
    return this.props.status === DebtStatus.SETTLED || this.props.outstandingBalance.amount === 0;
  }

  get paymentRequirements(): string[] {
    const requirements: string[] = [];

    if (!this.props.includedInEstateInventory) {
      requirements.push('Include in estate inventory');
    }

    if (this.props.verificationStatus !== 'VERIFIED') {
      requirements.push('Verify debt claim');
    }

    if (this.props.requiresCourtApproval && !this.props.courtApprovalObtained) {
      requirements.push('Obtain court approval');
    }

    if (!this.props.recommendedForPayment) {
      requirements.push('Executor recommendation required');
    }

    if (!this.props.paymentAuthorizationDate) {
      requirements.push('Payment authorization required');
    }

    return requirements;
  }

  // STATIC FACTORY METHODS
  public static createFuneralExpense(props: {
    estateId: string;
    description: string;
    amount: Money;
    creditorName: string;
    incurredDate: Date;
    createdBy?: string;
  }): Result<Debt> {
    const terms = DebtTerms.create({
      principalAmount: props.amount,
      isSecured: false,
      requiresCourtApproval: false,
    }).getValue();

    return Debt.create({
      ...props,
      type: DebtType.FUNERAL_EXPENSE,
      terms,
      section45Tier: Section45Tier.S45_A_FUNERAL_TESTAMENTARY,
    });
  }

  public static createTaxDebt(props: {
    estateId: string;
    taxType: KenyanTaxType;
    description: string;
    amount: Money;
    kraPin: KenyanId;
    taxPeriod: string;
    incurredDate: Date;
    dueDate?: Date;
    createdBy?: string;
  }): Result<Debt> {
    const terms = DebtTerms.create({
      principalAmount: props.amount,
      isSecured: false,
      requiresCourtApproval: false,
    }).getValue();

    return Debt.create({
      ...props,
      type: DebtType.TAX_OBLIGATION,
      creditorName: 'Kenya Revenue Authority',
      creditorKraPin: props.kraPin,
      terms,
      section45Tier: Section45Tier.S45_C_TAXES_RATES_WAGES,
    });
  }

  public static createMortgage(props: {
    estateId: string;
    description: string;
    amount: Money;
    creditorName: string;
    securedAssetId: string;
    terms: DebtTerms;
    incurredDate: Date;
    dueDate?: Date;
    createdBy?: string;
  }): Result<Debt> {
    return Debt.create({
      ...props,
      type: DebtType.MORTGAGE,
      section45Tier: Section45Tier.S45_B_SECURED,
    });
  }

  public static createTestamentaryExpense(props: {
    estateId: string;
    description: string;
    amount: Money;
    creditorName: string;
    incurredDate: Date;
    createdBy?: string;
  }): Result<Debt> {
    const terms = DebtTerms.create({
      principalAmount: props.amount,
      isSecured: false,
      requiresCourtApproval: false,
    }).getValue();

    return Debt.create({
      ...props,
      type: DebtType.TESTAMENTARY_EXPENSES,
      terms,
      section45Tier: Section45Tier.S45_A_FUNERAL_TESTAMENTARY,
    });
  }

  public static createLegalFee(props: {
    estateId: string;
    description: string;
    amount: Money;
    creditorName: string;
    incurredDate: Date;
    requiresCourtApproval?: boolean;
    createdBy?: string;
  }): Result<Debt> {
    const terms = DebtTerms.create({
      principalAmount: props.amount,
      isSecured: false,
      requiresCourtApproval: props.requiresCourtApproval || false,
    }).getValue();

    return Debt.create({
      ...props,
      type: DebtType.LEGAL_FEES,
      terms,
      section45Tier: Section45Tier.S45_A_FUNERAL_TESTAMENTARY,
    });
  }
}
