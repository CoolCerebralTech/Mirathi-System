import { Entity } from '../base/entity';
import { AdoptionFinalizedEvent } from '../events/relationship-events/adoption-finalized.event';
import { InvalidAdoptionException } from '../exceptions/relationship.exception';

export enum AdoptionType {
  CUSTOMARY = 'CUSTOMARY',
  STATUTORY = 'STATUTORY',
  INTER_COUNTRY = 'INTER_COUNTRY',
  KINSHIP = 'KINSHIP',
}

export interface AdoptionConsents {
  biologicalParents: boolean;
  spouse: boolean;
  [key: string]: boolean; // Allow for additional consents
}

export interface AdoptionOrderProps {
  id: string;
  familyId: string;

  // Adoption parties
  adopteeId: string;
  adopterId: string;

  // Adoption details
  adoptionType: string;
  courtOrderNumber?: string;
  adoptionDate: Date;
  registrationDate?: Date;

  // Kenyan Children Act compliance
  hasConsents: any; // JSON - e.g., {biologicalParents: true, spouse: true}
  consentDocuments: string[]; // Array of document IDs

  // Social welfare reports
  childWelfareReport?: string; // Document ID
  suitabilityReport?: string; // Document ID

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdoptionProps {
  familyId: string;
  adopteeId: string;
  adopterId: string;
  adoptionType: string;
  adoptionDate: Date;

  // Legal details
  courtOrderNumber?: string;
  registrationDate?: Date;

  // Consents (optional at creation, can be added later)
  hasConsents?: any;
  consentDocuments?: string[];

  // Welfare reports
  childWelfareReport?: string;
  suitabilityReport?: string;
}

export class AdoptionOrder extends Entity<AdoptionOrderProps> {
  private constructor(props: AdoptionOrderProps) {
    super(props.id, props);
    this.validate();
  }

