// domain/value-objects/identity/death-certificate.vo.ts
import { ValueObject } from '../../base/value-object';
import { InvalidDeathCertificateException } from '../../exceptions/identity.exceptions';

export enum DeathProofType {
  DEATH_CERTIFICATE = 'DEATH_CERTIFICATE',
  BURIAL_PERMIT = 'BURIAL_PERMIT',
  COURT_PRESUMPTION_ORDER = 'COURT_PRESUMPTION_ORDER',
  POLICE_ABSTRACT = 'POLICE_ABSTRACT',
  CHIEFS_LETTER = 'CHIEFS_LETTER',
  MEDICAL_CERTIFICATE = 'MEDICAL_CERTIFICATE',
}

export enum RegistrationType {
  STANDARD = 'STANDARD',
  LATE_REGISTRATION = 'LATE_REGISTRATION',
  DELAYED_REGISTRATION = 'DELAYED_REGISTRATION',
  STILLBIRTH = 'STILLBIRTH',
}

export interface DeathCertificateProps {
  certificateNumber: string;
  entryNumber?: string;
  serialNumber?: string;
  proofType: DeathProofType;
  dateOfDeath: Date;
  placeOfDeath: string;
  causeOfDeath?: string;
  registrationType: RegistrationType;
  dateOfRegistration: Date;
  registrationDistrict: string;
  registrationOfficer?: string;
  reportedBy?: string;
  informantRelationship?: string;
  informantIdNumber?: string;
  informantContact?: string;
  isCertifiedCopy: boolean;
  issuedAt?: Date;
  issuingOffice?: string;
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  verificationMethod?: string;
  supportingDocumentIds?: string[];
}

export class DeathCertificate extends ValueObject<DeathCertificateProps> {
  private constructor(props: DeathCertificateProps) {
    super(props);
    this.validate();
  }

  // --- Factory Methods ---

  static createStandardCertificate(
    certificateNumber: string,
    dateOfDeath: Date,
    dateOfRegistration: Date,
    placeOfDeath: string,
    registrationDistrict: string,
  ): DeathCertificate {
    return new DeathCertificate({
      certificateNumber: DeathCertificate.sanitizeCertificateNumber(certificateNumber),
      proofType: DeathProofType.DEATH_CERTIFICATE,
      dateOfDeath,
      placeOfDeath: DeathCertificate.sanitize(placeOfDeath),
      registrationType: DeathCertificate.determineRegistrationType(dateOfDeath, dateOfRegistration),
      dateOfRegistration,
      registrationDistrict: DeathCertificate.sanitize(registrationDistrict),
      isCertifiedCopy: false,
      isVerified: false,
    });
  }

  static createFromCourtOrder(
    courtOrderNumber: string,
    presumedDateOfDeath: Date,
    courtStation: string,
  ): DeathCertificate {
    return new DeathCertificate({
      certificateNumber: courtOrderNumber,
      proofType: DeathProofType.COURT_PRESUMPTION_ORDER,
      dateOfDeath: presumedDateOfDeath,
      placeOfDeath: `${courtStation} High Court`,
      registrationType: RegistrationType.STANDARD,
      dateOfRegistration: new Date(),
      registrationDistrict: courtStation,
      isCertifiedCopy: true,
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy: courtStation,
      verificationMethod: 'COURT_ORDER',
    });
  }

  static createBurialPermit(
    permitNumber: string,
    dateOfDeath: Date,
    placeOfDeath: string,
    issuingCounty: string,
  ): DeathCertificate {
    return new DeathCertificate({
      certificateNumber: permitNumber,
      proofType: DeathProofType.BURIAL_PERMIT,
      dateOfDeath,
      placeOfDeath: DeathCertificate.sanitize(placeOfDeath),
      registrationType: RegistrationType.STANDARD,
      dateOfRegistration: new Date(),
      registrationDistrict: issuingCounty,
      isCertifiedCopy: false,
      isVerified: false,
    });
  }

  static reconstruct(props: DeathCertificateProps): DeathCertificate {
    return new DeathCertificate(props);
  }

  // --- Validation ---

  protected validate(): void {
    const { certificateNumber, dateOfDeath, dateOfRegistration, proofType } = this._value;

    if (!certificateNumber) {
      throw new InvalidDeathCertificateException('Certificate number is required');
    }

    if (!dateOfDeath) {
      throw new InvalidDeathCertificateException('Date of death is required');
    }

    if (!dateOfRegistration) {
      throw new InvalidDeathCertificateException('Date of registration is required');
    }

    const today = new Date();
    if (dateOfDeath > today) {
      throw new InvalidDeathCertificateException('Date of death cannot be in the future');
    }

    if (dateOfRegistration > today) {
      throw new InvalidDeathCertificateException('Registration date cannot be in the future');
    }

    if (proofType !== DeathProofType.COURT_PRESUMPTION_ORDER && dateOfRegistration < dateOfDeath) {
      throw new InvalidDeathCertificateException(
        'Registration date cannot be before date of death',
      );
    }

    if (proofType === DeathProofType.DEATH_CERTIFICATE) {
      this.validateCivilRegistration();
    }
  }

  private validateCivilRegistration(): void {
    const { certificateNumber } = this._value;

    if (!DeathCertificate.isValidCertificateNumber(certificateNumber)) {
      console.warn(`Invalid certificate number format: ${certificateNumber}`);
    }
  }

  // --- Business Logic ---

  get isLateRegistration(): boolean {
    const { dateOfDeath, dateOfRegistration } = this._value;
    const oneYearLater = new Date(dateOfDeath);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    return dateOfRegistration > oneYearLater;
  }

