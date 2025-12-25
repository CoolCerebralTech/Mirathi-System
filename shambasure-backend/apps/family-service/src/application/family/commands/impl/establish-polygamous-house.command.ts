import { KenyanCounty } from '../../../../domain/value-objects/family-enums.vo';
import { BaseCommand } from '../../../common/base/base.command';

/**
 * Command to create a distinct House within a polygamous family.
 *
 * Investor Note / Legal Context:
 * Under Section 40 of the Law of Succession Act, if a deceased polygamist
 * leaves no will, the estate is divided according to "Houses" (per stirpes),
 * NOT simply by the number of children (per capita).
 *
 * This command creates that legal container ("The House of Wanjiku").
 */
export class EstablishPolygamousHouseCommand extends BaseCommand {
  public readonly familyId: string;

  // The Original Wife who establishes this house (REQUIRED)
  public readonly originalWifeId: string;

  // House Identification
  public readonly houseName: string; // e.g., "First House", "House of Akinyi"
  public readonly houseOrder: number; // 1, 2, 3...

  // Optional: House Head (can be different from original wife)
  public readonly houseHeadId?: string;

  // Additional properties that the handler expects
  public readonly houseCode?: string;
  public readonly establishmentType?: 'CUSTOMARY' | 'ISLAMIC' | 'TRADITIONAL' | 'COURT_RECOGNIZED';
  public readonly establishmentWitnesses?: string[];
  public readonly establishmentLocation?: string;
  public readonly distributionWeight?: number;
  public readonly specialAllocation?: {
    reason: string;
    percentage: number;
    courtOrdered: boolean;
  };
  public readonly houseColor?: string;
  public readonly houseSymbol?: string;
  public readonly traditionalName?: string;
  public readonly houseMotto?: string;
  public readonly primaryResidence?: string;
  public readonly residentialCounty?: KenyanCounty;
  public readonly hasSeparateHomestead?: boolean;
  public readonly houseMonthlyExpenses?: number;
  public readonly houseAnnualIncome?: number;
  public readonly financialDependents?: number;
  public readonly successorId?: string;
  public readonly successionRules?: string;
  public readonly verificationNotes?: string;

  constructor(props: {
    userId: string;
    familyId: string;
    originalWifeId: string;
    houseOrder: number;
    houseName?: string;
    houseHeadId?: string;
    houseCode?: string;
    establishmentType?: 'CUSTOMARY' | 'ISLAMIC' | 'TRADITIONAL' | 'COURT_RECOGNIZED';
    establishmentWitnesses?: string[];
    establishmentLocation?: string;
    distributionWeight?: number;
    specialAllocation?: {
      reason: string;
      percentage: number;
      courtOrdered: boolean;
    };
    houseColor?: string;
    houseSymbol?: string;
    traditionalName?: string;
    houseMotto?: string;
    primaryResidence?: string;
    residentialCounty?: KenyanCounty;
    hasSeparateHomestead?: boolean;
    houseMonthlyExpenses?: number;
    houseAnnualIncome?: number;
    financialDependents?: number;
    successorId?: string;
    successionRules?: string;
    verificationNotes?: string;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.familyId = props.familyId;
    this.originalWifeId = props.originalWifeId;
    this.houseOrder = props.houseOrder;
    this.houseHeadId = props.houseHeadId;

    // Default naming convention if not provided: "House #{N}"
    this.houseName = props.houseName || `House #${props.houseOrder}`;

    // Optional properties
    this.houseCode = props.houseCode;
    this.establishmentType = props.establishmentType;
    this.establishmentWitnesses = props.establishmentWitnesses;
    this.establishmentLocation = props.establishmentLocation;
    this.distributionWeight = props.distributionWeight;
    this.specialAllocation = props.specialAllocation;
    this.houseColor = props.houseColor;
    this.houseSymbol = props.houseSymbol;
    this.traditionalName = props.traditionalName;
    this.houseMotto = props.houseMotto;
    this.primaryResidence = props.primaryResidence;
    this.residentialCounty = props.residentialCounty;
    this.hasSeparateHomestead = props.hasSeparateHomestead;
    this.houseMonthlyExpenses = props.houseMonthlyExpenses;
    this.houseAnnualIncome = props.houseAnnualIncome;
    this.financialDependents = props.financialDependents;
    this.successorId = props.successorId;
    this.successionRules = props.successionRules;
    this.verificationNotes = props.verificationNotes;
  }

  public validate(): void {
    super.validate();
    if (!this.familyId) throw new Error('Family ID is required');
    if (!this.originalWifeId) throw new Error('Original Wife ID is required for polygamous house');
    if (this.houseOrder < 1) throw new Error('House order must be 1 or greater');

    // Validate distribution weight if provided
    if (this.distributionWeight !== undefined && this.distributionWeight <= 0) {
      throw new Error('Distribution weight must be positive');
    }
  }
}
