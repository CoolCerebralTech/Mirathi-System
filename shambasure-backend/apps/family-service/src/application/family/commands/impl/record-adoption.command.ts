import { BaseCommand } from '../../../common/base/base.command';

/**
 * Command to record a legal or customary adoption.
 *
 * Investor Note / Legal Context:
 * This handles two distinct legal frameworks in Kenya:
 * 1. 'FORMAL': Governed by The Children Act. Requires a High Court Order.
 *    Irrevocable. The child becomes a full legal heir.
 * 2. 'CUSTOMARY': Governed by Customary Law. Requires clan elders' witness.
 *    Rights can be contested in succession cases if not well documented.
 */
export class RecordAdoptionCommand extends BaseCommand {
  public readonly familyId: string;
  public readonly adopteeId: string; // The Child
  public readonly adoptiveParentId: string; // The Parent

  public readonly adoptionType: 'FORMAL' | 'CUSTOMARY';
  public readonly adoptionDate: Date;

  // Formal Adoption (The Children Act)
  public readonly courtOrderNumber?: string;
  public readonly courtName?: string;
  public readonly lawyerName?: string; // Optional metadata

  // Customary Adoption
  public readonly clanElders: string[]; // Names of witnesses - now required array
  public readonly ceremonyLocation?: string;
  public readonly agreementDocumentId?: string; // Scanned agreement

  constructor(props: {
    userId: string;
    familyId: string;
    adopteeId: string;
    adoptiveParentId: string;
    adoptionType: 'FORMAL' | 'CUSTOMARY';
    adoptionDate: Date;
    courtOrderNumber?: string;
    courtName?: string;
    lawyerName?: string;
    clanElders?: string[]; // Keep optional in constructor for backward compatibility
    ceremonyLocation?: string;
    agreementDocumentId?: string;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.familyId = props.familyId;
    this.adopteeId = props.adopteeId;
    this.adoptiveParentId = props.adoptiveParentId;
    this.adoptionType = props.adoptionType;
    this.adoptionDate = props.adoptionDate;
    this.courtOrderNumber = props.courtOrderNumber;
    this.courtName = props.courtName;
    this.lawyerName = props.lawyerName;
    this.clanElders = props.clanElders || []; // Default to empty array
    this.ceremonyLocation = props.ceremonyLocation;
    this.agreementDocumentId = props.agreementDocumentId;
  }

  public validate(): void {
    super.validate();

    if (!this.familyId) {
      throw new Error('Family ID is required');
    }
    if (!this.adopteeId) {
      throw new Error('Adoptee ID is required');
    }
    if (!this.adoptiveParentId) {
      throw new Error('Adoptive Parent ID is required');
    }

    if (this.adopteeId === this.adoptiveParentId) {
      throw new Error('A member cannot adopt themselves.');
    }

    if (this.adoptionDate > new Date()) {
      throw new Error('Adoption date cannot be in the future');
    }

    // Conditional Validation based on Type
    if (this.adoptionType === 'FORMAL' && !this.courtOrderNumber) {
      throw new Error('Formal adoption requires a Court Order Number.');
    }

    if (this.adoptionType === 'CUSTOMARY' && this.clanElders.length < 2) {
      throw new Error('Customary adoption requires at least 2 Clan Elders as witnesses.');
    }
  }
}
