// domain/aggregates/estate.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import { Asset } from '../entities/asset.entity';
import { Debt } from '../entities/debt.entity';
import { GiftInterVivos } from '../entities/gift-inter-vivos.entity';
import { LegalDependant } from '../entities/legal-dependant.entity';
import { Money } from '../value-objects';

/**
 * Estate Aggregate Root
 *
 * The "Net Worth" and "Inventory" of the deceased
 *
 * AGGREGATE BOUNDARY:
 * - Estate (root)
 * - Assets (entities)
 * - Debts (entities)
 * - Legal Dependants (entities)
 * - Gifts Inter Vivos (entities)
 *
 * INVARIANTS (Must Always Be True):
 * 1. Net Estate Value = Gross Value - Total Liabilities
 * 2. Assets >= Secured Debts (solvency check)
 * 3. Only verified assets count toward distribution
 * 4. S.45(a)-(c) debts must be paid before distribution
 * 5. Frozen estates cannot be modified
 * 6. Distributable value considers co-ownership
 *
 * LEGAL COMPLIANCE:
 * - S.45 LSA: Debt priority order
 * - S.83 LSA: Executor accountability
 * - S.35(3) LSA: Hotchpot for gifts inter vivos
 * - S.26/29 LSA: Dependant provisions
 *
 * Design Patterns:
 * - Aggregate Root (DDD)
 * - Event Sourcing (all changes emit events)
 * - Domain Events (for cross-aggregate communication)
 */

export interface EstateProps {
  // Identity
  deceasedId: UniqueEntityID;
  deceasedFullName: string;
  deceasedDateOfDeath?: Date;

  // Estate Status
  isTestate: boolean; // Has valid will
  isIntestate: boolean; // No will
  isFrozen: boolean;
  frozenAt?: Date;
  frozenReason?: string;

  // Financial Summary (Cached for performance, validated on demand)
  grossValueKES: Money;
  totalLiabilitiesKES: Money;
  netEstateValueKES: Money;

  // Hotchpot (S.35(3) LSA)
  hotchpotAdjustedValueKES?: Money;

  // Metadata
  metadata?: Record<string, any>;
}

export class Estate extends AggregateRoot<EstateProps> {
  // =========================================================================
  // COLLECTIONS (Entities owned by this aggregate)
  // =========================================================================
  private _assets: Map<string, Asset> = new Map();
  private _debts: Map<string, Debt> = new Map();
  private _legalDependants: Map<string, LegalDependant> = new Map();
  private _giftsInterVivos: Map<string, GiftInterVivos> = new Map();

  // =========================================================================
  // CACHED CALCULATIONS (Dirty flag pattern)
  // =========================================================================
  private _isDirty: boolean = true;

