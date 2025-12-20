import { AggregateRoot } from '../../base/aggregate-root';
import { UniqueEntityID } from '../../base/entity';
import { Guard } from '../../core/guard';
import { Result } from '../../core/result';
import { KenyanId } from '../../shared/kenyan-id.vo';
import { Currency, Money } from '../../shared/money.vo';
import { Asset } from './entities/asset.entity';
import { Debt } from './entities/debt.entity';
import { GiftInterVivos } from './entities/gift-inter-vivos.entity';
import { EstateCreatedEvent } from './events/estate-created.event';
import { EstateDebtPrioritizedEvent } from './events/estate-debt-prioritized.event';
import { EstateFrozenEvent } from './events/estate-frozen.event';
import { EstateHotchpotCalculatedEvent } from './events/estate-hotchpot-calculated.event';
import { EstateValueCalculatedEvent } from './events/estate-value-calculated.event';

export enum EstateType {
  TESTATE = 'TESTATE',
  INTESTATE = 'INTESTATE',
  MIXED = 'MIXED', // Some assets testate, some intestate
}

export enum EstateStatus {
  PLANNING = 'PLANNING', // Pre-death estate planning
  ACTIVE = 'ACTIVE', // Testator alive, estate plan active
  FROZEN = 'FROZEN', // Death occurred, estate frozen
  PROBATE = 'PROBATE', // In probate process
  ADMINISTRATION = 'ADMINISTRATION', // Under administration
  DISTRIBUTED = 'DISTRIBUTED', // Assets distributed
  CLOSED = 'CLOSED', // Estate closed
}

interface EstateProps {
  // Deceased Identity
  deceasedId: UniqueEntityID;
  deceasedFullName: string;
  deceasedNationalId: KenyanId | null;
  deceasedDateOfBirth: Date | null;
  deceasedDateOfDeath: Date | null;
  deceasedDeathCertNumber: string | null;

  // Estate Classification
  type: EstateType;
  status: EstateStatus;

  // Financial Summary (Computed)
  grossValue: Money;
  totalLiabilities: Money;
  netEstateValue: Money;
  hotchpotAdjustedValue: Money | null;

  // Freeze Status (on death)
  isFrozen: boolean;
  frozenAt: Date | null;

  // Succession Process Linkage
  successionCaseId: UniqueEntityID | null;

  // Collections (managed as separate aggregates but referenced)
  assetIds: UniqueEntityID[];
  debtIds: UniqueEntityID[];
  giftIds: UniqueEntityID[];

