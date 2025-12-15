// domain/value-objects/legal/polygamous-house-details.vo.ts
import { ValueObject } from '../base/value-object';

export interface PolygamousHouseDetailsProps {
  houseId: string;
  houseName: string;
  houseOrder: number;
  establishedDate: Date;
  courtRecognized: boolean;
  courtOrderNumber?: string;
  certificateIssuingCourt?: string;
  s40CertificateNumber?: string;
  certificateIssuedDate?: Date;
  houseHeadId?: string;
  houseBusinessName?: string;
  houseBusinessKraPin?: string;
  separateProperty: boolean;
  wivesConsentObtained: boolean;
  wivesConsentDocumentId?: string;
  wivesAgreementDetails?: Record<string, any>;
  houseSharePercentage?: number;
  houseAssetsFrozen: boolean;
  houseDissolvedAt?: Date;
  successionInstructions?: string;
}

export class PolygamousHouseDetails extends ValueObject<PolygamousHouseDetailsProps> {
  private constructor(props: PolygamousHouseDetailsProps) {
    super(props);
    this.validate();
  }

  static create(
    houseId: string,
    houseName: string,
    houseOrder: number,
    establishedDate: Date,
  ): PolygamousHouseDetails {
    return new PolygamousHouseDetails({
      houseId,
      houseName,
      houseOrder,
      establishedDate,
      courtRecognized: false,
      separateProperty: false,
      wivesConsentObtained: false,
      houseAssetsFrozen: false,
    });
  }

  static createFromProps(props: PolygamousHouseDetailsProps): PolygamousHouseDetails {
    return new PolygamousHouseDetails(props);
  }

  validate(): void {
    // House order validation (1-4 under Kenyan law)
    if (this._value.houseOrder < 1 || this._value.houseOrder > 4) {
      throw new Error('Polygamous house order must be between 1 and 4');
    }

    // Established date validation
    if (!this._value.establishedDate) {
      throw new Error('House established date is required');
    }

    if (this._value.establishedDate > new Date()) {
      throw new Error('House cannot be established in the future');
    }

    // Court recognition validation
    if (this._value.courtRecognized) {
      if (!this._value.courtOrderNumber) {
        throw new Error('Court order number is required for court recognized houses');
      }

      if (!this._value.certificateIssuingCourt) {
        throw new Error('Certificate issuing court is required');
      }
    }

    // S.40 certificate validation
    if (this._value.s40CertificateNumber && !this._value.certificateIssuedDate) {
      throw new Error('Certificate issue date is required when certificate number is provided');
    }

    // Business KRA PIN validation
    if (this._value.houseBusinessKraPin && !this.isValidKraPin(this._value.houseBusinessKraPin)) {
      throw new Error('Invalid KRA PIN format for house business');
    }

    // House share percentage validation
    if (this._value.houseSharePercentage !== undefined) {
      if (this._value.houseSharePercentage < 0 || this._value.houseSharePercentage > 100) {
        throw new Error('House share percentage must be between 0 and 100');
      }
    }

    // Dissolution validation
    if (this._value.houseDissolvedAt) {
      if (this._value.houseDissolvedAt < this._value.establishedDate) {
        throw new Error('House cannot be dissolved before establishment');
      }
    }

    // Wives consent validation
    if (this._value.wivesConsentObtained && !this._value.wivesConsentDocumentId) {
      throw new Error('Wives consent document ID is required when consent is obtained');
    }
  }

  private isValidKraPin(pin: string): boolean {
    return /^[A-Z]\d{9}[A-Z]$/.test(pin);
  }

  recognizeByCourt(
    courtOrderNumber: string,
    issuingCourt: string,
    s40CertificateNumber?: string,
  ): PolygamousHouseDetails {
    return new PolygamousHouseDetails({
      ...this._value,
      courtRecognized: true,
      courtOrderNumber,
      certificateIssuingCourt: issuingCourt,
      s40CertificateNumber,
      certificateIssuedDate: new Date(),
    });
  }

  setHouseHead(headId: string): PolygamousHouseDetails {
    return new PolygamousHouseDetails({
      ...this._value,
      houseHeadId: headId,
    });
  }

  updateBusinessDetails(businessName: string, kraPin: string): PolygamousHouseDetails {
    if (!this.isValidKraPin(kraPin)) {
      throw new Error('Invalid KRA PIN format');
    }

    return new PolygamousHouseDetails({
      ...this._value,
      houseBusinessName: businessName,
      houseBusinessKraPin: kraPin,
    });
  }

  markSeparateProperty(separate: boolean): PolygamousHouseDetails {
    return new PolygamousHouseDetails({
      ...this._value,
      separateProperty: separate,
    });
  }

  recordWivesConsent(
    documentId: string,
    agreementDetails: Record<string, any>,
  ): PolygamousHouseDetails {
    return new PolygamousHouseDetails({
      ...this._value,
      wivesConsentObtained: true,
      wivesConsentDocumentId: documentId,
      wivesAgreementDetails: agreementDetails,
    });
  }

  setHouseSharePercentage(percentage: number): PolygamousHouseDetails {
    if (percentage < 0 || percentage > 100) {
      throw new Error('House share percentage must be between 0 and 100');
    }

    return new PolygamousHouseDetails({
      ...this._value,
      houseSharePercentage: percentage,
    });
  }

  freezeAssets(): PolygamousHouseDetails {
    return new PolygamousHouseDetails({
      ...this._value,
      houseAssetsFrozen: true,
    });
  }

  unfreezeAssets(): PolygamousHouseDetails {
    return new PolygamousHouseDetails({
      ...this._value,
      houseAssetsFrozen: false,
    });
  }

