import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  EstateTaxAssessmentReceivedEvent,
  EstateTaxClearedEvent,
} from '../events/estate-tax.event';
import { TaxComplianceException } from '../exceptions/estate-tax.exception';
import { MoneyVO } from '../value-objects/money.vo';
import { TaxStatusVO } from '../value-objects/tax-status.vo';

// Assumed existence based on pattern

export interface EstateTaxComplianceProps {
  estateId: string;
  kraPin: string; // The Estate's Trust PIN or Deceased's PIN
  status: TaxStatusVO;

  // Tax Heads (Liabilities)
  incomeTaxLiability: MoneyVO;
  capitalGainsTaxLiability: MoneyVO;
  stampDutyLiability: MoneyVO;
  otherLeviesLiability: MoneyVO;

  // Total Paid so far
  totalPaid: MoneyVO;

  // Clearance Details
  clearanceCertificateNo?: string; // The "Golden Ticket"
  clearanceDate?: Date;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Estate Tax Compliance Entity ("The Gatekeeper")
 *
 * RESPONSIBILITY:
 * 1. Tracks tax liabilities vs payments.
 * 2. Blocks Estate Distribution until Status is CLEARED or EXEMPT.
 * 3. Stores the KRA Clearance Certificate details.
 */
export class EstateTaxCompliance extends Entity<EstateTaxComplianceProps> {
  private constructor(props: EstateTaxComplianceProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
  }

  /**
   * Initialize a new Tax Compliance Record for an Estate.
   * Starts in PENDING state.
   */
  public static create(
    props: { estateId: string; kraPin: string },
    id?: UniqueEntityID,
  ): EstateTaxCompliance {
    return new EstateTaxCompliance(
      {
        estateId: props.estateId,
        kraPin: props.kraPin,
        status: TaxStatusVO.pending(), // Default start state

        // Initialize liabilities to Zero until Assessed
        incomeTaxLiability: MoneyVO.zero('KES'),
        capitalGainsTaxLiability: MoneyVO.zero('KES'),
        stampDutyLiability: MoneyVO.zero('KES'),
        otherLeviesLiability: MoneyVO.zero('KES'),
        totalPaid: MoneyVO.zero('KES'),

        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
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

  /**
   * Calculates total outstanding tax liability.
   */
  get totalLiability(): MoneyVO {
    return this.props.incomeTaxLiability
      .add(this.props.capitalGainsTaxLiability)
      .add(this.props.stampDutyLiability)
      .add(this.props.otherLeviesLiability);
  }

  get remainingBalance(): MoneyVO {
    // Basic math: Liability - Paid
    // Note: In real KRA systems, penalties apply, but here we track the 'Assessed' total.
    if (this.props.totalPaid.amount >= this.totalLiability.amount) {
      return MoneyVO.zero(this.props.totalPaid.currency);
    }
    return this.totalLiability.subtract(this.props.totalPaid);
  }

  /**
   * THE GATEKEEPER CHECK.
   * Used by Estate.isReadyForDistribution()
   */
  public isClearedForDistribution(): boolean {
    // Delegate to the Value Object logic
    return this.props.status.isClearedForDistribution();
  }

  // ===========================================================================
  // BUSINESS LOGIC
  // ===========================================================================

  /**
   * 1. Record an Assessment (Demand) from KRA.
   * This updates the liabilities and moves status to ASSESSED.
   */
  public recordAssessment(
    heads: {
      incomeTax?: number;
      cgt?: number;
      stampDuty?: number;
      other?: number;
    },
    assessedBy: string,
  ): void {
    // Logic: Update the specific tax heads
    const currentIncome = this.props.incomeTaxLiability;
    const currentCGT = this.props.capitalGainsTaxLiability;
    const currentStamp = this.props.stampDutyLiability;
    const currentOther = this.props.otherLeviesLiability;

    const newIncome =
      heads.incomeTax !== undefined ? MoneyVO.createKES(heads.incomeTax) : currentIncome;
    const newCGT = heads.cgt !== undefined ? MoneyVO.createKES(heads.cgt) : currentCGT;
    const newStamp =
      heads.stampDuty !== undefined ? MoneyVO.createKES(heads.stampDuty) : currentStamp;
    const newOther = heads.other !== undefined ? MoneyVO.createKES(heads.other) : currentOther;

    this.updateState({
      incomeTaxLiability: newIncome,
      capitalGainsTaxLiability: newCGT,
      stampDutyLiability: newStamp,
      otherLeviesLiability: newOther,
      status: new TaxStatusVO(TaxStatusVO.ASSESSED),
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new EstateTaxAssessmentReceivedEvent(
        this.props.estateId,
        this.totalLiability.amount,
        assessedBy,
        this.version,
      ),
    );
  }

  /**
   * 2. Record a Tax Payment.
   * If fully paid, does NOT automatically clear (requires Cert),
   * but moves to PARTIALLY_PAID or PENDING_CLEARANCE.
   */
  public recordPayment(amount: MoneyVO): void {
    if (amount.amount <= 0) throw new TaxComplianceException('Payment amount must be positive');

    const newTotalPaid = this.props.totalPaid.add(amount);

    // Determine status
    let newStatus = this.props.status;
    if (newTotalPaid.amount >= this.totalLiability.amount) {
      // Paid in full, waiting for certificate
      // We keep it as PARTIALLY_PAID or move to a custom 'PAID_AWAITING_CERT' if exists.
      // For now, let's assume we leave it as ASSESSED or PARTIALLY_PAID until manual clearance.
      newStatus = new TaxStatusVO(TaxStatusVO.PARTIALLY_PAID);
    } else {
      newStatus = new TaxStatusVO(TaxStatusVO.PARTIALLY_PAID);
    }

    this.updateState({
      totalPaid: newTotalPaid,
      status: newStatus,
      updatedAt: new Date(),
    });
  }

  /**
   * 3. Final Clearance ("The Bouncer Opens the Door").
   * Requires a Certificate Number from KRA.
   */
  public markAsCleared(certificateNumber: string, clearedBy: string): void {
    if (!certificateNumber)
      throw new TaxComplianceException('Clearance Certificate Number required');

    this.updateState({
      status: TaxStatusVO.cleared(),
      clearanceCertificateNo: certificateNumber,
      clearanceDate: new Date(),
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new EstateTaxClearedEvent(this.props.estateId, certificateNumber, clearedBy, this.version),
    );
  }

  /**
   * Mark as Exempt (e.g., small estates).
   */
  public markAsExempt(_reason: string, _authorizedBy: string): void {
    this.updateState({
      status: new TaxStatusVO(TaxStatusVO.EXEMPT),
      updatedAt: new Date(),
    });

    // Emit event...
  }
}
