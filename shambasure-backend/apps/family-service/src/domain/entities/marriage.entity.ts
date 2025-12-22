// domain/entities/marriage.entity.ts
import { MarriageEndReason, MarriageType } from '@prisma/client';

import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { InvalidMarriageException } from '../exceptions/marriage.exception';
import { BridePrice } from '../value-objects/financial/bride-price.vo';
import { CustomaryMarriage } from '../value-objects/legal/customary-marriage.vo';
import { IslamicMarriage } from '../value-objects/legal/islamic-marriage.vo';
// Value Objects
import { MarriageDetails } from '../value-objects/legal/marriage-details.vo';
import { KenyanMarriageDates } from '../value-objects/temporal/kenyan-marriage-dates.vo';

/**
 * Marriage Entity Props (Immutable)
 *
 * Design Decision: Marriage is an ENTITY within Family aggregate
 * - Represents legal union between two FamilyMembers
 * - Critical for S. 35/40 LSA succession calculations
 * - Affects matrimonial property division
 *
 * Kenyan Law Context:
 * - Multiple marriage types (Civil, Customary, Islamic, Traditional)
 * - S. 40 LSA: Polygamous marriages have special distribution rules
 * - Matrimonial Property Act 2013: Property division on dissolution
 * - Marriage Act 2014: Recognition of different marriage types
 */
export interface MarriageProps {
  // References
  familyId: UniqueEntityID;
  spouse1Id: UniqueEntityID;
  spouse2Id: UniqueEntityID;

  // Core Marriage Data (Value Objects)
  type: MarriageType;
  details: MarriageDetails;
  dates: KenyanMarriageDates;

  // Optional VOs by Marriage Type
  bridePrice?: BridePrice; // Customary/Traditional
  customaryMarriage?: CustomaryMarriage; // Customary/Traditional
  islamicMarriage?: IslamicMarriage; // Islamic

  // Cached Registration Details (for querying)
  registrationNumber?: string;
  issuingAuthority?: string;
  certificateIssueDate?: Date;
  registrationDistrict?: string;

  // Marriage End Tracking
  endReason: MarriageEndReason;
  endDate?: Date;
  deceasedSpouseId?: UniqueEntityID;

  // Divorce Specifics
  divorceDecreeNumber?: string;
  divorceCourt?: string;
  divorceDate?: Date;

  // S. 40 LSA - Polygamous Marriage Compliance
  isPolygamousUnderS40: boolean;
  s40CertificateNumber?: string;
  polygamousHouseId?: UniqueEntityID;

  // Matrimonial Property Act 2013
  isMatrimonialPropertyRegime: boolean;
  matrimonialPropertySettled: boolean;

  // Pre-Marriage Status (for validity checks)
  spouse1MaritalStatusAtMarriage?: string;
  spouse2MaritalStatusAtMarriage?: string;

  // Separation Tracking
  separationDate?: Date;
  separationReason?: string;
  maintenanceOrderIssued: boolean;
  maintenanceOrderNumber?: string;

  // Court Validation
  courtValidationDate?: Date;
  isValidUnderKenyanLaw: boolean;
  invalidityReason?: string;

  // Status
  isActive: boolean;
}

/**
 * Factory Props for Creating New Marriage
 */
export interface CreateMarriageProps {
  familyId: string;
  spouse1Id: string;
  spouse2Id: string;
  type: MarriageType;
  startDate: Date;

  // Registration Details
  registrationNumber?: string;
  issuingAuthority?: string;
  certificateIssueDate?: Date;
  registrationDistrict?: string;

  // Customary Marriage
  customary?: {
    ethnicGroup: string;
    customaryType: string;
    ceremonyLocation: string;
    dowryAmount?: number;
    dowryCurrency?: string;
    dowryPaid?: boolean;
    elderWitnesses?: Array<{
      name: string;
      age: number;
      relationship: string;
    }>;
    clanApproval?: boolean;
    clanApprovalDate?: Date;
    familyConsent?: boolean;
    familyConsentDate?: Date;
  };

  // Islamic Marriage
  islamic?: {
    nikahDate: Date;
    nikahLocation: string;
    imamName: string;
    waliName: string;
    mahrAmount: number;
    mahrCurrency?: string;
  };

  // S. 40 Polygamy
  polygamy?: {
    isPolygamous: boolean;
    s40CertificateNumber?: string;
    polygamousHouseId?: string;
  };