  dissolveHouse(dissolutionDate: Date): PolygamousHouseDetails {
    if (dissolutionDate < this._value.establishedDate) {
      throw new Error('House cannot be dissolved before establishment');
    }

    return new PolygamousHouseDetails({
      ...this._value,
      houseDissolvedAt: dissolutionDate,
      houseAssetsFrozen: true,
    });
  }

  updateSuccessionInstructions(instructions: string): PolygamousHouseDetails {
    return new PolygamousHouseDetails({
      ...this._value,
      successionInstructions: instructions,
    });
  }

  get houseId(): string {
    return this._value.houseId;
  }

  get houseName(): string {
    return this._value.houseName;
  }

  get houseOrder(): number {
    return this._value.houseOrder;
  }

  get establishedDate(): Date {
    return this._value.establishedDate;
  }

  get courtRecognized(): boolean {
    return this._value.courtRecognized;
  }

  get courtOrderNumber(): string | undefined {
    return this._value.courtOrderNumber;
  }

  get certificateIssuingCourt(): string | undefined {
    return this._value.certificateIssuingCourt;
  }

  get s40CertificateNumber(): string | undefined {
    return this._value.s40CertificateNumber;
  }

  get certificateIssuedDate(): Date | undefined {
    return this._value.certificateIssuedDate;
  }

  get houseHeadId(): string | undefined {
    return this._value.houseHeadId;
  }

  get houseBusinessName(): string | undefined {
    return this._value.houseBusinessName;
  }

  get houseBusinessKraPin(): string | undefined {
    return this._value.houseBusinessKraPin;
  }

  get separateProperty(): boolean {
    return this._value.separateProperty;
  }

  get wivesConsentObtained(): boolean {
    return this._value.wivesConsentObtained;
  }

  get wivesConsentDocumentId(): string | undefined {
    return this._value.wivesConsentDocumentId;
  }

  get wivesAgreementDetails(): Record<string, any> | undefined {
    return this._value.wivesAgreementDetails;
  }

  get houseSharePercentage(): number | undefined {
    return this._value.houseSharePercentage;
  }

  get houseAssetsFrozen(): boolean {
    return this._value.houseAssetsFrozen;
  }

  get houseDissolvedAt(): Date | undefined {
    return this._value.houseDissolvedAt;
  }

  get successionInstructions(): string | undefined {
    return this._value.successionInstructions;
  }

  // Check if house is active
  get isActive(): boolean {
    return !this._value.houseDissolvedAt;
  }

  // Get house duration in years
  get houseDurationYears(): number {
    const endDate = this._value.houseDissolvedAt || new Date();
    const diffYears = endDate.getFullYear() - this._value.establishedDate.getFullYear();
    const monthDiff = endDate.getMonth() - this._value.establishedDate.getMonth();

    return monthDiff < 0 ? diffYears - 1 : diffYears;
  }

  // Check if house qualifies for S.40 distribution
  get qualifiesForS40Distribution(): boolean {
    return this._value.courtRecognized && this.isActive && this._value.houseOrder >= 1;
  }

  // Get house status
  get houseStatus(): string {
    if (this._value.houseDissolvedAt) return 'DISSOLVED';
    if (this._value.houseAssetsFrozen) return 'FROZEN';
    if (this._value.courtRecognized) return 'COURT_RECOGNIZED';
    return 'ACTIVE';
  }

  // Check if house has a business
  get hasBusiness(): boolean {
    return !!this._value.houseBusinessName && !!this._value.houseBusinessKraPin;
  }

  // Check if house has a head
  get hasHead(): boolean {
    return !!this._value.houseHeadId;
  }

  // Get S.40 compliance status
  get s40Compliance(): {
    isCompliant: boolean;
    missingRequirements: string[];
  } {
    const missing: string[] = [];

    if (!this._value.courtRecognized) {
      missing.push('Court recognition required');
    }

    if (!this._value.wivesConsentObtained && this._value.houseOrder > 1) {
      missing.push('Wives consent required for subsequent houses');
    }

    if (!this._value.houseSharePercentage && this._value.houseOrder > 1) {
      missing.push('House share percentage should be specified');
    }

    return {
      isCompliant: missing.length === 0,
      missingRequirements: missing,
    };
  }

  toJSON() {
    return {
      houseId: this._value.houseId,
      houseName: this._value.houseName,
      houseOrder: this._value.houseOrder,
      establishedDate: this._value.establishedDate.toISOString(),
      courtRecognized: this._value.courtRecognized,
      courtOrderNumber: this._value.courtOrderNumber,
      certificateIssuingCourt: this._value.certificateIssuingCourt,
      s40CertificateNumber: this._value.s40CertificateNumber,
      certificateIssuedDate: this._value.certificateIssuedDate?.toISOString(),
      houseHeadId: this._value.houseHeadId,
      houseBusinessName: this._value.houseBusinessName,
      houseBusinessKraPin: this._value.houseBusinessKraPin,
      separateProperty: this._value.separateProperty,
      wivesConsentObtained: this._value.wivesConsentObtained,
      wivesConsentDocumentId: this._value.wivesConsentDocumentId,
      wivesAgreementDetails: this._value.wivesAgreementDetails,
      houseSharePercentage: this._value.houseSharePercentage,
      houseAssetsFrozen: this._value.houseAssetsFrozen,
      houseDissolvedAt: this._value.houseDissolvedAt?.toISOString(),
      successionInstructions: this._value.successionInstructions,
      isActive: this.isActive,
      houseDurationYears: this.houseDurationYears,
      qualifiesForS40Distribution: this.qualifiesForS40Distribution,
      houseStatus: this.houseStatus,
      hasBusiness: this.hasBusiness,
      hasHead: this.hasHead,
      s40Compliance: this.s40Compliance,
    };
  }
}
