// src/shared/domain/value-objects/document-reference.vo.ts
import { ValueObject } from '../base/value-object';
import {
  InvalidBirthCertificateException,
  InvalidDeathCertificateException,
  InvalidDocumentReferenceException,
  InvalidIDNumberException,
  InvalidTitleDeedReferenceException,
  InvalidWillReferenceException,
} from '../exceptions/document-reference.exception';
import { KenyanCounty } from './kenyan-location.vo';

export enum DocumentType {
  // Identification Documents
  NATIONAL_ID = 'NATIONAL_ID',
  PASSPORT = 'PASSPORT',
  KRA_PIN = 'KRA_PIN',
  ALIEN_CARD = 'ALIEN_CARD',
  REFUGEE_ID = 'REFUGEE_ID',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  MILITARY_ID = 'MILITARY_ID',

  // Vital Records
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  DEATH_CERTIFICATE = 'DEATH_CERTIFICATE',
  MARRIAGE_CERTIFICATE = 'MARRIAGE_CERTIFICATE',
  DIVORCE_DECREE = 'DIVORCE_DECREE',

  // Property Documents
  TITLE_DEED = 'TITLE_DEED',
  LEASE_AGREEMENT = 'LEASE_AGREEMENT',
  SALE_AGREEMENT = 'SALE_AGREEMENT',
  CHARGE_INSTRUMENT = 'CHARGE_INSTRUMENT',
  SURVEY_DIAGRAM = 'SURVEY_DIAGRAM',
  LAND_RATES_CLEARANCE = 'LAND_RATES_CLEARANCE',
  LAND_RENT_CLEARANCE = 'LAND_RENT_CLEARANCE',

  // Legal & Succession Documents
  WILL = 'WILL',
  CODICIL = 'CODICIL',
  GRANT_OF_PROBATE = 'GRANT_OF_PROBATE',
  LETTERS_OF_ADMINISTRATION = 'LETTERS_OF_ADMINISTRATION',
  CONFIRMATION_OF_GRANT = 'CONFIRMATION_OF_GRANT',
  COURT_ORDER = 'COURT_ORDER',
  AFFIDAVIT = 'AFFIDAVIT',
  SUCCESSION_CAUSE = 'SUCCESSION_CAUSE',

  // Financial Documents
  BANK_STATEMENT = 'BANK_STATEMENT',
  LOAN_AGREEMENT = 'LOAN_AGREEMENT',
  MORTGAGE_DEED = 'MORTGAGE_DEED',
  INSURANCE_POLICY = 'INSURANCE_POLICY',
  PENSION_DOCUMENT = 'PENSION_DOCUMENT',

  // Business Documents
  COMPANY_REGISTRATION = 'COMPANY_REGISTRATION',
  BUSINESS_PERMIT = 'BUSINESS_PERMIT',
  PARTNERSHIP_DEED = 'PARTNERSHIP_DEED',

  // Other
  EDUCATIONAL_CERTIFICATE = 'EDUCATIONAL_CERTIFICATE',
  MEDICAL_REPORT = 'MEDICAL_REPORT',
  POLICE_CLEARANCE = 'POLICE_CLEARANCE',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  VALID = 'VALID',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  DISPUTED = 'DISPUTED',
}

export interface DocumentReferenceProps {
  referenceNumber: string;
  documentType: DocumentType;
  issuingAuthority: string;
  issueDate: Date;
  expiryDate?: Date;
  countyOfIssue?: KenyanCounty;
  districtOfIssue?: string;
  registrarName?: string;
  volume?: string;
  folio?: string;
  pageNumber?: string;
  status: DocumentStatus;
  verificationDate?: Date;
  verifiedBy?: string;
  remarks?: string;
  supportingDocumentIds?: string[];
}

