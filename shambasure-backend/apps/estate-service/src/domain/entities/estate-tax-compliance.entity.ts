// src/estate-service/src/domain/entities/estate-tax-compliance.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  EstateTaxAssessmentReceivedEvent,
  EstateTaxClearedEvent,
  EstateTaxExemptedEvent,
  EstateTaxPaymentRecordedEvent,
} from '../events/estate-tax.event';
import { TaxComplianceException } from '../exceptions/estate-tax.exception';
import { MoneyVO } from '../value-objects/money.vo';
import { TaxStatusVO } from '../value-objects/tax-status.vo';

export interface EstateTaxComplianceProps {
  estateId: string;
  kraPin: string;
  status: TaxStatusVO;

  // Tax Liabilities
  incomeTaxLiability: MoneyVO;
  capitalGainsTaxLiability: MoneyVO;
  stampDutyLiability: MoneyVO;
  otherLeviesLiability: MoneyVO;

  // Payments
  totalPaid: MoneyVO;
  lastPaymentDate?: Date;
  paymentHistory: Array<{
    date: Date;
    amount: number;
    type: string;
    reference: string;
  }>;

  // Clearance
  clearanceCertificateNo?: string;
  clearanceDate?: Date;
  clearanceIssuedBy?: string;

  // Assessment
  assessmentDate?: Date;
  assessmentReference?: string;
  assessedBy?: string;

  // Exemption
  exemptionReason?: string;
  exemptionCertificateNo?: string;
  exemptedBy?: string;
  exemptionDate?: Date;

  // Metadata
  requiresProfessionalValuation: boolean;
  isUnderInvestigation: boolean;
  notes?: string;
}

/**
 * Estate Tax Compliance Entity - "The Gatekeeper"
 *
 * BUSINESS RULES:
 * 1. Blocks estate distribution until CLEARED or EXEMPT
 * 2. Tracks all tax liabilities and payments
 * 3. Requires professional valuation for high-value estates (>10M KES)
 * 4. Maintains KRA clearance certificate audit trail
 */
export class EstateTaxCompliance extends Entity<EstateTaxComplianceProps> {
  private constructor(props: EstateTaxComplianceProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
    this.validate();
  }

