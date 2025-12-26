// src/estate-service/src/domain/entities/gift-inter-vivos.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { AssetType, AssetTypeHelper } from '../enums/asset-type.enum';
import {
  GiftInterVivosContestedEvent,
  GiftInterVivosCreatedEvent,
  GiftInterVivosExcludedEvent,
  GiftInterVivosReclassifiedEvent,
  GiftInterVivosResolvedEvent,
} from '../events/gift-inter-vivos.event';
import {
  GiftLogicException,
  InvalidGiftValueException,
} from '../exceptions/gift-inter-vivos.exception';
import { MoneyVO } from '../value-objects/money.vo';

/**
 * Gift Status Enum
 *
 * Legal Context (S.35(3) LSA - Hotchpot Rule):
 * - CONFIRMED: Gift accepted as valid for hotchpot calculation
 * - CONTESTED: Disputed by other heirs
 * - EXCLUDED: Court ruled exempt from hotchpot
 * - RECLASSIFIED_AS_LOAN: Reclassified as loan (becomes estate asset)
 * - VOID: Gift declared void/illegal
 */
export enum GiftStatus {
  CONFIRMED = 'CONFIRMED',
  CONTESTED = 'CONTESTED',
  EXCLUDED = 'EXCLUDED',
  RECLASSIFIED_AS_LOAN = 'RECLASSIFIED_AS_LOAN',
  VOID = 'VOID',
}

export interface GiftInterVivosProps {
  estateId: string;

  // Recipient (must be FamilyMember)
  recipientId: string;
  recipientName?: string;

  // Gift Details
  description: string;
  assetType: AssetType; // Type of gifted asset
  valueAtTimeOfGift: MoneyVO;
  dateGiven: Date;

  // Legal Context
  isFormalGift: boolean; // Formal deed of gift vs informal
  deedOfGiftRef?: string; // Document reference
  witnesses?: string[]; // Names of witnesses

  // Hotchpot Calculation
  isSubjectToHotchpot: boolean; // S.35(3) applies
  hotchpotMultiplier?: number; // Adjustment factor (usually 1.0)

  // Status & Disputes
  status: GiftStatus;
  contestReason?: string;
  contestedBy?: string;
  contestedAt?: Date;
  courtOrderRef?: string; // If court ruled on it

  // Relationship Context
  givenDuringLifetime: boolean; // Must be true for inter vivos
  relationshipToDeceased?: string; // e.g., "Son", "Daughter", "Nephew"

  // Metadata
  notes?: string;
  requiresReconciliation: boolean; // Needs to be reconciled with other gifts
}

/**
 * Gift Inter Vivos Entity
 *
 * Implements S.35(3) "Hotchpot Rule" of Law of Succession Act.
 *
 * BUSINESS RULES:
 * 1. Only gifts given during deceased's lifetime count
 * 2. Must be formalized (preferably with deed of gift)
 * 3. Value added back to estate for calculation purposes
 * 4. Disputes can exclude gifts from hotchpot
 * 5. Court can reclassify gifts as loans
 *
 * LEGAL CONTEXT:
 * - "Where a child has received a gift... that gift shall be taken into account"
 * - Protects other heirs from unequal treatment
 * - Prevents double-dipping by recipients
 */
export class GiftInterVivos extends Entity<GiftInterVivosProps> {
  private constructor(props: GiftInterVivosProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
    this.validate();
  }

