// domain/entities/marriage.entity.ts
import { MarriageEndReason, MarriageType } from '@prisma/client';

import { Entity } from '../base/entity';
import { CustomaryMarriageRecognizedEvent } from '../events/marriage-events/customary-marriage-recognized.event';
import { MarriageDissolvedEvent } from '../events/marriage-events/marriage-dissolved.event';
import { MarriageRegisteredEvent } from '../events/marriage-events/marriage-registered.event';
import { InvalidMarriageException } from '../exceptions/marriage.exception';
import { BridePrice } from '../value-objects/financial/bride-price.vo';
import { CustomaryMarriage } from '../value-objects/legal/customary-marriage.vo';
import { IslamicMarriage } from '../value-objects/legal/islamic-marriage.vo';
import { MarriageDetails } from '../value-objects/legal/marriage-details.vo';
import { KenyanMarriageDates } from '../value-objects/temporal/kenyan-marriage-dates.vo';

export interface MarriageProps {
  id: string;
  familyId: string;
  spouse1Id: string;
  spouse2Id: string;

  // Core marriage data
  type: MarriageType;
  details: MarriageDetails;
  dates: KenyanMarriageDates;
  bridePrice?: BridePrice;

  // Kenyan Legal Requirements (Cached for querying, authoritative source is in VOs)
  registrationNumber?: string;
  issuingAuthority?: string;
  certificateIssueDate?: Date;
  registrationDistrict?: string;

  // End of marriage tracking
  endReason: MarriageEndReason;
  deceasedSpouseId?: string;
  divorceDecreeNumber?: string;
  divorceCourt?: string;
  divorceDate?: Date;

  // S.40 Polygamy Compliance
  isPolygamousUnderS40: boolean;
  s40CertificateNumber?: string;
  polygamousHouseId?: string;

  // Matrimonial Property Act 2013
  isMatrimonialPropertyRegime: boolean;
  matrimonialPropertySettled: boolean;

  // Customary Marriage Details (if applicable)
  customaryMarriage?: CustomaryMarriage;

  // Islamic Marriage Details (if applicable)
  islamicMarriage?: IslamicMarriage;

  // Pre-marriage status
  spouse1MaritalStatusAtMarriage?: string;
  spouse2MaritalStatusAtMarriage?: string;

  // Separation tracking
  separationDate?: Date;
  separationReason?: string;
  maintenanceOrderIssued: boolean;
  maintenanceOrderNumber?: string;

  // Court validation
  courtValidationDate?: Date;
  isValidUnderKenyanLaw: boolean;
  invalidityReason?: string;

  // Status
  isActive: boolean;

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

  // Registration details
  registrationNumber?: string;
  issuingAuthority?: string;
  certificateIssueDate?: Date;
  registrationDistrict?: string;

  // Customary specifics
  isCustomary?: boolean;
  customaryType?: string; // e.g., 'KIKUYU_NGURARIO'
  ethnicGroup?: string;
  dowryPaid?: boolean;
  dowryAmount?: number;
  dowryCurrency?: string;
  elderWitnesses?: Array<{ name: string; age: number; relationship: string }>;
  ceremonyLocation?: string;
  clanApproval?: boolean;
  clanApprovalDate?: Date;
  familyConsent?: boolean;
  familyConsentDate?: Date;

  // Islamic specifics
  isIslamic?: boolean;
  nikahDate?: Date;
  nikahLocation?: string;
  imamName?: string;
  waliName?: string;
  mahrAmount?: number;
  mahrCurrency?: string;

  // S.40 specifics
  isPolygamous?: boolean;
  s40CertificateNumber?: string;

  // Matrimonial property
  isMatrimonialPropertyRegime?: boolean;

  // Pre-marriage status
  spouse1MaritalStatusAtMarriage?: string;
  spouse2MaritalStatusAtMarriage?: string;
}

export class Marriage extends Entity<MarriageProps> {
  private constructor(props: MarriageProps) {
    super(props.id, props);
    this.validate();
  }

