import { AggregateRoot } from '@nestjs/cqrs';
import { WillStatus, DebtType } from '@prisma/client';
import { Will } from '../entities/will.entity';
import { Asset } from '../entities/asset.entity';
import { Debt } from '../entities/debt.entity';
import { AssetValue } from '../value-objects/asset-value.vo';
import { DEBT_PRIORITY } from '../../../common/constants/distribution-rules.constants';
import { EstateCreatedEvent } from '../events/estate-created.event';
import { EstateAssetAddedEvent } from '../events/estate-asset-added.event';
import { EstateDebtAddedEvent } from '../events/estate-debt-added.event';
import { EstateWillAddedEvent } from '../events/estate-will-added.event';
import { EstateSolvencyCheckedEvent } from '../events/estate-solvency-checked.event';
import { EstateProbateValidatedEvent } from '../events/estate-probate-validated.event';

/**
 * Financial summary of the estate for probate and distribution purposes
 * @interface EstateSummary
 */
export interface EstateSummary {
  totalAssets: AssetValue;
  totalDebts: AssetValue;
  netValue: AssetValue;
  assetCount: number;
  debtCount: number;
  willCount: number;
  activeWillExists: boolean;
}

/**
 * Debt prioritization result for legal distribution
 * @interface DebtPriorityResult
 */
export interface DebtPriorityResult {
  priority: number;
  category: string;
  description: string;
}

/**
 * Properties required to hydrate the aggregate from the repository
 */
export interface EstateReconstituteProps {
  id: string;
  deceasedId: string;
  wills?: Will[];
  assets?: Asset[];
  debts?: Debt[];
}

/**
 * Estate Aggregate Root representing the complete estate of a deceased person
 *
 * Core Domain Aggregate for managing:
 * - All wills of the deceased (active, draft, revoked)
 * - Complete asset portfolio with Kenyan legal compliance
 * - Outstanding debts and liabilities
 * - Estate solvency analysis and debt prioritization
 * - Net estate value calculations for succession
 *
 * @class EstateAggregate
 * @extends {AggregateRoot}
 */
export class EstateAggregate extends AggregateRoot {
  // Core Estate Properties
  private readonly _id: string;
  private readonly _deceasedId: string;

  // Domain Entity Collections
  private _wills: Map<string, Will> = new Map();
  private _assets: Map<string, Asset> = new Map();
  private _debts: Map<string, Debt> = new Map();

