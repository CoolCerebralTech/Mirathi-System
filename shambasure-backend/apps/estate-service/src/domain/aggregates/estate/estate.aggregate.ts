// Exceptions
import { AggregateRoot } from '../../base/aggregate-root';
import { UniqueEntityID } from '../../base/unique-entity-id';
import { EstateDomainException } from '../../exceptions/estate.exception';
import { KenyanId } from '../../shared/kenyan-id.vo';
import { Currency, Money } from '../../shared/money.vo';
import { Asset } from './entities/asset.entity';
import { Debt } from './entities/debt.entity';
import { GiftInterVivos } from './entities/gift-inter-vivos.entity';
import { EstateCreatedEvent } from './events/estate-created.event';
import { EstateFrozenEvent } from './events/estate-frozen.event';
import { EstateHotchpotCalculatedEvent } from './events/estate-hotchpot-calculated.event';

export class InvalidEstateConfigurationException extends EstateDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEstateConfigurationException';
  }
}

export class EstateOperationException extends EstateDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'EstateOperationException';
  }
}

export enum EstateType {
  TESTATE = 'TESTATE',
  INTESTATE = 'INTESTATE',
  MIXED = 'MIXED',
}

export enum EstateStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN', // S.45 LSA triggers on this status
  PROBATE = 'PROBATE',
  ADMINISTRATION = 'ADMINISTRATION',
  DISTRIBUTED = 'DISTRIBUTED',
  CLOSED = 'CLOSED',
}

export interface EstateProps {
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

  // Financial Summary
  grossValue: Money;
  totalLiabilities: Money;
  netEstateValue: Money;
  hotchpotAdjustedValue: Money | null;

  // Freeze Status
  isFrozen: boolean;
  frozenAt: Date | null;

  // Linkage
  successionCaseId: UniqueEntityID | null;