  private constructor(id: UniqueEntityID, props: EstateProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  /**
   * Factory: Create new estate (when death is confirmed)
   */
  public static create(
    deceasedId: UniqueEntityID,
    deceasedFullName: string,
    deceasedDateOfDeath: Date,
    id?: UniqueEntityID,
  ): Estate {
    const estateId = id ?? new UniqueEntityID();

    const estate = new Estate(estateId, {
      deceasedId,
      deceasedFullName,
      deceasedDateOfDeath,
      isTestate: false,
      isIntestate: false, // Unknown until determined
      isFrozen: false,
      grossValueKES: Money.zero(),
      totalLiabilitiesKES: Money.zero(),
      netEstateValueKES: Money.zero(),
    });

    // Emit domain event
    estate.addDomainEvent(
      new EstateCreatedEvent(estateId.toString(), estate.getAggregateType(), estate.getVersion(), {
        deceasedId: deceasedId.toString(),
        deceasedFullName,
        dateOfDeath: deceasedDateOfDeath,
      }),
    );

    return estate;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(id: UniqueEntityID, props: EstateProps, createdAt: Date): Estate {
    return new Estate(id, props, createdAt);
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get deceasedId(): UniqueEntityID {
    return this.props.deceasedId;
  }

  get deceasedFullName(): string {
    return this.props.deceasedFullName;
  }

  get deceasedDateOfDeath(): Date | undefined {
    return this.props.deceasedDateOfDeath;
  }

  get isTestate(): boolean {
    return this.props.isTestate;
  }

  get isIntestate(): boolean {
    return this.props.isIntestate;
  }

  get isFrozen(): boolean {
    return this.props.isFrozen;
  }

  get grossValueKES(): Money {
    return this.props.grossValueKES;
  }

  get totalLiabilitiesKES(): Money {
    return this.props.totalLiabilitiesKES;
  }

  get netEstateValueKES(): Money {
    return this.props.netEstateValueKES;
  }

  get hotchpotAdjustedValueKES(): Money | undefined {
    return this.props.hotchpotAdjustedValueKES;
  }

  // Collection getters (read-only)
  get assets(): ReadonlyMap<string, Asset> {
    return this._assets;
  }

  get debts(): ReadonlyMap<string, Debt> {
    return this._debts;
  }

  get legalDependants(): ReadonlyMap<string, LegalDependant> {
    return this._legalDependants;
  }

  get giftsInterVivos(): ReadonlyMap<string, GiftInterVivos> {
    return this._giftsInterVivos;
  }

  // =========================================================================
  // ASSET MANAGEMENT
  // =========================================================================

  /**
   * Add asset to estate inventory
   */
  public addAsset(asset: Asset): void {
    this.ensureNotFrozen();
    this.ensureNotDeleted();

    if (this._assets.has(asset.id.toString())) {
      throw new Error(`Asset already exists in estate: ${asset.id.toString()}`);
    }

    if (!asset.estateId.equals(this.id)) {
      throw new Error('Asset does not belong to this estate');
    }

    this._assets.set(asset.id.toString(), asset);
    this._isDirty = true;

    this.addDomainEvent(
      new AssetAddedToEstateEvent(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        assetId: asset.id.toString(),
        assetName: asset.name,
        assetType: asset.type.value,
        value: asset.currentValue.getAmount(),
      }),
    );

    this.recalculateFinancials();
  }

  /**
   * Remove asset from estate
   */
  public removeAsset(assetId: UniqueEntityID, reason: string): void {
    this.ensureNotFrozen();
    this.ensureNotDeleted();

    const asset = this._assets.get(assetId.toString());
    if (!asset) {
      throw new Error(`Asset not found: ${assetId.toString()}`);
    }

    this._assets.delete(assetId.toString());
    this._isDirty = true;

    this.addDomainEvent(
      new AssetRemovedFromEstateEvent(
        this.id.toString(),
        this.getAggregateType(),
        this.getVersion(),
        {
          assetId: assetId.toString(),
          assetName: asset.name,
          reason,
        },
      ),
    );

    this.recalculateFinancials();
  }

  /**
   * Get asset by ID
   */
  public getAsset(assetId: UniqueEntityID): Asset | undefined {
    return this._assets.get(assetId.toString());
  }

  /**
   * Get all verified assets (ready for distribution)
   */
  public getVerifiedAssets(): Asset[] {
    return Array.from(this._assets.values()).filter((asset) => asset.isReadyForDistribution());
  }

  /**
   * Get total distributable asset value
   */
  public getTotalDistributableAssetValue(): Money {
    const verified = this.getVerifiedAssets();
    const values = verified.map((asset) => asset.getDistributableValue());
    return Money.sum(values);
  }

  // =========================================================================
  // DEBT MANAGEMENT (S.45 LSA Priority)
  // =========================================================================

  /**
   * Add debt to estate
   */
  public addDebt(debt: Debt): void {
    this.ensureNotFrozen();
    this.ensureNotDeleted();

    if (this._debts.has(debt.id.toString())) {
      throw new Error(`Debt already exists in estate: ${debt.id.toString()}`);
    }

    if (!debt.estateId.equals(this.id)) {
      throw new Error('Debt does not belong to this estate');
    }

    this._debts.set(debt.id.toString(), debt);
    this._isDirty = true;

    this.addDomainEvent(
      new DebtAddedToEstateEvent(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        debtId: debt.id.toString(),
        debtType: debt.type,
        creditorName: debt.creditorName,
        amount: debt.outstandingBalance.getAmount(),
        priority: debt.priority.getTier(),
      }),
    );

    this.recalculateFinancials();
  }

  /**
   * Remove debt from estate
   */
  public removeDebt(debtId: UniqueEntityID, reason: string): void {
    this.ensureNotFrozen();
    this.ensureNotDeleted();

    const debt = this._debts.get(debtId.toString());
    if (!debt) {
      throw new Error(`Debt not found: ${debtId.toString()}`);
    }

    this._debts.delete(debtId.toString());
    this._isDirty = true;

    this.addDomainEvent(
      new DebtRemovedFromEstateEvent(
        this.id.toString(),
        this.getAggregateType(),
        this.getVersion(),
        {
          debtId: debtId.toString(),
          reason,
        },
      ),
    );

    this.recalculateFinancials();
  }

  /**
   * Get debt by ID
   */
  public getDebt(debtId: UniqueEntityID): Debt | undefined {
    return this._debts.get(debtId.toString());
  }

  /**
   * Get debts sorted by S.45 priority
   */
  public getDebtsByPriority(): Debt[] {
    const debts = Array.from(this._debts.values());
    return debts.sort((a, b) => a.priority.compare(b.priority));
  }

  /**
   * Get critical debts (must be paid before distribution)
   */
  public getCriticalDebts(): Debt[] {
    return Array.from(this._debts.values()).filter((debt) => debt.blocksDistribution());
  }

  /**
   * Check if all critical debts are settled
   */
  public areCriticalDebtsSettled(): boolean {
    const critical = this.getCriticalDebts();
    return critical.length === 0;
  }

  /**
   * Get total outstanding debt amount
   */
  public getTotalOutstandingDebt(): Money {
    const debts = Array.from(this._debts.values()).filter(
      (debt) => debt.status !== DebtStatus.SETTLED && debt.status !== DebtStatus.WRITTEN_OFF,
    );

    const amounts = debts.map((debt) => debt.outstandingBalance);
    return Money.sum(amounts);
  }

  // =========================================================================
  // LEGAL DEPENDANT MANAGEMENT (S.26/S.29 LSA)
  // =========================================================================

  /**
   * Add legal dependant claim
   */
  public addLegalDependant(dependant: LegalDependant): void {
    this.ensureNotFrozen();
    this.ensureNotDeleted();

    if (this._legalDependants.has(dependant.id.toString())) {
      throw new Error(`Dependant already exists: ${dependant.id.toString()}`);
    }

    if (!dependant.estateId.equals(this.id)) {
      throw new Error('Dependant does not belong to this estate');
    }

    this._legalDependants.set(dependant.id.toString(), dependant);
    this._isDirty = true;

    this.addDomainEvent(
      new DependantClaimFiledEvent(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        dependantId: dependant.id.toString(),
        claimantId: dependant.dependantId.toString(),
        relationshipToDeceased: dependant.relationshipToDeceased,
        dependencyLevel: dependant.dependencyLevel,
        monthlyNeeds: dependant.monthlyNeeds?.getAmount(),
      }),
    );
  }