  static create(props: CreateAdoptionProps): AdoptionOrder {
    const id = this.generateId();
    const now = new Date();

    const order = new AdoptionOrder({
      id,
      familyId: props.familyId,
      adopteeId: props.adopteeId,
      adopterId: props.adopterId,
      adoptionType: props.adoptionType,
      courtOrderNumber: props.courtOrderNumber,
      adoptionDate: props.adoptionDate,
      registrationDate: props.registrationDate,
      hasConsents: props.hasConsents || {
        biologicalParents: false,
        spouse: false,
      },
      consentDocuments: props.consentDocuments || [],
      childWelfareReport: props.childWelfareReport,
      suitabilityReport: props.suitabilityReport,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    return order;
  }

  static createFromProps(props: AdoptionOrderProps): AdoptionOrder {
    return new AdoptionOrder(props);
  }

  // --- Domain Logic ---

  recordConsents(consents: any, documentIds: string[]): void {
    this.props.hasConsents = {
      ...this.props.hasConsents,
      ...consents,
    };

    // Add unique document IDs
    const currentDocs = new Set(this.props.consentDocuments);
    documentIds.forEach((id) => currentDocs.add(id));
    this.props.consentDocuments = Array.from(currentDocs);

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  attachWelfareReports(childWelfareReport: string, suitabilityReport: string): void {
    this.props.childWelfareReport = childWelfareReport;
    this.props.suitabilityReport = suitabilityReport;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  finalize(registrationDate: Date): void {
    if (this.props.adoptionType === 'STATUTORY' && !this.props.courtOrderNumber) {
      throw new InvalidAdoptionException('Statutory adoption requires a Court Order Number.');
    }

    // Check for necessary consents based on adoption type
    if (this.props.adoptionType === 'STATUTORY') {
      if (!this.props.childWelfareReport || !this.props.suitabilityReport) {
        throw new InvalidAdoptionException(
          'Statutory adoption requires child welfare and suitability reports.',
        );
      }

      // For statutory adoption, biological parents' consent is typically required
      if (!this.props.hasConsents?.biologicalParents) {
        console.warn('Warning: Statutory adoption finalized without biological parents consent.');
      }
    }

    this.props.registrationDate = registrationDate;
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new AdoptionFinalizedEvent({
        adoptionOrderId: this.id,
        familyId: this.props.familyId,
        adopteeId: this.props.adopteeId,
        adopterId: this.props.adopterId,
        adoptionType: this.props.adoptionType,
        adoptionDate: this.props.adoptionDate,
        registrationDate,
        courtOrderNumber: this.props.courtOrderNumber,
      }),
    );
  }

  updateAdoptionDetails(params: {
    courtOrderNumber?: string;
    adoptionDate?: Date;
    registrationDate?: Date;
    adoptionType?: string;
  }): void {
    if (params.courtOrderNumber !== undefined) {
      this.props.courtOrderNumber = params.courtOrderNumber;
    }

    if (params.adoptionDate !== undefined) {
      this.props.adoptionDate = params.adoptionDate;
    }

    if (params.registrationDate !== undefined) {
      this.props.registrationDate = params.registrationDate;
    }

    if (params.adoptionType !== undefined) {
      this.props.adoptionType = params.adoptionType;
    }

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  addConsentDocument(documentId: string): void {
    if (!this.props.consentDocuments.includes(documentId)) {
      this.props.consentDocuments.push(documentId);
      this.props.updatedAt = new Date();
      this.props.version++;
    }
  }

  private validate(): void {
    if (this.props.adopteeId === this.props.adopterId) {
      throw new InvalidAdoptionException('Adopter cannot be the Adoptee.');
    }

    if (this.props.adoptionDate > new Date()) {
      throw new InvalidAdoptionException('Adoption date cannot be in the future.');
    }

    if (this.props.registrationDate && this.props.registrationDate < this.props.adoptionDate) {
      throw new InvalidAdoptionException('Registration date cannot be before adoption date.');
    }

    // Validate adoption type
    const validTypes = ['CUSTOMARY', 'STATUTORY', 'INTER_COUNTRY', 'KINSHIP'];
    if (!validTypes.includes(this.props.adoptionType)) {
      throw new InvalidAdoptionException(`Invalid adoption type: ${this.props.adoptionType}`);
    }

    // For inter-country adoption, additional validation would be needed
    if (this.props.adoptionType === 'INTER_COUNTRY') {
      if (!this.props.courtOrderNumber) {
        throw new InvalidAdoptionException('Inter-country adoption requires a court order number.');
      }
    }

    // Validate consents structure
    if (this.props.hasConsents && typeof this.props.hasConsents !== 'object') {
      throw new InvalidAdoptionException('hasConsents must be a JSON object.');
    }
  }

  private static generateId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : `adp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get adopteeId(): string {
    return this.props.adopteeId;
  }

  get adopterId(): string {
    return this.props.adopterId;
  }

  get adoptionType(): string {
    return this.props.adoptionType;
  }

  get courtOrderNumber(): string | undefined {
    return this.props.courtOrderNumber;
  }

  get adoptionDate(): Date {
    return this.props.adoptionDate;
  }

  get registrationDate(): Date | undefined {
    return this.props.registrationDate;
  }

  get hasConsents(): any {
    return this.props.hasConsents;
  }

  get consentDocuments(): string[] {
    return this.props.consentDocuments;
  }

  get childWelfareReport(): string | undefined {
    return this.props.childWelfareReport;
  }

  get suitabilityReport(): string | undefined {
    return this.props.suitabilityReport;
  }

  get isFinalized(): boolean {
    return !!this.props.registrationDate;
  }

  get isStatutory(): boolean {
    return this.props.adoptionType === 'STATUTORY';
  }

  get isCustomary(): boolean {
    return this.props.adoptionType === 'CUSTOMARY';
  }

  get isInterCountry(): boolean {
    return this.props.adoptionType === 'INTER_COUNTRY';
  }

  get isKinship(): boolean {
    return this.props.adoptionType === 'KINSHIP';
  }

  // For inheritance rights under Kenyan Law of Succession Act
  get grantsFullInheritanceRights(): boolean {
    // All adoption types grant full inheritance rights under Kenyan law
    // Customary adoption may require proof, but once registered, grants rights
    return this.isFinalized;
  }

  // For Children Act compliance
  get isCompliantWithChildrenAct(): boolean {
    if (this.isStatutory) {
      return (
        !!this.props.courtOrderNumber &&
        !!this.props.childWelfareReport &&
        !!this.props.suitabilityReport &&
        (this.props.hasConsents?.biologicalParents || this.props.courtOrderNumber) // Court can dispense with consent
      );
    }

    if (this.isCustomary) {
      return (
        this.props.hasConsents?.biologicalParents === true ||
        this.props.courtOrderNumber !== undefined // Customary adoption can be formalized in court
      );
    }

    return this.isFinalized;
  }

  toJSON() {
    return {
      id: this.id,
      familyId: this.props.familyId,
      adopteeId: this.props.adopteeId,
      adopterId: this.props.adopterId,
      adoptionType: this.props.adoptionType,
      courtOrderNumber: this.props.courtOrderNumber,
      adoptionDate: this.props.adoptionDate,
      registrationDate: this.props.registrationDate,
      hasConsents: this.props.hasConsents,
      consentDocuments: this.props.consentDocuments,
      childWelfareReport: this.props.childWelfareReport,
      suitabilityReport: this.props.suitabilityReport,
      isFinalized: this.isFinalized,
      isStatutory: this.isStatutory,
      isCustomary: this.isCustomary,
      isInterCountry: this.isInterCountry,
      isKinship: this.isKinship,
      grantsFullInheritanceRights: this.grantsFullInheritanceRights,
      isCompliantWithChildrenAct: this.isCompliantWithChildrenAct,
      version: this.props.version,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
