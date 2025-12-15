// domain/entities/adoption-order.entity.ts
import { Entity } from '../base/entity';
import { AdoptionFinalizedEvent } from '../events/relationship-events/adoption-finalized.event';
import { InvalidAdoptionException } from '../exceptions/relationship.exception';

// Enums based on Kenyan Children Act
export enum AdoptionType {
  STATUTORY = 'STATUTORY', // Formal High Court adoption
  CUSTOMARY = 'CUSTOMARY', // Traditional (requires strict proof for succession)
  INTER_COUNTRY = 'INTER_COUNTRY', // Hague Convention
  KINSHIP = 'KINSHIP', // Relative adoption
}

export interface AdoptionConsents {
  biologicalParents: boolean;
  spouseOfAdopter: boolean; // Mandatory if adopter is married (sole applicant)
  childConsent: boolean; // If child is > 10 years (typically 14 in Kenya)
}

export interface AdoptionOrderProps {
  id: string;
  familyId: string;

  adopteeId: string; // The Child
  adopterId: string; // The Parent

  type: AdoptionType;

  // Legal Proof
  courtOrderNumber?: string; // High Court Adoption Cause No.
  courtStation?: string;
  adoptionDate: Date;
  registrationDate?: Date; // Date entered in Registrar of Adoptions

  // Section 158 Compliance (Consents)
  hasConsents: AdoptionConsents;
  consentDocumentIds: string[];

  // Children's Department Reports
  childWelfareReportId?: string; // Assessing child's best interest
  suitabilityReportId?: string; // Assessing parent's capacity

  // State
  isFinalized: boolean;
  isRevoked: boolean;
  revocationReason?: string;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdoptionProps {
  familyId: string;
  adopteeId: string;
  adopterId: string;
  type: AdoptionType;
  adoptionDate: Date;
  courtOrderNumber?: string;
}

export class AdoptionOrder extends Entity<AdoptionOrderProps> {
  private constructor(props: AdoptionOrderProps) {
    super(props);
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
      type: props.type,
      courtOrderNumber: props.courtOrderNumber,
      adoptionDate: props.adoptionDate,
      hasConsents: {
        biologicalParents: false,
        spouseOfAdopter: false,
        childConsent: false,
      },
      consentDocumentIds: [],
      isFinalized: false, // Starts as pending/interim
      isRevoked: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Note: We don't fire the 'Finalized' event yet.
    // We wait for the actual finalization method to be called.

    return order;
  }

  static createFromProps(props: AdoptionOrderProps): AdoptionOrder {
    return new AdoptionOrder(props);
  }

  // --- Domain Logic ---

  /**
   * Records the necessary consents required by Section 158 of the Children Act.
   */
  recordConsents(consents: Partial<AdoptionConsents>, documentIds: string[]): void {
    this.props.hasConsents = {
      ...this.props.hasConsents,
      ...consents,
    };

    // Add unique document IDs
    const currentDocs = new Set(this.props.consentDocumentIds);
    documentIds.forEach((id) => currentDocs.add(id));
    this.props.consentDocumentIds = Array.from(currentDocs);

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  /**
   * Links the mandatory Social Inquiry/Welfare reports from the Children's Department.
   */
  attachWelfareReports(childReportId: string, suitabilityReportId: string): void {
    this.props.childWelfareReportId = childReportId;
    this.props.suitabilityReportId = suitabilityReportId;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  /**
   * Finalizes the adoption process.
   * This is the trigger that permanently alters the FamilyRelationship graph,
   * cutting legal ties with bio parents and establishing full rights with adopter.
   */
  finalize(registrationDate: Date): void {
    if (this.props.isRevoked) {
      throw new InvalidAdoptionException('Cannot finalize a revoked adoption.');
    }

    if (this.props.type === AdoptionType.STATUTORY && !this.props.courtOrderNumber) {
      throw new InvalidAdoptionException('Statutory adoption requires a Court Order Number.');
    }

    // Basic consent check (simplified domain rule)
    // In reality, court dispenses consent, but we track if we have the record
    if (!this.props.childWelfareReportId && this.props.type !== AdoptionType.CUSTOMARY) {
      // Customary adoption might lack formal welfare reports initially
      throw new InvalidAdoptionException(
        'Cannot finalize statutory adoption without Welfare Report.',
      );
    }

    this.props.isFinalized = true;
    this.props.registrationDate = registrationDate;
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new AdoptionFinalizedEvent({
        adoptionOrderId: this.id,
        familyId: this.props.familyId,
        adopteeId: this.props.adopteeId,
        adopterId: this.props.adopterId,
        courtOrderNumber: this.props.courtOrderNumber,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Revokes an adoption order (rare, but legally possible via High Court appeal).
   */
  revoke(reason: string): void {
    this.props.isRevoked = true;
    this.props.revocationReason = reason;
    this.props.isFinalized = false;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  private validate(): void {
    if (this.props.adopteeId === this.props.adopterId) {
      throw new InvalidAdoptionException('Adopter cannot be the Adoptee.');
    }
  }

  private static generateId(): string {
    return `adp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }
  get type(): AdoptionType {
    return this.props.type;
  }
  get courtOrderNumber(): string | undefined {
    return this.props.courtOrderNumber;
  }
  get isFinalized(): boolean {
    return this.props.isFinalized;
  }

  toJSON() {
    return {
      id: this.id,
      familyId: this.props.familyId,
      adopteeId: this.props.adopteeId,
      adopterId: this.props.adopterId,
      type: this.props.type,
      courtOrderNumber: this.props.courtOrderNumber,
      adoptionDate: this.props.adoptionDate,
      registrationDate: this.props.registrationDate,
      hasConsents: this.props.hasConsents,
      childWelfareReportId: this.props.childWelfareReportId,
      isFinalized: this.props.isFinalized,
      isRevoked: this.props.isRevoked,
      version: this.props.version,
      createdAt: this.props.createdAt,
    };
  }
}