  /**
   * Remove dependant claim
   */
  public removeLegalDependant(dependantId: UniqueEntityID, reason: string): void {
    this.ensureNotFrozen();
    this.ensureNotDeleted();

    const dependant = this._legalDependants.get(dependantId.toString());
    if (!dependant) {
      throw new Error(`Dependant not found: ${dependantId.toString()}`);
    }

    this._legalDependants.delete(dependantId.toString());
    this._isDirty = true;

    this.addDomainEvent(
      new DependantClaimRemovedEvent(
        this.id.toString(),
        this.getAggregateType(),
        this.getVersion(),
        {
          dependantId: dependantId.toString(),
          reason,
        },
      ),
    );
  }

  /**
   * Get all verified dependants
   */
  public getVerifiedDependants(): LegalDependant[] {
    return Array.from(this._legalDependants.values()).filter((dep) => dep.isVerified);
  }

  /**
   * Get total dependant provision needs
   */
  public getTotalDependantProvisionNeeds(): Money {
    const verified = this.getVerifiedDependants();
    const provisions = verified.map((dep) => dep.calculateAnnualProvision());
    return Money.sum(provisions);
  }

  // =========================================================================
  // GIFT INTER VIVOS MANAGEMENT (S.35(3) Hotchpot)
  // =========================================================================