  // Kenyan Legal Context
  isPolygamous: boolean;
  polygamousHouseCount: number;
  homeCounty: string | null;
  customaryLawType: string | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Estate extends AggregateRoot<EstateProps> {
  private constructor(props: EstateProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: {
      deceasedId: string;
      deceasedFullName: string;
      deceasedNationalId?: KenyanId;
      deceasedDateOfBirth?: Date;
      deceasedDateOfDeath?: Date;
      deceasedDeathCertNumber?: string;
      type?: EstateType;
      isPolygamous?: boolean;
      polygamousHouseCount?: number;
      homeCounty?: string;
      customaryLawType?: string;
    },
    id?: string,
  ): Result<Estate> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.deceasedId, argumentName: 'deceasedId' },
      { argument: props.deceasedFullName, argumentName: 'deceasedFullName' },
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<Estate>(guardResult.message);
    }

    // Validate deceased full name
    if (props.deceasedFullName.trim().length < 5) {
      return Result.fail<Estate>('Deceased full name must be at least 5 characters');
    }

    // Validate date of death if provided
    if (props.deceasedDateOfDeath && props.deceasedDateOfDeath > new Date()) {
      return Result.fail<Estate>('Date of death cannot be in the future');
    }

    // Validate date of birth if provided
    if (props.deceasedDateOfBirth && props.deceasedDateOfBirth > new Date()) {
      return Result.fail<Estate>('Date of birth cannot be in the future');
    }

    // Validate death certificate number format if provided
    if (props.deceasedDeathCertNumber && !/^\d{6,12}$/.test(props.deceasedDeathCertNumber)) {
      return Result.fail<Estate>('Invalid death certificate number format');
    }

    // Polygamous validation
    if (props.isPolygamous && (!props.polygamousHouseCount || props.polygamousHouseCount < 2)) {
      return Result.warn<Estate>('Polygamous estate should have at least 2 houses');
    }

    const estateId = id ? new UniqueEntityID(id) : new UniqueEntityID();
    const now = new Date();

    const defaultProps: EstateProps = {
      deceasedId: new UniqueEntityID(props.deceasedId),
      deceasedFullName: props.deceasedFullName.trim(),
      deceasedNationalId: props.deceasedNationalId || null,
      deceasedDateOfBirth: props.deceasedDateOfBirth || null,
      deceasedDateOfDeath: props.deceasedDateOfDeath || null,
      deceasedDeathCertNumber: props.deceasedDeathCertNumber || null,
      type: props.type || EstateType.INTESTATE,
      status: props.deceasedDateOfDeath ? EstateStatus.FROZEN : EstateStatus.PLANNING,
      grossValue: Money.zero(Currency.KES),
      totalLiabilities: Money.zero(Currency.KES),
      netEstateValue: Money.zero(Currency.KES),
      hotchpotAdjustedValue: null,
      isFrozen: !!props.deceasedDateOfDeath,
      frozenAt: props.deceasedDateOfDeath || null,
      successionCaseId: null,
      assetIds: [],
      debtIds: [],
      giftIds: [],
      isPolygamous: props.isPolygamous || false,
      polygamousHouseCount: props.polygamousHouseCount || 0,
      homeCounty: props.homeCounty || null,
      customaryLawType: props.customaryLawType || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const estate = new Estate(defaultProps, estateId);

    // Add domain event for estate creation
    estate.addDomainEvent(
      new EstateCreatedEvent({
        estateId: estate.id.toString(),
        deceasedId: estate.props.deceasedId.toString(),
        deceasedFullName: estate.props.deceasedFullName,
        estateType: estate.props.type,
        isPolygamous: estate.props.isPolygamous,
        createdAt: now,
      }),
    );

    // If deceased date of death is provided, add frozen event
    if (props.deceasedDateOfDeath) {
      estate.addDomainEvent(
        new EstateFrozenEvent({
          estateId: estate.id.toString(),
          dateOfDeath: props.deceasedDateOfDeath,
          frozenAt: now,
          reason: 'Estate created with existing date of death',
        }),
      );
    }

    return Result.ok<Estate>(estate);
  }

  // ==================== BUSINESS METHODS ====================

  // Asset Management
  public addAsset(asset: Asset): Result<void> {
    // Validation
    if (!asset) {
      return Result.fail('Asset cannot be null');
    }

    // Check if estate is frozen
    if (this.props.isFrozen) {
      return Result.fail('Cannot add assets to frozen estate');
    }

    // Check if asset already exists in estate
    if (this.props.assetIds.some((id) => id.equals(asset.id))) {
      return Result.fail('Asset already exists in estate');
    }

    // Verify asset belongs to this estate
    if (!asset.estateId.equals(this.id)) {
      return Result.fail('Asset does not belong to this estate');
    }

    this.props.assetIds.push(asset.id);
    this.props.updatedAt = new Date();

    // Recalculate estate values
    this.recalculateEstateValues();

    return Result.ok();
  }

  public removeAsset(assetId: UniqueEntityID): Result<void> {
    // Check if estate is frozen
    if (this.props.isFrozen) {
      return Result.fail('Cannot remove assets from frozen estate');
    }

    const index = this.props.assetIds.findIndex((id) => id.equals(assetId));
    if (index === -1) {
      return Result.fail('Asset not found in estate');
    }

    this.props.assetIds.splice(index, 1);
    this.props.updatedAt = new Date();

    // Recalculate estate values
    this.recalculateEstateValues();

    return Result.ok();
  }

  // Debt Management
  public addDebt(debt: Debt): Result<void> {
    if (!debt) {
      return Result.fail('Debt cannot be null');
    }

    if (this.props.isFrozen) {
      return Result.fail('Cannot add debts to frozen estate');
    }

    if (this.props.debtIds.some((id) => id.equals(debt.id))) {
      return Result.fail('Debt already exists in estate');
    }

    if (!debt.estateId.equals(this.id)) {
      return Result.fail('Debt does not belong to this estate');
    }

    this.props.debtIds.push(debt.id);
    this.props.updatedAt = new Date();

    // Recalculate estate values
    this.recalculateEstateValues();

    return Result.ok();
  }

  public removeDebt(debtId: UniqueEntityID): Result<void> {
    if (this.props.isFrozen) {
      return Result.fail('Cannot remove debts from frozen estate');
    }

    const index = this.props.debtIds.findIndex((id) => id.equals(debtId));
    if (index === -1) {
      return Result.fail('Debt not found in estate');
    }

    this.props.debtIds.splice(index, 1);
    this.props.updatedAt = new Date();

    // Recalculate estate values
    this.recalculateEstateValues();

    return Result.ok();
  }

  // Gift Management (Inter Vivos)
  public addGift(gift: GiftInterVivos): Result<void> {
    if (!gift) {
      return Result.fail('Gift cannot be null');
    }

    if (this.props.isFrozen) {
      return Result.fail('Cannot add gifts to frozen estate');
    }

    if (this.props.giftIds.some((id) => id.equals(gift.id))) {
      return Result.fail('Gift already exists in estate');
    }

    if (!gift.estateId.equals(this.id)) {
      return Result.fail('Gift does not belong to this estate');
    }

    this.props.giftIds.push(gift.id);
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  public removeGift(giftId: UniqueEntityID): Result<void> {
    if (this.props.isFrozen) {
      return Result.fail('Cannot remove gifts from frozen estate');
    }

    const index = this.props.giftIds.findIndex((id) => id.equals(giftId));
    if (index === -1) {
      return Result.fail('Gift not found in estate');
    }

    this.props.giftIds.splice(index, 1);
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  // Estate Status Management
  public freezeEstate(dateOfDeath: Date, deathCertNumber?: string): Result<void> {
    if (this.props.isFrozen) {
      return Result.fail('Estate is already frozen');
    }

    if (dateOfDeath > new Date()) {
      return Result.fail('Date of death cannot be in the future');
    }

    this.props.deceasedDateOfDeath = dateOfDeath;
    if (deathCertNumber) {
      this.props.deceasedDeathCertNumber = deathCertNumber;
    }
    this.props.isFrozen = true;
    this.props.frozenAt = new Date();
    this.props.status = EstateStatus.FROZEN;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new EstateFrozenEvent({
        estateId: this.id.toString(),
        dateOfDeath,
        frozenAt: this.props.frozenAt,
        deathCertNumber,
        reason: 'Testator deceased',
      }),
    );

    return Result.ok();
  }

  public unfreezeEstate(reason: string): Result<void> {
    if (!this.props.isFrozen) {
      return Result.fail('Estate is not frozen');
    }

    // Only allow unfreezing if there's an error in death reporting
    if (!reason || reason.trim().length < 10) {
      return Result.fail('Unfreeze reason must be at least 10 characters');
    }

    this.props.isFrozen = false;
    this.props.frozenAt = null;
    this.props.status = EstateStatus.ACTIVE;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  public markAsTestate(willId: string): Result<void> {
    if (this.props.type === EstateType.TESTATE) {
      return Result.fail('Estate is already marked as testate');
    }

    this.props.type = EstateType.TESTATE;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  public markAsIntestate(): Result<void> {
    if (this.props.type === EstateType.INTESTATE) {
      return Result.fail('Estate is already marked as intestate');
    }

    this.props.type = EstateType.INTESTATE;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  // Financial Calculations
  public recalculateEstateValues(): Result<void> {
    try {
      // Note: In a real implementation, these would be calculated from actual asset/debt values
      // For now, we'll assume these are updated via events from the child aggregates

      // Trigger domain event
      this.addDomainEvent(
        new EstateValueCalculatedEvent({
          estateId: this.id.toString(),
          grossValue: this.props.grossValue.amount,
          totalLiabilities: this.props.totalLiabilities.amount,
          netEstateValue: this.props.netEstateValue.amount,
          currency: this.props.grossValue.currency,
          calculatedAt: new Date(),
        }),
      );

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to recalculate estate values: ${error}`);
    }
  }

  // Hotchpot Calculation (S.35(3) LSA)
  public calculateHotchpot(reconciliationDate: Date = new Date()): Result<void> {
    if (!this.props.isFrozen) {
      return Result.fail('Hotchpot can only be calculated for frozen estates (after death)');
    }

    // Calculate hotchpot from gifts
    let totalHotchpotValue = Money.zero(Currency.KES);

    // In real implementation, we would iterate through gifts and calculate
    // For now, we'll set a placeholder value
    totalHotchpotValue = totalHotchpotValue.add(
      Money.create({ amount: 0, currency: Currency.KES }),
    );

    // Calculate hotchpot adjusted value
    this.props.hotchpotAdjustedValue = this.props.grossValue.add(totalHotchpotValue);
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new EstateHotchpotCalculatedEvent({
        estateId: this.id.toString(),
        grossValue: this.props.grossValue.amount,
        totalHotchpotValue: totalHotchpotValue.amount,
        hotchpotAdjustedValue: this.props.hotchpotAdjustedValue.amount,
        currency: this.props.grossValue.currency,
        reconciliationDate,
        calculatedAt: new Date(),
      }),
    );

    return Result.ok();
  }

  // S.45 Debt Prioritization
  public prioritizeDebts(): Result<Map<string, Debt[]>> {
    if (!this.props.isFrozen) {
      return Result.fail('Debts can only be prioritized for frozen estates');
    }

    const debtPriorities = new Map<string, Debt[]>();

    // In real implementation, we would fetch debts and sort by S.45 priority
    // This is a placeholder for the business logic

    this.addDomainEvent(
      new EstateDebtPrioritizedEvent({
        estateId: this.id.toString(),
        prioritizedAt: new Date(),
        totalDebts: this.props.debtIds.length,
      }),
    );

    return Result.ok(debtPriorities);
  }

  // Kenyan Legal Compliance Methods
  public getProbateRequirements(): string[] {
    const requirements: string[] = [
      'Death certificate (original or certified copy)',
      'National ID of deceased (copy)',
      'List of surviving family members',
      'Affidavit of support',
    ];

    if (this.props.type === EstateType.TESTATE) {
      requirements.push('Original will or certified copy');
      requirements.push('Affidavit of executor');
    } else {
      requirements.push('Consent from all beneficiaries');
      requirements.push('Affidavit of justification for administrator');
    }

    if (this.props.isPolygamous) {
      requirements.push('List of all wives and their children');
      requirements.push('Consent from all houses for administrator');
    }

    if (this.props.grossValue.amount > 10000000) {
      // 10M KES
      requirements.push('Valuation reports for major assets');
      requirements.push('Tax clearance certificate from KRA');
    }

    return requirements;
  }

  public getEstimatedProbateTimeline(): {
    stage: string;
    duration: string;
    description: string;
  }[] {
    const timeline = [
      {
        stage: 'Filing',
        duration: '1-2 weeks',
        description: 'Prepare and file petition at High Court',
      },
      {
        stage: 'Gazettement',
        duration: '30 days',
        description: 'Publication in Kenya Gazette for objections',
      },
      {
        stage: 'Grant Issuance',
        duration: '2-4 weeks',
        description: 'Court issues grant of representation',
      },
      {
        stage: 'Asset Collection',
        duration: '1-3 months',
        description: 'Collect and secure estate assets',
      },
      {
        stage: 'Debt Settlement',
        duration: '1-2 months',
        description: 'Settle creditors per S.45 LSA',
      },
      {
        stage: 'Distribution',
        duration: '1-3 months',
        description: 'Distribute net estate to beneficiaries',
      },
    ];

    if (this.props.isPolygamous) {
      timeline.splice(2, 0, {
        stage: 'House Allocation',
        duration: '2-4 weeks',
        description: 'Allocate shares per S.40 LSA polygamous formula',
      });
    }

    if (this.props.grossValue.amount > 50000000) {
      // 50M KES
      timeline.push({
        stage: 'Tax Clearance',
        duration: '1-2 months',
        description: 'Obtain KRA tax clearance certificate',
      });
    }

    return timeline;
  }

  public getKenyanCourtRequirements(): {
    courtLevel: string;
    formsRequired: string[];
    filingFees: string;
  } {
    const estateValue = this.props.grossValue.amount;

    let courtLevel = 'High Court';
    let filingFees = 'KES 2,000 - 5,000';

    if (estateValue < 10000000) {
      // 10M KES
      courtLevel = 'Magistrate Court';
      filingFees = 'KES 1,000 - 3,000';
    }

    const formsRequired = [
      'Form P&A 1 (Probate) or P&A 80 (Letters of Administration)',
      'Affidavit in support',
      'List of assets and liabilities',
      'Consent of beneficiaries',
      'Death certificate',
      'ID copies of applicant and deceased',
    ];

    if (this.props.isPolygamous) {
      formsRequired.push('Schedule of wives and children per house');
    }

    return {
      courtLevel,
      formsRequired,
      filingFees,
    };
  }

  // Succession Process Linkage
  public linkSuccessionCase(caseId: string): Result<void> {
    if (!caseId || caseId.trim().length === 0) {
      return Result.fail('Succession case ID cannot be empty');
    }

    if (this.props.successionCaseId) {
      return Result.fail('Estate already linked to a succession case');
    }

    this.props.successionCaseId = new UniqueEntityID(caseId);
    this.props.status = EstateStatus.PROBATE;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  public updateSuccessionStatus(newStatus: EstateStatus): Result<void> {
    if (!Object.values(EstateStatus).includes(newStatus)) {
      return Result.fail('Invalid estate status');
    }

    this.props.status = newStatus;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  // Polygamous Estate Methods (S.40 LSA)
  public updatePolygamousDetails(
    isPolygamous: boolean,
    houseCount: number,
    houseNames?: string[],
  ): Result<void> {
    if (this.props.isFrozen) {
      return Result.fail('Cannot modify polygamous details on frozen estate');
    }

    if (isPolygamous && houseCount < 2) {
      return Result.fail('Polygamous estate must have at least 2 houses');
    }

    this.props.isPolygamous = isPolygamous;
    this.props.polygamousHouseCount = houseCount;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  public calculatePolygamousDistribution(): Result<Map<string, number>> {
    if (!this.props.isPolygamous) {
      return Result.fail('Estate is not polygamous');
    }

    if (!this.props.isFrozen) {
      return Result.fail('Distribution can only be calculated for frozen estates');
    }

    // S.40(2) LSA: Estate divided equally among houses
    const perHouseShare = 100 / this.props.polygamousHouseCount;
    const distribution = new Map<string, number>();

    for (let i = 1; i <= this.props.polygamousHouseCount; i++) {
      distribution.set(`House ${i}`, perHouseShare);
    }

    return Result.ok(distribution);
  }

  // Soft Delete
  public delete(deletedBy: string, reason: string): Result<void> {
    if (this.props.deletedAt) {
      return Result.fail('Estate is already deleted');
    }

    if (this.props.isFrozen) {
      return Result.fail('Cannot delete frozen estate');
    }

    if (
      this.props.status === EstateStatus.PROBATE ||
      this.props.status === EstateStatus.ADMINISTRATION
    ) {
      return Result.fail('Cannot delete estate under probate or administration');
    }

    if (!reason || reason.trim().length < 10) {
      return Result.fail('Deletion reason must be at least 10 characters');
    }

    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  public restore(): Result<void> {
    if (!this.props.deletedAt) {
      return Result.fail('Estate is not deleted');
    }

    this.props.deletedAt = null;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  // ==================== GETTERS ====================

  get id(): UniqueEntityID {
    return this._id;
  }

  get deceasedId(): UniqueEntityID {
    return this.props.deceasedId;
  }

  get deceasedFullName(): string {
    return this.props.deceasedFullName;
  }

  get deceasedDateOfDeath(): Date | null {
    return this.props.deceasedDateOfDeath;
  }

  get type(): EstateType {
    return this.props.type;
  }

  get status(): EstateStatus {
    return this.props.status;
  }

  get isFrozen(): boolean {
    return this.props.isFrozen;
  }

  get frozenAt(): Date | null {
    return this.props.frozenAt;
  }

  get grossValue(): Money {
    return this.props.grossValue;
  }

  get netEstateValue(): Money {
    return this.props.netEstateValue;
  }

  get hotchpotAdjustedValue(): Money | null {
    return this.props.hotchpotAdjustedValue;
  }

  get isPolygamous(): boolean {
    return this.props.isPolygamous;
  }

  get polygamousHouseCount(): number {
    return this.props.polygamousHouseCount;
  }

  get successionCaseId(): UniqueEntityID | null {
    return this.props.successionCaseId;
  }

  get assetIds(): UniqueEntityID[] {
    return [...this.props.assetIds];
  }

  get debtIds(): UniqueEntityID[] {
    return [...this.props.debtIds];
  }

  get giftIds(): UniqueEntityID[] {
    return [...this.props.giftIds];
  }

  get isActive(): boolean {
    return !this.props.deletedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  // Computed properties
  get hasDebts(): boolean {
    return this.props.debtIds.length > 0;
  }

  get hasGifts(): boolean {
    return this.props.giftIds.length > 0;
  }

  get hasAssets(): boolean {
    return this.props.assetIds.length > 0;
  }

  get isUnderProbate(): boolean {
    return this.props.status === EstateStatus.PROBATE;
  }

  get isUnderAdministration(): boolean {
    return this.props.status === EstateStatus.ADMINISTRATION;
  }

  get canDistribute(): boolean {
    return (
      this.props.isFrozen &&
      this.props.status !== EstateStatus.CLOSED &&
      this.props.netEstateValue.amount > 0
    );
  }

  get requiresHotchpotCalculation(): boolean {
    return this.props.isFrozen && this.props.giftIds.length > 0;
  }

  // Static factory methods
  public static createForPlanning(props: {
    deceasedId: string;
    deceasedFullName: string;
    deceasedNationalId?: KenyanId;
    deceasedDateOfBirth?: Date;
    isPolygamous?: boolean;
    polygamousHouseCount?: number;
    homeCounty?: string;
    customaryLawType?: string;
  }): Result<Estate> {
    return Estate.create({
      ...props,
      deceasedDateOfDeath: undefined, // No date of death for planning
    });
  }

  public static createForDeceased(props: {
    deceasedId: string;
    deceasedFullName: string;
    deceasedDateOfDeath: Date;
    deceasedDeathCertNumber: string;
    deceasedNationalId?: KenyanId;
    deceasedDateOfBirth?: Date;
    isPolygamous?: boolean;
    polygamousHouseCount?: number;
    homeCounty?: string;
    customaryLawType?: string;
  }): Result<Estate> {
    return Estate.create(props);
  }
}
