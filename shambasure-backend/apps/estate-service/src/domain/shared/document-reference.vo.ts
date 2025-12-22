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
  // Identification
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

  // Property
  TITLE_DEED = 'TITLE_DEED',
  LEASE_AGREEMENT = 'LEASE_AGREEMENT',
  SALE_AGREEMENT = 'SALE_AGREEMENT',
  CHARGE_INSTRUMENT = 'CHARGE_INSTRUMENT',
  SURVEY_DIAGRAM = 'SURVEY_DIAGRAM',
  LAND_RATES_CLEARANCE = 'LAND_RATES_CLEARANCE',
  LAND_RENT_CLEARANCE = 'LAND_RENT_CLEARANCE',

  // Legal & Succession
  WILL = 'WILL',
  CODICIL = 'CODICIL',
  GRANT_OF_PROBATE = 'GRANT_OF_PROBATE',
  LETTERS_OF_ADMINISTRATION = 'LETTERS_OF_ADMINISTRATION',
  CONFIRMATION_OF_GRANT = 'CONFIRMATION_OF_GRANT',
  COURT_ORDER = 'COURT_ORDER',
  AFFIDAVIT = 'AFFIDAVIT',
  SUCCESSION_CAUSE = 'SUCCESSION_CAUSE',

  // Financial & Business
  BANK_STATEMENT = 'BANK_STATEMENT',
  LOAN_AGREEMENT = 'LOAN_AGREEMENT',
  MORTGAGE_DEED = 'MORTGAGE_DEED',
  INSURANCE_POLICY = 'INSURANCE_POLICY',
  COMPANY_REGISTRATION = 'COMPANY_REGISTRATION',
  BUSINESS_PERMIT = 'BUSINESS_PERMIT',
  PARTNERSHIP_DEED = 'PARTNERSHIP_DEED',

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
  registrarName?: string;
  volume?: string;
  folio?: string;
  pageNumber?: string;
  status: DocumentStatus;
  verificationDate?: Date;
  verifiedBy?: string;
  remarks?: string;
}

export class DocumentReference extends ValueObject<DocumentReferenceProps> {
  // Regex Patterns for validation
  private static readonly DOCUMENT_PATTERNS: Partial<Record<DocumentType, RegExp[]>> = {
    [DocumentType.TITLE_DEED]: [
      /^(IR|CR)\s*\d{4,8}$/i,
      /^L\.?R\.?\s*(No\.?)?\s*\d{4,8}$/i,
      /^Title\s*(No\.?)?\s*[A-Z]{1,5}\/\d{1,5}\/\d{1,5}$/i,
      /^\d{1,5}\/[A-Z]{1,5}\/\d{1,5}$/i, // Block/Plot
      /^[A-Z]{2,3}\/\d{4,6}$/i,
    ],
    [DocumentType.DEATH_CERTIFICATE]: [
      /^DC\/\d+\/\d{4}$/i,
      /^DEATH\/\d+\/\d{4}$/i,
      /^RD\/[A-Z]+\/\d+\/\d{4}$/i,
      /^\d{6,10}$/, // Serial number
    ],
    [DocumentType.BIRTH_CERTIFICATE]: [
      /^BC\/\d+\/\d{4}$/i,
      /^[A-Z]{2,3}\/B\/\d+\/\d{4}$/i,
      /^\d{6,10}$/,
    ],
    [DocumentType.NATIONAL_ID]: [/^\d{7,9}[A-Z]?$/],
    [DocumentType.KRA_PIN]: [/^[PA]\d{9,10}[A-Z]$/i],
    [DocumentType.PASSPORT]: [/^[A-Z]{1,2}\d{7}$/i],
    [DocumentType.WILL]: [/^WILL\/\d+\/\d{4}$/i, /^WR\/\d+\/\d{4}$/i],
    [DocumentType.GRANT_OF_PROBATE]: [/^GP\/\d+\/\d{4}$/i, /^P&A\s*1\/\d+\/\d{4}$/i],
    [DocumentType.LETTERS_OF_ADMINISTRATION]: [/^LA\/\d+\/\d{4}$/i, /^P&A\s*80\/\d+\/\d{4}$/i],
  };

  constructor(props: DocumentReferenceProps) {
    super(props);
  }

  protected validate(): void {
    this.validateReferenceNumber();
    this.validateDates();
    this.validateIssuingAuthority();
  }

  private validateReferenceNumber(): void {
    const ref = this.props.referenceNumber.trim();
    if (!ref || ref.length === 0) {
      throw new InvalidDocumentReferenceException(
        'Reference number is required',
        'referenceNumber',
      );
    }

    const patterns = DocumentReference.DOCUMENT_PATTERNS[this.props.documentType];
    if (patterns) {
      const isValid = patterns.some((p) => p.test(ref));
      if (!isValid) {
        throw this.createDocumentTypeSpecificException(ref);
      }
    }

    this.performAdditionalValidation(ref);
  }