  /**
   * Add gift inter vivos record
   */
  public addGiftInterVivos(gift: GiftInterVivos): void {
    this.ensureNotFrozen();
    this.ensureNotDeleted();

    if (this._giftsInterVivos.has(gift.id.toString())) {
      throw new Error(`Gift already recorded: ${gift.id.toString()}`);
    }

    if (!gift.estateId.equals(this.id)) {
      throw new Error('Gift does not belong to this estate');
    }

    this._giftsInterVivos.set(gift.id.toString(), gift);
    this._isDirty = true;

    this.addDomainEvent(
      new GiftInterVivosRecordedEvent(
        this.id.toString(),
        this.getAggregateType(),
        this.getVersion(),
        {
          giftId: gift.id.toString(),
          recipientId: gift.recipientId.toString(),
          value: gift.valueAtGiftTime.getAmount(),
          isSubjectToHotchpot: gift.isSubjectToHotchpot,
        },
      ),
    );

    this.recalculateHotchpot();
  }

  /**
   * Remove gift record
   */
  public removeGiftInterVivos(giftId: UniqueEntityID, reason: string): void {
    this.ensureNotFrozen();
    this.ensureNotDeleted();

    const gift = this._giftsInterVivos.get(giftId.toString());
    if (!gift) {
      throw new Error(`Gift not found: ${giftId.toString()}`);
    }

    this._giftsInterVivos.delete(giftId.toString());
    this._isDirty = true;

    this.addDomainEvent(
      new GiftInterVivosRemovedEvent(
        this.id.toString(),
        this.getAggregateType(),
        this.getVersion(),
        {
          giftId: giftId.toString(),
          reason,
        },
      ),
    );

    this.recalculateHotchpot();
  }

  /**
   * Get all gifts subject to hotchpot
   */
  public getHotchpotGifts(): GiftInterVivos[] {
    return Array.from(this._giftsInterVivos.values()).filter(
      (gift) => gift.isSubjectToHotchpot && gift.isVerified,
    );
  }

  /**
   * Calculate total hotchpot value (S.35(3))
   */
  public calculateTotalHotchpotValue(): Money {
    const gifts = this.getHotchpotGifts();
    const values = gifts.map((gift) => gift.getHotchpotValue());
    return Money.sum(values);
  }

  // =========================================================================
  // FINANCIAL CALCULATIONS (Invariant Enforcement)
  // =========================================================================

  /**
   * Recalculate all financial values
   * Called automatically when assets/debts change
   */
  private recalculateFinancials(): void {
    // Gross Value = Sum of all distributable asset values
    const assetValues = Array.from(this._assets.values())
      .filter((asset) => asset.isActive && !asset.isDeleted)
      .map((asset) => asset.getDistributableValue());
    const grossValue = Money.sum(assetValues);

    // Total Liabilities = Sum of outstanding debts
    const debtAmounts = Array.from(this._debts.values())
      .filter(
        (debt) =>
          debt.status !== DebtStatus.SETTLED &&
          debt.status !== DebtStatus.WRITTEN_OFF &&
          !debt.isStatuteBarred,
      )
      .map((debt) => debt.outstandingBalance);
    const totalLiabilities = Money.sum(debtAmounts);

    // Net Value = Gross - Liabilities
    const netValue = grossValue.subtract(totalLiabilities);

    // Update props
    (this.props as any).grossValueKES = grossValue;
    (this.props as any).totalLiabilitiesKES = totalLiabilities;
    (this.props as any).netEstateValueKES = netValue.isNegative() ? Money.zero() : netValue;

    this._isDirty = false;

    // Emit event
    this.addDomainEvent(
      new EstateValueRecalculatedEvent(
        this.id.toString(),
        this.getAggregateType(),
        this.getVersion(),
        {
          grossValue: grossValue.getAmount(),
          totalLiabilities: totalLiabilities.getAmount(),
          netValue: this.netEstateValueKES.getAmount(),
        },
      ),
    );
  }

