import { KenyanCounty, MarriageType } from '../../../../domain/value-objects/family-enums.vo';
import { BaseCommand } from '../../../common/base/base.command';

/**
 * Command to register a legal or customary union.
 *
 * Investor Note / Legal Logic:
 * This command handles the complexity of the Marriage Act 2014:
 * 1. Civil/Christian marriages require a Certificate Number.
 * 2. Customary marriages require Bride Price (Dowry) details.
 * 3. Islamic/Customary marriages support Polygamy (requiring a House ID).
 */
export class RegisterMarriageCommand extends BaseCommand {
  public readonly familyId: string;
  public readonly spouse1Id: string;
  public readonly spouse2Id: string;

  // Core Details
  public readonly marriageType: MarriageType;
  public readonly startDate: Date;
  public readonly location?: string;
  public readonly county?: KenyanCounty;
  public readonly witnesses: string[];

  // Legal / Civil Specifics
  public readonly registrationNumber?: string; // Certificate No.

  // Customary / Dowry Specifics
  public readonly dowryPayment?: {
    amount: number;
    currency: string; // KES, USD, COWS, GOATS
    isPaidInFull: boolean;
    livestockCount?: number; // Specific for rural economies
  };

  // Polygamy Context (Section 40)
  public readonly isPolygamous: boolean;
  public readonly polygamousHouseId?: string; // Required if isPolygamous = true
  public readonly marriageOrder?: number; // 1st, 2nd, 3rd wife

  constructor(props: {
    userId: string;
    familyId: string;
    spouse1Id: string;
    spouse2Id: string;
    marriageType: MarriageType;
    startDate: Date;
    location?: string;
    county?: KenyanCounty;
    witnesses?: string[];
    registrationNumber?: string;
    dowryPayment?: {
      amount: number;
      currency: string;
      isPaidInFull: boolean;
      livestockCount?: number;
    };
    isPolygamous?: boolean;
    polygamousHouseId?: string;
    marriageOrder?: number;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.familyId = props.familyId;
    this.spouse1Id = props.spouse1Id;
    this.spouse2Id = props.spouse2Id;
    this.marriageType = props.marriageType;
    this.startDate = props.startDate;
    this.location = props.location;
    this.county = props.county;
    this.witnesses = props.witnesses || [];
    this.registrationNumber = props.registrationNumber;
    this.dowryPayment = props.dowryPayment;
    this.isPolygamous = props.isPolygamous || false;
    this.polygamousHouseId = props.polygamousHouseId;
    this.marriageOrder = props.marriageOrder;
  }

  public validate(): void {
    super.validate();
    if (!this.familyId) throw new Error('Family ID is required');
    if (!this.spouse1Id || !this.spouse2Id) throw new Error('Both spouses are required');
    if (this.spouse1Id === this.spouse2Id) throw new Error('Spouses cannot be the same person');

    // Polygamy Validation
    if (this.isPolygamous && !this.polygamousHouseId) {
      throw new Error('Polygamous marriages must be assigned to a House (Establish House first).');
    }

    // Civil Marriage Validation
    if (
      (this.marriageType === MarriageType.CIVIL || this.marriageType === MarriageType.CHRISTIAN) &&
      this.isPolygamous
    ) {
      throw new Error('Civil and Christian marriages must be Monogamous under Kenyan Law.');
    }
  }
}