  // Matrimonial Property
  matrimonialPropertyRegime?: boolean;

  // Pre-Marriage Status
  spouse1MaritalStatusAtMarriage?: string;
  spouse2MaritalStatusAtMarriage?: string;
}

/**
 * Marriage Entity
 *
 * Represents legal union under Kenyan law.
 * Critical for succession calculations and property division.
 *
 * Kenyan Marriage Types:
 * 1. CIVIL - Marriage Act 2014, Sec 6-26 (Monogamous)
 * 2. CHRISTIAN - Marriage Act 2014, Sec 27-37 (Monogamous)
 * 3. CUSTOMARY - Marriage Act 2014, Sec 38-44 (Can be polygamous)
 * 4. ISLAMIC - Marriage Act 2014, Sec 45-56 (Can be polygamous)
 * 5. TRADITIONAL - Customary variant
 *
 * Key Legal Requirements:
 * - S. 40 LSA: Polygamous marriages need court certification
 * - Matrimonial Property Act 2013: Property division rules
 * - Marriage Act 2014: Different requirements per type
 */
export class Marriage extends Entity<MarriageProps> {
  private constructor(id: UniqueEntityID, props: MarriageProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  // =========================================================================
  // FACTORY METHODS
  // =========================================================================

  /**
   * Create new marriage
   *
   * Kenyan Law Context:
   * - Must be legally valid per Marriage Act 2014
   * - Type determines succession rules (S. 35/40 LSA)
   * - Registration required for civil/christian marriages
   */
  public static create(props: CreateMarriageProps): Marriage {
    const id = new UniqueEntityID();
    const now = new Date();

    // Build Value Objects
    const dates = Marriage.buildDates(props);
    const details = Marriage.buildDetails(props);
    const bridePrice = Marriage.buildBridePrice(props);
    const customaryMarriage = Marriage.buildCustomaryMarriage(props);
    const islamicMarriage = Marriage.buildIslamicMarriage(props);

    const marriageProps: MarriageProps = {
      familyId: new UniqueEntityID(props.familyId),
      spouse1Id: new UniqueEntityID(props.spouse1Id),
      spouse2Id: new UniqueEntityID(props.spouse2Id),
      type: props.type,
      details,
      dates,
      bridePrice,
      customaryMarriage,
      islamicMarriage,

      // Registration
      registrationNumber: props.registrationNumber,
      issuingAuthority: props.issuingAuthority,
      certificateIssueDate: props.certificateIssueDate,
      registrationDistrict: props.registrationDistrict,

      // Status
      endReason: MarriageEndReason.STILL_ACTIVE,
      isActive: true,

      // S. 40 Polygamy
      isPolygamousUnderS40: props.polygamy?.isPolygamous || false,
      s40CertificateNumber: props.polygamy?.s40CertificateNumber,
      polygamousHouseId: props.polygamy?.polygamousHouseId
        ? new UniqueEntityID(props.polygamy.polygamousHouseId)
        : undefined,

      // Matrimonial Property
      isMatrimonialPropertyRegime: props.matrimonialPropertyRegime ?? true,
      matrimonialPropertySettled: false,

      // Pre-marriage status
      spouse1MaritalStatusAtMarriage: props.spouse1MaritalStatusAtMarriage,
      spouse2MaritalStatusAtMarriage: props.spouse2MaritalStatusAtMarriage,

      // Maintenance
      maintenanceOrderIssued: false,

      // Validation
      isValidUnderKenyanLaw: true,
    };

    return new Marriage(id, marriageProps, now);
  }

  /**
   * Reconstitute from persistence (Repository)
   */
  public static fromPersistence(
    id: string,
    props: MarriageProps,
    createdAt: Date,
    updatedAt?: Date,
  ): Marriage {
    const entityId = new UniqueEntityID(id);
    const marriage = new Marriage(entityId, props, createdAt);

    if (updatedAt) {
      (marriage as any)._updatedAt = updatedAt;
    }

    return marriage;
  }

  // =========================================================================
  // PRIVATE BUILDERS (Factory Helpers)
  // =========================================================================

  private static buildDates(props: CreateMarriageProps): KenyanMarriageDates {
    let dates = KenyanMarriageDates.create(props.startDate, props.type);

    if (props.certificateIssueDate) {
      dates = dates.issueCertificate(props.certificateIssueDate);
    }

    if (props.registrationNumber) {
      dates = dates.registerMarriage(new Date(), props.registrationNumber);
    }

    return dates;
  }

  private static buildDetails(props: CreateMarriageProps): MarriageDetails {
    let details = MarriageDetails.create(props.type, props.startDate);

    // Civil/Christian Registration
    if (
      props.registrationNumber &&
      props.certificateIssueDate &&
      props.issuingAuthority &&
      props.registrationDistrict
    ) {
      details = details.registerCivilMarriage(
        props.registrationNumber,
        props.certificateIssueDate,
        props.issuingAuthority,
        props.registrationDistrict,
      );
    }

    // Customary Details
    if (
      props.customary &&
      (props.type === MarriageType.CUSTOMARY || props.type === MarriageType.TRADITIONAL)
    ) {
      details = details.addCustomaryDetails(
        props.customary.customaryType,
        props.customary.dowryPaid || false,
        props.customary.dowryAmount,
        props.customary.dowryCurrency,
      );
    }

    // Islamic Details
    if (props.islamic && props.type === MarriageType.ISLAMIC) {
      details = details.addIslamicDetails(
        props.islamic.nikahDate,
        props.islamic.mahrAmount,
        props.islamic.mahrCurrency,
        props.islamic.waliName,
      );
    }

    return details;
  }

  private static buildBridePrice(props: CreateMarriageProps): BridePrice | undefined {
    if (!props.customary) return undefined;
    if (props.type !== MarriageType.CUSTOMARY && props.type !== MarriageType.TRADITIONAL) {
      return undefined;
    }

    const amount = props.customary.dowryAmount || 0;
    const currency = props.customary.dowryCurrency || 'KES';
    let bridePrice = BridePrice.create(amount, currency);

    // Add payment if marked as paid
    if (props.customary.dowryPaid && amount > 0) {
      bridePrice = bridePrice.addPayment({
        type: 'CASH',
        description: 'Initial bride price payment',
        totalValue: amount,
        date: props.startDate,
        witnesses: [],
      });
    }

    return bridePrice;
  }

  private static buildCustomaryMarriage(props: CreateMarriageProps): CustomaryMarriage | undefined {
    if (!props.customary) return undefined;
    if (props.type !== MarriageType.CUSTOMARY && props.type !== MarriageType.TRADITIONAL) {
      return undefined;
    }

    const { ethnicGroup, customaryType, ceremonyLocation } = props.customary;
    if (!ethnicGroup || !customaryType || !ceremonyLocation) {
      return undefined;
    }

    let customary = CustomaryMarriage.create(
      ethnicGroup,
      customaryType,
      props.startDate,
      ceremonyLocation,
    );

    // Add elder witnesses
    if (props.customary.elderWitnesses) {
      props.customary.elderWitnesses.forEach((witness) => {
        customary = customary.addElderWitness(witness.name, witness.age, witness.relationship);
      });
    }

    // Clan approval
    if (props.customary.clanApproval && props.customary.clanApprovalDate) {
      customary = customary.grantClanApproval(props.customary.clanApprovalDate);
    }

    // Family consent
    if (props.customary.familyConsent && props.customary.familyConsentDate) {
      customary = customary.grantFamilyConsent(props.customary.familyConsentDate);
    }

    return customary;
  }

  private static buildIslamicMarriage(props: CreateMarriageProps): IslamicMarriage | undefined {
    if (!props.islamic) return undefined;
    if (props.type !== MarriageType.ISLAMIC) return undefined;

    const { nikahDate, nikahLocation, imamName, waliName, mahrAmount } = props.islamic;

    return IslamicMarriage.create(nikahDate, nikahLocation, imamName, waliName, mahrAmount);
  }

  // =========================================================================
  // VALIDATION (Invariants)
  // =========================================================================

  /**
   * Validate marriage invariants
   *
   * Kenyan Law Requirements:
   * - Spouses must be different people
   * - Marriage type must match supporting documents
   * - S. 40 polygamy only for Customary/Islamic marriages
   * - Registration required for Civil/Christian marriages
   */
  public validate(): void {
    // Basic validation
    if (this.props.spouse1Id.equals(this.props.spouse2Id)) {
      throw new InvalidMarriageException('Spouses cannot be the same person');
    }

    // S. 40 LSA Compliance
    if (this.props.isPolygamousUnderS40) {
      if (this.props.type === MarriageType.CHRISTIAN || this.props.type === MarriageType.CIVIL) {
        throw new InvalidMarriageException(
          'Christian/Civil marriages cannot be polygamous under S. 40 LSA. ' +
            'Only Customary/Islamic marriages support polygamy.',
        );
      }
    }

    // Islamic marriage must have Islamic details
    if (this.props.type === MarriageType.ISLAMIC && !this.props.islamicMarriage) {
      throw new InvalidMarriageException(
        'Islamic marriage requires Islamic marriage details (nikah)',
      );
    }

    // Customary marriage must have customary details
    if (
      (this.props.type === MarriageType.CUSTOMARY ||
        this.props.type === MarriageType.TRADITIONAL) &&
      !this.props.customaryMarriage
    ) {
      throw new InvalidMarriageException(
        'Customary/Traditional marriage requires customary marriage details',
      );
    }

    // Civil/Christian marriages require registration
    if (
      (this.props.type === MarriageType.CIVIL || this.props.type === MarriageType.CHRISTIAN) &&
      !this.props.registrationNumber
    ) {
      console.warn('Civil/Christian marriage should have registration number');
    }
  }

  // =========================================================================
  // BUSINESS LOGIC (State Transitions)
  // =========================================================================

  /**
   * Assign to polygamous house (S. 40 LSA)
   * Only applicable for Customary/Islamic marriages
   */
  public assignToPolygamousHouse(houseId: string, s40CertificateNumber?: string): Marriage {
    this.ensureNotDeleted();

    if (this.props.type === MarriageType.CHRISTIAN || this.props.type === MarriageType.CIVIL) {
      throw new InvalidMarriageException(
        'Monogamous unions (Civil/Christian) cannot be assigned to polygamous house',
      );
    }

    if (!this.props.isActive) {
      throw new InvalidMarriageException('Cannot assign inactive marriage to polygamous house');
    }

    // Update value objects
    const newDates = this.props.dates.establishPolygamousHouse(new Date());
    const newDetails = this.props.details.markAsPolygamous(houseId);

    const newProps: MarriageProps = {
      ...this.props,
      dates: newDates,
      details: newDetails,
      polygamousHouseId: new UniqueEntityID(houseId),
      isPolygamousUnderS40: true,
      s40CertificateNumber: s40CertificateNumber || this.props.s40CertificateNumber,
    };

    return new Marriage(this._id, newProps, this._createdAt);
  }

  /**
   * Dissolve marriage (divorce, annulment, customary dissolution)
   *
   * Kenyan Law Context:
   * - Different rules for different marriage types
   * - Islamic: Talaq procedures
   * - Customary: Bride price may be returned
   * - Civil/Christian: Court decree required
   */
  public dissolve(params: {
    date: Date;
    reason: string;
    courtDecreeNumber?: string;
    divorceCourt?: string;
    returnOfBridePrice?: boolean;
    dissolutionType?: 'DIVORCE' | 'ANNULMENT' | 'CUSTOMARY_DISSOLUTION';
  }): Marriage {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      throw new InvalidMarriageException('Marriage is already dissolved');
    }

    if (params.date < this.props.dates.marriageDate) {
      throw new InvalidMarriageException('Dissolution date cannot be before marriage date');
    }

    // Determine end reason
    let endReason: MarriageEndReason;
    let dissolutionType = params.dissolutionType || 'DIVORCE';

    if (this.isCustomary) {
      endReason = MarriageEndReason.CUSTOMARY_DISSOLUTION;
      dissolutionType = 'CUSTOMARY_DISSOLUTION';
    } else if (params.reason.toLowerCase().includes('annulment')) {
      endReason = MarriageEndReason.ANNULMENT;
      dissolutionType = 'ANNULMENT';
    } else {
      endReason = MarriageEndReason.DIVORCE;
    }

    // Update value objects
    const newDates = this.props.dates.dissolveMarriage(params.date, dissolutionType, params.reason);

    const newDetails = this.props.details.endMarriage(params.date, endReason);

    // Handle Islamic dissolution
    let newIslamicMarriage = this.props.islamicMarriage;
    if (this.isIslamic && newIslamicMarriage) {
      newIslamicMarriage = newIslamicMarriage.issueTalaq('TALAQ_AL_BIDDAH', params.date, 3);
    }

    // Handle Customary dissolution
    let newCustomaryMarriage = this.props.customaryMarriage;
    if (this.isCustomary && newCustomaryMarriage) {
      newCustomaryMarriage = newCustomaryMarriage.dissolveMarriage(params.date, params.reason);
    }

    // Handle bride price return
    let newBridePrice = this.props.bridePrice;
    if (newBridePrice && params.returnOfBridePrice) {
      newBridePrice = newBridePrice.addNotes('Bride price returned upon dissolution');
    }

    const newProps: MarriageProps = {
      ...this.props,
      dates: newDates,
      details: newDetails,
      islamicMarriage: newIslamicMarriage,
      customaryMarriage: newCustomaryMarriage,
      bridePrice: newBridePrice,
      isActive: false,
      endReason,
      endDate: params.date,
      divorceDecreeNumber: params.courtDecreeNumber,
      divorceCourt: params.courtDecreeNumber ? params.divorceCourt : undefined,
      divorceDate: params.date,
    };

    return new Marriage(this._id, newProps, this._createdAt);
  }