  /**
   * Recalculate hotchpot value (S.35(3))
   */
  private recalculateHotchpot(): void {
    const hotchpotValue = this.calculateTotalHotchpotValue();
    const adjustedValue = this.grossValueKES.add(hotchpotValue);

    (this.props as any).hotchpotAdjustedValueKES = adjustedValue;
  }

  /**
   * Force recalculation (for integrity checks)
   */
  public forceRecalculation(): void {
    this.recalculateFinancials();
    this.recalculateHotchpot();
  }

  // =========================================================================
  // SOLVENCY CHECKS (Business Rules)
  // =========================================================================

  /**
   * Check if estate is solvent (assets >= liabilities)
   */
  public isSolvent(): boolean {
    return this.grossValueKES.greaterThanOrEqual(this.totalLiabilitiesKES);
  }

  /**
   * Check if estate can cover critical debts
   */
  public canCoverCriticalDebts(): boolean {
    const critical = this.getCriticalDebts();
    const criticalAmount = Money.sum(critical.map((d) => d.outstandingBalance));
    return this.grossValueKES.greaterThanOrEqual(criticalAmount);
  }

  /**
   * Get insolvency shortfall (if insolvent)
   */
  public getInsolvencyShortfall(): Money {
    if (this.isSolvent()) {
      return Money.zero();
    }
    return this.totalLiabilitiesKES.subtract(this.grossValueKES);
  }

  // =========================================================================
  // DISTRIBUTION READINESS
  // =========================================================================

  /**
   * Check if estate is ready for distribution
   */
  public isReadyForDistribution(): boolean {
    return (
      !this.isFrozen &&
      this.isSolvent() &&
      this.areCriticalDebtsSettled() &&
      this.getVerifiedAssets().length > 0
    );
  }

  /**
   * Get distribution blockers
   */
  public getDistributionBlockers(): string[] {
    const blockers: string[] = [];

    if (this.isFrozen) {
      blockers.push(`Estate is frozen: ${this.props.frozenReason}`);
    }

    if (!this.isSolvent()) {
      blockers.push(`Estate is insolvent (shortfall: ${this.getInsolvencyShortfall().format()})`);
    }

    const criticalDebts = this.getCriticalDebts();
    if (criticalDebts.length > 0) {
      blockers.push(`${criticalDebts.length} critical debt(s) must be settled`);
    }

    const unverified = Array.from(this._assets.values()).filter(
      (asset) => !asset.verificationStatus.isVerified(),
    );
    if (unverified.length > 0) {
      blockers.push(`${unverified.length} asset(s) pending verification`);
    }

    return blockers;
  }

  // =========================================================================
  // ESTATE STATUS MANAGEMENT
  // =========================================================================

  /**
   * Mark estate as testate (has valid will)
   */
  public markAsTestate(): void {
    this.ensureNotDeleted();

    if (this.isTestate) {
      throw new Error('Estate is already marked as testate');
    }

    (this.props as any).isTestate = true;
    (this.props as any).isIntestate = false;

    this.addDomainEvent(
      new EstateMarkedAsTestateEvent(
        this.id.toString(),
        this.getAggregateType(),
        this.getVersion(),
        {},
      ),
    );
  }

  /**
   * Mark estate as intestate (no valid will)
   */
  public markAsIntestate(): void {
    this.ensureNotDeleted();

    if (this.isIntestate) {
      throw new Error('Estate is already marked as intestate');
    }

    (this.props as any).isTestate = false;
    (this.props as any).isIntestate = true;

    this.addDomainEvent(
      new EstateMarkedAsIntestateEvent(
        this.id.toString(),
        this.getAggregateType(),
        this.getVersion(),
        {},
      ),
    );
  }