export class DocumentReference extends ValueObject<DocumentReferenceProps> {
  // Kenyan document validation patterns
  // Using Partial<Record> because not every single enum key needs a specific regex
  private static readonly DOCUMENT_PATTERNS: Partial<Record<DocumentType, RegExp[]>> = {
    [DocumentType.TITLE_DEED]: [
      /^(IR|CR)\s*\d{4,8}$/i,
      /^L\.?R\.?\s*(No\.?)?\s*\d{4,8}$/i,
      /^Title\s*(No\.?)?\s*[A-Z]{1,5}\/\d{1,5}\/\d{1,5}$/i,
      /^\d{1,5}\/[A-Z]{1,5}\/\d{1,5}$/i,
      /^[A-Z]{2,3}\/\d{4,6}$/i,
    ],
    [DocumentType.DEATH_CERTIFICATE]: [
      /^DC\/\d+\/\d{4}$/i,
      /^DEATH\/\d+\/\d{4}$/i,
      /^RD\/[A-Z]+\/\d+\/\d{4}$/i,
      /^CERT\/\d+\/\d{4}$/i,
      /^[A-Z]{2,3}\/D\/\d+\/\d{4}$/i, // County/D/Number/Year
      /^\d{6,10}$/, // Serial number only (legacy)
    ],
    [DocumentType.BIRTH_CERTIFICATE]: [
      /^BC\/\d+\/\d{4}$/i,
      /^BIRTH\/\d+\/\d{4}$/i,
      /^[A-Z]{2,3}\/B\/\d+\/\d{4}$/i,
      /^RB\/[A-Z]+\/\d+\/\d{4}$/i,
      /^\d{6,10}$/, // Serial number only (legacy)
    ],
    [DocumentType.NATIONAL_ID]: [
      /^\d{8}$/, // New format
      /^\d{7}[A-Z]$/i, // Old format
      /^\d{6}[A-Z]$/i, // Very old format
    ],
    [DocumentType.KRA_PIN]: [/^[PA]\d{10}$/i],
    [DocumentType.PASSPORT]: [
      /^[A-Z]\d{7}$/i, // Old format
      /^[A-Z]{2}\d{7}$/i, // New format
      /^D\d{7}$/i, // Diplomatic
      /^EA\d{7}$/i, // East African
    ],
    [DocumentType.WILL]: [
      /^WILL\/\d+\/\d{4}$/i,
      /^WR\/\d+\/\d{4}$/i,
      /^W\/\d+\/\d{4}$/i,
      /^HCSC\/\d+\/\d{4}$/i, // High Court Succession Cause
      /^P&A\/\d+\/\d{4}$/i, // Probate and Administration
    ],
    [DocumentType.GRANT_OF_PROBATE]: [
      /^GP\/\d+\/\d{4}$/i,
      /^GRANT\/\d+\/\d{4}$/i,
      /^P&A\s*1\/\d+\/\d{4}$/i, // Form P&A 1
    ],
    [DocumentType.LETTERS_OF_ADMINISTRATION]: [
      /^LA\/\d+\/\d{4}$/i,
      /^LETTERS\/\d+\/\d{4}$/i,
      /^P&A\s*80\/\d+\/\d{4}$/i, // Form P&A 80
    ],
    [DocumentType.COURT_ORDER]: [
      /^CO\/\d+\/\d{4}$/i,
      /^ORDER\/\d+\/\d{4}$/i,
      /^HC\/[A-Z]+\/\d+\/\d{4}$/i, // High Court
      /^MC\/[A-Z]+\/\d+\/\d{4}$/i, // Magistrate Court
      /^CMCC\/.+$/i, // Chief Magistrate Commercial Court
      /^ELC\/.+$/i, // Environment and Land Court
    ],
    [DocumentType.MARRIAGE_CERTIFICATE]: [
      /^MC\/\d+\/\d{4}$/i,
      /^MARRIAGE\/\d+\/\d{4}$/i,
      /^RM\/[A-Z]+\/\d+\/\d{4}$/i,
      /^[A-Z]{2,3}\/M\/\d+\/\d{4}$/i,
    ],
    [DocumentType.DIVORCE_DECREE]: [
      /^DD\/\d+\/\d{4}$/i,
      /^DIVORCE\/\d+\/\d{4}$/i,
      /^DC\/[A-Z]+\/\d+\/\d{4}$/i,
    ],
    [DocumentType.OTHER]: [/^.+$/], // Accept any non-empty string
  };

  // Default patterns for document types without specific patterns
  private static readonly DEFAULT_PATTERNS = [/^.{3,100}$/];

  constructor(props: DocumentReferenceProps) {
    super(props);
  }

  protected validate(): void {
    this.validateReferenceNumber();
    this.validateDates();
    this.validateIssuingAuthority();
    this.validateStatus();
  }

