import { Gender, KenyanCounty } from '../../../../domain/value-objects/family-enums.vo';
import { BaseCommand } from '../../../common/base/base.command';

/**
 * Command to initialize a new Family Tree.
 *
 * Investor Note:
 * This command doesn't just create an empty group. It establishes the "Genesis"
 * of the graph by creating the Family entity AND the first Member (the Creator)
 * simultaneously to ensure no family exists without a Head.
 */
export class CreateFamilyCommand extends BaseCommand {
  // Family Identity
  public readonly familyName: string;
  public readonly description?: string;

  // Cultural Context (Optional but recommended for S.40/Customary logic)
  public readonly homeCounty?: KenyanCounty;
  public readonly clanName?: string;
  public readonly subClan?: string;
  public readonly totem?: string;

  // Creator Profile (The first member)
  public readonly creatorProfile: {
    firstName: string;
    lastName: string;
    middleName?: string;
    gender: Gender;
    dateOfBirth?: Date;
    nationalId?: string; // Optional at creation, verified later
  };

  constructor(props: {
    userId: string; // The Auth User ID
    familyName: string;
    description?: string;
    homeCounty?: KenyanCounty;
    clanName?: string;
    subClan?: string;
    totem?: string;
    creatorProfile: {
      firstName: string;
      lastName: string;
      middleName?: string;
      gender: Gender;
      dateOfBirth?: Date;
      nationalId?: string;
    };
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });

    this.familyName = props.familyName;
    this.description = props.description;
    this.homeCounty = props.homeCounty;
    this.clanName = props.clanName;
    this.subClan = props.subClan;
    this.totem = props.totem;
    this.creatorProfile = props.creatorProfile;
  }

  /**
   * Fail-fast validation before hitting the domain
   */
  public validate(): void {
    super.validate();

    if (!this.familyName || this.familyName.trim().length < 2) {
      throw new Error('Family name is required and must be at least 2 characters.');
    }

    if (!this.creatorProfile.firstName || !this.creatorProfile.lastName) {
      throw new Error('Creator first and last name are required.');
    }
  }
}