  /**
   * Freeze estate (dispute, tax hold, etc.)
   */
  public freeze(reason: string): void {
    this.ensureNotDeleted();

    if (this.isFrozen) {
      throw new Error('Estate is already frozen');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Freeze reason is required');
    }

    (this.props as any).isFrozen = true;
    (this.props as any).frozenAt = new Date();
    (this.props as any).frozenReason = reason;

    this.addDomainEvent(
      new EstateFrozenEvent(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        reason,
        frozenAt: new Date(),
      }),
    );
  }

  /**
   * Unfreeze estate
   */
  public unfreeze(reason: string): void {
    this.ensureNotDeleted();

    if (!this.isFrozen) {
      throw new Error('Estate is not frozen');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Unfreeze reason is required');
    }

    (this.props as any).isFrozen = false;
    (this.props as any).frozenAt = undefined;
    (this.props as any).metadata = {
      ...this.props.metadata,
      lastFrozenReason: this.props.frozenReason,
      unfrozenAt: new Date(),
      unfreezeReason: reason,
    };

    this.addDomainEvent(
      new EstateUnfrozenEvent(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        reason,
        unfrozenAt: new Date(),
      }),
    );
  }

  private ensureNotFrozen(): void {
    if (this.isFrozen) {
      throw new Error(`Estate is frozen: ${this.props.frozenReason}`);
    }
  }

  // =========================================================================
  // AGGREGATE ROOT IMPLEMENTATION
  // =========================================================================

  protected applyEvent(_event: DomainEvent): void {
    // Event sourcing: Apply event to rebuild state
    // Implementation depends on your event sourcing strategy
  }

  public validate(): void {
    if (!this.props.deceasedId) {
      throw new Error('Deceased ID is required');
    }

    if (!this.props.deceasedFullName || this.props.deceasedFullName.trim().length === 0) {
      throw new Error('Deceased full name is required');
    }

    if (!this.props.grossValueKES) {
      throw new Error('Gross value is required');
    }

    if (!this.props.totalLiabilitiesKES) {
      throw new Error('Total liabilities is required');
    }

    if (!this.props.netEstateValueKES) {
      throw new Error('Net estate value is required');
    }

    // Invariant: Net value must equal gross - liabilities
    const calculated = this.props.grossValueKES.subtract(this.props.totalLiabilitiesKES);
    const expectedNet = calculated.isNegative() ? Money.zero() : calculated;

    if (!this.props.netEstateValueKES.equals(expectedNet)) {
      throw new Error('Net estate value does not match gross - liabilities');
    }
  }

  /**
   * Clone estate (for scenario simulations)
   */
  public clone(): Estate {
    const clonedProps = { ...this.props };
    const cloned = new Estate(new UniqueEntityID(), clonedProps);

    // Clone collections
    this._assets.forEach((asset, key) => {
      cloned._assets.set(key, asset.clone());
    });
    this._debts.forEach((debt, key) => {
      cloned._debts.set(key, debt.clone());
    });
    this._legalDependants.forEach((dep, key) => {
      cloned._legalDependants.set(key, dep.clone());
    });
    this._giftsInterVivos.forEach((gift, key) => {
      cloned._giftsInterVivos.set(key, gift.clone());
    });

    return cloned;
  }
}

// =========================================================================
// DOMAIN EVENTS (To be expanded in events file)
// =========================================================================

class EstateCreatedEvent extends DomainEvent<any> {}
class AssetAddedToEstateEvent extends DomainEvent<any> {}
class AssetRemovedFromEstateEvent extends DomainEvent<any> {}
class DebtAddedToEstateEvent extends DomainEvent<any> {}
class DebtRemovedFromEstateEvent extends DomainEvent<any> {}
class DependantClaimFiledEvent extends DomainEvent<any> {}
class DependantClaimRemovedEvent extends DomainEvent<any> {}
class GiftInterVivosRecordedEvent extends DomainEvent<any> {}
class GiftInterVivosRemovedEvent extends DomainEvent<any> {}
class EstateValueRecalculatedEvent extends DomainEvent<any> {}
class EstateMarkedAsTestateEvent extends DomainEvent<any> {}
class EstateMarkedAsIntestateEvent extends DomainEvent<any> {}
class EstateFrozenEvent extends DomainEvent<any> {}
class EstateUnfrozenEvent extends DomainEvent<any> {}
