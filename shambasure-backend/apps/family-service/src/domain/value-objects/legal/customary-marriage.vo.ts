// domain/value-objects/legal/customary-marriage.vo.ts
import { ValueObject } from '../../base/value-object';

export interface ElderWitness {
  name: string;
  age: number;
  relationship: string;
}

export interface CouncilMember {
  name: string;
  position: string;
  clan: string;
}

export interface CustomaryMarriageProps {
  ethnicGroup: string;
  customaryType: string;
  ceremonyDate: Date;
  ceremonyLocation: string;

  // Witnesses & Authority
  elderWitnesses: ElderWitness[];
  elderCouncilMembers?: CouncilMember[]; // Added based on Mapper usage

  // Consents
  clanApproval: boolean;
  clanApprovalDate?: Date;
  familyConsent: boolean;
  familyConsentDate?: Date;

  // Rites & Validation
  traditionalRitesPerformed: string[];
  marriageValidatedByElders: boolean;
  validationDate?: Date;

  // Dissolution
  dissolutionRitesPerformed?: string[];
  isDissolved: boolean;
  dissolutionDate?: Date;
  dissolutionReason?: string;

  // Legacy / Simple Bride Price tracking (Detailed tracking is in BridePrice VO)
  // These boolean flags act as summaries for the Marriage Aggregate
  bridePricePaid: boolean;
  bridePriceAmount?: number;
  bridePriceCurrency: string;
  bridePricePaidInFull: boolean;
  bridePriceInstallments?: Array<{
    amount: number;
    date: Date;
    receiptNumber?: string;
  }>;
}

export class CustomaryMarriage extends ValueObject<CustomaryMarriageProps> {
  private constructor(props: CustomaryMarriageProps) {
    super(props);
    this.validate();
  }

  static create(
    ethnicGroup: string,
    customaryType: string,
    ceremonyDate: Date,
    ceremonyLocation: string,
  ): CustomaryMarriage {
    return new CustomaryMarriage({
      ethnicGroup,
      customaryType,
      ceremonyDate,
      ceremonyLocation,
      elderWitnesses: [],
      elderCouncilMembers: [],
      clanApproval: false,
      familyConsent: false,
      traditionalRitesPerformed: [],
      marriageValidatedByElders: false,
      isDissolved: false,
      bridePricePaid: false,
      bridePriceCurrency: 'KES',
      bridePricePaidInFull: false,
    });
  }

  static createFromProps(props: CustomaryMarriageProps): CustomaryMarriage {
    return new CustomaryMarriage(props);
  }

  validate(): void {
    if (!this._value.ceremonyDate) {
      throw new Error('Ceremony date is required');
    }
    // We relax strict validation here to allow reconstitution of legacy data
    // where some fields might be missing.
  }

  // --- Actions ---

  addElderWitness(name: string, age: number, relationship: string): CustomaryMarriage {
    const witnesses = [...this._value.elderWitnesses, { name, age, relationship }];
    return new CustomaryMarriage({ ...this._value, elderWitnesses: witnesses });
  }

  addCouncilMember(name: string, position: string, clan: string): CustomaryMarriage {
    const members = [...(this._value.elderCouncilMembers || []), { name, position, clan }];
    return new CustomaryMarriage({ ...this._value, elderCouncilMembers: members });
  }

  grantClanApproval(approvalDate: Date): CustomaryMarriage {
    return new CustomaryMarriage({
      ...this._value,
      clanApproval: true,
      clanApprovalDate: approvalDate,
    });
  }

  grantFamilyConsent(consentDate: Date): CustomaryMarriage {
    return new CustomaryMarriage({
      ...this._value,
      familyConsent: true,
      familyConsentDate: consentDate,
    });
  }

  dissolveMarriage(date: Date, reason: string): CustomaryMarriage {
    return new CustomaryMarriage({
      ...this._value,
      isDissolved: true,
      dissolutionDate: date,
      dissolutionReason: reason,
    });
  }

  // --- Getters ---

  get ceremonyType(): string {
    return this._value.customaryType;
  }

  get location(): string {
    return this._value.ceremonyLocation;
  }

  get witnesses(): ElderWitness[] {
    return [...this._value.elderWitnesses];
  }

  get elderCouncilMembers(): CouncilMember[] {
    return [...(this._value.elderCouncilMembers || [])];
  }

  get isClanApproved(): boolean {
    return this._value.clanApproval;
  }

  get isFamilyConsented(): boolean {
    return this._value.familyConsent;
  }

  // --- Serialization ---

  toJSON() {
    return {
      ethnicGroup: this._value.ethnicGroup,
      customaryType: this._value.customaryType,
      ceremonyDate: this._value.ceremonyDate.toISOString(),
      ceremonyLocation: this._value.ceremonyLocation,

      elderWitnesses: this._value.elderWitnesses,
      elderCouncilMembers: this._value.elderCouncilMembers,

      clanApproval: this._value.clanApproval,
      clanApprovalDate: this._value.clanApprovalDate?.toISOString(),
      familyConsent: this._value.familyConsent,
      familyConsentDate: this._value.familyConsentDate?.toISOString(),

      traditionalRitesPerformed: this._value.traditionalRitesPerformed,
      marriageValidatedByElders: this._value.marriageValidatedByElders,
      validationDate: this._value.validationDate?.toISOString(),

      isDissolved: this._value.isDissolved,
      dissolutionDate: this._value.dissolutionDate?.toISOString(),
      dissolutionReason: this._value.dissolutionReason,

      // Legacy BP Summary
      bridePricePaid: this._value.bridePricePaid,
      bridePriceAmount: this._value.bridePriceAmount,
      bridePriceCurrency: this._value.bridePriceCurrency,
      bridePricePaidInFull: this._value.bridePricePaidInFull,
    };
  }
}
