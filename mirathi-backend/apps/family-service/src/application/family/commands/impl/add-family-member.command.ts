import {
  Gender,
  KenyanCounty,
  RelationshipType,
} from '../../../../domain/value-objects/family-enums.vo';
import { BaseCommand } from '../../../common/base/base.command';

/**
 * Command to add a person to an existing family tree.
 *
 * Investor Note / "Smart Add":
 * This command supports an optional 'relationshipContext' (Smart Link).
 *
 * DIGITAL LAWYER CHECK:
 * This command is strictly for adding blood relatives (Child, Parent, Sibling) or unrelated members.
 * It strictly forbids adding a SPOUSE via this command, as Spouses require a 'Marriage' entity
 * (Civil/Customary) to ensure S.40 Polygamy compliance.
 */
export class AddFamilyMemberCommand extends BaseCommand {
  public readonly familyId: string;

  // Identity
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly middleName?: string;
  public readonly gender: Gender;
  public readonly dateOfBirth?: Date;
  public readonly dateOfBirthEstimated?: boolean;

  // Kenyan Context
  public readonly nationalId?: string;
  public readonly placeOfBirth?: KenyanCounty;
  public readonly tribe?: string;

  // "Smart Link" Context
  public readonly relativeId?: string;
  public readonly relationshipToRelative?: RelationshipType;

  // New: Default to true for this command (Adoptions use a different command)
  public readonly isBiological: boolean;

  constructor(props: {
    userId: string;
    familyId: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    gender: Gender;
    dateOfBirth?: Date;
    dateOfBirthEstimated?: boolean;
    nationalId?: string;
    placeOfBirth?: KenyanCounty;
    tribe?: string;
    relativeId?: string;
    relationshipToRelative?: RelationshipType;
    isBiological?: boolean;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.familyId = props.familyId;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.middleName = props.middleName;
    this.gender = props.gender;
    this.dateOfBirth = props.dateOfBirth;
    this.dateOfBirthEstimated = props.dateOfBirthEstimated;
    this.nationalId = props.nationalId;
    this.placeOfBirth = props.placeOfBirth;
    this.tribe = props.tribe;
    this.relativeId = props.relativeId;
    this.relationshipToRelative = props.relationshipToRelative;
    this.isBiological = props.isBiological ?? true; // Default to true for manual adds
  }

  public validate(): void {
    super.validate();
    if (!this.familyId) throw new Error('Family ID is required');
    if (!this.firstName) throw new Error('First Name is required');
    if (!this.lastName) throw new Error('Last Name is required');

    // Logic: If you provide a relationship type, you must provide the relative ID
    if (this.relationshipToRelative && !this.relativeId) {
      throw new Error('If specifying a relationship type, you must provide the relative ID.');
    }

    // DIGITAL LAWYER: Prevent "Backdoor Marriages"
    if (this.relationshipToRelative === RelationshipType.SPOUSE) {
      throw new Error(
        'Cannot add a Spouse via this command. Please use "Register Marriage" to ensure legal compliance (S.40).',
      );
    }
  }
}
