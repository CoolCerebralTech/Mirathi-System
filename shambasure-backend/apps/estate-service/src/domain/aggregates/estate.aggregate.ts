import { AggregateRoot } from '../base/aggregate-root';
import { UniqueEntityID } from '../base/unique-entity-id';
import { Asset } from '../entities/asset.entity';
import { Debt } from '../entities/debt.entity';
import { EstateTaxCompliance } from '../entities/estate-tax-compliance.entity';
import { GiftInterVivos, GiftStatus } from '../entities/gift-inter-vivos.entity';
import { LegalDependant } from '../entities/legal-dependant.entity';
import { AssetStatus } from '../enums/asset-status.enum';
import { DebtStatus } from '../enums/debt-status.enum';
import {
  EstateCreatedEvent,
  EstateFrozenEvent,
  EstateInsolvencyDetectedEvent,
  EstateReadyForDistributionEvent,
  EstateUnfrozenEvent,
} from '../events/estate.events';
import {
  EstateFrozenException,
  EstateInsolventException,
  EstateLogicException,
  Section45ViolationException,
  TaxComplianceBlockException,
} from '../exceptions/estate.exception';
import { MoneyVO } from '../value-objects/money.vo';

export enum EstateStatus {
  SETUP = 'SETUP', // Initial data entry
  EVALUATION = 'EVALUATION', // Valuing assets, inviting claims
  ADMINISTRATION = 'ADMINISTRATION', // Paying debts, taxes
  READY_FOR_DISTRIBUTION = 'READY_FOR_DISTRIBUTION', // Validated
  DISTRIBUTING = 'DISTRIBUTING', // Assets moving
  CLOSED = 'CLOSED', // Done
}

export interface EstateProps {
  name: string; // "Estate of the Late John Doe"
  deceasedId: string;
  dateOfDeath: Date;
  status: EstateStatus;

  // The Ledger
  assets: Asset[];
  debts: Debt[];
  gifts: GiftInterVivos[];
  dependants: LegalDependant[];

  // The Gatekeeper
  taxCompliance: EstateTaxCompliance;

  // Liquidity
  cashOnHand: MoneyVO;

  // Safety
  isFrozen: boolean;
  freezeReason?: string;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The Estate Aggregate Root ("The Financial Truth Engine")
 *
 * RESPONSIBILITIES:
 * 1. Solvency: Net Worth = Assets - Debts.
 * 2. Compliance: Blocks distribution if Tax != Cleared.
 * 3. Priority: Enforces S.45 (Funeral > Unsecured).
 * 4. Hotchpot: Adds Gift Values back for calculation.
 */
export class Estate extends AggregateRoot<EstateProps> {
  private constructor(props: EstateProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
  }