  /**
   * Factory method to create a new gift
   */
  public static create(
    props: Omit<
      GiftInterVivosProps,
      'status' | 'isSubjectToHotchpot' | 'requiresReconciliation' | 'givenDuringLifetime'
    >,
    id?: UniqueEntityID,
  ): GiftInterVivos {
    // Validate gift value
    // FIX: Add isPositive() method to MoneyVO or use isGreaterThan(MoneyVO.zero())
    if (props.valueAtTimeOfGift.isZero() || props.valueAtTimeOfGift.amount <= 0) {
      throw new InvalidGiftValueException(
        props.estateId,
        props.valueAtTimeOfGift.amount,
        props.valueAtTimeOfGift.currency,
      );
    }

    // Validate date is in the past (inter vivos gifts)
    if (props.dateGiven > new Date()) {
      throw new GiftLogicException('Gift date cannot be in the future');
    }

    // Validate date is not too far in the past (statute limitations)
    const yearsAgo = (new Date().getTime() - props.dateGiven.getTime()) / (1000 * 3600 * 24 * 365);
    if (yearsAgo > 12) {
      // 12 years limitation for property disputes
      console.warn(
        `Warning: Gift was given ${yearsAgo.toFixed(1)} years ago, may be statute barred`,
      );
    }

    const gift = new GiftInterVivos(
      {
        ...props,
        status: GiftStatus.CONFIRMED,
        isSubjectToHotchpot: true, // Default applies
        requiresReconciliation: !props.isFormalGift, // Informal gifts need reconciliation
        givenDuringLifetime: true, // By definition for inter vivos
      },
      id,
    );

    gift.addDomainEvent(
      new GiftInterVivosCreatedEvent(
        gift.id.toString(),
        props.estateId,
        props.recipientId,
        props.assetType,
        props.valueAtTimeOfGift.amount,
        gift.version,
      ),
    );

    return gift;
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  private validate(): void {
    // High-value gifts require formal documentation
    if (
      this.props.valueAtTimeOfGift.isGreaterThan(MoneyVO.createKES(1000000)) &&
      !this.props.isFormalGift
    ) {
      console.warn(
        `Warning: High-value gift (${this.props.valueAtTimeOfGift.toString()}) lacks formal documentation`,
      );
    }

    // Gifts to non-family members may have different tax implications
    if (
      !this.props.relationshipToDeceased?.toLowerCase().includes('child') &&
      !this.props.relationshipToDeceased?.toLowerCase().includes('spouse')
    ) {
      console.warn(
        `Warning: Gift to ${this.props.relationshipToDeceased} may have different legal treatment`,
      );
    }
  }

  // ===========================================================================
  // HOTCHPOT CALCULATIONS
  // ===========================================================================

  /**
   * Calculate hotchpot-adjusted value
   */
  public getHotchpotValue(): MoneyVO {
    if (!this.props.isSubjectToHotchpot || this.props.status !== GiftStatus.CONFIRMED) {
      return MoneyVO.zero(this.props.valueAtTimeOfGift.currency);
    }

    // Apply multiplier if specified (e.g., inflation adjustment)
    const multiplier = this.props.hotchpotMultiplier || 1.0;
    return this.props.valueAtTimeOfGift.multiply(multiplier);
  }

  /**
   * Check if gift should be included in hotchpot calculations
   */
  public isIncludedInHotchpot(): boolean {
    return this.props.isSubjectToHotchpot && this.props.status === GiftStatus.CONFIRMED;
  }

  // ===========================================================================
  // DISPUTE & LEGAL MANAGEMENT
  // ===========================================================================

  /**
   * Contest the gift (other heirs dispute)
   */
  public contest(reason: string, contestedBy: string, evidence?: string): void {
    if (this.props.status !== GiftStatus.CONFIRMED) {
      throw new GiftLogicException(`Cannot contest gift in status: ${this.props.status}`);
    }

    this.updateState({
      status: GiftStatus.CONTESTED,
      contestReason: reason,
      contestedBy,
      contestedAt: new Date(),
      notes: `Contested: ${reason}. Evidence: ${evidence}. ${this.props.notes || ''}`,
    });

    this.addDomainEvent(
      new GiftInterVivosContestedEvent(
        this.id.toString(),
        this.props.estateId,
        this.props.recipientId,
        reason,
        contestedBy,
        this.version,
      ),
    );
  }

  /**
   * Resolve contestation (court or executor decision)
   */
  public resolveContestation(
    outcome: GiftStatus,
    resolution: string,
    resolvedBy: string,
    courtOrderRef?: string,
  ): void {
    if (this.props.status !== GiftStatus.CONTESTED) {
      throw new GiftLogicException('Cannot resolve non-contested gift');
    }

    const oldStatus = this.props.status;

    this.updateState({
      status: outcome,
      contestReason: undefined,
      contestedBy: undefined,
      courtOrderRef,
      notes: `Resolved: ${resolution}. Outcome: ${outcome}. ${this.props.notes || ''}`,
    });

    this.addDomainEvent(
      new GiftInterVivosResolvedEvent(
        this.id.toString(),
        this.props.estateId,
        this.props.recipientId,
        oldStatus,
        outcome,
        resolution,
        resolvedBy,
        this.version,
      ),
    );
  }

  /**
   * Exclude gift from hotchpot (court order)
   */
  public excludeFromHotchpot(reason: string, excludedBy: string, courtOrderRef?: string): void {
    this.updateState({
      status: GiftStatus.EXCLUDED,
      isSubjectToHotchpot: false,
      courtOrderRef,
      notes: `Excluded from hotchpot: ${reason}. ${this.props.notes || ''}`,
    });

    this.addDomainEvent(
      new GiftInterVivosExcludedEvent(
        this.id.toString(),
        this.props.estateId,
        this.props.recipientId,
        reason,
        excludedBy,
        this.version,
      ),
    );
  }

  /**
   * Reclassify gift as loan
   */
  public reclassifyAsLoan(reason: string, reclassifiedBy: string, loanTerms?: string): void {
    this.updateState({
      status: GiftStatus.RECLASSIFIED_AS_LOAN,
      isSubjectToHotchpot: false,
      notes: `Reclassified as loan: ${reason}. Terms: ${loanTerms}. ${this.props.notes || ''}`,
    });

    this.addDomainEvent(
      new GiftInterVivosReclassifiedEvent(
        this.id.toString(),
        this.props.estateId,
        this.props.recipientId,
        this.props.valueAtTimeOfGift.amount,
        reason,
        reclassifiedBy,
        this.version,
      ),
    );
  }

  /**
   * Declare gift void (e.g., fraud, undue influence)
   */
  public declareVoid(reason: string, _declaredBy: string, courtOrderRef?: string): void {
    this.updateState({
      status: GiftStatus.VOID,
      isSubjectToHotchpot: false,
      courtOrderRef,
      notes: `Declared void: ${reason}. ${this.props.notes || ''}`,
    });
  }

  // ===========================================================================
  // UPDATES & ADJUSTMENTS
  // ===========================================================================

  /**
   * Update gift value (e.g., inflation adjustment)
   */
  public updateValue(newValue: MoneyVO, reason: string, _updatedBy: string): void {
    if (this.props.status !== GiftStatus.CONFIRMED) {
      throw new GiftLogicException(`Cannot update value of gift in status: ${this.props.status}`);
    }

    const oldValue = this.props.valueAtTimeOfGift;

    this.updateState({
      valueAtTimeOfGift: newValue,
      notes: `Value updated: ${oldValue.toString()} -> ${newValue.toString()}. Reason: ${reason}. ${this.props.notes || ''}`,
    });
  }

  /**
   * Set hotchpot multiplier (e.g., for inflation adjustment)
   */
  public setHotchpotMultiplier(multiplier: number, reason: string, _setBy: string): void {
    if (multiplier < 0) {
      throw new GiftLogicException('Hotchpot multiplier cannot be negative');
    }

    this.updateState({
      hotchpotMultiplier: multiplier,
      notes: `Hotchpot multiplier set to ${multiplier}: ${reason}. ${this.props.notes || ''}`,
    });
  }

  // ===========================================================================
  // VALIDATION QUERIES
  // ===========================================================================

  /**
   * Check if gift requires formal documentation
   */
  public requiresFormalDocumentation(): boolean {
    return this.props.valueAtTimeOfGift.isGreaterThan(MoneyVO.createKES(500000)); // 500K threshold
  }

  /**
   * Check if gift is statute barred (12 years limitation)
   */
  public isStatuteBarred(): boolean {
    const yearsAgo =
      (new Date().getTime() - this.props.dateGiven.getTime()) / (1000 * 3600 * 24 * 365);
    return yearsAgo > 12; // 12 years for property claims
  }

  /**
   * Check if gift is to a child (special S.35(3) treatment)
   */
  public isToChild(): boolean {
    const relationship = this.props.relationshipToDeceased?.toLowerCase() || '';
    return (
      relationship.includes('child') ||
      relationship.includes('son') ||
      relationship.includes('daughter')
    );
  }
  /**
   * Get asset type description
   */
  public getAssetTypeDescription(): string {
    return AssetTypeHelper.getDescription(this.props.assetType);
  }

  /**
   * Check if this gift asset requires registry transfer
   */
  public requiresRegistryTransfer(): boolean {
    return AssetTypeHelper.requiresRegistryTransfer(this.props.assetType);
  }

  /**
   * Check if this gift asset is liquid
   */
  public isLiquidAsset(): boolean {
    return AssetTypeHelper.isLiquid(this.props.assetType);
  }

  /**
   * Get typical documentation required for this gift
   */
  public getRequiredDocumentation(): string[] {
    return AssetTypeHelper.getTransferDocumentation(this.props.assetType);
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  get estateId(): string {
    return this.props.estateId;
  }

  get recipientId(): string {
    return this.props.recipientId;
  }

  get valueAtTimeOfGift(): MoneyVO {
    return this.props.valueAtTimeOfGift;
  }

  get status(): GiftStatus {
    return this.props.status;
  }

  get assetType(): AssetType {
    return this.props.assetType;
  }

  get dateGiven(): Date {
    return this.props.dateGiven;
  }

  get isSubjectToHotchpot(): boolean {
    return this.props.isSubjectToHotchpot;
  }

  get hotchpotValue(): MoneyVO {
    return this.getHotchpotValue();
  }
}
