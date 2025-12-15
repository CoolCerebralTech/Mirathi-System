// domain/entities/polygamous-house.entity.ts
import { Entity } from '../base/entity';
import { HouseHeadChangedEvent } from '../events/family-events/house-head-changed.event';
import { S40CertificateVerifiedEvent } from '../events/legal-events/s40-certificate-verified.event';
import { PolygamousHouseCreatedEvent } from '../events/marriage-events/polygamous-house-created.event';
import { InvalidPolygamousHouseException } from '../exceptions/polygamy.exception';
import { PolygamousHouseDetails } from '../value-objects/legal/polygamous-house-details.vo';

export interface PolygamousHouseProps {
  id: string;
  familyId: string;

  // The "Owner" of the house (The Wife/Widow)
  houseHeadId: string;

  // Core Details (Name, Order in marriage sequence)
  details: PolygamousHouseDetails;

  // Section 40 LSA Compliance
  s40CertificateNumber?: string;
  courtRecognized: boolean;
  courtOrderNumber?: string;

  // House Specific Economy (S.40 implies houses can have own property)
  houseBusinessName?: string;
  houseBusinessKraPin?: string;
  areAssetsFrozen: boolean; // During succession disputes

  // Wives Consent (Critical for validity of subsequent houses in customary law)
  wivesConsentObtained: boolean;
  wivesConsentDocumentId?: string;

  // State
  isDissolved: boolean;
  dissolvedAt?: Date;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreatePolygamousHouseProps {
  familyId: string;
  houseHeadId: string; // The Wife
  houseName: string; // e.g., "House of Wanjiku"
  houseOrder: number; // 1, 2, 3...
  establishedDate: Date;
  wivesConsentObtained?: boolean; // Did previous wives agree?
  s40CertificateNumber?: string; // If retrospective creation
}

export class PolygamousHouse extends Entity<PolygamousHouseProps> {
  private constructor(props: PolygamousHouseProps) {
    super(props);
    this.validate();
  }

  static create(props: CreatePolygamousHouseProps): PolygamousHouse {
    const id = this.generateId();
    const now = new Date();

    const details = PolygamousHouseDetails.create({
      houseName: props.houseName,
      houseOrder: props.houseOrder,
      establishedDate: props.establishedDate,
    });

    const house = new PolygamousHouse({
      id,
      familyId: props.familyId,
      houseHeadId: props.houseHeadId,
      details,
      s40CertificateNumber: props.s40CertificateNumber,
      courtRecognized: !!props.s40CertificateNumber, // If cert exists, it's recognized
      areAssetsFrozen: false,
      wivesConsentObtained: props.wivesConsentObtained ?? false, // Defaults to false (strict)
      isDissolved: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    house.addDomainEvent(
      new PolygamousHouseCreatedEvent({
        houseId: id,
        familyId: props.familyId,
        houseHeadId: props.houseHeadId,
        houseOrder: props.houseOrder,
        houseName: props.houseName,
        timestamp: now,
      }),
    );

    return house;
  }

  static createFromProps(props: PolygamousHouseProps): PolygamousHouse {
    return new PolygamousHouse(props);
  }

  // --- Domain Logic ---

  /**
   * Updates the House Head.
   * In Kenyan Customary Law, if the wife dies, the eldest son often becomes the
   * "acting head" for the purpose of administration, though the house remains "House of [Mother]".
   */
  changeHouseHead(newHeadId: string, reason: string): void {
    if (this.props.isDissolved) {
      throw new InvalidPolygamousHouseException('Cannot change head of a dissolved house.');
    }

    if (newHeadId === this.props.houseHeadId) {
      return;
    }

    const previousHeadId = this.props.houseHeadId;
    this.props.houseHeadId = newHeadId;
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new HouseHeadChangedEvent({
        houseId: this.id,
        familyId: this.props.familyId,
        oldHeadId: previousHeadId,
        newHeadId: newHeadId,
        reason,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Certifies the house under Section 40 of the LSA.
   * This is usually done via a court process confirming the beneficiaries.
   */
  certifyUnderSection40(certificateNumber: string, courtStation: string): void {
    if (this.props.s40CertificateNumber) {
      // Idempotency check - if same cert, ignore
      if (this.props.s40CertificateNumber === certificateNumber) return;
      throw new InvalidPolygamousHouseException('House is already certified under S.40.');
    }

    this.props.s40CertificateNumber = certificateNumber;
    this.props.courtRecognized = true;
    this.props.courtOrderNumber = `S40-${courtStation}-${certificateNumber}`;
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new S40CertificateVerifiedEvent({
        houseId: this.id,
        certificateNumber,
        courtStation,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Registers a separate business or property specifically for this house.
   * This protects these assets from being merged into the general estate
   * before the Section 40 split.
   */
  registerHouseBusiness(businessName: string, kraPin?: string): void {
    if (this.props.isDissolved) {
      throw new InvalidPolygamousHouseException('Cannot register business for dissolved house.');
    }

    this.props.houseBusinessName = businessName;
    this.props.houseBusinessKraPin = kraPin;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  /**
   * Freezes house assets.
   * Used when there is an inter-house dispute regarding asset ownership.
   */
  freezeAssets(): void {
    this.props.areAssetsFrozen = true;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  unfreezeAssets(): void {
    this.props.areAssetsFrozen = false;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  /**
   * Validates the house structure.
   */
  private validate(): void {
    if (!this.props.houseHeadId) {
      throw new InvalidPolygamousHouseException(
        'A Polygamous House must have a Head (Wife/Widow).',
      );
    }

    if (this.props.details.houseOrder < 1) {
      throw new InvalidPolygamousHouseException('House order must be 1 or greater.');
    }

    // S.40 specific validation:
    // If it's the 2nd+ house, and customary law applies, explicit consent/recognition is preferred
    // but not always strictly required by statute if cohabitation is proven.
    // However, in our system, we enforce logic consistency.
  }

  private static generateId(): string {
    return `hse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }
  get familyId(): string {
    return this.props.familyId;
  }
  get houseHeadId(): string {
    return this.props.houseHeadId;
  }
  get houseName(): string {
    return this.props.details.houseName;
  }
  get houseOrder(): number {
    return this.props.details.houseOrder;
  }
  get isCertifiedS40(): boolean {
    return !!this.props.s40CertificateNumber;
  }
  get areAssetsFrozen(): boolean {
    return this.props.areAssetsFrozen;
  }

  toJSON() {
    return {
      id: this.id,
      familyId: this.props.familyId,
      houseHeadId: this.props.houseHeadId,
      details: this.props.details.toJSON(),
      s40CertificateNumber: this.props.s40CertificateNumber,
      courtRecognized: this.props.courtRecognized,
      houseBusinessName: this.props.houseBusinessName,
      houseBusinessKraPin: this.props.houseBusinessKraPin,
      areAssetsFrozen: this.props.areAssetsFrozen,
      wivesConsentObtained: this.props.wivesConsentObtained,
      isActive: !this.props.isDissolved,
      version: this.props.version,
      createdAt: this.props.createdAt,
    };
  }
}
