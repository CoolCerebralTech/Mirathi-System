// src/shared/domain/value-objects/document-reference.vo.ts
import { ValueObject } from '../base/value-object';
import {
  InvalidBirthCertificateException,
  InvalidDeathCertificateException,
  InvalidDocumentReferenceException,
  InvalidIDNumberException,
  InvalidTitleDeedReferenceException,
} from '../exceptions/document-reference.exception';
import { KenyanCounty } from './kenyan-location.vo';

export enum DocumentType {
  TITLE_DEED = 'TITLE_DEED',
  DEATH_CERTIFICATE = 'DEATH_CERTIFICATE',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  NATIONAL_ID = 'NATIONAL_ID',
  PASSPORT = 'PASSPORT',
  KRA_PIN = 'KRA_PIN',
  MARRIAGE_CERTIFICATE = 'MARRIAGE_CERTIFICATE',
  DIVORCE_DECREE = 'DIVORCE_DECREE',
  WILL = 'WILL',
  GRANT_OF_PROBATE = 'GRANT_OF_PROBATE',
  LETTERS_OF_ADMINISTRATION = 'LETTERS_OF_ADMINISTRATION',
  COURT_ORDER = 'COURT_ORDER',
  AFFIDAVIT = 'AFFIDAVIT',
  OTHER = 'OTHER',
}

export interface DocumentReferenceProps {
  referenceNumber: string;
  documentType: DocumentType;
  issuingAuthority: string;
  issueDate: Date;
  expiryDate?: Date;
  countyOfIssue?: KenyanCounty;
  documentNumber?: string;
  volume?: string;
  folio?: string;
  registrar?: string;
}

export class DocumentReference extends ValueObject<DocumentReferenceProps> {
  constructor(props: DocumentReferenceProps) {
    super(props);
  }

  protected validate(): void {
    this.validateReferenceNumber();
    this.validateDates();
    this.validateIssuingAuthority();
  }

  private validateReferenceNumber(): void {
    const ref = this._value.referenceNumber.trim();

    if (!ref || ref.length === 0) {
      throw new InvalidDocumentReferenceException(
        'Document reference number cannot be empty',
        'referenceNumber',
      );
    }

    // Type-specific validation
    switch (this._value.documentType) {
      case DocumentType.TITLE_DEED:
        this.validateTitleDeedReference(ref);
        break;
      case DocumentType.DEATH_CERTIFICATE:
        this.validateDeathCertificateReference(ref);
        break;
      case DocumentType.BIRTH_CERTIFICATE:
        this.validateBirthCertificateReference(ref);
        break;
      case DocumentType.NATIONAL_ID:
        this.validateNationalIDReference(ref);
        break;
      case DocumentType.KRA_PIN:
        this.validateKraPinReference(ref);
        break;
      case DocumentType.MARRIAGE_CERTIFICATE:
        this.validateMarriageCertificateReference(ref);
        break;
      case DocumentType.WILL:
        this.validateWillReference(ref);
        break;
      default:
        this.validateGenericReference(ref);
    }
  }

  private validateTitleDeedReference(ref: string): void {
    // Kenyan title deed formats
    const patterns = [
      /^IR\s*\d{4,8}$/i,
      /^CR\s*\d{4,8}$/i,
      /^L\.?R\.?\s*No\.?\s*\d{4,8}$/i,
      /^Title\s*No\.?\s*[A-Z]+\/\d+$/i,
      /^\d+\/[A-Z]+\/\d+$/i,
    ];

    const isValid = patterns.some((pattern) => pattern.test(ref));

    if (!isValid) {
      throw new InvalidTitleDeedReferenceException(ref, {
        reference: ref,
        documentType: 'TITLE_DEED',
      });
    }
  }

  private validateDeathCertificateReference(ref: string): void {
    // Death certificate formats:
    // - DC/12345/2024
    // - DEATH/123/2024
    // - Registrar's format: RD/COUNTY/123/2024

    const patterns = [
      /^DC\/\d+\/\d{4}$/i,
      /^DEATH\/\d+\/\d{4}$/i,
      /^RD\/[A-Z]+\/\d+\/\d{4}$/i,
      /^CERT\/\d+\/\d{4}$/i,
    ];

    const isValid = patterns.some((pattern) => pattern.test(ref));

    if (!isValid) {
      throw new InvalidDeathCertificateException(ref, {
        reference: ref,
        documentType: 'DEATH_CERTIFICATE',
      });
    }
  }

