import { RelationshipType } from '../../../../domain/value-objects/family-enums.vo';
import { Gender, KenyanCounty } from '../../../../domain/value-objects/family-enums.vo';
import { BaseCommand } from '../../../common/base/base.command';

/**
 * Command to add a person to an existing family tree.
 *
 * Investor Note / "Smart Add":
 * This command supports an optional 'relationshipContext'.
 * This allows the frontend to say "Add John as the Son of Peter" in one atomic operation,
 * ensuring the graph is always connected and valid.
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
  public readonly tribe?: string; // Optional, defaults to Family's clan if not set

  // "Smart Link" Context
  // If provided, we automatically create the graph edge
  public readonly relativeId?: string; // e.g., The Father's ID
  public readonly relationshipToRelative?: RelationshipType; // e.g. CHILD (New member is CHILD of Relative)

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
  }
}
