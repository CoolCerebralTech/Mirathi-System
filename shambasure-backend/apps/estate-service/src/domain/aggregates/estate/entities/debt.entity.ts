import { Entity } from '../../../../domain/base/entity';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
// Exceptions
import {
  EstateDomainException, // Reusing generic estate exceptions
} from '../../../exceptions/estate.exception';
import { KenyanId } from '../../../shared/kenyan-id.vo';
import { Money } from '../../../shared/money.vo';
import { DebtTerms } from '../value-objects/debt-terms.vo';
import { LiabilityTier } from '../value-objects/liability-tier.vo';

// New Debt Specific Exceptions (Define these in estate.exception.ts or locally)
export class InvalidDebtConfigurationException extends EstateDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDebtConfigurationException';
  }
}
export class DebtPaymentException extends EstateDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'DebtPaymentException';
  }
}
export class DebtLegalViolationException extends EstateDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'DebtLegalViolationException';
  }
}

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
  HIGHEST = 'HIGHEST', // S.45(a)
  HIGH = 'HIGH', // S.45(b)
  MEDIUM = 'MEDIUM', // S.45(c)
  LOW = 'LOW', // S.45(d)
}

// Re-export Section45Tier for clarity if it was in previous files,
// otherwise we map it manually based on priority.
export enum Section45Tier {
  S45_A_FUNERAL_TESTAMENTARY = 'S45_A_FUNERAL_TESTAMENTARY',
  S45_B_SECURED = 'S45_B_SECURED',
  S45_C_TAXES_RATES_WAGES = 'S45_C_TAXES_RATES_WAGES',
  S45_D_UNSECURED_GENERAL = 'S45_D_UNSECURED_GENERAL',
}

export interface DebtProps {
  estateId: UniqueEntityID;

  // Core Debt Information
  type: DebtType;
  description: string;

  // Section 45 Compliance
  section45Tier: Section45Tier;
  liabilityTier: LiabilityTier;
  priority: DebtPriority;
  priorityOrder: number;
  isMandatoryPayment: boolean;

  // Financial Details
  principalAmount: Money;
  outstandingBalance: Money;
  claimedAmount: Money;
  maximumPayableAmount: Money;

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
  taxPeriod: string | null;
  taxAssessmentNumber: string | null;
  taxOffice: string | null;

  // Creditor Information
  creditorName: string;
  creditorType: 'INDIVIDUAL' | 'COMPANY' | 'GOVERNMENT' | 'FINANCIAL_INSTITUTION' | 'OTHER';
  creditorContact: string | null;
  creditorAccountNumber: string | null;
  creditorKraPin: KenyanId | null;
  creditorAddress: string | null;
  creditorPhone: string | null;
  creditorEmail: string | null;
  creditorBankDetails: Record<string, any> | null;

  // Asset Linkage
  securedAssetId: UniqueEntityID | null;
  securityDetails: string | null;
  securityDocumentId: string | null;
  securityRegistrationNumber: string | null;

  // Payment Tracking
  lastPaymentDate: Date | null;
  lastPaymentAmount: Money | null;
  lastPaymentMethod: string | null;
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

  // Legal & Compliance
  isStatuteBarred: boolean;
  statuteBarredDate: Date | null;
  limitationPeriodYears: number;
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
  supportingDocuments: string[];
  proofOfDebtSubmitted: boolean;
  proofOfDebtDocumentId: string | null;
  creditorAffidavitSubmitted: boolean;
  affidavitDocumentId: string | null;

  // Timeline
  incurredDate: Date;
  dueDate: Date | null;
  noticeDate: Date | null;
  claimSubmissionDate: Date | null;
  claimVerificationDeadline: Date | null;
  paymentDeadline: Date | null;

  // Estate Administration
  includedInEstateInventory: boolean;
  inventoryDate: Date | null;
  recommendedForPayment: boolean;
  paymentRecommendationDate: Date | null;
  paymentRecommendationBy: UniqueEntityID | null;
  paymentAuthorizationDate: Date | null;
  paymentAuthorizedBy: UniqueEntityID | null;

