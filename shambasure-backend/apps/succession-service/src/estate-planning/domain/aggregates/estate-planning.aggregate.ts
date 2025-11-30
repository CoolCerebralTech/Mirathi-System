import { AggregateRoot } from '@nestjs/cqrs';

import { EstatePlanningCreatedEvent } from '../events/estate-planning-created.event';
import { EstatePlanningValuationUpdatedEvent } from '../events/estate-planning-valuation-updated.event';
import { EstatePlanningWillActivatedEvent } from '../events/estate-planning-will-activated.event';

/**
 * Estate Planning Summary for Pre-Death Wealth Management
 */
export interface EstatePlanningFinancialSummary {
  totalAssets: number;
  totalDebts: number;
  netWorth: number;
  currency: string;
  assetCount: number;
  debtCount: number;
  activeWillExists: boolean;
  hasExecutors: boolean;
  hasBeneficiaries: boolean;
  isPlanComplete: boolean;
}

/**
 * Estate Planning Aggregate Root (Pre-Death Wealth Management)
 *
 * Manages a LIVING person's estate planning activities:
 * - Tracking owned assets and debts
 * - Creating and managing wills
 * - Net worth calculations
 * - Planning completeness validation
 *
 * This aggregate represents estate planning BEFORE death.
 * Once the person dies, their data feeds into EstateAggregate.
 *
 * Legal Context:
 * - Pre-death planning activities
 * - No succession law applies yet
 * - Focuses on will preparation and asset organization
 *
 * Lifecycle:
 * 1. Created when user starts estate planning
 * 2. Assets/Debts registered
 * 3. Will created and activated
 * 4. On death → Data migrates to EstateAggregate
 *
 * This is distinct from:
 * - WillAggregate (manages single will document)
 * - EstateAggregate (manages post-death succession)
 */
export class EstatePlanningAggregate extends AggregateRoot {
  // Core Identity
  private readonly _id: string;
  private readonly _userId: string; // Living person planning their estate

  // Financial State (IDs only - entities managed separately)
  private _assetIds: Set<string> = new Set();
  private _debtIds: Set<string> = new Set();
  private _willIds: Set<string> = new Set();

  // Active Will Tracking
  private _activeWillId: string | null;

  // Cached Financial Summary (for performance)
  private _lastCalculatedNetWorth: number | null;
  private _lastCalculationDate: Date | null;
  private _currency: string;

  // Planning Status
  private _isPlanComplete: boolean;

  // Timestamps
  private _createdAt: Date;
  private _updatedAt: Date;

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(id: string, userId: string, currency: string = 'KES') {
    super();

    if (!id?.trim()) throw new Error('Estate planning ID is required');
    if (!userId?.trim()) throw new Error('User ID is required');

    this._id = id;
    this._userId = userId;
    this._currency = currency;
    this._activeWillId = null;
    this._lastCalculatedNetWorth = null;
    this._lastCalculationDate = null;
    this._isPlanComplete = false;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(id: string, userId: string, currency: string = 'KES'): EstatePlanningAggregate {
    const planning = new EstatePlanningAggregate(id, userId, currency);

    planning.apply(
      new EstatePlanningCreatedEvent(planning._id, planning._userId, planning._createdAt),
    );

    return planning;
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    currency: string;
    activeWillId: string | null;
    lastCalculatedNetWorth: number | null;
    lastCalculationDate: Date | string | null;
    isPlanComplete: boolean;
    completenessLastChecked: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    assetIds?: string[];
    debtIds?: string[];
    willIds?: string[];
  }): EstatePlanningAggregate {
    const planning = new EstatePlanningAggregate(props.id, props.userId, props.currency);

    planning._activeWillId = props.activeWillId;
    planning._lastCalculatedNetWorth = props.lastCalculatedNetWorth;
    planning._lastCalculationDate = props.lastCalculationDate
      ? new Date(props.lastCalculationDate)
      : null;
    planning._isPlanComplete = props.isPlanComplete;
    planning._createdAt = new Date(props.createdAt);
    planning._updatedAt = new Date(props.updatedAt);

    if (props.assetIds) {
      planning._assetIds = new Set(props.assetIds);
    }
    if (props.debtIds) {
      planning._debtIds = new Set(props.debtIds);
    }
    if (props.willIds) {
      planning._willIds = new Set(props.willIds);
    }

    return planning;
  }

  // --------------------------------------------------------------------------
  // ASSET MANAGEMENT
  // --------------------------------------------------------------------------

  registerAsset(assetId: string): void {
    if (this._assetIds.has(assetId)) {
      return; // Idempotent
    }

    this._assetIds.add(assetId);
    this.invalidateFinancialCache();
    this.markAsUpdated();
  }

  removeAsset(assetId: string): void {
    this._assetIds.delete(assetId);
    this.invalidateFinancialCache();
    this.markAsUpdated();
  }

  getAssetIds(): string[] {
    return Array.from(this._assetIds);
  }

  getAssetCount(): number {
    return this._assetIds.size;
  }