  private validateReferenceNumber(): void {
    const ref = this._value.referenceNumber.trim();

    if (!ref || ref.length === 0) {
      throw new InvalidDocumentReferenceException(
        'Document reference number cannot be empty',
        'referenceNumber',
        { documentType: this._value.documentType },
      );
    }

    // Get patterns for this document type
    const patterns =
      DocumentReference.DOCUMENT_PATTERNS[this._value.documentType] ||
      DocumentReference.DEFAULT_PATTERNS;

    const isValid = patterns.some((pattern) => pattern.test(ref));

    if (!isValid) {
      throw this.createDocumentTypeSpecificException(ref);
    }

    // Additional type-specific validation
    this.performAdditionalValidation(ref);
  }

  private createDocumentTypeSpecificException(ref: string): Error {
    switch (this._value.documentType) {
      case DocumentType.TITLE_DEED:
        return new InvalidTitleDeedReferenceException(ref, {
          reference: ref,
          documentType: this._value.documentType,
          validPatterns: DocumentReference.DOCUMENT_PATTERNS[DocumentType.TITLE_DEED]?.map(
            (p) => p.source,
          ),
        });
      case DocumentType.DEATH_CERTIFICATE:
        return new InvalidDeathCertificateException(ref, {
          reference: ref,
          documentType: this._value.documentType,
        });
      case DocumentType.BIRTH_CERTIFICATE:
        return new InvalidBirthCertificateException(ref, {
          reference: ref,
          documentType: this._value.documentType,
        });
      case DocumentType.NATIONAL_ID:
        return new InvalidIDNumberException(ref, 'NATIONAL_ID', {
          reference: ref,
          documentType: this._value.documentType,
        });
      case DocumentType.KRA_PIN:
        return new InvalidIDNumberException(ref, 'KRA_PIN', {
          reference: ref,
          documentType: this._value.documentType,
        });
      case DocumentType.WILL:
        return new InvalidWillReferenceException(ref, {
          reference: ref,
          documentType: this._value.documentType,
        });
      default:
        return new InvalidDocumentReferenceException(
          `Invalid ${this._value.documentType.replace(/_/g, ' ').toLowerCase()} reference: ${ref}`,
          'referenceNumber',
          {
            reference: ref,
            documentType: this._value.documentType,
            length: ref.length,
          },
        );
    }
  }

  private performAdditionalValidation(ref: string): void {
    // Additional validation based on document type
    switch (this._value.documentType) {
      case DocumentType.DEATH_CERTIFICATE:
        this.validateDeathCertificateYear(ref);
        break;
      case DocumentType.BIRTH_CERTIFICATE:
        this.validateBirthCertificateYear(ref);
        break;
      case DocumentType.NATIONAL_ID:
        this.validateNationalIDChecksum(ref);
        break;
      case DocumentType.KRA_PIN:
        this.validateKraPinChecksum(ref);
        break;
    }
  }

  private validateDeathCertificateYear(ref: string): void {
    // Extract year from death certificate reference (e.g., DC/123/2024)
    const yearMatch = ref.match(/\/(\d{4})$/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      const currentYear = new Date().getFullYear();

      if (year < 1900 || year > currentYear) {
        throw new InvalidDeathCertificateException(ref, {
          reference: ref,
          year,
          reason: `Invalid year in death certificate. Must be between 1900 and ${currentYear}`,
        });
      }
    }
  }

  private validateBirthCertificateYear(ref: string): void {
    const yearMatch = ref.match(/\/(\d{4})$/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      const currentYear = new Date().getFullYear();

      if (year < 1900 || year > currentYear) {
        throw new InvalidBirthCertificateException(ref, {
          reference: ref,
          year,
          reason: `Invalid year in birth certificate. Must be between 1900 and ${currentYear}`,
        });
      }
    }
  }

