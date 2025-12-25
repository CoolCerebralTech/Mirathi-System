import { KenyanCounty } from '../../../../domain/value-objects/family-enums.vo';
import { BaseCommand } from '../../../common/base/base.command';

/**
 * Command to record a "Come-we-stay" relationship.
 *
 * Investor Note / Legal Strategy:
 * Unlike a Marriage, a Cohabitation Record does not automatically grant
 * "Spousal" rights (Section 40). However, it establishes the factual basis
 * for a "Dependency" claim (Section 29) if the partner was being maintained
 * by the deceased prior to death.
 *
 * We capture specific "Badges of Cohabitation" here:
 * 1. Shared Residence (Location)
 * 2. Exclusivity (Monogamous nature)
 * 3. Duration (Start Date)
 */
export class RecordCohabitationCommand extends BaseCommand {
  public readonly familyId: string;
  public readonly partner1Id: string;
  public readonly partner2Id: string;

  // Evidence of Union
  public readonly startDate: Date;
  public readonly sharedResidenceAddress: string;
  public readonly county: KenyanCounty;

  // Legal Badges
  public readonly isExclusive: boolean; // "To the exclusion of all others"
  public readonly jointAssets?: boolean; // Do they own things together?
  public readonly hasChildrenTogether: boolean;

  // Documentation
  public readonly affidavitId?: string; // Sworn affidavit of cohabitation

  // Optional additional details
  public readonly witnesses?: string[];
  public readonly communityAcknowledged?: boolean;
  public readonly familyAcknowledged?: boolean;
  public readonly knownAsCouple?: boolean;
  public readonly jointFinancialAccounts?: boolean;
  public readonly jointPropertyOwnership?: boolean;

  constructor(props: {
    userId: string;
    familyId: string;
    partner1Id: string;
    partner2Id: string;
    startDate: Date;
    sharedResidenceAddress: string;
    county: KenyanCounty;
    isExclusive?: boolean;
    jointAssets?: boolean;
    hasChildrenTogether?: boolean;
    affidavitId?: string;
    witnesses?: string[];
    communityAcknowledged?: boolean;
    familyAcknowledged?: boolean;
    knownAsCouple?: boolean;
    jointFinancialAccounts?: boolean;
    jointPropertyOwnership?: boolean;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.familyId = props.familyId;
    this.partner1Id = props.partner1Id;
    this.partner2Id = props.partner2Id;
    this.startDate = props.startDate;
    this.sharedResidenceAddress = props.sharedResidenceAddress;
    this.county = props.county;
    this.isExclusive = props.isExclusive ?? true;
    this.jointAssets = props.jointAssets ?? false;
    this.hasChildrenTogether = props.hasChildrenTogether ?? false;
    this.affidavitId = props.affidavitId;
    this.witnesses = props.witnesses;
    this.communityAcknowledged = props.communityAcknowledged;
    this.familyAcknowledged = props.familyAcknowledged;
    this.knownAsCouple = props.knownAsCouple;
    this.jointFinancialAccounts = props.jointFinancialAccounts;
    this.jointPropertyOwnership = props.jointPropertyOwnership;
  }

  public validate(): void {
    super.validate();

    if (!this.familyId) {
      throw new Error('Family ID is required');
    }

    if (!this.partner1Id || !this.partner2Id) {
      throw new Error('Both partners are required');
    }

    if (this.partner1Id === this.partner2Id) {
      throw new Error('Partners cannot be the same person');
    }

    if (this.startDate > new Date()) {
      throw new Error('Cohabitation start date cannot be in the future');
    }

    if (!this.sharedResidenceAddress || this.sharedResidenceAddress.trim().length === 0) {
      throw new Error('Shared residence address must be provided');
    }
  }
}
