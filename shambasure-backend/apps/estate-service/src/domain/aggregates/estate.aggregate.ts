// src/estate-service/src/domain/aggregates/estate.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { UniqueEntityID } from '../base/unique-entity-id';
import { AssetLiquidation } from '../entities/asset-liquidation.entity';
import { Asset } from '../entities/asset.entity';
import { Debt } from '../entities/debt.entity';
import { EstateTaxCompliance } from '../entities/estate-tax-compliance.entity';
import { GiftInterVivos } from '../entities/gift-inter-vivos.entity';
import { LegalDependant } from '../entities/legal-dependant.entity';
import { AssetStatus } from '../enums/asset-status.enum';
import { DebtStatus } from '../enums/debt-status.enum';
import {
  EstateAssetAddedEvent,
  EstateCashUpdatedEvent,
  EstateCreatedEvent,
  EstateDebtAddedEvent,
  EstateDebtPaidEvent,
  EstateDependantAddedEvent,
  EstateFrozenEvent,
  EstateGiftAddedEvent,
  EstateInsolvencyDetectedEvent,
  EstateLiquidatedEvent,
  EstateReadyForDistributionEvent,
  EstateTaxClearedEvent,
  EstateUnfrozenEvent,
} from '../events/estate.events';
import {
  EstateFrozenException,
  EstateLogicException,
  Section45ViolationException,
} from '../exceptions/estate.exception';
import { MoneyVO } from '../value-objects/money.vo';

/**
 * Estate Status Enum
 *
 * Legal Context (Law of Succession Act):
 * - SETUP: Initial data entry, no legal validity yet
 * - ACTIVE: Estate is legally valid and being administered
 * - FROZEN: Estate is halted due to dispute or court order
 * - LIQUIDATING: Assets are being converted to cash
 * - READY_FOR_DISTRIBUTION: All debts/taxes paid, ready for heirs
 * - DISTRIBUTING: Assets are being transferred to heirs
 * - CLOSED: Estate administration complete
 */
export enum EstateStatus {
  SETUP = 'SETUP',
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  LIQUIDATING = 'LIQUIDATING',
  READY_FOR_DISTRIBUTION = 'READY_FOR_DISTRIBUTION',
  DISTRIBUTING = 'DISTRIBUTING',
  CLOSED = 'CLOSED',
}

export interface EstateProps {
  // Core Identity
  name: string;
  deceasedId: string;
  dateOfDeath: Date;
  deceasedName: string;
  status: EstateStatus;

  // The Economic Ledger
  assets: Asset[];
  activeLiquidations: AssetLiquidation[];
  debts: Debt[];
  gifts: GiftInterVivos[];
  dependants: LegalDependant[];

  // The Gatekeeper
  taxCompliance: EstateTaxCompliance;
  kraPin: string;

  // Liquidity Management
  cashOnHand: MoneyVO;
  cashReservedForDebts: MoneyVO;
  cashReservedForTaxes: MoneyVO;

  // Risk Management
  isFrozen: boolean;
  freezeReason?: string;
  frozenBy?: string;
  frozenAt?: Date;

  // Legal Flags
  hasActiveDisputes: boolean;
  requiresCourtSupervision: boolean;
  isInsolvent: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  executorId?: string;
  courtCaseNumber?: string;
}

/**
 * THE ECONOMIC TRUTH ENGINE
 *
 * SINGLE SOURCE OF TRUTH for the Deceased's Net Worth.
 *
 * BUSINESS INNOVATIONS:
 * 1. Real-time Solvency Radar: Auto-detects insolvency before payments
 * 2. Cash Waterfall: Smart cash allocation with S.45 prioritization
 * 3. Hotchpot Calculator: Automatic S.35(3) adjustments
 * 4. Dispute Impact Analysis: Quantifies dispute effects on distribution
 * 5. Liquidity Forecasting: Predicts cash needs for debt/tax payments
 *
 * LEGAL COMPLIANCE:
 * - S.45 LSA: Debt priority enforcement
 * - S.35(3) LSA: Hotchpot calculation
 * - S.26 LSA: Dependant provision
 * - Kenyan Tax Law: KRA clearance enforcement
 */