  private validateNationalIDChecksum(id: string): void {
    // Implementation of Kenyan National ID checksum validation
    if (id.length === 8 && /^\d{8}$/.test(id)) {
      const digits = id.split('').map(Number);
      let sum = 0;

      for (let i = 0; i < 7; i++) {
        let digit = digits[i];
        if ((7 - i) % 2 === 0) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }
        sum += digit;
      }

      const calculatedChecksum = (10 - (sum % 10)) % 10;

      if (calculatedChecksum !== digits[7]) {
        throw new InvalidIDNumberException(id, 'NATIONAL_ID', {
          reference: id,
          reason: `Invalid checksum. Expected last digit ${calculatedChecksum}`,
        });
      }
    }
  }

  private validateKraPinChecksum(pin: string): void {
    // KRA PIN checksum validation
    const baseDigits = pin.slice(1); // Remove prefix
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];

    let sum = 0;
    for (let i = 0; i < baseDigits.length; i++) {
      let digit = parseInt(baseDigits[i], 10) * weights[i];
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
      sum += digit;
    }

    const checksum = (10 - (sum % 10)) % 10;

    if (checksum !== 0) {
      throw new InvalidIDNumberException(pin, 'KRA_PIN', {
        reference: pin,
        reason: 'Invalid KRA PIN checksum',
      });
    }
  }

  private validateDates(): void {
    // Issue date cannot be in the future
    if (this._value.issueDate > new Date()) {
      throw new InvalidDocumentReferenceException(
        'Issue date cannot be in the future',
        'issueDate',
        { issueDate: this._value.issueDate },
      );
    }

    // Expiry date must be after issue date if provided
    if (this._value.expiryDate && this._value.expiryDate <= this._value.issueDate) {
      throw new InvalidDocumentReferenceException(
        'Expiry date must be after issue date',
        'expiryDate',
        {
          issueDate: this._value.issueDate,
          expiryDate: this._value.expiryDate,
        },
      );
    }

    // Some documents have maximum validity periods
    if (this._value.expiryDate) {
      const maxValidityYears = this.getMaximumValidityYears();
      if (maxValidityYears) {
        const validityYears = this.calculateYearsBetween(
          this._value.issueDate,
          this._value.expiryDate,
        );

        if (validityYears > maxValidityYears) {
          console.warn(
            `Document validity period (${validityYears} years) exceeds typical maximum (${maxValidityYears} years) for ${this._value.documentType}`,
          );
        }
      }
    }
  }

  private validateIssuingAuthority(): void {
    if (!this._value.issuingAuthority || this._value.issuingAuthority.trim().length === 0) {
      throw new InvalidDocumentReferenceException(
        'Issuing authority cannot be empty',
        'issuingAuthority',
        { documentType: this._value.documentType },
      );
    }

    // Validate against known Kenyan authorities
    const validAuthorities = this.getValidIssuingAuthorities();
    const authority = this._value.issuingAuthority.toUpperCase();

    if (validAuthorities.length > 0) {
      const isKnownAuthority = validAuthorities.some((valid) =>
        authority.includes(valid.toUpperCase()),
      );

      if (!isKnownAuthority) {
        console.warn(
          `Unknown issuing authority for ${this._value.documentType}: ${this._value.issuingAuthority}`,
        );
      }
    }
  }

  private validateStatus(): void {
    // If document is expired, status should reflect that
    if (this.isExpired() && this._value.status === DocumentStatus.VALID) {
      console.warn(`Document ${this._value.referenceNumber} is expired but status is VALID`);
    }
  }

  // Factory methods
  static createTitleDeed(
    deedNumber: string,
    issueDate: Date,
    issuingAuthority: string = 'REGISTRAR OF TITLES',
    countyOfIssue?: KenyanCounty,
    status: DocumentStatus = DocumentStatus.VALID,
  ): DocumentReference {
    return new DocumentReference({
      referenceNumber: deedNumber,
      documentType: DocumentType.TITLE_DEED,
      issuingAuthority,
      issueDate,
      countyOfIssue,
      status,
    });
  }

  static createDeathCertificate(
    certificateNumber: string,
    issueDate: Date,
    issuingAuthority: string = 'REGISTRAR OF BIRTHS AND DEATHS',
    countyOfIssue?: KenyanCounty,
    status: DocumentStatus = DocumentStatus.VALID,
  ): DocumentReference {
    return new DocumentReference({
      referenceNumber: certificateNumber,
      documentType: DocumentType.DEATH_CERTIFICATE,
      issuingAuthority,
      issueDate,
      countyOfIssue,
      status,
    });
  }

  static createWillReference(
    willNumber: string,
    registrationDate: Date,
    issuingAuthority: string = 'HIGH COURT OF KENYA',
    status: DocumentStatus = DocumentStatus.VALID,
  ): DocumentReference {
    return new DocumentReference({
      referenceNumber: willNumber,
      documentType: DocumentType.WILL,
      issuingAuthority,
      issueDate: registrationDate,
      status,
    });
  }

  static createGrantOfProbate(
    grantNumber: string,
    issueDate: Date,
    courtStation: string,
    status: DocumentStatus = DocumentStatus.VALID,
  ): DocumentReference {
    return new DocumentReference({
      referenceNumber: grantNumber,
      documentType: DocumentType.GRANT_OF_PROBATE,
      issuingAuthority: `High Court at ${courtStation}`,
      issueDate,
      status,
    });
  }

  // Business logic methods
  isExpired(): boolean {
    if (!this._value.expiryDate) return false;
    return this._value.expiryDate < new Date();
  }

  isValidForSuccession(): boolean {
    // Check if document is valid for succession purposes
    if (this._value.status !== DocumentStatus.VALID) {
      return false;
    }

    // Some documents must not be expired for succession
    const requiresCurrentValidity = [
      DocumentType.NATIONAL_ID,
      DocumentType.PASSPORT,
      DocumentType.KRA_PIN,
      DocumentType.DEATH_CERTIFICATE,
    ].includes(this._value.documentType);

    if (requiresCurrentValidity && this.isExpired()) {
      return false;
    }

    // Some documents have additional requirements
    if (this._value.documentType === DocumentType.DEATH_CERTIFICATE) {
      // Death certificate must be recent (within 6 months) for some purposes
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Warning only, as it might be an old death being processed now
      if (this._value.issueDate < sixMonthsAgo) {
        // console.warn(`Death certificate is more than 6 months old: ${this._value.issueDate}`);
      }
    }

    return true;
  }

  isIdentityDocument(): boolean {
    return [
      DocumentType.NATIONAL_ID,
      DocumentType.PASSPORT,
      DocumentType.KRA_PIN,
      DocumentType.ALIEN_CARD,
      DocumentType.REFUGEE_ID,
      DocumentType.DRIVER_LICENSE,
      DocumentType.MILITARY_ID,
    ].includes(this._value.documentType);
  }

  isPropertyDocument(): boolean {
    return [
      DocumentType.TITLE_DEED,
      DocumentType.LEASE_AGREEMENT,
      DocumentType.SALE_AGREEMENT,
      DocumentType.CHARGE_INSTRUMENT,
      DocumentType.SURVEY_DIAGRAM,
      DocumentType.GRANT_OF_PROBATE,
      DocumentType.LETTERS_OF_ADMINISTRATION,
    ].includes(this._value.documentType);
  }

  isLegalDocument(): boolean {
    return [
      DocumentType.WILL,
      DocumentType.CODICIL,
      DocumentType.COURT_ORDER,
      DocumentType.AFFIDAVIT,
      DocumentType.SUCCESSION_CAUSE,
      DocumentType.DIVORCE_DECREE,
      DocumentType.MARRIAGE_CERTIFICATE,
    ].includes(this._value.documentType);
  }

  getYearsValid(): number | null {
    if (!this._value.expiryDate) return null;
    return this.calculateYearsBetween(this._value.issueDate, this._value.expiryDate);
  }

  getRemainingValidityDays(): number | null {
    if (!this._value.expiryDate) return null;

    const now = new Date();
    if (now >= this._value.expiryDate) return 0;

    const diffTime = this._value.expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Formatting methods
  getFormattedReference(): string {
    const typeName = this.getDocumentTypeName();
    return `${typeName} No. ${this._value.referenceNumber}`;
  }

  getLegalCitation(): string {
    const typeName = this.getDocumentTypeName();
    const issueDate = this._value.issueDate.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `${typeName} Number ${this._value.referenceNumber} issued by ${this._value.issuingAuthority} on ${issueDate}`;
  }

  getDocumentSummary(): string {
    const summary = [
      `Type: ${this.getDocumentTypeName()}`,
      `Reference: ${this._value.referenceNumber}`,
      `Issuing Authority: ${this._value.issuingAuthority}`,
      `Issue Date: ${this._value.issueDate.toLocaleDateString()}`,
      this._value.expiryDate ? `Expiry Date: ${this._value.expiryDate.toLocaleDateString()}` : null,
      `Status: ${this._value.status}`,
      this._value.countyOfIssue ? `County of Issue: ${this._value.countyOfIssue}` : null,
      this._value.registrarName ? `Registrar: ${this._value.registrarName}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    return summary;
  }

  private getDocumentTypeName(): string {
    return this._value.documentType
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  private getValidIssuingAuthorities(): string[] {
    // Return valid issuing authorities for this document type
    const authorities: Partial<Record<DocumentType, string[]>> = {
      [DocumentType.TITLE_DEED]: ['REGISTRAR OF TITLES', 'MINISTRY OF LANDS', 'LAND REGISTRAR'],
      [DocumentType.DEATH_CERTIFICATE]: [
        'REGISTRAR OF BIRTHS AND DEATHS',
        'CIVIL REGISTRATION SERVICES',
      ],
      [DocumentType.BIRTH_CERTIFICATE]: [
        'REGISTRAR OF BIRTHS AND DEATHS',
        'CIVIL REGISTRATION SERVICES',
      ],
      [DocumentType.NATIONAL_ID]: ['NATIONAL REGISTRATION BUREAU', 'NRB'],
      [DocumentType.PASSPORT]: ['DEPARTMENT OF IMMIGRATION', 'DIRECTORATE OF IMMIGRATION SERVICES'],
      [DocumentType.KRA_PIN]: ['KENYA REVENUE AUTHORITY', 'KRA'],
      [DocumentType.WILL]: ['HIGH COURT', 'LAWYER', 'NOTARY PUBLIC'],
      [DocumentType.GRANT_OF_PROBATE]: ['HIGH COURT', 'HIGH COURT OF KENYA'],
      [DocumentType.LETTERS_OF_ADMINISTRATION]: ['HIGH COURT', 'HIGH COURT OF KENYA'],
      [DocumentType.COURT_ORDER]: [
        'HIGH COURT',
        'MAGISTRATE COURT',
        "KADHI'S COURT",
        'SUPREME COURT',
        'COURT OF APPEAL',
      ],
      [DocumentType.MARRIAGE_CERTIFICATE]: [
        'REGISTRAR OF MARRIAGES',
        'CHURCH',
        'MOSQUE',
        'ATTORNEY GENERAL',
      ],
      [DocumentType.DIVORCE_DECREE]: ['HIGH COURT', 'MAGISTRATE COURT', "KADHI'S COURT"],
    };

    return authorities[this._value.documentType] || [];
  }

  private getMaximumValidityYears(): number | null {
    // Defined using Partial since not all documents have max validity logic here
    const validityMap: Partial<Record<DocumentType, number | null>> = {
      [DocumentType.NATIONAL_ID]: 10,
      [DocumentType.PASSPORT]: 10,
      [DocumentType.DRIVER_LICENSE]: 3,
      [DocumentType.ALIEN_CARD]: 2,
      [DocumentType.REFUGEE_ID]: 1,
      [DocumentType.BUSINESS_PERMIT]: 1,
      [DocumentType.POLICE_CLEARANCE]: 0.5, // 6 months
      [DocumentType.MEDICAL_REPORT]: 1,
    };

    return validityMap[this._value.documentType] ?? null;
  }

  private calculateYearsBetween(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return diffTime / (1000 * 60 * 60 * 24 * 365.25);
  }

  // Getters
  get referenceNumber(): string {
    return this._value.referenceNumber;
  }

  get documentType(): DocumentType {
    return this._value.documentType;
  }

  get issuingAuthority(): string {
    return this._value.issuingAuthority;
  }

  get issueDate(): Date {
    return this._value.issueDate;
  }

  get expiryDate(): Date | undefined {
    return this._value.expiryDate;
  }

  get countyOfIssue(): KenyanCounty | undefined {
    return this._value.countyOfIssue;
  }

  get status(): DocumentStatus {
    return this._value.status;
  }

  get verificationDate(): Date | undefined {
    return this._value.verificationDate;
  }

  get verifiedBy(): string | undefined {
    return this._value.verifiedBy;
  }

  // For API responses
  toJSON() {
    return {
      referenceNumber: this._value.referenceNumber,
      formattedReference: this.getFormattedReference(),
      documentType: this._value.documentType,
      documentTypeName: this.getDocumentTypeName(),
      issuingAuthority: this._value.issuingAuthority,
      issueDate: this._value.issueDate,
      expiryDate: this._value.expiryDate,
      countyOfIssue: this._value.countyOfIssue,
      status: this._value.status,
      isExpired: this.isExpired(),
      isValidForSuccession: this.isValidForSuccession(),
      isIdentityDocument: this.isIdentityDocument(),
      isPropertyDocument: this.isPropertyDocument(),
      isLegalDocument: this.isLegalDocument(),
      yearsValid: this.getYearsValid(),
      remainingValidityDays: this.getRemainingValidityDays(),
      legalCitation: this.getLegalCitation(),
      verification: {
        verifiedBy: this._value.verifiedBy,
        verificationDate: this._value.verificationDate,
      },
      metadata: {
        volume: this._value.volume,
        folio: this._value.folio,
        pageNumber: this._value.pageNumber,
        registrarName: this._value.registrarName,
      },
    };
  }
}