  // Collections (IDs only for Aggregate Root, Entities loaded via Repo)
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
    super(id ?? new UniqueEntityID(), props);
  }

  private get mutableProps(): EstateProps {
    return this._props;
  }

  // Implementation of abstract method from Base AggregateRoot
  protected applyEvent(event: any): void {
    // Event sourcing replay logic would go here
  }

  // Implementation of abstract method from Base AggregateRoot
  public validate(): void {
    if (this.props.isPolygamous && this.props.polygamousHouseCount < 2) {
      throw new InvalidEstateConfigurationException(
        'Polygamous estate must have at least 2 houses (S.40 LSA)',
      );
    }
    if (this.props.isFrozen && !this.props.deceasedDateOfDeath) {
      throw new InvalidEstateConfigurationException('Frozen estate must have date of death');
    }
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
  ): Estate {
    // Validation
    if (!props.deceasedId || !props.deceasedFullName) {
      throw new InvalidEstateConfigurationException('Missing required estate fields');
    }
    if (props.deceasedFullName.trim().length < 5) {
      throw new InvalidEstateConfigurationException(
        'Deceased full name must be at least 5 characters',
      );
    }
    if (props.deceasedDateOfDeath && props.deceasedDateOfDeath > new Date()) {
      throw new InvalidEstateConfigurationException('Date of death cannot be in the future');
    }
    if (props.deceasedDeathCertNumber && !/^\d{6,12}$/.test(props.deceasedDeathCertNumber)) {
      throw new InvalidEstateConfigurationException('Invalid death certificate number format');
    }
    if (props.isPolygamous && (!props.polygamousHouseCount || props.polygamousHouseCount < 2)) {
      // In Exception pattern, we can throw or handle. For creation, strictness is better.
      // But for "planning" stage, user might not have set it yet.
      // We will allow creation but validate() will fail on persistence if invalid.
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
      frozenAt: props.deceasedDateOfDeath ? now : null,
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

    // Domain Events
    estate.addDomainEvent(
      new EstateCreatedEvent(estateId.toString(), 'Estate', 1, {
        deceasedId: props.deceasedId,
        type: estate.props.type,
        isPolygamous: estate.props.isPolygamous,
      }),
    );

    if (props.deceasedDateOfDeath) {
      estate.addDomainEvent(
        new EstateFrozenEvent(estateId.toString(), 'Estate', 1, {
          dateOfDeath: props.deceasedDateOfDeath,
          reason: 'Created with Date of Death',
        }),
      );
    }

    return estate;
  }

  // ==================== BUSINESS METHODS ====================

  public addAsset(asset: Asset): void {
    if (!asset) throw new EstateOperationException('Asset cannot be null');
    if (this.props.isFrozen)
      throw new EstateOperationException(
        'Cannot add new assets to frozen estate (Post-death discovery requires special process)',
      );
    if (this.props.assetIds.some((id) => id.equals(asset.id)))
      throw new EstateOperationException('Asset already exists in estate');
    if (!asset.estateId.equals(this.id))
      throw new EstateOperationException('Asset estate ID mismatch');

    this.mutableProps.assetIds.push(asset.id);
    this.mutableProps.updatedAt = new Date();
    // In a real app, we'd trigger a recalculation service here or simply flag it dirty
    // this.recalculateEstateValues();
  }

  public removeAsset(assetId: UniqueEntityID): void {
    if (this.props.isFrozen)
      throw new EstateOperationException('Cannot remove assets from frozen estate');

    const index = this.props.assetIds.findIndex((id) => id.equals(assetId));
    if (index === -1) throw new EstateOperationException('Asset not found');

    this.mutableProps.assetIds.splice(index, 1);
    this.mutableProps.updatedAt = new Date();
  }

  public addDebt(debt: Debt): void {
    if (!debt) throw new EstateOperationException('Debt cannot be null');
    // Debts CAN be added to frozen estate (Creditor Claims come in after death)
    // if (this.props.isFrozen) ... -> Removed constraint for Debts

    if (this.props.debtIds.some((id) => id.equals(debt.id)))
      throw new EstateOperationException('Debt already exists');
    if (!debt.estateId.equals(this.id))
      throw new EstateOperationException('Debt estate ID mismatch');

    this.mutableProps.debtIds.push(debt.id);
    this.mutableProps.updatedAt = new Date();
  }

  public removeDebt(debtId: UniqueEntityID): void {
    // Debts can be removed (e.g. erroneous claim) even if frozen, but ideally marked rejected instead
    const index = this.props.debtIds.findIndex((id) => id.equals(debtId));
    if (index === -1) throw new EstateOperationException('Debt not found');

    this.mutableProps.debtIds.splice(index, 1);
    this.mutableProps.updatedAt = new Date();
  }

  public addGift(gift: GiftInterVivos): void {
    if (!gift) throw new EstateOperationException('Gift cannot be null');
    // Gifts Inter Vivos happen BEFORE death. Adding them post-death is strictly for record keeping of past events.

    if (this.props.giftIds.some((id) => id.equals(gift.id)))
      throw new EstateOperationException('Gift already exists');
    if (!gift.estateId.equals(this.id))
      throw new EstateOperationException('Gift estate ID mismatch');

    this.mutableProps.giftIds.push(gift.id);
    this.mutableProps.updatedAt = new Date();
  }

  // --- Status Management ---

  public freezeEstate(dateOfDeath: Date, deathCertNumber?: string): void {
    if (this.props.isFrozen) throw new EstateOperationException('Estate is already frozen');
    if (dateOfDeath > new Date())
      throw new EstateOperationException('Date of death cannot be in future');

    this.mutableProps.deceasedDateOfDeath = dateOfDeath;
    if (deathCertNumber) this.mutableProps.deceasedDeathCertNumber = deathCertNumber;

    this.mutableProps.isFrozen = true;
    this.mutableProps.frozenAt = new Date();
    this.mutableProps.status = EstateStatus.FROZEN;
    this.mutableProps.updatedAt = new Date();

    this.addDomainEvent(
      new EstateFrozenEvent(this.id.toString(), 'Estate', this.version, {
        dateOfDeath,
        reason: 'Testator Deceased',
      }),
    );
  }

  public unfreezeEstate(reason: string): void {
    if (!this.props.isFrozen) throw new EstateOperationException('Estate is not frozen');
    if (!reason || reason.trim().length < 10)
      throw new EstateOperationException('Unfreeze reason required');

    this.mutableProps.isFrozen = false;
    this.mutableProps.frozenAt = null;
    this.mutableProps.status = EstateStatus.ACTIVE;
    this.mutableProps.updatedAt = new Date();
  }

  // --- S.35(3) Hotchpot ---

  public calculateHotchpot(reconciliationDate: Date = new Date()): void {
    if (!this.props.isFrozen)
      throw new EstateOperationException('Hotchpot only applies to frozen estates (S.35 LSA)');

    // NOTE: Aggregate Root shouldn't loop through entities if they aren't loaded in memory.
    // In DDD, typically a Domain Service (EstateCalculationService) handles this by loading entities and performing math.
    // The Aggregate acts as the transaction boundary.
    // We update the summary fields here assuming the service passed the values or we dispatch an event to trigger calculation.

    this.addDomainEvent(
      new EstateHotchpotCalculatedEvent(this.id.toString(), 'Estate', this.version, {
        reconciliationDate,
      }),
    );
    // Actual logic for summation requires access to GiftInterVivos Entities
  }

  // --- S.40 Polygamy ---

  public updatePolygamousDetails(isPolygamous: boolean, houseCount: number): void {
    if (this.props.isFrozen)
      throw new EstateOperationException('Cannot modify structure of frozen estate');
    if (isPolygamous && houseCount < 2)
      throw new EstateOperationException('Polygamous estate must have 2+ houses');

    this.mutableProps.isPolygamous = isPolygamous;
    this.mutableProps.polygamousHouseCount = houseCount;
    this.mutableProps.updatedAt = new Date();
  }

  public linkSuccessionCase(caseId: string): void {
    if (!caseId) throw new EstateOperationException('Case ID required');
    if (this.props.successionCaseId) throw new EstateOperationException('Already linked to a case');

    this.mutableProps.successionCaseId = new UniqueEntityID(caseId);
    this.mutableProps.status = EstateStatus.PROBATE;
    this.mutableProps.updatedAt = new Date();
  }

  // --- Getters ---

  get id(): UniqueEntityID {
    return this._id;
  }
  get deceasedId(): UniqueEntityID {
    return this.props.deceasedId;
  }
  get status(): EstateStatus {
    return this.props.status;
  }
  get isFrozen(): boolean {
    return this.props.isFrozen;
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

  // Static Factory Helpers
  public static createForPlanning(props: any): Estate {
    return Estate.create({ ...props, deceasedDateOfDeath: undefined });
  }
}