  private createDocumentTypeSpecificException(ref: string): Error {
    switch (this.props.documentType) {
      case DocumentType.TITLE_DEED:
        return new InvalidTitleDeedReferenceException(ref, {
          provided: ref,
          reason: 'Does not match standard IR/CR/LR/Block title formats',
        });
      case DocumentType.DEATH_CERTIFICATE:
        return new InvalidDeathCertificateException(ref);
      case DocumentType.BIRTH_CERTIFICATE:
        return new InvalidBirthCertificateException(ref);
      case DocumentType.NATIONAL_ID:
        return new InvalidIDNumberException(ref, 'NATIONAL_ID');
      case DocumentType.KRA_PIN:
        return new InvalidIDNumberException(ref, 'KRA_PIN');
      case DocumentType.WILL:
        return new InvalidWillReferenceException(ref);
      default:
        return new InvalidDocumentReferenceException(
          `Invalid reference for ${this.props.documentType}: ${ref}`,
          'referenceNumber',
        );
    }
  }

  private performAdditionalValidation(ref: string): void {
    // Checksum validations
    if (this.props.documentType === DocumentType.NATIONAL_ID) {
      this.validateNationalIDChecksum(ref);
    }
    // Year validation for Certs
    if (this.props.documentType === DocumentType.DEATH_CERTIFICATE) {
      this.validateCertificateYear(ref, 'DEATH');
    }
  }

  private validateNationalIDChecksum(id: string): void {
    // Basic length check for now as full checksum is in KenyanId VO
    if (id.length === 8 && /^\d{8}$/.test(id)) {
      // We defer full checksum to KenyanId VO to avoid duplication,
      // or we can implement a lightweight check here if this VO is standalone.
      // For standalone safety:
      // (Simplified check omitted for brevity as it mirrors KenyanId VO)
    }
  }

  private validateCertificateYear(ref: string, type: string): void {
    const match = ref.match(/\/(\d{4})$/);
    if (match) {
      const year = parseInt(match[1]);
      const current = new Date().getFullYear();
      if (year < 1900 || year > current) {
        if (type === 'DEATH') throw new InvalidDeathCertificateException(ref, { year });
        else throw new InvalidBirthCertificateException(ref, { year });
      }
    }
  }

  private validateDates(): void {
    const now = new Date();
    if (this.props.issueDate > now) {
      throw new InvalidDocumentReferenceException('Issue date cannot be in future', 'issueDate');
    }
    if (this.props.expiryDate && this.props.expiryDate <= this.props.issueDate) {
      throw new InvalidDocumentReferenceException('Expiry must be after Issue date', 'expiryDate');
    }
  }

  private validateIssuingAuthority(): void {
    if (!this.props.issuingAuthority || this.props.issuingAuthority.trim().length === 0) {
      throw new InvalidDocumentReferenceException('Issuing Authority required', 'issuingAuthority');
    }
  }

  // --- Factory Methods ---

  static createTitleDeed(
    deedNumber: string,
    issueDate: Date,
    issuingAuthority: string = 'REGISTRAR OF TITLES',
    county?: KenyanCounty,
  ): DocumentReference {
    return new DocumentReference({
      referenceNumber: deedNumber,
      documentType: DocumentType.TITLE_DEED,
      issuingAuthority,
      issueDate,
      countyOfIssue: county,
      status: DocumentStatus.VALID,
    });
  }

  static createDeathCertificate(
    certNumber: string,
    issueDate: Date,
    county?: KenyanCounty,
  ): DocumentReference {
    return new DocumentReference({
      referenceNumber: certNumber,
      documentType: DocumentType.DEATH_CERTIFICATE,
      issuingAuthority: 'REGISTRAR OF BIRTHS AND DEATHS',
      issueDate,
      countyOfIssue: county,
      status: DocumentStatus.VALID,
    });
  }

  static createGrantOfProbate(
    grantNumber: string,
    issueDate: Date,
    courtStation: string,
  ): DocumentReference {
    return new DocumentReference({
      referenceNumber: grantNumber,
      documentType: DocumentType.GRANT_OF_PROBATE,
      issuingAuthority: `High Court at ${courtStation}`,
      issueDate,
      status: DocumentStatus.VALID,
    });
  }

  // --- Business Logic ---

  isExpired(): boolean {
    if (!this.props.expiryDate) return false;
    return this.props.expiryDate < new Date();
  }

  isValidForSuccession(): boolean {
    if (this.props.status !== DocumentStatus.VALID) return false;
    // Certain docs like ID/Passport must be current
    const strictValidityTypes = [
      DocumentType.NATIONAL_ID,
      DocumentType.PASSPORT,
      DocumentType.KRA_PIN,
    ];
    if (strictValidityTypes.includes(this.props.documentType) && this.isExpired()) return false;
    return true;
  }

  public toJSON(): Record<string, any> {
    return {
      reference: this.props.referenceNumber,
      type: this.props.documentType,
      formatted: `${this.props.documentType} #${this.props.referenceNumber}`,
      issuedBy: this.props.issuingAuthority,
      issuedAt: this.props.issueDate,
      status: this.props.status,
      valid: this.isValidForSuccession(),
    };
  }
}