  // --------------------------------------------------------------------------
  // PRIVATE CONSTRUCTOR - Enforces use of factory methods
  // --------------------------------------------------------------------------
  private constructor(id: string, deceasedId: string) {
    super();

    // Validate required parameters
    if (!id?.trim()) throw new Error('Estate ID is required');
    if (!deceasedId?.trim()) throw new Error('Deceased ID is required');

    this._id = id;
    this._deceasedId = deceasedId;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS - Domain Lifecycle Management
  // --------------------------------------------------------------------------

  /**
   * Creates a new Estate Aggregate for a deceased person
   *
   * @static
   * @param {string} id - Unique estate identifier
   * @param {string} deceasedId - ID of the deceased person
   * @returns {EstateAggregate} New estate aggregate
   */
  static create(id: string, deceasedId: string): EstateAggregate {
    const estate = new EstateAggregate(id, deceasedId);

    estate.apply(new EstateCreatedEvent(estate._id, estate._deceasedId, new Date()));

    return estate;
  }

  /**
   * Reconstitutes the aggregate from persistence.
   * Accepts fully hydrated child entities from the Repository.
   */
  static reconstitute(props: EstateReconstituteProps): EstateAggregate {
    const estate = new EstateAggregate(props.id, props.deceasedId);

    if (props.wills) {
      props.wills.forEach((will) => estate._wills.set(will.id, will));
    }
    if (props.assets) {
      props.assets.forEach((asset) => estate._assets.set(asset.id, asset));
    }
    if (props.debts) {
      props.debts.forEach((debt) => estate._debts.set(debt.id, debt));
    }

    return estate;
  }

  // --------------------------------------------------------------------------
  // WILL MANAGEMENT & TESTAMENTARY DOCUMENTS
  // --------------------------------------------------------------------------

  /**
   * Adds a will to the estate with validation
   *
   * @param {Will} will - Will entity to add
   * @throws {Error} When will testator doesn't match deceased or will already exists
   */
  addWill(will: Will): void {
    if (will.testatorId !== this._deceasedId) {
      throw new Error('Will testator does not match estate deceased person');
    }

    if (this._wills.has(will.id)) {
      throw new Error(`Will ${will.id} already exists in estate`);
    }

    this._wills.set(will.id, will);

    this.apply(new EstateWillAddedEvent(this._id, will.id, will.status, new Date()));
  }

  /**
   * Retrieves the active will for the estate (if any)
   *
   * @returns {Will | undefined} Active will or undefined if none exists
   */
  getActiveWill(): Will | undefined {
    return Array.from(this._wills.values()).find((will) => will.status === WillStatus.ACTIVE);
  }

  /**
   * Retrieves all wills in the estate
   *
   * @returns {Will[]} Array of all will entities
   */
  getAllWills(): Will[] {
    return Array.from(this._wills.values());
  }

  /**
   * Checks if estate has an active will
   *
   * @returns {boolean} True if active will exists
   */
  hasActiveWill(): boolean {
    return this.getActiveWill() !== undefined;
  }

  // --------------------------------------------------------------------------
  // ASSET MANAGEMENT & PORTFOLIO OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Adds an asset to the estate with ownership validation
   *
   * @param {Asset} asset - Asset entity to add
   * @throws {Error} When asset owner doesn't match deceased or asset already exists
   */
  addAsset(asset: Asset): void {
    if (asset.ownerId !== this._deceasedId) {
      throw new Error('Asset owner does not match estate deceased person');
    }

    if (this._assets.has(asset.id)) {
      throw new Error(`Asset ${asset.id} already exists in estate`);
    }

    this._assets.set(asset.id, asset);

    this.apply(
      new EstateAssetAddedEvent(this._id, asset.id, asset.type, asset.currentValue, new Date()),
    );
  }

  /**
   * Removes an asset from the estate
   *
   * @param {string} assetId - ID of the asset to remove
   * @throws {Error} When asset not found in estate
   */
  removeAsset(assetId: string): void {
    if (!this._assets.has(assetId)) {
      throw new Error(`Asset ${assetId} not found in estate`);
    }

    this._assets.delete(assetId);
  }

  /**
   * Retrieves all assets in the estate
   *
   * @returns {Asset[]} Array of all asset entities
   */
  getAllAssets(): Asset[] {
    return Array.from(this._assets.values());
  }

  /**
   * Retrieves assets eligible for legal transfer under Kenyan law
   *
   * @returns {Asset[]} Array of transferable asset entities
   */
  getTransferableAssets(): Asset[] {
    return this.getAllAssets().filter((asset) => asset.canBeTransferred());
  }

  /**
   * Retrieves assets with verified documentation
   *
   * @returns {Asset[]} Array of verified asset entities
   */
  getVerifiedAssets(): Asset[] {
    return this.getAllAssets().filter((asset) => asset.hasVerifiedDocument);
  }

  /**
   * Retrieves encumbered assets (with mortgages/liens)
   *
   * @returns {Asset[]} Array of encumbered asset entities
   */
  getEncumberedAssets(): Asset[] {
    return this.getAllAssets().filter((asset) => asset.isEncumbered);
  }

  // --------------------------------------------------------------------------
  // DEBT MANAGEMENT & LIABILITY OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Adds a debt to the estate with validation
   *
   * @param {Debt} debt - Debt entity to add
   * @throws {Error} When debt already exists in estate
   */
  addDebt(debt: Debt): void {
    if (this._debts.has(debt.id)) {
      throw new Error(`Debt ${debt.id} already exists in estate`);
    }

    this._debts.set(debt.id, debt);

    this.apply(
      new EstateDebtAddedEvent(this._id, debt.id, debt.type, debt.outstandingBalance, new Date()),
    );
  }

  /**
   * Retrieves all debts in the estate
   *
   * @returns {Debt[]} Array of all debt entities
   */
  getAllDebts(): Debt[] {
    return Array.from(this._debts.values());
  }

  /**
   * Retrieves outstanding (unpaid) debts
   *
   * @returns {Debt[]} Array of outstanding debt entities
   */
  getOutstandingDebts(): Debt[] {
    return this.getAllDebts().filter((debt) => !debt.isPaid);
  }

  /**
   * Retrieves paid debts
   *
   * @returns {Debt[]} Array of paid debt entities
   */
  getPaidDebts(): Debt[] {
    return this.getAllDebts().filter((debt) => debt.isPaid);
  }

  /**
   * Retrieves secured debts (linked to assets)
   *
   * @returns {Debt[]} Array of secured debt entities
   */
  getSecuredDebts(): Debt[] {
    return this.getAllDebts().filter((debt) => debt.isSecured());
  }

  // --------------------------------------------------------------------------
  // DOMAIN LOGIC & FINANCIAL CALCULATIONS
  // --------------------------------------------------------------------------

  /**
   * Calculates comprehensive estate financial summary
   * Note: Currently assumes single currency (KES) for Kenyan context
   * Future enhancement: Multi-currency support with conversion service
   *
   * @param {string} [defaultCurrency='KES'] - Base currency for calculations
   * @returns {EstateSummary} Comprehensive estate financial summary
   */
  getEstateSummary(defaultCurrency: string = 'KES'): EstateSummary {
    const allAssets = this.getAllAssets();
    const allDebts = this.getAllDebts();
    const allWills = this.getAllWills();

    let totalAssetsAmount = 0;
    let totalDebtsAmount = 0;

    // Sum assets in base currency (KES)
    for (const asset of allAssets) {
      const value = asset.currentValue;
      if (value.currency === defaultCurrency) {
        totalAssetsAmount += value.getAmount();
      }
      // Note: Assets in other currencies are currently excluded
      // Future: Inject CurrencyConverter service for multi-currency support
    }

    // Sum debts in base currency (KES)
    for (const debt of allDebts) {
      const value = debt.outstandingBalance;
      if (value.currency === defaultCurrency) {
        totalDebtsAmount += value.getAmount();
      }
      // Note: Debts in other currencies are currently excluded
    }

    const totalAssets = new AssetValue(totalAssetsAmount, defaultCurrency, new Date());
    const totalDebts = new AssetValue(totalDebtsAmount, defaultCurrency, new Date());
    const netValue = totalAssets.subtract(totalDebts);

    return {
      totalAssets,
      totalDebts,
      netValue,
      assetCount: allAssets.length,
      debtCount: allDebts.length,
      willCount: allWills.length,
      activeWillExists: this.hasActiveWill(),
    };
  }

  /**
   * Sorts debts according to Kenyan legal priority (Section 83)
   * Priority: Funeral > Taxes > Secured > Unsecured
   *
   * @returns {Debt[]} Array of debts sorted by legal priority
   */
  getPrioritizedDebts(): Debt[] {
    const outstandingDebts = this.getOutstandingDebts();

    return outstandingDebts.sort((debtA, debtB) => {
      const priorityA = this.getDebtPriority(debtA.type);
      const priorityB = this.getDebtPriority(debtB.type);

      return priorityA.priority - priorityB.priority;
    });
  }

  /**
   * Maps debt type to legal priority category and priority level
   *
   * @private
   * @param {DebtType} debtType - Type of debt to prioritize
   * @returns {DebtPriorityResult} Debt priority information
   */
  private getDebtPriority(debtType: DebtType): DebtPriorityResult {
    const categoryMap: Record<DebtType, string> = {
      [DebtType.FUNERAL_EXPENSE]: 'FUNERAL_EXPENSES',
      [DebtType.TAX_OBLIGATION]: 'TAXES',
      [DebtType.MORTGAGE]: 'SECURED_CREDITORS',
      [DebtType.PERSONAL_LOAN]: 'UNSECURED_CREDITORS',
      [DebtType.CREDIT_CARD]: 'UNSECURED_CREDITORS',
      [DebtType.BUSINESS_DEBT]: 'UNSECURED_CREDITORS',
      [DebtType.MEDICAL_BILL]: 'UNSECURED_CREDITORS',
      [DebtType.OTHER]: 'UNSECURED_CREDITORS',
    };

    const descriptionMap: Record<string, string> = {
      FUNERAL_EXPENSES: 'Funeral expenses take first priority',
      TAXES: 'Tax obligations owed to the government',
      SECURED_CREDITORS: 'Debts secured by mortgages or liens',
      PREFERRED_CREDITORS: 'Preferred creditors under Kenyan law',
      UNSECURED_CREDITORS: 'General unsecured creditors',
    };

    const category = categoryMap[debtType] ?? 'UNSECURED_CREDITORS';

    const priorityEntry = DEBT_PRIORITY.ORDER.find((item) => item.category === category);

    const priority = priorityEntry ? priorityEntry.priority : 99;
    const description = descriptionMap[category] ?? 'Low Priority Debt';

    return {
      priority,
      category,
      description,
    };
  }

  /**
   * Validates estate solvency under Kenyan succession law
   *
   * @returns {{ isSolvent: boolean; shortfall?: AssetValue }} Solvency validation result
   */
  validateEstateSolvency(): { isSolvent: boolean; shortfall?: AssetValue } {
    const summary = this.getEstateSummary();

    const valuationDate = summary.netValue.valuationDate ?? new Date();

    const result =
      summary.netValue.getAmount() >= 0
        ? { isSolvent: true }
        : {
            isSolvent: false,
            shortfall: new AssetValue(
              Math.abs(summary.netValue.getAmount()),
              summary.netValue.currency,
              valuationDate,
            ),
          };

    // Emit solvency check event
    this.apply(
      new EstateSolvencyCheckedEvent(
        this._id,
        result.isSolvent,
        summary.netValue,
        result.shortfall,
      ),
    );

    return result;
  }

  /**
   * Validates if estate meets minimum requirements for probate
   *
   * @returns {{ isValid: boolean; issues: string[] }} Probate validation result
   */
  validateForProbate(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const summary = this.getEstateSummary();

    // Validation logic (same as before)
    if (summary.assetCount === 0) {
      issues.push('Estate must contain at least one asset');
    }

    if (summary.netValue.getAmount() < 0) {
      issues.push('Estate is insolvent - liabilities exceed assets');
    }

    if (!this.hasActiveWill() && summary.assetCount > 0) {
      issues.push('Intestate estate requires special court procedures');
    }

    const minimumEstateValue = 100000;
    if (summary.totalAssets.getAmount() < minimumEstateValue) {
      issues.push(
        `Estate value below minimum threshold for formal probate: ${minimumEstateValue} KES`,
      );
    }

    const result = {
      isValid: issues.length === 0,
      issues,
    };

    // Emit probate validation event
    this.apply(new EstateProbateValidatedEvent(this._id, result.isValid, result.issues));

    return result;
  }

  /**
   * Calculates net distributable value after debt settlement
   *
   * @returns {AssetValue} Net value available for distribution to beneficiaries
   */
  getNetDistributableValue(): AssetValue {
    const summary = this.getEstateSummary();
    const outstandingDebts = this.getOutstandingDebts();

    let totalDebtSettlement = 0;
    const currency = summary.totalAssets.currency;
    const valuationDate = summary.totalAssets.valuationDate ?? new Date();

    // Sum only outstanding debts for distribution calculation
    for (const debt of outstandingDebts) {
      const balance = debt.outstandingBalance;
      if (balance.currency === currency) {
        totalDebtSettlement += balance.getAmount();
      }
    }

    const netDistributable = Math.max(0, summary.totalAssets.getAmount() - totalDebtSettlement);

    return new AssetValue(netDistributable, currency, valuationDate);
  }

  // --------------------------------------------------------------------------
  // AGGREGATE INTEGRITY & VALIDATION
  // --------------------------------------------------------------------------

  /**
   * Validates aggregate integrity and business rules
   *
   * @returns {{ isValid: boolean; errors: string[] }} Aggregate validation result
   */
  validateAggregate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate all contained entities
    for (const [assetId, asset] of this._assets) {
      if (asset.ownerId !== this._deceasedId) {
        errors.push(
          `Asset ${assetId} owner mismatch: expected ${this._deceasedId}, found ${asset.ownerId}`,
        );
      }
    }

    for (const [willId, will] of this._wills) {
      if (will.testatorId !== this._deceasedId) {
        errors.push(
          `Will ${willId} testator mismatch: expected ${this._deceasedId}, found ${will.testatorId}`,
        );
      }
    }

    // Business rule: Only one active will allowed
    const activeWills = Array.from(this._wills.values()).filter(
      (will) => will.status === WillStatus.ACTIVE,
    );
    if (activeWills.length > 1) {
      errors.push('Multiple active wills found in estate - only one active will allowed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // --------------------------------------------------------------------------
  // IMMUTABLE GETTERS - Provide read-only access to aggregate state
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }
  get deceasedId(): string {
    return this._deceasedId;
  }
  get wills(): ReadonlyMap<string, Will> {
    return new Map(this._wills);
  }
  get assets(): ReadonlyMap<string, Asset> {
    return new Map(this._assets);
  }
  get debts(): ReadonlyMap<string, Debt> {
    return new Map(this._debts);
  }
}
