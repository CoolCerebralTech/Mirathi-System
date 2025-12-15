import { Entity } from '../base/entity';
import { HouseHeadChangedEvent } from '../events/family-events/house-head-changed.event';
import { S40CertificateVerifiedEvent } from '../events/legal-events/s40-certificate-verified.event';
import { PolygamousHouseCreatedEvent } from '../events/marriage-events/polygamous-house-created.event';
import { InvalidPolygamousHouseException } from '../exceptions/polygamy.exception';

export interface PolygamousHouseProps {
  id: string;
  familyId: string;

  // House identity
  houseName: string;
  houseOrder: number;
  establishedDate: Date;

  // House head (wife)
  houseHeadId?: string;

  // Section 40 LSA Compliance
  courtRecognized: boolean;
  courtOrderNumber?: string;
  s40CertificateNumber?: string;
  certificateIssuedDate?: Date;
  certificateIssuingCourt?: string;

  // House share percentage for estate distribution
  houseSharePercentage?: number;

  // Business and property tracking
  houseBusinessName?: string;
  houseBusinessKraPin?: string;
  separateProperty: boolean;

  // Wives consent tracking
  wivesConsentObtained: boolean;
  wivesConsentDocument?: string; // Document ID
  wivesAgreementDetails?: any; // JSON

  // Succession planning
  successionInstructions?: string;

  // House dissolution tracking
  houseDissolvedAt?: Date;
  houseAssetsFrozen: boolean;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePolygamousHouseProps {
  familyId: string;
  houseHeadId?: string;
  houseName: string;
  houseOrder: number;
  establishedDate: Date;

  // S.40 compliance
  courtRecognized?: boolean;
  s40CertificateNumber?: string;
  certificateIssuedDate?: Date;
  certificateIssuingCourt?: string;

  // Wives consent
  wivesConsentObtained?: boolean;
  wivesConsentDocument?: string;
  wivesAgreementDetails?: any;

  // House share
  houseSharePercentage?: number;

  // Business details
  houseBusinessName?: string;
  houseBusinessKraPin?: string;
}

export class PolygamousHouse extends Entity<PolygamousHouseProps> {
  private constructor(props: PolygamousHouseProps) {
    super(props.id, props);
    this.validate();
  }

  static create(props: CreatePolygamousHouseProps): PolygamousHouse {
    const id = this.generateId();
    const now = new Date();

    const house = new PolygamousHouse({
      id,
      familyId: props.familyId,
      houseHeadId: props.houseHeadId,
      houseName: props.houseName,
      houseOrder: props.houseOrder,
      establishedDate: props.establishedDate,
      courtRecognized: props.courtRecognized || false,
      s40CertificateNumber: props.s40CertificateNumber,
      certificateIssuedDate: props.certificateIssuedDate,
      certificateIssuingCourt: props.certificateIssuingCourt,
      houseSharePercentage: props.houseSharePercentage,
      houseBusinessName: props.houseBusinessName,
      houseBusinessKraPin: props.houseBusinessKraPin,
      separateProperty: false,
      wivesConsentObtained: props.wivesConsentObtained || false,
      wivesConsentDocument: props.wivesConsentDocument,
      wivesAgreementDetails: props.wivesAgreementDetails,
      houseAssetsFrozen: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    house.addDomainEvent(
      new PolygamousHouseCreatedEvent({
        houseId: id,
        familyId: props.familyId,
        houseName: props.houseName,
        houseOrder: props.houseOrder,
        houseHeadId: props.houseHeadId,
        establishedDate: props.establishedDate,
      }),
    );

    return house;
  }

  static createFromProps(props: PolygamousHouseProps): PolygamousHouse {
    return new PolygamousHouse(props);
  }

  // --- Domain Logic ---

  changeHouseHead(newHeadId: string, reason: string): void {
    if (this.props.houseDissolvedAt) {
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
      }),
    );
  }

  certifyUnderSection40(params: {
    certificateNumber: string;
    courtStation: string;
    issuedDate?: Date;
  }): void {
    if (this.props.s40CertificateNumber) {
      if (this.props.s40CertificateNumber === params.certificateNumber) return;
      throw new InvalidPolygamousHouseException('House is already certified under S.40.');
    }

    if (!this.props.houseHeadId) {
      throw new InvalidPolygamousHouseException('House must have a head before certification.');
    }

    this.props.s40CertificateNumber = params.certificateNumber;
    this.props.courtRecognized = true;
    this.props.certificateIssuingCourt = params.courtStation;
    this.props.certificateIssuedDate = params.issuedDate || new Date();
    this.props.courtOrderNumber = `S40-${params.courtStation}-${params.certificateNumber}`;
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new S40CertificateVerifiedEvent({
        houseId: this.id,
        certificateNumber: params.certificateNumber,
        courtStation: params.courtStation,
        issuedDate: params.issuedDate || new Date(),
      }),
    );
  }

