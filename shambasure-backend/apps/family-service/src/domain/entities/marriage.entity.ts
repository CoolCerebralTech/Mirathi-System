// domain/entities/marriage.entity.ts
import { Entity } from '../base/entity';
import { CustomaryMarriageRecognizedEvent } from '../events/marriage-events/customary-marriage-recognized.event';
import { MarriageDissolvedEvent } from '../events/marriage-events/marriage-dissolved.event';
import { MarriageRegisteredEvent } from '../events/marriage-events/marriage-registered.event';
import { InvalidMarriageException } from '../exceptions/marriage.exception';
import { BridePrice } from '../value-objects/financial/bride-price.vo';
import { MarriageDetails } from '../value-objects/legal/marriage-details.vo';
import { KenyanMarriageDates } from '../value-objects/temporal/kenyan-marriage-dates.vo';

// Enums based on your Prisma Schema
export enum MarriageType {
  CUSTOMARY = 'CUSTOMARY',
  CHRISTIAN = 'CHRISTIAN',
  CIVIL = 'CIVIL',
  ISLAMIC = 'ISLAMIC',
  TRADITIONAL = 'TRADITIONAL',
}

export enum MarriageEndReason {
  DEATH_OF_SPOUSE = 'DEATH_OF_SPOUSE',
  DIVORCE = 'DIVORCE',
  ANNULMENT = 'ANNULMENT',
  CUSTOMARY_DISSOLUTION = 'CUSTOMARY_DISSOLUTION',
  STILL_ACTIVE = 'STILL_ACTIVE',
}

export enum MatrimonialRegime {
  MONOGAMOUS = 'MONOGAMOUS',
  POLYGAMOUS_S40 = 'POLYGAMOUS_S40',
  CUSTOMARY = 'CUSTOMARY',
}

export interface MarriageProps {
  id: string;
  familyId: string;
  spouse1Id: string; // Husband usually (in S.40 context)
  spouse2Id: string; // Wife

  // Value Objects
  type: MarriageType;
  details: MarriageDetails; // Cert numbers, issuing authority, divorce decree numbers
  dates: KenyanMarriageDates; // Start date, end date, separation date
  bridePrice?: BridePrice; // Dowry details for customary

  // S.40 Polygamy Specifics
  isPolygamousUnderS40: boolean;
  s40CertificateNumber?: string;
  polygamousHouseId?: string; // Links to the House entity

  // Matrimonial Property Act 2013 context
  matrimonialRegime: MatrimonialRegime;
  isMatrimonialPropertyRegime: boolean;

  // State
  isActive: boolean;
  endReason: MarriageEndReason;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateMarriageProps {
  familyId: string;
  spouse1Id: string;
  spouse2Id: string;
  type: MarriageType;
  startDate: Date;
  registrationNumber?: string;
  issuingAuthority?: string;
  // Customary specifics
  isCustomary?: boolean;
  dowryPaid?: boolean;
  dowryAmount?: number;
  // Islamic specifics
  isIslamic?: boolean;
  nikahDate?: Date;
  // S.40 specifics
  isPolygamous?: boolean;
}

export class Marriage extends Entity<MarriageProps> {
  private constructor(props: MarriageProps) {
    super(props);
    this.validate();
  }