  public static create(
    props: { name: string; deceasedId: string; dateOfDeath: Date; taxPin: string },
    id?: UniqueEntityID,
  ): Estate {
    const estate = new Estate(
      {
        name: props.name,
        deceasedId: props.deceasedId,
        dateOfDeath: props.dateOfDeath,
        status: EstateStatus.SETUP,
        assets: [],
        debts: [],
        gifts: [],
        dependants: [],
        // Initialize Tax Compliance (The Gatekeeper)
        taxCompliance: EstateTaxCompliance.create({
          estateId: id ? id.toString() : 'temp', // ID fixup handled by repo usually
          kraPin: props.taxPin,
        }),
        cashOnHand: MoneyVO.zero('KES'), // Default currency
        isFrozen: false,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );

    estate.addDomainEvent(
      new EstateCreatedEvent(estate.id.toString(), props.name, props.deceasedId, estate.version),
    );

    return estate;
  }

  // ===========================================================================
  // 1. THE LEDGER (Inventory Management)
  // ===========================================================================

  public addAsset(asset: Asset): void {
    this.ensureNotFrozen();

    // Check duplication logic or rules here
    this.props.assets.push(asset);
    this.updateState({ updatedAt: new Date() });

    // Re-calculate solvency whenever ledger changes
    this.checkSolvency();
  }

  public addDebt(debt: Debt): void {
    this.ensureNotFrozen();

    this.props.debts.push(debt);
    this.updateState({ updatedAt: new Date() });

    this.checkSolvency();
  }

  // ===========================================================================
  // 2. SECTION 45 ENFORCER (Debt Payment Logic)
  // ===========================================================================

  /**
   * Attempts to pay a debt.
   * INNOVATION: Strictly enforces Law of Succession Act S.45 Priorities.
   * You cannot pay a Tier 5 debt if a Tier 1 debt is outstanding.
   */
  public payDebt(debtId: string, amount: MoneyVO): void {
    this.ensureNotFrozen();

    const debt = this.props.debts.find((d) => d.id.toString() === debtId);
    if (!debt) throw new EstateLogicException(`Debt ${debtId} not found`);

    // 1. Check Cash Liquidity
    if (this.props.cashOnHand.amount < amount.amount) {
      throw new EstateLogicException(
        `Insufficient Cash on Hand. Needed: ${amount.toString()}, Available: ${this.props.cashOnHand.toString()}`,
      );
    }

    // 2. INNOVATION: S.45 Priority Check
    // Are there any active debts with HIGHER priority (lower Tier number) than this one?
    const higherPriorityDebts = this.props.debts.filter(
      (d) =>
        d.status === DebtStatus.OUTSTANDING &&
        d.id.toString() !== debtId &&
        d.priority.getValue().tier < debt.priority.getValue().tier,
    );

    if (higherPriorityDebts.length > 0) {
      // Get the name of the most critical one
      const blocker = higherPriorityDebts.sort(
        (a, b) => a.priority.getValue().tier - b.priority.getValue().tier,
      )[0];
      throw new Section45ViolationException(
        this.id.toString(),
        `Cannot pay ${debt.priority.getValue().name} debt while ${blocker.priority.getValue().name} (${blocker.props.description}) is still outstanding.`,
      );
    }

    // 3. Process Payment
    debt.recordPayment(amount, 'Estate Cash'); // Delegate to Child Entity

    // 4. Update Aggregate State (Reduce Cash)
    this.updateState({
      cashOnHand: this.props.cashOnHand.subtract(amount),
      updatedAt: new Date(),
    });

    this.checkSolvency();
  }

  // ===========================================================================
  // 3. THE CALCULATOR (Net Worth & Hotchpot)
  // ===========================================================================

  /**
   * Calculates the raw Net Value.
   * Formula: (Distributable Assets + Cash) - (Liabilities)
   */
  public getNetValue(): MoneyVO {
    // Sum of Distributable Assets (excluding Joint Tenancy survivor shares)
    const totalAssets = this.props.assets
      .filter((a) => a.status !== AssetStatus.LIQUIDATED) // Liquidated ones are in Cash
      .reduce((sum, asset) => sum + asset.getDistributableValue().amount, 0);

    const totalCash = this.props.cashOnHand.amount;

    // Sum of Outstanding Debts
    const totalDebts = this.props.debts.reduce(
      (sum, debt) => sum + debt.outstandingBalance.amount,
      0,
    );

    // Sum of Tax Liability
    const totalTax =
      this.props.taxCompliance.totalLiability.amount -
      this.props.taxCompliance.props.totalPaid.amount;

    const netAmount = totalAssets + totalCash - (totalDebts + totalTax);

    // If negative, return zero (or negative if we want to show insolvency magnitude)
    return MoneyVO.createKES(netAmount);
  }

  /**
   * Calculates the S.35 Distribution Pool.
   * Formula: Net Value + GiftInterVivos (Hotchpot)
   */
  public getDistributablePool(): MoneyVO {
    const netValue = this.getNetValue();

    // S.35(3) Hotchpot: Add back confirmed gifts
    const hotchpotValue = this.props.gifts
      .filter((g) => g.status === GiftStatus.CONFIRMED)
      .reduce((sum, gift) => sum + gift.value.amount, 0);

    return netValue.add(MoneyVO.createKES(hotchpotValue));
  }

  // ===========================================================================
  // 4. THE SOLVENCY RADAR
  // ===========================================================================

  private checkSolvency(): void {
    const netValue = this.getNetValue();
    const isNowInsolvent = netValue.amount < 0;

    // Check previous state logic (simplified here)
    // If we just became insolvent, emit event
    if (isNowInsolvent) {
      // Check if we already emitted this? (In a real app, we'd check previous events or state flags)
      // For now, we emit to alert the system.
      this.addDomainEvent(
        new EstateInsolvencyDetectedEvent(this.id.toString(), netValue.amount, this.version),
      );
    }
  }

  public isSolvent(): boolean {
    return this.getNetValue().amount >= 0;
  }

  // ===========================================================================
  // 5. THE GATEKEEPER (Readiness Check)
  // ===========================================================================

  /**
   * The "Final Check" before generating the Distribution Plan.
   */
  public validateReadyForDistribution(): void {
    // 1. Frozen Check
    if (this.props.isFrozen) {
      throw new EstateFrozenException(this.id.toString(), this.props.freezeReason || 'Unknown');
    }

    // 2. Solvency Check
    if (!this.isSolvent()) {
      throw new EstateInsolventException(this.id.toString(), this.getNetValue().amount);
    }

    // 3. Tax Compliance Check (The Bouncer)
    if (!this.props.taxCompliance.isClearedForDistribution()) {
      throw new TaxComplianceBlockException(
        this.id.toString(),
        this.props.taxCompliance.status.toString(),
      );
    }

    // 4. Dispute Check
    const hasActiveDisputes =
      this.props.debts.some((d) => d.status === DebtStatus.DISPUTED) ||
      this.props.assets.some((a) => a.status === AssetStatus.DISPUTED);

    if (hasActiveDisputes) {
      throw new EstateLogicException('Cannot distribute while Assets or Debts are DISPUTED.');
    }

    // If we pass all this, emit event
    this.addDomainEvent(
      new EstateReadyForDistributionEvent(
        this.id.toString(),
        this.getDistributablePool().amount,
        this.version,
      ),
    );
  }

  // ===========================================================================
  // 6. SAFETY SWITCHES
  // ===========================================================================

  public freeze(reason: string, byUser: string): void {
    this.updateState({
      isFrozen: true,
      freezeReason: reason,
      updatedAt: new Date(),
    });

    this.addDomainEvent(new EstateFrozenEvent(this.id.toString(), reason, byUser, this.version));
  }

  public unfreeze(reason: string, byUser: string): void {
    this.updateState({
      isFrozen: false,
      freezeReason: undefined,
      updatedAt: new Date(),
    });

    this.addDomainEvent(new EstateUnfrozenEvent(this.id.toString(), reason, byUser, this.version));
  }

  private ensureNotFrozen(): void {
    if (this.props.isFrozen) {
      throw new EstateFrozenException(this.id.toString(), this.props.freezeReason || 'Frozen');
    }
  }

  // Boilerplate for abstract method implementation
  protected applyEvent(event: any): void {
    // Event sourcing replay logic goes here
  }
  public validate(): void {
    // Invariant checks
  }
}