  hasAssets(): boolean {
    return this._assetIds.size > 0;
  }

  // --------------------------------------------------------------------------
  // DEBT MANAGEMENT
  // --------------------------------------------------------------------------

  registerDebt(debtId: string): void {
    if (this._debtIds.has(debtId)) {
      return; // Idempotent
    }

    this._debtIds.add(debtId);
    this.invalidateFinancialCache();
    this.markAsUpdated();
  }

  removeDebt(debtId: string): void {
    this._debtIds.delete(debtId);
    this.invalidateFinancialCache();
    this.markAsUpdated();
  }

  getDebtIds(): string[] {
    return Array.from(this._debtIds);
  }

  getDebtCount(): number {
    return this._debtIds.size;
  }

  hasDebts(): boolean {
    return this._debtIds.size > 0;
  }

  // --------------------------------------------------------------------------
  // WILL MANAGEMENT
  // --------------------------------------------------------------------------

  registerWill(willId: string): void {
    if (this._willIds.has(willId)) {
      return; // Idempotent
    }

    this._willIds.add(willId);
    this.markAsUpdated();
  }

  setActiveWill(willId: string): void {
    if (!this._willIds.has(willId)) {
      throw new Error('Will not registered in estate plan');
    }

    if (this._activeWillId === willId) {
      return; // Idempotent
    }

    this._activeWillId = willId;
    this.markAsUpdated();

    this.apply(new EstatePlanningWillActivatedEvent(this._id, this._userId, willId, new Date()));
  }

  clearActiveWill(): void {
    this._activeWillId = null;
    this.markAsUpdated();
  }

  getWillIds(): string[] {
    return Array.from(this._willIds);
  }

  hasActiveWill(): boolean {
    return this._activeWillId !== null;
  }

  getActiveWillId(): string | null {
    return this._activeWillId;
  }

  // --------------------------------------------------------------------------
  // FINANCIAL CALCULATIONS
  // --------------------------------------------------------------------------

  /**
   * Updates cached net worth calculation.
   * Actual calculation happens at application service level by loading entities.
   */
  updateNetWorthCalculation(totalAssets: number, totalDebts: number): void {
    const netWorth = totalAssets - totalDebts;

    this._lastCalculatedNetWorth = netWorth;
    this._lastCalculationDate = new Date();
    this.markAsUpdated();

    this.apply(
      new EstatePlanningValuationUpdatedEvent(
        this._id,
        this._userId,
        totalAssets,
        totalDebts,
        netWorth,
        this._currency,
        this._lastCalculationDate,
      ),
    );
  }

  getLastCalculatedNetWorth(): number | null {
    return this._lastCalculatedNetWorth;
  }

  getLastCalculationDate(): Date | null {
    return this._lastCalculationDate;
  }

  isFinancialDataStale(maxAgeInDays: number = 30): boolean {
    if (!this._lastCalculationDate) return true;

    const daysSinceCalculation =
      (new Date().getTime() - this._lastCalculationDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceCalculation > maxAgeInDays;
  }

  private invalidateFinancialCache(): void {
    // Financial data changed, mark for recalculation
    this._lastCalculationDate = null;
  }

  // --------------------------------------------------------------------------
  // PLANNING COMPLETENESS
  // --------------------------------------------------------------------------

  /**
   * Validates estate plan completeness.
   */
  checkPlanCompleteness(): { isComplete: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this._assetIds.size === 0) {
      issues.push('No assets registered');
    }

    if (!this.hasActiveWill()) {
      issues.push('No active will');
    }

    // Note: More detailed validation (executors, beneficiaries) requires loading Will aggregate
    // This is a high-level check

    const isComplete = issues.length === 0;

    this._isPlanComplete = isComplete;
    this.markAsUpdated();

    return { isComplete, issues };
  }

  isPlanComplete(): boolean {
    return this._isPlanComplete;
  }

  // --------------------------------------------------------------------------
  // AGGREGATE STATE QUERIES
  // --------------------------------------------------------------------------

  /**
   * Summary for dashboard display.
   */
  getSummary(): {
    planningId: string;
    userId: string;
    assetCount: number;
    debtCount: number;
    willCount: number;
    hasActiveWill: boolean;
    activeWillId: string | null;
    lastCalculatedNetWorth: number | null;
    lastCalculationDate: Date | null;
    currency: string;
    isPlanComplete: boolean;
    isFinancialDataStale: boolean;
  } {
    return {
      planningId: this._id,
      userId: this._userId,
      assetCount: this._assetIds.size,
      debtCount: this._debtIds.size,
      willCount: this._willIds.size,
      hasActiveWill: this.hasActiveWill(),
      activeWillId: this._activeWillId,
      lastCalculatedNetWorth: this._lastCalculatedNetWorth,
      lastCalculationDate: this._lastCalculationDate,
      currency: this._currency,
      isPlanComplete: this._isPlanComplete,
      isFinancialDataStale: this.isFinancialDataStale(),
    };
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get currency(): string {
    return this._currency;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
}