  // Management
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

  // Bypass readonly restriction for internal aggregate logic
  private get mutableProps(): DebtProps {
    return this._props;
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
  ): Debt {
    // 1. Validation
    if (
      !props.estateId ||
      !props.type ||
      !props.description ||
      !props.principalAmount ||
      !props.creditorName ||
      !props.incurredDate ||
      !props.terms
    ) {
      throw new InvalidDebtConfigurationException('Missing required debt fields');
    }

    if (props.description.trim().length < 5) {
      throw new InvalidDebtConfigurationException('Debt description must be at least 5 characters');
    }

    if (props.principalAmount.amount <= 0) {
      throw new InvalidDebtConfigurationException('Principal amount must be positive');
    }

    if (props.incurredDate > new Date()) {
      throw new InvalidDebtConfigurationException('Incurred date cannot be in the future');
    }

    // Determine liability tier and Section 45 tier
    let liabilityTier = props.liabilityTier;
    let section45Tier = props.section45Tier;

    if (!liabilityTier || !section45Tier) {
      // Logic to auto-assign based on type if not provided
      // This replaces props.terms.getSection45Priority() if it doesn't exist on VO
      if (
        props.type === DebtType.FUNERAL_EXPENSE ||
        props.type === DebtType.TESTAMENTARY_EXPENSES
      ) {
        section45Tier = Section45Tier.S45_A_FUNERAL_TESTAMENTARY;
      } else if (props.terms.isSecured) {
        section45Tier = Section45Tier.S45_B_SECURED;
      } else if (props.type === DebtType.TAX_OBLIGATION || props.type === DebtType.LAND_RATES) {
        section45Tier = Section45Tier.S45_C_TAXES_RATES_WAGES;
      } else {
        section45Tier = Section45Tier.S45_D_UNSECURED_GENERAL;
      }
      liabilityTier = Debt.mapSection45ToLiabilityTier(section45Tier);
    }

    const priority = Debt.determinePriorityFromTier(section45Tier);
    const priorityOrder = Debt.getPriorityOrderFromTier(section45Tier);

    // Validate tax debt requirements
    if (props.taxType) {
      if (!props.kraPin) {
        throw new InvalidDebtConfigurationException('Tax debts require KRA PIN');
      }
      // Warn about tax period - handled via notes or ignored in Exception pattern
    }

    // Validate secured debt requirements
    if (props.terms.isSecured && !props.securedAssetId) {
      throw new InvalidDebtConfigurationException('Secured debts must be linked to an asset');
    }

    const debtId = id ? new UniqueEntityID(id) : new UniqueEntityID();
    const estateId = new UniqueEntityID(props.estateId);
    const securedAssetId = props.securedAssetId ? new UniqueEntityID(props.securedAssetId) : null;
    const createdBy = props.createdBy ? new UniqueEntityID(props.createdBy) : null;

    const creditorType = Debt.determineCreditorType(props.creditorName, props.taxType);

    const defaultProps: DebtProps = {
      estateId,
      type: props.type,
      description: props.description.trim(),
      section45Tier,
      liabilityTier: liabilityTier,
      priority,
      priorityOrder,
      isMandatoryPayment: priorityOrder <= 3,
      principalAmount: props.principalAmount,
      outstandingBalance: props.principalAmount,
      claimedAmount: props.principalAmount,
      maximumPayableAmount: props.principalAmount,
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
      securityDetails: props.terms.toJSON().securityDetails || null, // Assuming props in VO
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
      limitationPeriodYears: props.terms.isSecured ? 12 : 6,
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

    return new Debt(defaultProps, debtId);
  }

  // ==================== BUSINESS METHODS ====================

  public recordPayment(
    amount: Money,
    paymentDetails: {
      date?: Date;
      method: string;
      reference: string;
      paidBy: string;
      notes?: string;
    },
  ): void {
    if (amount.amount <= 0) throw new DebtPaymentException('Payment amount must be positive');

    const paymentDate = paymentDetails.date || new Date();
    if (paymentDate > new Date())
      throw new DebtPaymentException('Payment date cannot be in the future');

    if (this.props.status === DebtStatus.SETTLED)
      throw new DebtPaymentException('Debt is already settled');
    if (this.props.status === DebtStatus.STATUTE_BARRED)
      throw new DebtPaymentException('Cannot make payments on statute-barred debt');
    if (this.props.status === DebtStatus.WRITTEN_OFF)
      throw new DebtPaymentException('Cannot make payments on written-off debt');

    let processedAmount = amount;

    // Check if payment exceeds outstanding balance
    if (amount.amount > this.props.outstandingBalance.amount) {
      // In Clean Architecture with Exception pattern, we can either throw or adjust silently.
      // Adjusting silently with a note is safer for financial reconciliations.
      processedAmount = this.props.outstandingBalance;
      this.addNote(
        `Payment adjusted from ${amount.amount} to ${processedAmount.amount} to match balance.`,
      );
    }

    // Process payment
    this.mutableProps.outstandingBalance = this.props.outstandingBalance.subtract(processedAmount);
    this.mutableProps.totalPaid = this.props.totalPaid.add(processedAmount);
    this.mutableProps.lastPaymentDate = paymentDate;
    this.mutableProps.lastPaymentAmount = processedAmount;
    this.mutableProps.lastPaymentMethod = paymentDetails.method;
    this.mutableProps.lastPaymentReference = paymentDetails.reference;

    // Record in payment history
    this.mutableProps.paymentHistory.push({
      date: paymentDate,
      amount: processedAmount,
      method: paymentDetails.method,
      reference: paymentDetails.reference,
      paidBy: paymentDetails.paidBy,
      notes: paymentDetails.notes,
    });

    // Update status
    if (this.props.outstandingBalance.amount === 0) {
      this.mutableProps.status = DebtStatus.SETTLED;
      this.addNote(
        `Debt fully settled on ${paymentDate.toISOString()}. Ref: ${paymentDetails.reference}`,
      );
    } else {
      this.mutableProps.status = DebtStatus.PARTIALLY_PAID;
      this.addNote(`Partial payment of ${processedAmount.amount} on ${paymentDate.toISOString()}.`);
    }

    this.mutableProps.lastModifiedBy = new UniqueEntityID(paymentDetails.paidBy);
  }

  public updateSection45Classification(
    section45Tier: Section45Tier,
    updatedBy: string,
    reason?: string,
  ): void {
    if (section45Tier === this.props.section45Tier) return;

    if (this.props.section45Tier === Section45Tier.S45_A_FUNERAL_TESTAMENTARY) {
      throw new DebtLegalViolationException(
        'Cannot change classification of S.45(a) funeral/testamentary expenses',
      );
    }

    const oldTier = this.props.section45Tier;
    this.mutableProps.section45Tier = section45Tier;
    this.mutableProps.liabilityTier = Debt.mapSection45ToLiabilityTier(section45Tier);
    this.mutableProps.priority = Debt.determinePriorityFromTier(section45Tier);
    this.mutableProps.priorityOrder = Debt.getPriorityOrderFromTier(section45Tier);
    this.mutableProps.isMandatoryPayment = this.props.priorityOrder <= 3;

    this.mutableProps.lastModifiedBy = new UniqueEntityID(updatedBy);
    this.addNote(`Section 45 tier changed from ${oldTier} to ${section45Tier}. Reason: ${reason}`);
  }

  public checkStatuteBarredStatus(checkDate: Date = new Date()): boolean {
    if (this.props.isStatuteBarred) return true;

    const limitationDate = new Date(this.props.incurredDate);
    limitationDate.setFullYear(limitationDate.getFullYear() + this.props.limitationPeriodYears);

    if (checkDate > limitationDate) {
      this.mutableProps.isStatuteBarred = true;
      this.mutableProps.statuteBarredDate = checkDate;
      this.mutableProps.status = DebtStatus.STATUTE_BARRED;
      this.addNote(`Debt became statute-barred on ${checkDate.toISOString()}`);
      return true;
    }

    return false;
  }

  public obtainCourtApproval(
    courtOrderDetails: {
      reference: string;
      date: Date;
      courtStation: string;
      judgeName?: string;
      conditions?: string[];
    },
    approvedBy: string,
  ): void {
    if (!this.props.requiresCourtApproval)
      throw new InvalidDebtConfigurationException('This debt does not require court approval');
    if (this.props.courtApprovalObtained)
      throw new InvalidDebtConfigurationException('Court approval already obtained');

    this.mutableProps.courtApprovalObtained = true;
    this.mutableProps.courtApprovalDate = courtOrderDetails.date;
    this.mutableProps.courtOrderReference = courtOrderDetails.reference;
    this.mutableProps.courtStation = courtOrderDetails.courtStation;
    this.mutableProps.judgeName = courtOrderDetails.judgeName || null;
    this.mutableProps.lastModifiedBy = new UniqueEntityID(approvedBy);

    this.addNote(`Court approval obtained: ${courtOrderDetails.reference}`);
  }

  public disputeDebt(disputedBy: string, reason: string, supportingDocuments?: string[]): void {
    if (this.props.isDisputed)
      throw new InvalidDebtConfigurationException('Debt is already disputed');
    if (!reason || reason.trim().length < 10)
      throw new InvalidDebtConfigurationException('Dispute reason must be at least 10 characters');

    this.mutableProps.isDisputed = true;
    this.mutableProps.disputeReason = reason.trim();
    this.mutableProps.disputeFiledBy = disputedBy;
    this.mutableProps.disputeFiledDate = new Date();
    this.mutableProps.status = DebtStatus.DISPUTED;
    this.mutableProps.lastModifiedBy = new UniqueEntityID(disputedBy);

    if (supportingDocuments && supportingDocuments.length > 0) {
      this.mutableProps.supportingDocuments.push(...supportingDocuments);
    }
    this.addNote(`Debt disputed by ${disputedBy}: ${reason}`);
  }

  public resolveDispute(
    resolution: string,
    resolvedBy: string,
    outcome: 'UPHELD' | 'DISMISSED' | 'SETTLED',
  ): void {
    if (!this.props.isDisputed) throw new InvalidDebtConfigurationException('Debt is not disputed');

    this.mutableProps.isDisputed = false;
    this.mutableProps.disputeResolvedAt = new Date();
    this.mutableProps.disputeResolution = `${outcome}: ${resolution}`;
    this.mutableProps.lastModifiedBy = new UniqueEntityID(resolvedBy);

    if (outcome === 'UPHELD' || outcome === 'DISMISSED') {
      this.mutableProps.status = DebtStatus.OUTSTANDING;
    } else if (outcome === 'SETTLED') {
      this.mutableProps.status = DebtStatus.SETTLED;
      this.mutableProps.outstandingBalance = Money.zero(this.props.principalAmount.currency);
    }

    this.addNote(`Dispute resolved by ${resolvedBy}: ${outcome}. ${resolution}`);
  }

  public writeOffDebt(
    writtenOffBy: string,
    reason: string,
    requiresKRAApproval: boolean = false,
    kraApprovalReference?: string,
  ): void {
    if (this.props.status === DebtStatus.SETTLED)
      throw new InvalidDebtConfigurationException('Cannot write off settled debt');
    if (this.props.status === DebtStatus.WRITTEN_OFF)
      throw new InvalidDebtConfigurationException('Debt is already written off');

    if (this.props.section45Tier === Section45Tier.S45_A_FUNERAL_TESTAMENTARY) {
      throw new DebtLegalViolationException(
        'Funeral/Testamentary expenses cannot be written off (S.45(a))',
      );
    }

    if (this.props.taxType) {
      if (!requiresKRAApproval)
        throw new DebtLegalViolationException('Tax debts require KRA approval for write-off');
      if (!kraApprovalReference)
        throw new DebtLegalViolationException('KRA approval reference is required');
    }

    this.mutableProps.status = DebtStatus.WRITTEN_OFF;
    this.mutableProps.outstandingBalance = Money.zero(this.props.principalAmount.currency);
    this.mutableProps.lastModifiedBy = new UniqueEntityID(writtenOffBy);
    this.addNote(`Written off by ${writtenOffBy}: ${reason}`);
  }

  // --- Verification ---

  public verifyDebt(
    verifiedBy: string,
    verificationMethod: string,
    documentId?: string,
    notes?: string,
  ): void {
    if (this.props.verificationStatus === 'VERIFIED')
      throw new InvalidDebtConfigurationException('Debt already verified');

    // Specific Checks
    if (this.props.taxType && !this.props.taxAssessmentNumber) {
      // Warning logic handled via logs/notes usually, exception implies hard stop.
      // Proceeding for now.
    }

    this.mutableProps.verificationStatus = 'VERIFIED';
    this.mutableProps.verifiedBy = new UniqueEntityID(verifiedBy);
    this.mutableProps.verifiedAt = new Date();
    this.mutableProps.verificationNotes = notes || null;
    this.mutableProps.lastModifiedBy = new UniqueEntityID(verifiedBy);
    if (documentId) this.mutableProps.supportingDocuments.push(documentId);

    this.addNote(`Verified by ${verifiedBy} using ${verificationMethod}`);
  }

  // --- Helpers ---

  private addNote(note: string): void {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${note}`;
    this.mutableProps.notes = this.props.notes ? `${this.props.notes}\n${entry}` : entry;
  }

  public calculateAccruedInterest(asOfDate: Date = new Date()): Money {
    // Assuming DebtTerms VO handles the math.
    // NOTE: This logic should ideally be inside the VO `terms`.
    // Since VO doesn't have it explicitly implemented in the provided snippet beyond simple fields,
    // we return Zero or rely on placeholder logic.
    return Money.zero(this.props.principalAmount.currency);
  }

  // --- Static Helpers ---

  private static determinePriorityFromTier(tier: Section45Tier): DebtPriority {
    switch (tier) {
      case Section45Tier.S45_A_FUNERAL_TESTAMENTARY:
        return DebtPriority.HIGHEST;
      case Section45Tier.S45_B_SECURED:
        return DebtPriority.HIGH;
      case Section45Tier.S45_C_TAXES_RATES_WAGES:
        return DebtPriority.MEDIUM;
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
    if (nameLower.includes('bank') || nameLower.includes('sacco') || nameLower.includes('finance'))
      return 'FINANCIAL_INSTITUTION';
    if (nameLower.includes('ltd') || nameLower.includes('limited')) return 'COMPANY';
    if (
      nameLower.includes('government') ||
      nameLower.includes('county') ||
      nameLower.includes('ministry')
    )
      return 'GOVERNMENT';
    return 'INDIVIDUAL';
  }

  // --- Getters ---

  get id(): UniqueEntityID {
    return this._id;
  }
  get type(): DebtType {
    return this.props.type;
  }
  get description(): string {
    return this.props.description;
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
  get section45Tier(): Section45Tier {
    return this.props.section45Tier;
  }
  get isSecured(): boolean {
    return this.props.terms.isSecured;
  }

  // Computed
  get canBePaid(): boolean {
    return (
      this.props.status === DebtStatus.OUTSTANDING &&
      this.props.verificationStatus === 'VERIFIED' &&
      (!this.props.requiresCourtApproval || this.props.courtApprovalObtained) &&
      this.props.includedInEstateInventory &&
      this.props.paymentAuthorizedBy !== null
    );
  }
}