  static create(props: CreateMarriageProps): Marriage {
    const id = this.generateId();
    const now = new Date();

    // 1. Create Dates VO
    const dates = KenyanMarriageDates.create(props.startDate, props.type);

    if (props.certificateIssueDate) {
      dates.issueCertificate(props.certificateIssueDate);
    }
    if (props.registrationNumber) {
      dates.registerMarriage(now, props.registrationNumber);
    }

    // 2. Create Details VO
    let details = MarriageDetails.create(props.type, props.startDate);

    // Add registration details to Details VO
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

    // 3. Create Customary/BridePrice VOs
    let bridePrice: BridePrice | undefined;
    let customaryMarriage: CustomaryMarriage | undefined;

    if (props.type === MarriageType.CUSTOMARY || props.type === MarriageType.TRADITIONAL) {
      // Bride Price
      bridePrice = BridePrice.create(props.dowryAmount || 0, props.dowryCurrency || 'KES');

      // We manually add payment if "paid" is true, as create() defaults to PENDING
      if (props.dowryPaid && props.dowryAmount) {
        bridePrice = bridePrice.addPayment({
          type: 'CASH',
          description: 'Initial bride price payment',
          totalValue: props.dowryAmount,
          date: props.startDate,
          witnesses: [], // Empty initially
        });
      }

      // Customary Marriage
      if (props.ethnicGroup && props.customaryType && props.ceremonyLocation) {
        customaryMarriage = CustomaryMarriage.create(
          props.ethnicGroup,
          props.customaryType,
          props.startDate,
          props.ceremonyLocation,
        );

        if (props.elderWitnesses) {
          props.elderWitnesses.forEach((w) => {
            customaryMarriage = customaryMarriage!.addElderWitness(w.name, w.age, w.relationship);
          });
        }

        if (props.clanApproval && props.clanApprovalDate) {
          customaryMarriage = customaryMarriage.grantClanApproval(props.clanApprovalDate);
        }

        if (props.familyConsent && props.familyConsentDate) {
          customaryMarriage = customaryMarriage.grantFamilyConsent(props.familyConsentDate);
        }

        // Sync details
        details = details.addCustomaryDetails(
          props.customaryType,
          props.dowryPaid || false,
          props.dowryAmount,
          props.dowryCurrency,
        );
      }
    }

    // 4. Create Islamic VO
    let islamicMarriage: IslamicMarriage | undefined;
    if (props.type === MarriageType.ISLAMIC) {
      if (props.nikahLocation && props.imamName && props.waliName && props.mahrAmount) {
        islamicMarriage = IslamicMarriage.create(
          props.nikahDate || props.startDate,
          props.nikahLocation,
          props.imamName,
          props.waliName,
          props.mahrAmount,
        );

        // Sync details
        details = details.addIslamicDetails(
          props.nikahDate || props.startDate,
          props.mahrAmount,
          props.mahrCurrency,
          props.waliName,
        );
      }
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
      customaryMarriage,
      islamicMarriage,
      registrationNumber: props.registrationNumber,
      issuingAuthority: props.issuingAuthority,
      certificateIssueDate: props.certificateIssueDate,
      registrationDistrict: props.registrationDistrict,
      endReason: MarriageEndReason.STILL_ACTIVE,
      isPolygamousUnderS40: props.isPolygamous || false,
      s40CertificateNumber: props.s40CertificateNumber,
      isMatrimonialPropertyRegime: props.isMatrimonialPropertyRegime ?? true,
      matrimonialPropertySettled: false,
      spouse1MaritalStatusAtMarriage: props.spouse1MaritalStatusAtMarriage,
      spouse2MaritalStatusAtMarriage: props.spouse2MaritalStatusAtMarriage,
      maintenanceOrderIssued: false,
      isValidUnderKenyanLaw: true,
      isActive: true,
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
        registrationNumber: props.registrationNumber,
      }),
    );

    if (customaryMarriage) {
      marriage.addDomainEvent(
        new CustomaryMarriageRecognizedEvent({
          marriageId: id,
          bridePriceStatus: bridePrice?.status,
          clanApproval: props.clanApproval,
          familyConsent: props.familyConsent,
        }),
      );
    }

    return marriage;
  }

  static createFromProps(props: MarriageProps): Marriage {
    return new Marriage(props);
  }

  // --- Domain Logic ---

  assignToPolygamousHouse(houseId: string, s40CertificateNumber?: string): void {
    if (this.props.type === MarriageType.CHRISTIAN || this.props.type === MarriageType.CIVIL) {
      throw new InvalidMarriageException(
        'Monogamous unions (Civil/Christian) cannot be assigned to a polygamous house without conversion.',
      );
    }

    this.props.polygamousHouseId = houseId;
    this.props.isPolygamousUnderS40 = true;
    if (s40CertificateNumber) {
      this.props.s40CertificateNumber = s40CertificateNumber;
    }

    // Update VOs
    this.props.dates = this.props.dates.establishPolygamousHouse(new Date());
    this.props.details = this.props.details.markAsPolygamous(houseId);

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  dissolve(params: {
    date: Date;
    reason: string;
    courtDecreeNumber?: string;
    divorceCourt?: string;
    returnOfBridePrice?: boolean;
    dissolutionType?: 'DIVORCE' | 'ANNULMENT' | 'CUSTOMARY_DISSOLUTION'; // Specific to VO
  }): void {
    if (!this.props.isActive) {
      throw new InvalidMarriageException('Marriage is already inactive.');
    }

    if (params.date < this.props.dates.marriageDate) {
      throw new InvalidMarriageException('Dissolution date cannot be before start date.');
    }

    // 1. Determine End Reason and Type
    let endReason: MarriageEndReason = MarriageEndReason.DIVORCE;
    let dissolutionType = params.dissolutionType || 'DIVORCE';

    if (
      this.props.type === MarriageType.CUSTOMARY ||
      this.props.type === MarriageType.TRADITIONAL
    ) {
      endReason = MarriageEndReason.CUSTOMARY_DISSOLUTION;
      dissolutionType = 'CUSTOMARY_DISSOLUTION';
    } else if (params.reason.toLowerCase().includes('annulment')) {
      endReason = MarriageEndReason.ANNULMENT;
      dissolutionType = 'ANNULMENT';
    }

    // 2. Update Dates VO
    this.props.dates = this.props.dates.dissolveMarriage(
      params.date,
      dissolutionType,
      params.reason,
    );

    // 3. Update Details VO
    this.props.details = this.props.details.endMarriage(params.date, endReason);

    // 4. Handle Specific Types
    // Islamic
    if (this.props.type === MarriageType.ISLAMIC && this.props.islamicMarriage) {
      // Default to irrevocable talaq if not specified via specific method
      this.props.islamicMarriage = this.props.islamicMarriage.issueTalaq(
        'TALAQ_AL_BIDDAH',
        params.date,
        3,
      );
    }

    // Customary
    if (
      (this.props.type === MarriageType.CUSTOMARY ||
        this.props.type === MarriageType.TRADITIONAL) &&
      this.props.customaryMarriage
    ) {
      this.props.customaryMarriage = this.props.customaryMarriage.dissolveMarriage(
        params.date,
        params.reason,
      );
    }

    // Update Bride Price (if returned in customary law)
    if (this.props.bridePrice && params.returnOfBridePrice) {
      // Note: BridePrice VO doesn't have a 'markReturned' method in the snippet provided.
      // We might need to add negative payment or update note.
      this.props.bridePrice = this.props.bridePrice.addNotes(
        'Bride price returned upon dissolution',
      );
    }

    // Update Entity State
    this.props.isActive = false;
    this.props.endReason = endReason;
    this.props.divorceDecreeNumber = params.courtDecreeNumber;
    this.props.divorceCourt = params.courtDecreeNumber ? params.divorceCourt : undefined;
    this.props.divorceDate = params.date;

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

  recordDeathOfSpouse(deceasedSpouseId: string, dateOfDeath: Date): void {
    if (!this.props.isActive) return;

    // Update VOs
    this.props.dates = this.props.dates.dissolveMarriage(dateOfDeath, 'DEATH', 'Death of Spouse');
    this.props.details = this.props.details.endMarriage(
      dateOfDeath,
      MarriageEndReason.DEATH_OF_SPOUSE,
    );

    this.props.deceasedSpouseId = deceasedSpouseId;
    this.props.isActive = false;
    this.props.endReason = MarriageEndReason.DEATH_OF_SPOUSE;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  updateSeparation(params: { date: Date; reason?: string }): void {
    // Note: KenyanMarriageDates doesn't have explicit separation tracker in props,
    // usually handled via status or notes. We'll update the Entity props.
    this.props.separationDate = params.date;
    this.props.separationReason = params.reason;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  issueMaintenanceOrder(orderNumber: string): void {
    this.props.maintenanceOrderIssued = true;
    this.props.maintenanceOrderNumber = orderNumber;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  settleMatrimonialProperty(): void {
    if (!this.props.isMatrimonialPropertyRegime) {
      throw new InvalidMarriageException('Matrimonial property regime is not applicable');
    }

    this.props.details = this.props.details.settleMatrimonialProperty();
    this.props.matrimonialPropertySettled = true;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  private validate(): void {
    if (this.props.spouse1Id === this.props.spouse2Id) {
      throw new InvalidMarriageException('Spouses cannot be the same person.');
    }

    // Validate S.40 Compliance
    if (
      this.props.isPolygamousUnderS40 &&
      (this.props.type === MarriageType.CHRISTIAN || this.props.type === MarriageType.CIVIL)
    ) {
      throw new InvalidMarriageException(
        'Christian/Civil marriages cannot be flagged as Polygamous under S.40 without legal conversion.',
      );
    }

    // Validate Islamic marriage consistency
    if (this.props.type === MarriageType.ISLAMIC && !this.props.islamicMarriage) {
      throw new InvalidMarriageException('Islamic marriage requires Islamic marriage details');
    }

    // Validate customary marriage consistency
    if (
      (this.props.type === MarriageType.CUSTOMARY ||
        this.props.type === MarriageType.TRADITIONAL) &&
      !this.props.customaryMarriage
    ) {
      throw new InvalidMarriageException('Customary marriage requires customary marriage details');
    }
  }

  private static generateId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : `mrr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
  get endReason(): MarriageEndReason {
    return this.props.endReason;
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
  get familyId(): string {
    return this.props.familyId;
  }
  get polygamousHouseId(): string | undefined {
    return this.props.polygamousHouseId;
  }
  get maintenanceOrderIssued(): boolean {
    return this.props.maintenanceOrderIssued;
  }

  get maintenanceOrderNumber(): string | undefined {
    return this.props.maintenanceOrderNumber;
  }

  get divorceDate(): Date | undefined {
    return this.props.divorceDate;
  }
  get isIslamic(): boolean {
    return this.props.type === MarriageType.ISLAMIC;
  }

  get isCustomary(): boolean {
    return (
      this.props.type === MarriageType.CUSTOMARY || this.props.type === MarriageType.TRADITIONAL
    );
  }

  get hasMatrimonialProperty(): boolean {
    return this.props.isMatrimonialPropertyRegime && !this.props.matrimonialPropertySettled;
  }

  get isSpouseDependant(): boolean {
    return this.props.isActive || this.props.endReason === MarriageEndReason.STILL_ACTIVE;
  }

  get details(): MarriageDetails {
    return this.props.details;
  }
  get dates(): KenyanMarriageDates {
    return this.props.dates;
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
      customaryMarriage: this.props.customaryMarriage?.toJSON(),
      islamicMarriage: this.props.islamicMarriage?.toJSON(),
      registrationNumber: this.props.registrationNumber,
      issuingAuthority: this.props.issuingAuthority,
      certificateIssueDate: this.props.certificateIssueDate,
      registrationDistrict: this.props.registrationDistrict,
      endReason: this.props.endReason,
      deceasedSpouseId: this.props.deceasedSpouseId,
      divorceDecreeNumber: this.props.divorceDecreeNumber,
      divorceCourt: this.props.divorceCourt,
      divorceDate: this.props.divorceDate,
      isPolygamousUnderS40: this.props.isPolygamousUnderS40,
      s40CertificateNumber: this.props.s40CertificateNumber,
      polygamousHouseId: this.props.polygamousHouseId,
      isMatrimonialPropertyRegime: this.props.isMatrimonialPropertyRegime,
      matrimonialPropertySettled: this.props.matrimonialPropertySettled,
      spouse1MaritalStatusAtMarriage: this.props.spouse1MaritalStatusAtMarriage,
      spouse2MaritalStatusAtMarriage: this.props.spouse2MaritalStatusAtMarriage,
      separationDate: this.props.separationDate,
      separationReason: this.props.separationReason,
      maintenanceOrderIssued: this.props.maintenanceOrderIssued,
      maintenanceOrderNumber: this.props.maintenanceOrderNumber,
      courtValidationDate: this.props.courtValidationDate,
      isValidUnderKenyanLaw: this.props.isValidUnderKenyanLaw,
      invalidityReason: this.props.invalidityReason,
      isActive: this.props.isActive,
      version: this.props.version,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