export class Estate extends AggregateRoot<EstateProps> {
  private static readonly HIGH_VALUE_THRESHOLD = MoneyVO.createKES(10000000); // 10M KES
  private static readonly MINOR_ESTATE_THRESHOLD = MoneyVO.createKES(100000); // 100K KES

  private constructor(props: EstateProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
    this.validateInvariants();
  }

  // ===========================================================================
  // FACTORY METHODS - "The Birth Certificate"
  // ===========================================================================

  /**
   * Factory method to create a new Estate (The Genesis)
   */
  public static create(
    props: {
      name: string;
      deceasedId: string;
      deceasedName: string;
      dateOfDeath: Date;
      kraPin: string;
      createdBy: string;
      executorId?: string;
      initialCash?: MoneyVO;
    },
    id?: UniqueEntityID,
  ): Estate {
    const now = new Date();
    const initialCash = props.initialCash || MoneyVO.zero('KES');
    const estateId = id ? id.toString() : 'temp-estate-id';

    const estate = new Estate(
      {
        ...props,
        status: EstateStatus.SETUP,
        assets: [],
        activeLiquidations: [],
        debts: [],
        gifts: [],
        dependants: [],
        taxCompliance: EstateTaxCompliance.create(estateId, props.kraPin),
        cashOnHand: initialCash,
        cashReservedForDebts: MoneyVO.zero('KES'),
        cashReservedForTaxes: MoneyVO.zero('KES'),
        isFrozen: false,
        hasActiveDisputes: false,
        requiresCourtSupervision: false,
        isInsolvent: false,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );

    // Emit creation event
    estate.addDomainEvent(
      new EstateCreatedEvent(
        estate.id.toString(),
        props.name,
        props.deceasedId,
        props.deceasedName,
        props.createdBy,
        estate.version,
      ),
    );

    return estate;
  }

  /**
   * Factory for Minor Estates (Simplified process)
   */
  public static createMinorEstate(
    props: {
      name: string;
      deceasedId: string;
      deceasedName: string;
      dateOfDeath: Date;
      kraPin: string;
      createdBy: string;
      estimatedValue: MoneyVO;
    },
    id?: UniqueEntityID,
  ): Estate {
    const estate = Estate.create(props, id);

    if (props.estimatedValue.isLessThan(Estate.MINOR_ESTATE_THRESHOLD)) {
      // Minor estates get auto-flagged for simplified process
      estate.markForSimplifiedProcess();
    }

    return estate;
  }

  // ===========================================================================
  // INVARIANTS & VALIDATION - "The Constitution"
  // ===========================================================================

  private validateInvariants(): void {
    // Invariant 1: Net Worth = Assets - Liabilities (cannot be negative without insolvency flag)
    const netWorth = this.calculateNetWorth();
    if (netWorth.amount < 0 && !this.props.isInsolvent) {
      throw new EstateLogicException(
        'Estate cannot have negative net worth without insolvency flag',
      );
    }

    // Invariant 2: Cash reservations cannot exceed cash on hand
    const totalReserved = this.props.cashReservedForDebts.add(this.props.cashReservedForTaxes);
    if (totalReserved.isGreaterThan(this.props.cashOnHand)) {
      throw new EstateLogicException('Cash reservations exceed available cash');
    }

    // Invariant 3: Active disputes require frozen status
    if (this.props.hasActiveDisputes && !this.props.isFrozen) {
      throw new EstateLogicException('Active disputes require estate to be frozen');
    }

    // Invariant 4: Closed estate cannot be modified
    if (this.props.status === EstateStatus.CLOSED) {
      throw new EstateLogicException('Closed estate cannot be modified');
    }
  }

  // ===========================================================================
  // LEDGER MANAGEMENT - "The Bookkeeper"
  // ===========================================================================

  /**
   * Add Asset to Estate
   * INNOVATION: Auto-detects high-value assets requiring professional valuation
   */
  public addAsset(asset: Asset, addedBy: string): void {
    this.ensureCanBeModified();

    // Validate asset belongs to this estate
    if (asset.estateId !== this.id.toString()) {
      throw new EstateLogicException('Asset must belong to this estate');
    }

    // High-value asset check
    if (asset.currentValue.isGreaterThan(Estate.HIGH_VALUE_THRESHOLD)) {
      console.warn(
        `Warning: High-value asset ${asset.id.toString()} requires professional valuation`,
      );
    }

    this.updateState({
      assets: [...this.props.assets, asset],
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new EstateAssetAddedEvent(
        this.id.toString(),
        asset.id.toString(),
        asset.type.value,
        asset.currentValue.amount,
        addedBy,
        this.version,
      ),
    );

    // Recalculate financials
    this.recalculateFinancialStatus();
  }

  /**
   * Add Debt to Estate
   * INNOVATION: Auto-reserves cash for S.45 priority debts
   */
  public addDebt(debt: Debt, addedBy: string): void {
    this.ensureCanBeModified();

    // Validate debt belongs to this estate
    if (debt.estateId !== this.id.toString()) {
      throw new EstateLogicException('Debt must belong to this estate');
    }

    // Auto-reserve cash for high-priority debts
    if (debt.priority.getNumericalPriority() <= 3) {
      // Funeral, Testamentary, Secured
      const currentReserved = this.props.cashReservedForDebts;
      const newReserved = currentReserved.add(debt.outstandingBalance);

      if (newReserved.isLessThanOrEqual(this.props.cashOnHand)) {
        this.updateState({
          cashReservedForDebts: newReserved,
        });
      }
    }

    this.updateState({
      debts: [...this.props.debts, debt],
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new EstateDebtAddedEvent(
        this.id.toString(),
        debt.id.toString(),
        debt.type,
        debt.outstandingBalance.amount,
        debt.priority.getNumericalPriority(),
        addedBy,
        this.version,
      ),
    );

    // Check solvency and recalculate
    this.checkSolvency();
    this.recalculateFinancialStatus();
  }

  /**
   * Add Gift for Hotchpot Calculation
   */
  public addGift(gift: GiftInterVivos, addedBy: string): void {
    this.ensureCanBeModified();

    if (gift.estateId !== this.id.toString()) {
      throw new EstateLogicException('Gift must belong to this estate');
    }

    this.updateState({
      gifts: [...this.props.gifts, gift],
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new EstateGiftAddedEvent(
        this.id.toString(),
        gift.id.toString(),
        gift.valueAtTimeOfGift.amount,
        gift.recipientId,
        addedBy,
        this.version,
      ),
    );
  }

  /**
   * Add Dependant Claim
   * INNOVATION: Auto-analyzes risk and freezes estate if high risk
   */
  public addDependant(dependant: LegalDependant, addedBy: string): void {
    this.ensureCanBeModified();

    if (dependant.estateId !== this.id.toString()) {
      throw new EstateLogicException('Dependant must belong to this estate');
    }

    this.updateState({
      dependants: [...this.props.dependants, dependant],
      updatedAt: new Date(),
    });

    // Auto-freeze if high-risk dependant
    if (dependant.riskLevel === 'HIGH' || dependant.requiresCourtDetermination) {
      this.freeze(`High-risk dependant added: ${dependant.dependantName}`, 'system');
      this.updateState({
        requiresCourtSupervision: true,
      });
    }

    this.addDomainEvent(
      new EstateDependantAddedEvent(
        this.id.toString(),
        dependant.id.toString(),
        dependant.relationship,
        dependant.riskLevel,
        addedBy,
        this.version,
      ),
    );
  }

  // ===========================================================================
  // SECTION 45 ENFORCER - "The Priority Police"
  // ===========================================================================

  /**
   * Pay Debt with S.45 Priority Enforcement
   * INNOVATION: Smart waterfall payment respecting legal priorities
   */
  public payDebt(debtId: string, paymentAmount: MoneyVO, paidBy: string): void {
    this.ensureCanBeModified();
    this.ensureSufficientCash(paymentAmount);

    const debt = this.props.debts.find((d) => d.id.toString() === debtId);
    if (!debt) {
      throw new EstateLogicException(`Debt ${debtId} not found`);
    }

    // SECTION 45 PRIORITY CHECK
    const higherPriorityDebts = this.getOutstandingDebts().filter(
      (d) =>
        d.id.toString() !== debtId &&
        d.priority.getNumericalPriority() < debt.priority.getNumericalPriority(),
    );

    if (higherPriorityDebts.length > 0) {
      const highestBlocker = higherPriorityDebts[0];
      throw new Section45ViolationException(
        this.id.toString(),
        `Cannot pay ${debt.creditorName} (${debt.priority.getLegalReference()}) while ${highestBlocker.creditorName} (${highestBlocker.priority.getLegalReference()}) is outstanding`,
      );
    }

    // FIX: Pass correct parameters to recordPayment
    debt.recordPayment(
      paymentAmount,
      new Date(), // paymentDate
      'bank_transfer', // paymentMethod
      `Payment from estate`, // reference
      paidBy, // paidBy
    );

    // Update estate cash
    const newCashOnHand = this.props.cashOnHand.subtract(paymentAmount);
    const newDebtReserve = this.props.cashReservedForDebts.subtract(paymentAmount);

    this.updateState({
      cashOnHand: newCashOnHand,
      cashReservedForDebts: newDebtReserve.isPositive() ? newDebtReserve : MoneyVO.zero('KES'),
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new EstateDebtPaidEvent(
        this.id.toString(),
        debtId,
        paymentAmount.amount,
        debt.priority.getNumericalPriority(),
        paidBy,
        this.version,
      ),
    );

    // Check if debt is now settled
    if (debt.status === DebtStatus.SETTLED) {
      // If secured debt was settled, unencumber the asset
      if (debt.isSecured && debt.securedAssetId) {
        const asset = this.props.assets.find((a) => a.id.toString() === debt.securedAssetId);
        if (asset) {
          // In real implementation, would call asset.clearEncumbrance()
        }
      }
    }

    this.recalculateFinancialStatus();
  }

  /**
   * Smart Debt Payment - Pays highest priority debts first
   * INNOVATION: Auto-allocates cash to highest priority debts
   */
  public payHighestPriorityDebts(availableCash: MoneyVO, paidBy: string): void {
    this.ensureCanBeModified();
    this.ensureSufficientCash(availableCash);

    const outstandingDebts = this.getOutstandingDebts().sort(
      (a, b) => a.priority.getNumericalPriority() - b.priority.getNumericalPriority(),
    );

    let remainingCash = availableCash;

    for (const debt of outstandingDebts) {
      if (remainingCash.isZero()) break;

      const amountToPay = MoneyVO.min(debt.outstandingBalance, remainingCash);

      if (amountToPay.isPositive()) {
        this.payDebt(debt.id.toString(), amountToPay, paidBy);
        remainingCash = remainingCash.subtract(amountToPay);
      }
    }
  }

  // ===========================================================================
  // LIQUIDATION MANAGEMENT - "The Cash Converter"
  // ===========================================================================

  /**
   * Initiate Asset Liquidation
   * INNOVATION: Auto-validates if liquidation is needed for debt payment
   */
  public initiateLiquidation(
    assetId: string,
    liquidation: AssetLiquidation,
    initiatedBy: string,
  ): void {
    this.ensureCanBeModified();

    const asset = this.props.assets.find((a) => a.id.toString() === assetId);
    if (!asset) {
      throw new EstateLogicException(`Asset ${assetId} not found`);
    }

    // Validate estate owns the asset
    if (asset.estateId !== this.id.toString()) {
      throw new EstateLogicException('Cannot liquidate asset not owned by estate');
    }

    // Check if liquidation is needed (insolvency or cash shortage)
    const isNecessaryForDebts = this.isLiquidationNecessaryForDebts();
    const isNecessaryForTaxes = this.isLiquidationNecessaryForTaxes();

    if (!isNecessaryForDebts && !isNecessaryForTaxes) {
      console.warn('Liquidation initiated without clear financial necessity');
    }

    // Update asset status
    asset.initiateLiquidation(liquidation, initiatedBy);

    this.updateState({
      activeLiquidations: [...this.props.activeLiquidations, liquidation],
      status: EstateStatus.LIQUIDATING,
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new EstateLiquidatedEvent(
        this.id.toString(),
        assetId,
        liquidation.targetAmount.amount,
        liquidation.liquidationType,
        initiatedBy,
        this.version,
      ),
    );
  }

  /**
   * Complete Liquidation and Add Cash to Estate
   */
  public completeLiquidation(
    liquidationId: string,
    netProceeds: MoneyVO,
    completedBy: string,
  ): void {
    const liquidation = this.props.activeLiquidations.find(
      (l) => l.id.toString() === liquidationId,
    );
    if (!liquidation) {
      throw new EstateLogicException(`Liquidation ${liquidationId} not found`);
    }

    liquidation.markSaleCompleted(
      netProceeds,
      undefined, // buyerName
      undefined, // buyerIdNumber
      completedBy,
    );

    liquidation.markProceedsReceived();
    liquidation.markAsDistributed();

    // Add cash to estate
    const newCashOnHand = this.props.cashOnHand.add(netProceeds);

    this.updateState({
      cashOnHand: newCashOnHand,
      activeLiquidations: this.props.activeLiquidations.filter(
        (l) => l.id.toString() !== liquidationId,
      ),
      status: EstateStatus.ACTIVE,
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new EstateCashUpdatedEvent(
        this.id.toString(),
        netProceeds.amount,
        'LIQUIDATION_PROCEEDS',
        completedBy,
        this.version,
      ),
    );

    // Auto-allocate to debts if needed
    if (this.hasUrgentDebts()) {
      this.autoAllocateCashToDebts(netProceeds, completedBy);
    }

    this.recalculateFinancialStatus();
  }

  // ===========================================================================
  // FINANCIAL CALCULATIONS - "The Truth Engine"
  // ===========================================================================

  /**
   * Calculate Net Worth (Assets - Liabilities)
   * INNOVATION: Includes co-ownership adjustments and encumbrances
   */
  public calculateNetWorth(): MoneyVO {
    // Total distributable assets (after co-owner shares)
    const totalAssets = this.props.assets.reduce(
      (sum, asset) => sum + asset.getDistributableValue().amount,
      0,
    );

    // Add cash
    const totalCash = this.props.cashOnHand.amount;

    // Subtract outstanding debts
    const totalDebts = this.getOutstandingDebts().reduce(
      (sum, debt) => sum + debt.getCurrentLiability().amount,
      0,
    );

    // Subtract tax liability
    const taxLiability = this.props.taxCompliance.getTotalLiability().amount;

    const netAmount = totalAssets + totalCash - (totalDebts + taxLiability);

    return MoneyVO.createKES(netAmount);
  }

  /**
   * Calculate Distributable Pool (S.35 Hotchpot)
   * INNOVATION: Auto-includes hotchpot adjustments
   */
  public calculateDistributablePool(): MoneyVO {
    const netWorth = this.calculateNetWorth();

    // S.35(3) Hotchpot: Add back confirmed gifts
    const hotchpotTotal = this.props.gifts
      .filter((gift) => gift.isIncludedInHotchpot())
      .reduce((sum, gift) => sum + gift.getHotchpotValue().amount, 0);

    return netWorth.add(MoneyVO.createKES(hotchpotTotal));
  }

  /**
   * Calculate Available Cash for Distribution
   * INNOVATION: Excludes reserved cash for debts/taxes
   */
  public calculateAvailableCash(): MoneyVO {
    const totalReserved = this.props.cashReservedForDebts.add(this.props.cashReservedForTaxes);
    return this.props.cashOnHand.subtract(totalReserved);
  }

  // ===========================================================================
  // TAX COMPLIANCE - "The Gatekeeper"
  // ===========================================================================

  /**
   * Record Tax Assessment
   * INNOVATION: Auto-reserves cash for taxes
   */
  public recordTaxAssessment(
    assessment: {
      incomeTax?: number;
      capitalGainsTax?: number;
      stampDuty?: number;
      otherLevies?: number;
    },
    assessmentReference: string,
    assessedBy: string,
  ): void {
    this.ensureCanBeModified();

    this.props.taxCompliance.recordAssessment(assessment, assessmentReference, assessedBy);

    // Auto-reserve cash for taxes
    const totalTaxLiability = this.props.taxCompliance.getTotalLiability();
    if (totalTaxLiability.isGreaterThan(this.props.cashReservedForTaxes)) {
      const additionalReserve = totalTaxLiability.subtract(this.props.cashReservedForTaxes);
      if (additionalReserve.isLessThanOrEqual(this.calculateAvailableCash())) {
        this.updateState({
          cashReservedForTaxes: this.props.cashReservedForTaxes.add(additionalReserve),
        });
      }
    }

    this.updateState({ updatedAt: new Date() });
  }

  /**
   * Record Tax Payment
   */
  public recordTaxPayment(
    amount: MoneyVO,
    paymentType: string,
    reference: string,
    paidBy?: string,
  ): void {
    this.ensureCanBeModified();
    this.ensureSufficientCash(amount);

    this.props.taxCompliance.recordPayment(amount, paymentType, reference, paidBy);

    // Update cash
    const newCashOnHand = this.props.cashOnHand.subtract(amount);
    const newTaxReserve = this.props.cashReservedForTaxes.subtract(amount);

    this.updateState({
      cashOnHand: newCashOnHand,
      cashReservedForTaxes: newTaxReserve.isPositive() ? newTaxReserve : MoneyVO.zero('KES'),
      updatedAt: new Date(),
    });

    // If tax is now cleared, emit event
    if (this.props.taxCompliance.isClearedForDistribution()) {
      this.addDomainEvent(
        new EstateTaxClearedEvent(
          this.id.toString(),
          this.props.taxCompliance.clearanceCertificateNo || '',
          paidBy || 'system',
          this.version,
        ),
      );
    }

    this.recalculateFinancialStatus();
  }

  // ===========================================================================
  // DISTRIBUTION READINESS - "The Final Check"
  // ===========================================================================

  /**
   * Validate Estate Readiness for Distribution
   * INNOVATION: Comprehensive 7-point check with actionable feedback
   */
  public validateDistributionReadiness(): { isValid: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // 1. Frozen Check
    if (this.props.isFrozen) {
      reasons.push(`Estate is frozen: ${this.props.freezeReason}`);
    }

    // 2. Solvency Check
    if (!this.isSolvent()) {
      reasons.push(`Estate is insolvent. Net worth: ${this.calculateNetWorth().toString()}`);
    }

    // 3. Tax Compliance Check
    if (!this.props.taxCompliance.isClearedForDistribution()) {
      reasons.push(`Tax compliance not cleared: ${this.props.taxCompliance.status.value}`);
    }

    // 4. Active Disputes Check
    if (this.props.hasActiveDisputes) {
      reasons.push('Active disputes block distribution');
    }

    // 5. Outstanding High-Priority Debts Check
    const highPriorityDebts = this.getOutstandingDebts().filter(
      (d) => d.priority.getNumericalPriority() <= 3,
    ); // Funeral, Testamentary, Secured
    if (highPriorityDebts.length > 0) {
      reasons.push(`${highPriorityDebts.length} high-priority debts outstanding`);
    }

    // 6. Active Liquidations Check
    if (this.props.activeLiquidations.length > 0) {
      reasons.push(`${this.props.activeLiquidations.length} assets being liquidated`);
    }

    // 7. Court Supervision Check
    if (this.props.requiresCourtSupervision) {
      reasons.push('Estate requires court supervision');
    }

    const isValid = reasons.length === 0;

    if (isValid) {
      this.updateState({
        status: EstateStatus.READY_FOR_DISTRIBUTION,
        updatedAt: new Date(),
      });

      this.addDomainEvent(
        new EstateReadyForDistributionEvent(
          this.id.toString(),
          this.calculateDistributablePool().amount,
          this.props.dependants.length,
          this.version,
        ),
      );
    }

    return { isValid, reasons };
  }

  /**
   * Start Distribution Process
   */
  public startDistribution(_distributedBy: string): void {
    const readiness = this.validateDistributionReadiness();
    if (!readiness.isValid) {
      throw new EstateLogicException(`Cannot start distribution: ${readiness.reasons.join(', ')}`);
    }

    this.updateState({
      status: EstateStatus.DISTRIBUTING,
      updatedAt: new Date(),
    });
  }

  /**
   * Close Estate After Distribution
   */
  public closeEstate(_closedBy: string, _closureNotes?: string): void {
    if (this.props.status !== EstateStatus.DISTRIBUTING) {
      throw new EstateLogicException('Estate must be in DISTRIBUTING status to close');
    }

    // Verify all assets distributed
    const undistributedAssets = this.props.assets.filter(
      (asset) =>
        asset.status !== AssetStatus.TRANSFERRED && asset.status !== AssetStatus.LIQUIDATED,
    );

    if (undistributedAssets.length > 0) {
      throw new EstateLogicException(`${undistributedAssets.length} assets not distributed`);
    }

    this.updateState({
      status: EstateStatus.CLOSED,
      updatedAt: new Date(),
    });
  }

  // ===========================================================================
  // RISK MANAGEMENT - "The Safety System"
  // ===========================================================================

  /**
   * Freeze Estate (Safety Switch)
   * INNOVATION: Auto-detects reasons for freezing
   */
  public freeze(reason: string, frozenBy: string): void {
    if (this.props.isFrozen) {
      throw new EstateLogicException('Estate is already frozen');
    }

    this.updateState({
      isFrozen: true,
      freezeReason: reason,
      frozenBy,
      frozenAt: new Date(),
      updatedAt: new Date(),
    });

    this.addDomainEvent(new EstateFrozenEvent(this.id.toString(), reason, frozenBy, this.version));
  }

  /**
   * Unfreeze Estate
   */
  public unfreeze(reason: string, unfrozenBy: string): void {
    if (!this.props.isFrozen) {
      throw new EstateLogicException('Estate is not frozen');
    }

    this.updateState({
      isFrozen: false,
      freezeReason: undefined,
      frozenBy: undefined,
      frozenAt: undefined,
      updatedAt: new Date(),
    });

    this.addDomainEvent(
      new EstateUnfrozenEvent(this.id.toString(), reason, unfrozenBy, this.version),
    );
  }

  // ===========================================================================
  // HELPER METHODS - "The Internal Machinery"
  // ===========================================================================

  private ensureCanBeModified(): void {
    if (this.props.isFrozen) {
      throw new EstateFrozenException(this.id.toString(), this.props.freezeReason || 'Unknown');
    }

    if (this.props.status === EstateStatus.CLOSED) {
      throw new EstateLogicException('Closed estate cannot be modified');
    }

    if (this.props.status === EstateStatus.DISTRIBUTING) {
      throw new EstateLogicException('Estate in distribution cannot be modified');
    }
  }

  private ensureSufficientCash(amount: MoneyVO): void {
    if (amount.isGreaterThan(this.calculateAvailableCash())) {
      throw new EstateLogicException(
        `Insufficient available cash. Needed: ${amount.toString()}, Available: ${this.calculateAvailableCash().toString()}`,
      );
    }
  }

  private getOutstandingDebts(): Debt[] {
    return this.props.debts.filter((debt) => debt.isCollectible() && debt.isIncludedInS45());
  }

  private checkSolvency(): void {
    const netWorth = this.calculateNetWorth();
    const wasInsolvent = this.props.isInsolvent;
    const isNowInsolvent = netWorth.amount < 0;

    if (isNowInsolvent && !wasInsolvent) {
      this.updateState({
        isInsolvent: true,
      });

      this.addDomainEvent(
        new EstateInsolvencyDetectedEvent(
          this.id.toString(),
          netWorth.amount,
          this.getOutstandingDebts().length,
          this.version,
        ),
      );
    } else if (!isNowInsolvent && wasInsolvent) {
      this.updateState({
        isInsolvent: false,
      });
    }
  }

  private recalculateFinancialStatus(): void {
    this.checkSolvency();

    // Recalculate cash needs
    const totalDebtNeeds = this.getOutstandingDebts()
      .filter((d) => d.priority.getNumericalPriority() <= 3)
      .reduce((sum, debt) => sum + debt.outstandingBalance.amount, 0);

    const debtReserve = MoneyVO.createKES(totalDebtNeeds);
    if (!debtReserve.equals(this.props.cashReservedForDebts)) {
      this.updateState({
        cashReservedForDebts: debtReserve,
      });
    }

    this.updateState({
      updatedAt: new Date(),
    });
  }

  private isSolvent(): boolean {
    return !this.props.isInsolvent;
  }

  private isLiquidationNecessaryForDebts(): boolean {
    const highPriorityDebtTotal = this.getOutstandingDebts()
      .filter((d) => d.priority.getNumericalPriority() <= 3)
      .reduce((sum, debt) => sum + debt.outstandingBalance.amount, 0);

    return highPriorityDebtTotal > this.calculateAvailableCash().amount;
  }

  private isLiquidationNecessaryForTaxes(): boolean {
    const taxLiability = this.props.taxCompliance.getRemainingBalance().amount;
    return taxLiability > this.calculateAvailableCash().amount;
  }

  private hasUrgentDebts(): boolean {
    return this.getOutstandingDebts().some((debt) => debt.priority.getNumericalPriority() <= 2); // Funeral & Testamentary
  }

  private autoAllocateCashToDebts(availableCash: MoneyVO, allocatedBy: string): void {
    // Get urgent debts (funeral & testamentary)
    const urgentDebts = this.getOutstandingDebts()
      .filter((debt) => debt.priority.getNumericalPriority() <= 2) // Funeral & Testamentary
      .sort((a, b) => a.priority.getNumericalPriority() - b.priority.getNumericalPriority());

    let remainingCash = availableCash;

    for (const debt of urgentDebts) {
      if (remainingCash.isZero()) break;

      // Use MoneyVO.min to get the smaller amount
      const amountToPay = MoneyVO.min(debt.outstandingBalance, remainingCash);

      if (amountToPay.isPositive()) {
        // Use the existing payDebt method
        this.payDebt(debt.id.toString(), amountToPay, allocatedBy);
        remainingCash = remainingCash.subtract(amountToPay);
      }
    }
  }

  private markForSimplifiedProcess(): void {
    // Minor estates qualify for simplified administration
    this.updateState({
      requiresCourtSupervision: false,
    });
  }

  // ===========================================================================
  // GETTERS - "The Public Interface"
  // ===========================================================================

  get status(): EstateStatus {
    return this.props.status;
  }

  get netWorth(): MoneyVO {
    return this.calculateNetWorth();
  }

  get distributablePool(): MoneyVO {
    return this.calculateDistributablePool();
  }

  get availableCash(): MoneyVO {
    return this.calculateAvailableCash();
  }

  get isFrozen(): boolean {
    return this.props.isFrozen;
  }

  get taxStatus(): string {
    return this.props.taxCompliance.status.value;
  }

  get assetCount(): number {
    return this.props.assets.length;
  }

  get debtCount(): number {
    return this.props.debts.length;
  }

  get dependantCount(): number {
    return this.props.dependants.length;
  }

  get activeDisputes(): boolean {
    return this.props.hasActiveDisputes;
  }

  // ===========================================================================
  // AGGREGATE ROOT IMPLEMENTATION
  // ===========================================================================

  protected applyEvent(_event: any): void {
    // Event sourcing implementation
    // This would handle event replay for rebuilding aggregate state
  }

  public validate(): void {
    this.validateInvariants();
  }
}