  /**
   * Factory method to create new tax compliance record
   */
  public static create(
    estateId: string,
    kraPin: string,
    initialNetWorth?: MoneyVO,
    id?: UniqueEntityID,
  ): EstateTaxCompliance {
    // Determine if professional valuation is required
    const requiresProfessionalValuation = initialNetWorth
      ? initialNetWorth.isGreaterThan(MoneyVO.createKES(10000000))
      : false;

    return new EstateTaxCompliance(
      {
        estateId,
        kraPin,
        status: TaxStatusVO.pending(),
        incomeTaxLiability: MoneyVO.zero('KES'),
        capitalGainsTaxLiability: MoneyVO.zero('KES'),
        stampDutyLiability: MoneyVO.zero('KES'),
        otherLeviesLiability: MoneyVO.zero('KES'),
        totalPaid: MoneyVO.zero('KES'),
        paymentHistory: [],
        requiresProfessionalValuation,
        isUnderInvestigation: false,
      },
      id,
    );
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  private validate(): void {
    // Validate KRA PIN format (simplified)
    if (!this.props.kraPin || this.props.kraPin.trim().length < 9) {
      throw new TaxComplianceException('Invalid KRA PIN format');
    }

    // Validate total paid doesn't exceed total liability
    if (this.props.totalPaid.isGreaterThan(this.getTotalLiability())) {
      throw new TaxComplianceException('Total paid cannot exceed total liability');
    }

    // Validate clearance certificate if status is CLEARED
    if (this.props.status.value === TaxStatusVO.CLEARED && !this.props.clearanceCertificateNo) {
      throw new TaxComplianceException('Cleared status requires clearance certificate number');
    }

    // Validate exemption details if status is EXEMPT
    if (this.props.status.value === TaxStatusVO.EXEMPT && !this.props.exemptionReason) {
      throw new TaxComplianceException('Exempt status requires exemption reason');
    }
  }

  // ===========================================================================
  // FINANCIAL CALCULATIONS
  // ===========================================================================

  /**
   * Get total tax liability
   */
  public getTotalLiability(): MoneyVO {
    return this.props.incomeTaxLiability
      .add(this.props.capitalGainsTaxLiability)
      .add(this.props.stampDutyLiability)
      .add(this.props.otherLeviesLiability);
  }

  /**
   * Get remaining balance
   */
  public getRemainingBalance(): MoneyVO {
    const liability = this.getTotalLiability();
    if (this.props.totalPaid.isGreaterThan(liability) || this.props.totalPaid.equals(liability)) {
      return MoneyVO.zero('KES');
    }
    return liability.subtract(this.props.totalPaid);
  }

  /**
   * Get payment percentage
   */
  public getPaymentPercentage(): number {
    const liability = this.getTotalLiability();
    if (liability.isZero()) return 100;

    return (this.props.totalPaid.amount / liability.amount) * 100;
  }

  // ===========================================================================
  // ASSESSMENT MANAGEMENT
  // ===========================================================================

  /**
   * Record tax assessment from KRA
   */
  public recordAssessment(
    assessment: {
      incomeTax?: number;
      capitalGainsTax?: number;
      stampDuty?: number;
      otherLevies?: number;
    },
    assessmentReference: string,
    assessedBy: string,
    assessmentDate: Date = new Date(),
  ): void {
    if (this.props.status.value === TaxStatusVO.CLEARED) {
      throw new TaxComplianceException('Cannot assess already cleared tax compliance');
    }

    if (this.props.status.value === TaxStatusVO.EXEMPT) {
      throw new TaxComplianceException('Cannot assess exempt estate');
    }

    // Update liabilities
    const updates: Partial<EstateTaxComplianceProps> = {
      assessmentDate,
      assessmentReference,
      assessedBy,
      status: new TaxStatusVO(TaxStatusVO.ASSESSED),
    };

    if (assessment.incomeTax !== undefined) {
      updates.incomeTaxLiability = MoneyVO.createKES(assessment.incomeTax);
    }
    if (assessment.capitalGainsTax !== undefined) {
      updates.capitalGainsTaxLiability = MoneyVO.createKES(assessment.capitalGainsTax);
    }
    if (assessment.stampDuty !== undefined) {
      updates.stampDutyLiability = MoneyVO.createKES(assessment.stampDuty);
    }
    if (assessment.otherLevies !== undefined) {
      updates.otherLeviesLiability = MoneyVO.createKES(assessment.otherLevies);
    }

    this.updateState(updates);

    this.addDomainEvent(
      new EstateTaxAssessmentReceivedEvent(
        this.props.estateId,
        this.getTotalLiability().amount,
        assessmentReference,
        assessedBy,
        this.version,
      ),
    );
  }

  // ===========================================================================
  // PAYMENT PROCESSING
  // ===========================================================================

  /**
   * Record tax payment
   */
  public recordPayment(
    amount: MoneyVO,
    paymentType: string,
    reference: string,
    paidBy?: string,
    paymentDate: Date = new Date(),
  ): void {
    if (amount.isZero() || amount.amount <= 0) {
      throw new TaxComplianceException('Payment amount must be positive');
    }

    if (this.props.status.value === TaxStatusVO.CLEARED) {
      throw new TaxComplianceException('Cannot record payment for cleared compliance');
    }

    if (this.props.status.value === TaxStatusVO.EXEMPT) {
      throw new TaxComplianceException('Cannot record payment for exempt estate');
    }

    const newTotalPaid = this.props.totalPaid.add(amount);
    const remainingBalance = this.getTotalLiability().subtract(newTotalPaid);

    // Determine new status
    let newStatus = this.props.status;
    if (remainingBalance.isZero()) {
      newStatus = new TaxStatusVO(TaxStatusVO.PARTIALLY_PAID); // Fully paid but needs clearance
    } else if (newTotalPaid.isGreaterThan(MoneyVO.zero('KES'))) {
      newStatus = new TaxStatusVO(TaxStatusVO.PARTIALLY_PAID);
    }

    // Update payment history
    const paymentRecord = {
      date: paymentDate,
      amount: amount.amount,
      type: paymentType,
      reference,
    };

    this.updateState({
      totalPaid: newTotalPaid,
      status: newStatus,
      lastPaymentDate: paymentDate,
      paymentHistory: [...this.props.paymentHistory, paymentRecord],
    });

    this.addDomainEvent(
      new EstateTaxPaymentRecordedEvent(
        this.props.estateId,
        amount.amount,
        paymentType,
        reference,
        paidBy,
        this.version,
      ),
    );
  }

  // ===========================================================================
  // CLEARANCE MANAGEMENT
  // ===========================================================================

  /**
   * Mark tax compliance as cleared (The Bouncer Opens the Door)
   */
  public markAsCleared(
    certificateNumber: string,
    clearedBy: string,
    clearanceDate: Date = new Date(),
  ): void {
    if (!certificateNumber) {
      throw new TaxComplianceException('Clearance certificate number is required');
    }

    // Validate all taxes are paid
    if (!this.getRemainingBalance().isZero()) {
      throw new TaxComplianceException('Cannot clear with outstanding balance');
    }

    if (this.props.status.value === TaxStatusVO.CLEARED) {
      throw new TaxComplianceException('Tax compliance is already cleared');
    }

    if (this.props.status.value === TaxStatusVO.EXEMPT) {
      throw new TaxComplianceException('Cannot clear exempt estate');
    }

    this.updateState({
      status: TaxStatusVO.cleared(),
      clearanceCertificateNo: certificateNumber,
      clearanceDate,
      clearanceIssuedBy: clearedBy,
    });

    this.addDomainEvent(
      new EstateTaxClearedEvent(this.props.estateId, certificateNumber, clearedBy, this.version),
    );
  }

  // ===========================================================================
  // EXEMPTION MANAGEMENT
  // ===========================================================================

  /**
   * Mark estate as tax exempt
   */
  public markAsExempt(
    reason: string,
    certificateNo?: string,
    exemptedBy?: string,
    exemptionDate: Date = new Date(),
  ): void {
    if (this.props.status.value === TaxStatusVO.CLEARED) {
      throw new TaxComplianceException('Cannot exempt already cleared compliance');
    }

    // Validate estate qualifies for exemption (small estates < 100,000 KES)
    const totalLiability = this.getTotalLiability();
    if (totalLiability.isGreaterThan(MoneyVO.createKES(100000))) {
      throw new TaxComplianceException('Estate value exceeds exemption threshold');
    }

    this.updateState({
      status: new TaxStatusVO(TaxStatusVO.EXEMPT),
      exemptionReason: reason,
      exemptionCertificateNo: certificateNo,
      exemptedBy,
      exemptionDate,
    });

    this.addDomainEvent(
      new EstateTaxExemptedEvent(
        this.props.estateId,
        reason,
        certificateNo,
        exemptedBy,
        this.version,
      ),
    );
  }

  // ===========================================================================
  // INVESTIGATION & DISPUTE
  // ===========================================================================

  /**
   * Mark tax compliance as under investigation
   */
  public markUnderInvestigation(reason: string, investigator?: string): void {
    if (this.props.status.value === TaxStatusVO.CLEARED) {
      throw new TaxComplianceException('Cannot investigate cleared compliance');
    }

    this.updateState({
      status: new TaxStatusVO(TaxStatusVO.DISPUTED),
      isUnderInvestigation: true,
      notes: `Under investigation: ${reason}. Investigator: ${investigator || 'unknown'}`,
    });
  }

  /**
   * Resolve investigation
   */
  public resolveInvestigation(
    outcome: string,
    resolvedBy: string,
    resolvedDate: Date = new Date(),
  ): void {
    if (!this.props.isUnderInvestigation) {
      throw new TaxComplianceException('Tax compliance is not under investigation');
    }

    this.updateState({
      status: new TaxStatusVO(TaxStatusVO.ASSESSED), // Return to assessed status
      isUnderInvestigation: false,
      notes: `Investigation resolved: ${outcome}. Resolved by: ${resolvedBy} on ${resolvedDate.toISOString()}. ${this.props.notes || ''}`,
    });
  }

  // ===========================================================================
  // GATEKEEPER CHECKS
  // ===========================================================================

  /**
   * Check if estate can proceed to distribution
   */
  public isClearedForDistribution(): boolean {
    return this.props.status.isClearedForDistribution();
  }

  /**
   * Check if tax compliance is a liability (unpaid taxes)
   */
  public isLiability(): boolean {
    return this.props.status.isLiability() || !this.getRemainingBalance().isZero();
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  get status(): TaxStatusVO {
    return this.props.status;
  }

  get kraPin(): string {
    return this.props.kraPin;
  }

  get clearanceCertificateNo(): string | undefined {
    return this.props.clearanceCertificateNo;
  }

  get totalPaid(): MoneyVO {
    return this.props.totalPaid;
  }

  get remainingBalance(): MoneyVO {
    return this.getRemainingBalance();
  }

  get requiresProfessionalValuation(): boolean {
    return this.props.requiresProfessionalValuation;
  }

  get isUnderInvestigation(): boolean {
    return this.props.isUnderInvestigation;
  }

  get estateId(): string {
    return this.props.estateId;
  }
}