  static create(props: CreateMarriageProps): Marriage {
    const id = this.generateId();
    const now = new Date();

    // 1. Create Dates VO
    const dates = KenyanMarriageDates.create({
      startDate: props.startDate,
      nikahDate: props.nikahDate,
    });

    // 2. Create Details VO
    const details = MarriageDetails.create({
      registrationNumber: props.registrationNumber,
      issuingAuthority: props.issuingAuthority,
      type: props.type,
    });

    // 3. Create Bride Price VO (if Customary)
    let bridePrice: BridePrice | undefined;
    if (props.type === MarriageType.CUSTOMARY || props.type === MarriageType.TRADITIONAL) {
      bridePrice = BridePrice.create({
        isPaid: props.dowryPaid ?? false,
        amount: props.dowryAmount ?? 0,
        currency: 'KES',
        status: props.dowryPaid ? 'FULLY_PAID' : 'PENDING',
      });
    }

    // 4. Determine Regime
    let regime = MatrimonialRegime.MONOGAMOUS;
    if (props.isPolygamous) {
      regime = MatrimonialRegime.POLYGAMOUS_S40;
    } else if (props.type === MarriageType.CUSTOMARY) {
      regime = MatrimonialRegime.CUSTOMARY;
    }

    const marriage = new Marriage({
      id,
      familyId: props.familyId,
      spouse1Id: props.spouse1Id,
      spouse2Id: props.spouse2Id,
      type: props.type,
      details,
      dates,
      bridePrice,
      isPolygamousUnderS40: props.isPolygamous ?? false,
      polygamousHouseId: undefined, // Assigned later via method
      matrimonialRegime: regime,
      isMatrimonialPropertyRegime: true,
      isActive: true,
      endReason: MarriageEndReason.STILL_ACTIVE,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Domain Events
    marriage.addDomainEvent(
      new MarriageRegisteredEvent({
        marriageId: id,
        familyId: props.familyId,
        spouse1Id: props.spouse1Id,
        spouse2Id: props.spouse2Id,
        marriageType: props.type,
        startDate: props.startDate,
      }),
    );

    if (props.type === MarriageType.CUSTOMARY) {
      marriage.addDomainEvent(
        new CustomaryMarriageRecognizedEvent({
          marriageId: id,
          bridePriceStatus: bridePrice?.status,
        }),
      );
    }

    return marriage;
  }

  static createFromProps(props: MarriageProps): Marriage {
    return new Marriage(props);
  }

  // --- Domain Logic ---

  /**
   * Assigns this marriage to a Polygamous House (S.40 LSA).
   * This is required if the marriage is part of a polygamous setup.
   */
  assignToPolygamousHouse(houseId: string, s40CertificateNumber?: string): void {
    if (this.props.type === MarriageType.CHRISTIAN || this.props.type === MarriageType.CIVIL) {
      // Strictly legally, Civil/Christian marriages are monogamous in Kenya.
      // However, conversion to polygamy is complex. We block it by default to prevent legal anomalies.
      throw new InvalidMarriageException(
        'Monogamous unions (Civil/Christian) cannot be assigned to a polygamous house without conversion.',
      );
    }

    this.props.polygamousHouseId = houseId;
    this.props.isPolygamousUnderS40 = true;
    if (s40CertificateNumber) {
      this.props.s40CertificateNumber = s40CertificateNumber;
    }

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  /**
   * Dissolves the marriage via Divorce or Customary Dissolution.
   */
  dissolve(params: {
    date: Date;
    reason: string;
    courtDecreeNumber?: string;
    returnOfBridePrice?: boolean;
  }): void {
    if (!this.props.isActive) {
      throw new InvalidMarriageException('Marriage is already inactive.');
    }

    if (params.date < this.props.dates.startDate) {
      throw new InvalidMarriageException('Dissolution date cannot be before start date.');
    }

    // Update Dates
    this.props.dates = this.props.dates.markEnded(params.date);

    // Update Details (Decree)
    if (params.courtDecreeNumber) {
      this.props.details = this.props.details.addDivorceDecree(params.courtDecreeNumber);
    }

    // Update Bride Price (if returned in customary law)
    if (this.props.bridePrice && params.returnOfBridePrice) {
      this.props.bridePrice = this.props.bridePrice.markReturned();
    }

    this.props.isActive = false;
    this.props.endReason =
      this.props.type === MarriageType.CUSTOMARY
        ? MarriageEndReason.CUSTOMARY_DISSOLUTION
        : MarriageEndReason.DIVORCE;

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new MarriageDissolvedEvent({
        marriageId: this.id,
        reason: this.props.endReason,
        date: params.date,
        decreeNumber: params.courtDecreeNumber,
      }),
    );
  }

  /**
   * Marks marriage as ended due to death of a spouse.
   * This is critical for S.29 Dependant analysis (Surviving Spouse).
   */
  recordDeathOfSpouse(dateOfDeath: Date): void {
    if (!this.props.isActive) {
      return; // Already ended via divorce, no action needed
    }

    this.props.dates = this.props.dates.markEnded(dateOfDeath);
    this.props.isActive = false; // The legal union ends, but "Surviving Spouse" status begins in other aggregates
    this.props.endReason = MarriageEndReason.DEATH_OF_SPOUSE;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  /**
   * Validates if the marriage is recognized under Kenyan Law.
   */
  private validate(): void {
    if (this.props.spouse1Id === this.props.spouse2Id) {
      throw new InvalidMarriageException('Spouses cannot be the same person.');
    }

    // Validate S.40 Compliance
    if (
      this.props.isPolygamousUnderS40 &&
      (this.props.type === MarriageType.CHRISTIAN || this.props.type === MarriageType.CIVIL)
    ) {
      // This is a "Bigamy" check in the domain layer
      throw new InvalidMarriageException(
        'Christian/Civil marriages cannot be flagged as Polygamous under S.40 without legal conversion.',
      );
    }
  }

  private static generateId(): string {
    return `mrr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }
  get type(): MarriageType {
    return this.props.type;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get isPolygamous(): boolean {
    return this.props.isPolygamousUnderS40;
  }
  get spouse1Id(): string {
    return this.props.spouse1Id;
  }
  get spouse2Id(): string {
    return this.props.spouse2Id;
  }

  /**
   * Checks if this marriage qualifies the spouse as a S.29 Dependant.
   * Under Kenyan law, a spouse is automatically a dependant.
   */
  isSpouseDependant(): boolean {
    // If marriage was active at time of death (or separation with maintenance), they are a dependant.
    return this.props.isActive || this.props.endReason === MarriageEndReason.STILL_ACTIVE;
  }

  toJSON() {
    return {
      id: this.id,
      familyId: this.props.familyId,
      spouse1Id: this.props.spouse1Id,
      spouse2Id: this.props.spouse2Id,
      type: this.props.type,
      details: this.props.details.toJSON(),
      dates: this.props.dates.toJSON(),
      bridePrice: this.props.bridePrice?.toJSON(),
      isPolygamousUnderS40: this.props.isPolygamousUnderS40,
      s40CertificateNumber: this.props.s40CertificateNumber,
      polygamousHouseId: this.props.polygamousHouseId,
      isActive: this.props.isActive,
      endReason: this.props.endReason,
      version: this.props.version,
      createdAt: this.props.createdAt,
    };
  }
}