  updateHouseShare(percentage: number): void {
    if (percentage < 0 || percentage > 100) {
      throw new InvalidPolygamousHouseException('Share percentage must be between 0 and 100.');
    }

    this.props.houseSharePercentage = percentage;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  registerHouseBusiness(businessName: string, kraPin?: string): void {
    if (this.props.houseDissolvedAt) {
      throw new InvalidPolygamousHouseException('Cannot register business for dissolved house.');
    }

    this.props.houseBusinessName = businessName;
    this.props.houseBusinessKraPin = kraPin;
    this.props.separateProperty = true;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  recordWivesConsent(params: {
    consentObtained: boolean;
    consentDocument?: string;
    agreementDetails?: any;
  }): void {
    this.props.wivesConsentObtained = params.consentObtained;
    this.props.wivesConsentDocument = params.consentDocument;
    this.props.wivesAgreementDetails = params.agreementDetails;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  addSuccessionInstructions(instructions: string): void {
    this.props.successionInstructions = instructions;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  freezeAssets(): void {
    this.props.houseAssetsFrozen = true;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  unfreezeAssets(): void {
    this.props.houseAssetsFrozen = false;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  dissolve(dissolutionDate: Date): void {
    if (this.props.houseDissolvedAt) {
      throw new InvalidPolygamousHouseException('House is already dissolved.');
    }

    this.props.houseDissolvedAt = dissolutionDate;
    this.props.houseAssetsFrozen = true;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  private validate(): void {
    if (!this.props.houseName) {
      throw new InvalidPolygamousHouseException('House name is required.');
    }

    if (this.props.houseOrder < 1) {
      throw new InvalidPolygamousHouseException('House order must be 1 or greater.');
    }

    if (this.props.establishedDate > new Date()) {
      throw new InvalidPolygamousHouseException('Established date cannot be in the future.');
    }

    if (
      this.props.houseSharePercentage &&
      (this.props.houseSharePercentage < 0 || this.props.houseSharePercentage > 100)
    ) {
      throw new InvalidPolygamousHouseException(
        'House share percentage must be between 0 and 100.',
      );
    }

    // S.40 validation: If court recognized, must have certificate number
    if (this.props.courtRecognized && !this.props.s40CertificateNumber) {
      throw new InvalidPolygamousHouseException(
        'Court recognized house must have S.40 certificate number.',
      );
    }

    // For polygamous houses under S.40, wives consent is critical
    if (this.props.houseOrder > 1 && !this.props.wivesConsentObtained) {
      console.warn(
        'Warning: Subsequent polygamous house without documented wives consent may face legal challenges.',
      );
    }
  }

  private static generateId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : `hse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get houseHeadId(): string | undefined {
    return this.props.houseHeadId;
  }

  get houseName(): string {
    return this.props.houseName;
  }

  get houseOrder(): number {
    return this.props.houseOrder;
  }

  get establishedDate(): Date {
    return this.props.establishedDate;
  }

  get isCertifiedS40(): boolean {
    return !!this.props.s40CertificateNumber;
  }

  get courtRecognized(): boolean {
    return this.props.courtRecognized;
  }

  get houseAssetsFrozen(): boolean {
    return this.props.houseAssetsFrozen;
  }

  get houseDissolvedAt(): Date | undefined {
    return this.props.houseDissolvedAt;
  }

  get isDissolved(): boolean {
    return !!this.props.houseDissolvedAt;
  }

  get wivesConsentObtained(): boolean {
    return this.props.wivesConsentObtained;
  }

  get separateProperty(): boolean {
    return this.props.separateProperty;
  }

  get houseSharePercentage(): number | undefined {
    return this.props.houseSharePercentage;
  }

  get hasSuccessionInstructions(): boolean {
    return !!this.props.successionInstructions;
  }

  // Computed property for S.40 compliance status
  get s40ComplianceStatus(): 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' {
    if (this.props.houseOrder === 1) return 'COMPLIANT'; // First house doesn't need S.40 certification

    if (this.props.courtRecognized && this.props.s40CertificateNumber) {
      return 'COMPLIANT';
    }

    if (this.props.wivesConsentObtained) {
      return 'PENDING'; // Has consent but not court recognized
    }

    return 'NON_COMPLIANT';
  }

  toJSON() {
    return {
      id: this.id,
      familyId: this.props.familyId,
      houseName: this.props.houseName,
      houseOrder: this.props.houseOrder,
      houseHeadId: this.props.houseHeadId,
      establishedDate: this.props.establishedDate,
      courtRecognized: this.props.courtRecognized,
      courtOrderNumber: this.props.courtOrderNumber,
      s40CertificateNumber: this.props.s40CertificateNumber,
      certificateIssuedDate: this.props.certificateIssuedDate,
      certificateIssuingCourt: this.props.certificateIssuingCourt,
      houseSharePercentage: this.props.houseSharePercentage,
      houseBusinessName: this.props.houseBusinessName,
      houseBusinessKraPin: this.props.houseBusinessKraPin,
      separateProperty: this.props.separateProperty,
      wivesConsentObtained: this.props.wivesConsentObtained,
      wivesConsentDocument: this.props.wivesConsentDocument,
      wivesAgreementDetails: this.props.wivesAgreementDetails,
      successionInstructions: this.props.successionInstructions,
      houseDissolvedAt: this.props.houseDissolvedAt,
      houseAssetsFrozen: this.props.houseAssetsFrozen,
      version: this.props.version,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      isDissolved: this.isDissolved,
      s40ComplianceStatus: this.s40ComplianceStatus,
    };
  }
}