  get isDelayedRegistration(): boolean {
    const { dateOfDeath, dateOfRegistration } = this._value;
    const oneWeekLater = new Date(dateOfDeath);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    const oneYearLater = new Date(dateOfDeath);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    return dateOfRegistration >= oneWeekLater && dateOfRegistration <= oneYearLater;
  }

  get requiresAdditionalVerification(): boolean {
    return (
      this.isLateRegistration ||
      this._value.proofType === DeathProofType.CHIEFS_LETTER ||
      this._value.proofType === DeathProofType.POLICE_ABSTRACT
    );
  }

  get validityStatus(): 'VALID' | 'REQUIRES_VERIFICATION' | 'INVALID' {
    if (!this._value.isVerified) return 'REQUIRES_VERIFICATION';

    if (this.requiresAdditionalVerification && !this._value.supportingDocumentIds?.length) {
      return 'REQUIRES_VERIFICATION';
    }

    return 'VALID';
  }

  // --- Domain Methods ---

  withEntryNumber(entryNumber: string): DeathCertificate {
    return new DeathCertificate({
      ...this._value,
      entryNumber: DeathCertificate.sanitize(entryNumber),
    });
  }

  withInformant(
    name: string,
    relationship: string,
    idNumber?: string,
    contact?: string,
  ): DeathCertificate {
    return new DeathCertificate({
      ...this._value,
      reportedBy: DeathCertificate.sanitize(name),
      informantRelationship: DeathCertificate.sanitize(relationship),
      informantIdNumber: idNumber ? DeathCertificate.sanitize(idNumber) : undefined,
      informantContact: contact ? DeathCertificate.sanitize(contact) : undefined,
    });
  }

  withCauseOfDeath(cause: string, icdCode?: string): DeathCertificate {
    const causeDescription = icdCode ? `${cause} (ICD-10: ${icdCode})` : cause;
    return new DeathCertificate({
      ...this._value,
      causeOfDeath: DeathCertificate.sanitize(causeDescription),
    });
  }

  markAsCertifiedCopy(issuedAt: Date, issuingOffice: string): DeathCertificate {
    return new DeathCertificate({
      ...this._value,
      isCertifiedCopy: true,
      issuedAt,
      issuingOffice: DeathCertificate.sanitize(issuingOffice),
    });
  }

  verify(
    verifiedBy: string,
    method: string = 'MANUAL_VERIFICATION',
    supportingDocumentIds?: string[],
  ): DeathCertificate {
    return new DeathCertificate({
      ...this._value,
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy: DeathCertificate.sanitize(verifiedBy),
      verificationMethod: method,
      supportingDocumentIds: supportingDocumentIds || this._value.supportingDocumentIds,
    });
  }

  addSupportingDocument(documentId: string): DeathCertificate {
    const documents = [...(this._value.supportingDocumentIds || []), documentId];
    return new DeathCertificate({
      ...this._value,
      supportingDocumentIds: documents,
    });
  }

  // --- Getters ---

  get certificateNumber(): string {
    return this._value.certificateNumber;
  }

  get dateOfDeath(): Date {
    return this._value.dateOfDeath;
  }

  get isVerified(): boolean {
    return this._value.isVerified;
  }

  get proofType(): DeathProofType {
    return this._value.proofType;
  }

  get registrationType(): RegistrationType {
    return this._value.registrationType;
  }

  // --- Static Helper Methods ---

  private static sanitizeCertificateNumber(certNumber: string): string {
    return certNumber ? certNumber.trim().toUpperCase().replace(/\s+/g, '') : '';
  }

  private static sanitize(val: string): string {
    return val ? val.trim() : '';
  }

  private static determineRegistrationType(
    dateOfDeath: Date,
    dateOfRegistration: Date,
  ): RegistrationType {
    const oneYearLater = new Date(dateOfDeath);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    if (dateOfRegistration > oneYearLater) {
      return RegistrationType.LATE_REGISTRATION;
    }

    const oneWeekLater = new Date(dateOfDeath);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);

    if (dateOfRegistration >= oneWeekLater) {
      return RegistrationType.DELAYED_REGISTRATION;
    }

    return RegistrationType.STANDARD;
  }

  private static isValidCertificateNumber(certNumber: string): boolean {
    const patterns = [
      /^CR\/\d{4,}\/\d{4}$/,
      /^BP\/\w+\/\d{4}$/,
      /^HC\/\w+\/\d{4}\/\d+$/,
      /^\d{2}\/\d{4}\/\d{4}$/,
      /^[A-Z]{2,3}\d{6,8}$/,
    ];

    return patterns.some((pattern) => pattern.test(certNumber));
  }

  // --- JSON Serialization ---

  public toJSON() {
    return {
      certificateNumber: this._value.certificateNumber,
      entryNumber: this._value.entryNumber,
      proofType: this._value.proofType,
      dateOfDeath: this._value.dateOfDeath,
      placeOfDeath: this._value.placeOfDeath,
      causeOfDeath: this._value.causeOfDeath,
      registrationType: this._value.registrationType,
      dateOfRegistration: this._value.dateOfRegistration,
      registrationDistrict: this._value.registrationDistrict,
      isCertifiedCopy: this._value.isCertifiedCopy,
      isVerified: this._value.isVerified,
      verifiedAt: this._value.verifiedAt,
      verifiedBy: this._value.verifiedBy,
      verificationMethod: this._value.verificationMethod,
      isLateRegistration: this.isLateRegistration,
      isDelayedRegistration: this.isDelayedRegistration,
      requiresAdditionalVerification: this.requiresAdditionalVerification,
      validityStatus: this.validityStatus,
      supportingDocumentIds: this._value.supportingDocumentIds,
    };
  }
}