  private validateBirthCertificateReference(ref: string): void {
    // Birth certificate formats:
    // - BC/12345/2024
    // - BIRTH/123/2024
    // - District format: NAI/123/2024

    const patterns = [/^BC\/\d+\/\d{4}$/i, /^BIRTH\/\d+\/\d{4}$/i, /^[A-Z]{2,3}\/\d+\/\d{4}$/i];

    const isValid = patterns.some((pattern) => pattern.test(ref));

    if (!isValid) {
      throw new InvalidBirthCertificateException(ref, {
        reference: ref,
        documentType: 'BIRTH_CERTIFICATE',
      });
    }
  }

  private validateNationalIDReference(ref: string): void {
    // National ID: 8 digits or 7 digits + letter
    const pattern = /^(\d{8}|\d{7}[A-Z])$/i;

    if (!pattern.test(ref)) {
      throw new InvalidIDNumberException(ref, 'NATIONAL_ID', {
        reference: ref,
        documentType: 'NATIONAL_ID',
      });
    }
  }

  private validateKraPinReference(ref: string): void {
    // KRA PIN: P/A followed by 10 digits
    const pattern = /^[PA]\d{10}$/i;

    if (!pattern.test(ref)) {
      throw new InvalidIDNumberException(ref, 'KRA_PIN', {
        reference: ref,
        documentType: 'KRA_PIN',
      });
    }
  }

  private validateMarriageCertificateReference(ref: string): void {
    // Marriage certificate formats:
    // - MC/123/2024
    // - MARRIAGE/123/2024
    // - Registrar's format: RM/COUNTY/123/2024

    const patterns = [/^MC\/\d+\/\d{4}$/i, /^MARRIAGE\/\d+\/\d{4}$/i, /^RM\/[A-Z]+\/\d+\/\d{4}$/i];

    const isValid = patterns.some((pattern) => pattern.test(ref));

    if (!isValid) {
      throw new InvalidDocumentReferenceException(
        `Invalid marriage certificate reference: ${ref}`,
        'referenceNumber',
        { reference: ref, documentType: 'MARRIAGE_CERTIFICATE' },
      );
    }
  }

  private validateWillReference(ref: string): void {
    // Will registration formats:
    // - WILL/123/2024
    // - WR/123/2024 (Will Registry)

    const patterns = [/^WILL\/\d+\/\d{4}$/i, /^WR\/\d+\/\d{4}$/i, /^W\/\d+\/\d{4}$/i];

    const isValid = patterns.some((pattern) => pattern.test(ref));

    if (!isValid) {
      throw new InvalidDocumentReferenceException(
        `Invalid will reference: ${ref}`,
        'referenceNumber',
        { reference: ref, documentType: 'WILL' },
      );
    }
  }

  private validateGenericReference(ref: string): void {
    // Generic validation for other document types
    if (ref.length < 3 || ref.length > 100) {
      throw new InvalidDocumentReferenceException(
        `Document reference must be 3-100 characters: ${ref}`,
        'referenceNumber',
        { reference: ref, length: ref.length },
      );
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
        { issueDate: this._value.issueDate, expiryDate: this._value.expiryDate },
      );
    }