  /**
   * Record death of spouse
   * Automatically dissolves marriage
   * Critical trigger for succession process (S. 83 LSA)
   */
  public recordDeathOfSpouse(deceasedSpouseId: string, dateOfDeath: Date): Marriage {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      // Already dissolved, just return current instance
      return this;
    }

    // Validate deceased spouse is one of the spouses
    const deceasedId = new UniqueEntityID(deceasedSpouseId);
    if (!this.props.spouse1Id.equals(deceasedId) && !this.props.spouse2Id.equals(deceasedId)) {
      throw new InvalidMarriageException('Deceased spouse must be one of the marriage spouses');
    }

    // Update value objects
    const newDates = this.props.dates.dissolveMarriage(dateOfDeath, 'DEATH', 'Death of spouse');

    const newDetails = this.props.details.endMarriage(
      dateOfDeath,
      MarriageEndReason.DEATH_OF_SPOUSE,
    );

    const newProps: MarriageProps = {
      ...this.props,
      dates: newDates,
      details: newDetails,
      deceasedSpouseId: deceasedId,
      isActive: false,
      endReason: MarriageEndReason.DEATH_OF_SPOUSE,
      endDate: dateOfDeath,
    };

    return new Marriage(this._id, newProps, this._createdAt);
  }

  /**
   * Update separation details
   * Does not dissolve marriage (still legally married)
   */
  public updateSeparation(params: { date: Date; reason?: string }): Marriage {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      throw new InvalidMarriageException('Cannot update separation for dissolved marriage');
    }

    const newProps: MarriageProps = {
      ...this.props,
      separationDate: params.date,
      separationReason: params.reason,
    };

    return new Marriage(this._id, newProps, this._createdAt);
  }

  /**
   * Issue maintenance order
   * Required for separated/divorced spouses
   */
  public issueMaintenanceOrder(orderNumber: string): Marriage {
    this.ensureNotDeleted();

    const newProps: MarriageProps = {
      ...this.props,
      maintenanceOrderIssued: true,
      maintenanceOrderNumber: orderNumber,
    };

    return new Marriage(this._id, newProps, this._createdAt);
  }

  /**
   * Settle matrimonial property (Matrimonial Property Act 2013)
   * Must be done before final distribution
   */
  public settleMatrimonialProperty(): Marriage {
    this.ensureNotDeleted();

    if (!this.props.isMatrimonialPropertyRegime) {
      throw new InvalidMarriageException('Matrimonial property regime not applicable');
    }

    if (this.props.matrimonialPropertySettled) {
      throw new InvalidMarriageException('Matrimonial property already settled');
    }

    const newDetails = this.props.details.settleMatrimonialProperty();

    const newProps: MarriageProps = {
      ...this.props,
      details: newDetails,
      matrimonialPropertySettled: true,
    };

    return new Marriage(this._id, newProps, this._createdAt);
  }

  /**
   * Invalidate marriage (court order)
   * Used for bigamy, underage marriage, etc.
   */
  public invalidate(reason: string, courtDate: Date): Marriage {
    this.ensureNotDeleted();

    const newProps: MarriageProps = {
      ...this.props,
      isValidUnderKenyanLaw: false,
      invalidityReason: reason,
      courtValidationDate: courtDate,
      isActive: false,
      endReason: MarriageEndReason.ANNULMENT,
      endDate: courtDate,
    };

    return new Marriage(this._id, newProps, this._createdAt);
  }

  // =========================================================================
  // GETTERS (Read-Only Access)
  // =========================================================================

  get familyId(): UniqueEntityID {
    return this.props.familyId;
  }

  get spouse1Id(): UniqueEntityID {
    return this.props.spouse1Id;
  }

  get spouse2Id(): UniqueEntityID {
    return this.props.spouse2Id;
  }

  get type(): MarriageType {
    return this.props.type;
  }

  get details(): MarriageDetails {
    return this.props.details;
  }

  get dates(): KenyanMarriageDates {
    return this.props.dates;
  }

  get bridePrice(): BridePrice | undefined {
    return this.props.bridePrice;
  }

  get customaryMarriage(): CustomaryMarriage | undefined {
    return this.props.customaryMarriage;
  }

  get islamicMarriage(): IslamicMarriage | undefined {
    return this.props.islamicMarriage;
  }

  get registrationNumber(): string | undefined {
    return this.props.registrationNumber;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get endReason(): MarriageEndReason {
    return this.props.endReason;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
  }

  get deceasedSpouseId(): UniqueEntityID | undefined {
    return this.props.deceasedSpouseId;
  }

  get isPolygamousUnderS40(): boolean {
    return this.props.isPolygamousUnderS40;
  }

  get s40CertificateNumber(): string | undefined {
    return this.props.s40CertificateNumber;
  }

  get polygamousHouseId(): UniqueEntityID | undefined {
    return this.props.polygamousHouseId;
  }

  get matrimonialPropertySettled(): boolean {
    return this.props.matrimonialPropertySettled;
  }

  get maintenanceOrderIssued(): boolean {
    return this.props.maintenanceOrderIssued;
  }

  get maintenanceOrderNumber(): string | undefined {
    return this.props.maintenanceOrderNumber;
  }

  get separationDate(): Date | undefined {
    return this.props.separationDate;
  }

  get isValidUnderKenyanLaw(): boolean {
    return this.props.isValidUnderKenyanLaw;
  }

  get invalidityReason(): string | undefined {
    return this.props.invalidityReason;
  }

  // =========================================================================
  // COMPUTED PROPERTIES (Kenyan Law Context)
  // =========================================================================

  /**
   * Is Islamic marriage (affects succession rules)
   */
  get isIslamic(): boolean {
    return this.props.type === MarriageType.ISLAMIC;
  }

  /**
   * Is Customary marriage (affects succession rules)
   */
  get isCustomary(): boolean {
    return (
      this.props.type === MarriageType.CUSTOMARY || this.props.type === MarriageType.TRADITIONAL
    );
  }

  /**
   * Is Civil/Christian (monogamous only)
   */
  get isMonogamous(): boolean {
    return this.props.type === MarriageType.CIVIL || this.props.type === MarriageType.CHRISTIAN;
  }

  /**
   * Has unsettled matrimonial property
   * Blocks final distribution until settled
   */
  get hasUnsettledMatrimonialProperty(): boolean {
    return this.props.isMatrimonialPropertyRegime && !this.props.matrimonialPropertySettled;
  }

  /**
   * Is in polygamous house (S. 40 LSA)
   */
  get isInPolygamousHouse(): boolean {
    return !!this.props.polygamousHouseId;
  }

  /**
   * Marriage duration in years
   */
  get durationYears(): number {
    const startDate = this.props.dates.marriageDate;
    const endDate = this.props.endDate || new Date();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
  }

  /**
   * Surviving spouse ID (if one is deceased)
   */
  get survivingSpouseId(): UniqueEntityID | undefined {
    if (!this.props.deceasedSpouseId) return undefined;

    if (this.props.spouse1Id.equals(this.props.deceasedSpouseId)) {
      return this.props.spouse2Id;
    }

    if (this.props.spouse2Id.equals(this.props.deceasedSpouseId)) {
      return this.props.spouse1Id;
    }

    return undefined;
  }

  /**
   * Has surviving spouse (important for S. 35 LSA)
   */
  get hasSurvivingSpouse(): boolean {
    return !!this.survivingSpouseId;
  }

  /**
   * Requires court validation
   * True for polygamous marriages, customary marriages
   */
  get requiresCourtValidation(): boolean {
    return this.props.isPolygamousUnderS40 || this.isCustomary;
  }

  /**
   * Is eligible for succession distribution
   * Must be active or ended by death (not divorce/annulment)
   */
  get isEligibleForSuccession(): boolean {
    if (this.props.isActive) return true;

    return this.props.endReason === MarriageEndReason.DEATH_OF_SPOUSE;
  }

  /**
   * Get spouse IDs as array (for queries)
   */
  public getSpouseIds(): UniqueEntityID[] {
    return [this.props.spouse1Id, this.props.spouse2Id];
  }

  /**
   * Check if member is a spouse in this marriage
   */
  public isSpouse(memberId: string | UniqueEntityID): boolean {
    const id = typeof memberId === 'string' ? new UniqueEntityID(memberId) : memberId;

    return this.props.spouse1Id.equals(id) || this.props.spouse2Id.equals(id);
  }

  /**
   * Get other spouse ID (given one spouse)
   */
  public getOtherSpouse(spouseId: string | UniqueEntityID): UniqueEntityID {
    const id = typeof spouseId === 'string' ? new UniqueEntityID(spouseId) : spouseId;

    if (this.props.spouse1Id.equals(id)) {
      return this.props.spouse2Id;
    }

    if (this.props.spouse2Id.equals(id)) {
      return this.props.spouse1Id;
    }

    throw new InvalidMarriageException('Provided ID is not a spouse in this marriage');
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  /**
   * Convert to plain object (for persistence/API)
   */
  public toPlainObject(): Record<string, any> {
    return {
      id: this._id.toString(),
      familyId: this.props.familyId.toString(),
      spouse1Id: this.props.spouse1Id.toString(),
      spouse2Id: this.props.spouse2Id.toString(),

      // Core data
      type: this.props.type,
      details: this.props.details.toJSON(),
      dates: this.props.dates.toJSON(),

      // Optional VOs
      bridePrice: this.props.bridePrice?.toJSON(),
      customaryMarriage: this.props.customaryMarriage?.toJSON(),
      islamicMarriage: this.props.islamicMarriage?.toJSON(),

      // Registration
      registrationNumber: this.props.registrationNumber,
      issuingAuthority: this.props.issuingAuthority,
      certificateIssueDate: this.props.certificateIssueDate,
      registrationDistrict: this.props.registrationDistrict,

      // End tracking
      endReason: this.props.endReason,
      endDate: this.props.endDate,
      deceasedSpouseId: this.props.deceasedSpouseId?.toString(),

      // Divorce
      divorceDecreeNumber: this.props.divorceDecreeNumber,
      divorceCourt: this.props.divorceCourt,
      divorceDate: this.props.divorceDate,

      // S. 40 Polygamy
      isPolygamousUnderS40: this.props.isPolygamousUnderS40,
      s40CertificateNumber: this.props.s40CertificateNumber,
      polygamousHouseId: this.props.polygamousHouseId?.toString(),

      // Matrimonial property
      isMatrimonialPropertyRegime: this.props.isMatrimonialPropertyRegime,
      matrimonialPropertySettled: this.props.matrimonialPropertySettled,

      // Pre-marriage status
      spouse1MaritalStatusAtMarriage: this.props.spouse1MaritalStatusAtMarriage,
      spouse2MaritalStatusAtMarriage: this.props.spouse2MaritalStatusAtMarriage,

      // Separation
      separationDate: this.props.separationDate,
      separationReason: this.props.separationReason,
      maintenanceOrderIssued: this.props.maintenanceOrderIssued,
      maintenanceOrderNumber: this.props.maintenanceOrderNumber,

      // Validation
      courtValidationDate: this.props.courtValidationDate,
      isValidUnderKenyanLaw: this.props.isValidUnderKenyanLaw,
      invalidityReason: this.props.invalidityReason,

      // Status
      isActive: this.props.isActive,

      // Computed
      isIslamic: this.isIslamic,
      isCustomary: this.isCustomary,
      isMonogamous: this.isMonogamous,
      hasUnsettledMatrimonialProperty: this.hasUnsettledMatrimonialProperty,
      isInPolygamousHouse: this.isInPolygamousHouse,
      durationYears: this.durationYears,
      hasSurvivingSpouse: this.hasSurvivingSpouse,
      survivingSpouseId: this.survivingSpouseId?.toString(),
      requiresCourtValidation: this.requiresCourtValidation,
      isEligibleForSuccession: this.isEligibleForSuccession,

      // Audit
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