    // Check if document is expired
    if (this._value.expiryDate && this._value.expiryDate < new Date()) {
      console.warn(`Document ${this._value.referenceNumber} has expired`);
    }
  }

  private validateIssuingAuthority(): void {
    if (!this._value.issuingAuthority || this._value.issuingAuthority.trim().length === 0) {
      throw new InvalidDocumentReferenceException(
        'Issuing authority cannot be empty',
        'issuingAuthority',
      );
    }

    // Validate common Kenyan issuing authorities
    const validAuthorities = [
      'REGISTRAR OF BIRTHS AND DEATHS',
      'REGISTRAR OF MARRIAGES',
      'REGISTRAR OF TITLES',
      'DEPARTMENT OF IMMIGRATION',
      'KENYA REVENUE AUTHORITY',
      'HIGH COURT OF KENYA',
      'CHIEF MAGISTRATE COURT',
      "KADHI'S COURT",
      'MINISTRY OF LANDS',
      'NATIONAL REGISTRATION BUREAU',
    ];

    const authority = this._value.issuingAuthority.toUpperCase();
    const isKnownAuthority = validAuthorities.some((valid) => authority.includes(valid));

    if (!isKnownAuthority) {
      console.warn(`Unknown issuing authority: ${this._value.issuingAuthority}`);
    }
  }

  // Factory methods
  static createTitleDeed(
    deedNumber: string,
    issueDate: Date,
    issuingAuthority: string = 'REGISTRAR OF TITLES',
    countyOfIssue?: KenyanCounty,
  ): DocumentReference {
    return new DocumentReference({
      referenceNumber: deedNumber,
      documentType: DocumentType.TITLE_DEED,
      issuingAuthority,
      issueDate,
      countyOfIssue,
    });
  }

  static createDeathCertificate(
    certificateNumber: string,
    issueDate: Date,
    issuingAuthority: string = 'REGISTRAR OF BIRTHS AND DEATHS',
    countyOfIssue?: KenyanCounty,
  ): DocumentReference {
    return new DocumentReference({
      referenceNumber: certificateNumber,
      documentType: DocumentType.DEATH_CERTIFICATE,
      issuingAuthority,
      issueDate,
      countyOfIssue,
    });
  }

  static createNationalID(
    idNumber: string,
    issueDate: Date,
    issuingAuthority: string = 'NATIONAL REGISTRATION BUREAU',
    expiryDate?: Date,
  ): DocumentReference {
    return new DocumentReference({
      referenceNumber: idNumber,
      documentType: DocumentType.NATIONAL_ID,
      issuingAuthority,
      issueDate,
      expiryDate,
    });
  }

  static createWillReference(
    willNumber: string,
    registrationDate: Date,
    issuingAuthority: string = 'HIGH COURT OF KENYA',
  ): DocumentReference {
    return new DocumentReference({
      referenceNumber: willNumber,
      documentType: DocumentType.WILL,
      issuingAuthority,
      issueDate: registrationDate,
    });
  }

  // Business logic methods
  isExpired(): boolean {
    if (!this._value.expiryDate) return false;
    return this._value.expiryDate < new Date();
  }

  isIdentityDocument(): boolean {
    return [DocumentType.NATIONAL_ID, DocumentType.PASSPORT, DocumentType.KRA_PIN].includes(
      this._value.documentType,
    );
  }

  isPropertyDocument(): boolean {
    return [
      DocumentType.TITLE_DEED,
      DocumentType.GRANT_OF_PROBATE,
      DocumentType.LETTERS_OF_ADMINISTRATION,
    ].includes(this._value.documentType);
  }

  isLegalDocument(): boolean {
    return [
      DocumentType.WILL,
      DocumentType.COURT_ORDER,
      DocumentType.AFFIDAVIT,
      DocumentType.DIVORCE_DECREE,
      DocumentType.MARRIAGE_CERTIFICATE,
    ].includes(this._value.documentType);
  }

  getYearsValid(): number | null {
    if (!this._value.expiryDate) return null;

    const diffTime = Math.abs(this._value.expiryDate.getTime() - this._value.issueDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
  }

  // Formatting methods
  getFormattedReference(): string {
    const typeMap: Record<DocumentType, string> = {
      [DocumentType.TITLE_DEED]: 'Title Deed',
      [DocumentType.DEATH_CERTIFICATE]: 'Death Certificate',
      [DocumentType.BIRTH_CERTIFICATE]: 'Birth Certificate',
      [DocumentType.NATIONAL_ID]: 'National ID',
      [DocumentType.PASSPORT]: 'Passport',
      [DocumentType.KRA_PIN]: 'KRA PIN',
      [DocumentType.MARRIAGE_CERTIFICATE]: 'Marriage Certificate',
      [DocumentType.DIVORCE_DECREE]: 'Divorce Decree',
      [DocumentType.WILL]: 'Will',
      [DocumentType.GRANT_OF_PROBATE]: 'Grant of Probate',
      [DocumentType.LETTERS_OF_ADMINISTRATION]: 'Letters of Administration',
      [DocumentType.COURT_ORDER]: 'Court Order',
      [DocumentType.AFFIDAVIT]: 'Affidavit',
      [DocumentType.OTHER]: 'Document',
    };

    return `${typeMap[this._value.documentType]} No. ${this._value.referenceNumber}`;
  }

  getLegalCitation(): string {
    return `Certified copy of ${this.getFormattedReference()} issued by ${this._value.issuingAuthority} on ${this._value.issueDate.toLocaleDateString()}`;
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

  get documentNumber(): string | undefined {
    return this._value.documentNumber;
  }

  get volume(): string | undefined {
    return this._value.volume;
  }

  get folio(): string | undefined {
    return this._value.folio;
  }

  get registrar(): string | undefined {
    return this._value.registrar;
  }
}
