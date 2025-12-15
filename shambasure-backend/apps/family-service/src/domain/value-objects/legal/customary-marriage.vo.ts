// domain/value-objects/legal/customary-marriage.vo.ts
import { ValueObject } from '../../base/value-object';

export interface CustomaryMarriageProps {
  ethnicGroup: string;
  customaryType: string;
  ceremonyDate: Date;
  ceremonyLocation: string;
  bridePricePaid: boolean;
  bridePriceAmount?: number;
  bridePriceCurrency: string;
  bridePricePaidInFull: boolean;
  bridePriceInstallments?: Array<{
    amount: number;
    date: Date;
    receiptNumber?: string;
  }>;
  elderWitnesses: Array<{
    name: string;
    age: number;
    relationship: string;
  }>;
  clanApproval: boolean;
  clanApprovalDate?: Date;
  familyConsent: boolean;
  familyConsentDate?: Date;
  traditionalRitesPerformed: string[];
  marriageValidatedByElders: boolean;
  validationDate?: Date;
  dissolutionRitesPerformed?: string[];
  isDissolved: boolean;
  dissolutionDate?: Date;
  dissolutionReason?: string;
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
      bridePricePaid: false,
      bridePriceCurrency: 'KES',
      bridePricePaidInFull: false,
      elderWitnesses: [],
      clanApproval: false,
      familyConsent: false,
      traditionalRitesPerformed: [],
      marriageValidatedByElders: false,
      isDissolved: false,
    });
  }

  static createFromProps(props: CustomaryMarriageProps): CustomaryMarriage {
    return new CustomaryMarriage(props);
  }

  validate(): void {
    // Ethnic group validation
    if (!this._value.ethnicGroup || this._value.ethnicGroup.trim().length === 0) {
      throw new Error('Ethnic group is required for customary marriage');
    }

    // Customary type validation
    if (!this._value.customaryType || this._value.customaryType.trim().length === 0) {
      throw new Error('Customary type is required');
    }

    // Ceremony date validation
    if (!this._value.ceremonyDate) {
      throw new Error('Ceremony date is required');
    }

    if (this._value.ceremonyDate > new Date()) {
      throw new Error('Ceremony cannot be in the future');
    }

    // Ceremony location validation
    if (!this._value.ceremonyLocation || this._value.ceremonyLocation.trim().length === 0) {
      throw new Error('Ceremony location is required');
    }

    // Bride price validation
    if (this._value.bridePricePaid) {
      if (!this._value.bridePriceAmount || this._value.bridePriceAmount <= 0) {
        throw new Error('Bride price amount is required when bride price is paid');
      }

      if (this._value.bridePricePaidInFull && this._value.bridePriceInstallments?.length) {
        throw new Error('Bride price cannot have installments if paid in full');
      }
    }

    // Clan approval validation
    if (this._value.clanApproval && !this._value.clanApprovalDate) {
      throw new Error('Clan approval date is required when clan approval is given');
    }

    // Family consent validation
    if (this._value.familyConsent && !this._value.familyConsentDate) {
      throw new Error('Family consent date is required when family consent is given');
    }

    // Elder validation
    if (this._value.marriageValidatedByElders && !this._value.validationDate) {
      throw new Error('Validation date is required when marriage is validated by elders');
    }

    // Dissolution validation
    if (this._value.isDissolved && !this._value.dissolutionDate) {
      throw new Error('Dissolution date is required when marriage is dissolved');
    }

    // Validate elder witnesses
    for (const witness of this._value.elderWitnesses) {
      if (!witness.name || witness.name.trim().length === 0) {
        throw new Error('Elder witness name is required');
      }
      if (witness.age < 40) {
        throw new Error('Elder witness must be at least 40 years old');
      }
    }

    // Validate traditional rites
    for (const rite of this._value.traditionalRitesPerformed) {
      if (!rite || rite.trim().length === 0) {
        throw new Error('Traditional rite cannot be empty');
      }
    }
  }

  recordBridePrice(
    amount: number,
    paidInFull: boolean,
    installments?: Array<{
      amount: number;
      date: Date;
      receiptNumber?: string;
    }>,
  ): CustomaryMarriage {
    if (amount <= 0) {
      throw new Error('Bride price amount must be positive');
    }

    return new CustomaryMarriage({
      ...this._value,
      bridePricePaid: true,
      bridePriceAmount: amount,
      bridePricePaidInFull: paidInFull,
      bridePriceInstallments: installments,
    });
  }

  addElderWitness(name: string, age: number, relationship: string): CustomaryMarriage {
    if (age < 40) {
      throw new Error('Elder witness must be at least 40 years old');
    }

    const elderWitnesses = [...this._value.elderWitnesses, { name, age, relationship }];

    return new CustomaryMarriage({
      ...this._value,
      elderWitnesses,
    });
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

  performTraditionalRite(rite: string): CustomaryMarriage {
    const traditionalRitesPerformed = [...this._value.traditionalRitesPerformed, rite];

    return new CustomaryMarriage({
      ...this._value,
      traditionalRitesPerformed,
    });
  }

  validateByElders(validationDate: Date): CustomaryMarriage {
    if (this._value.elderWitnesses.length < 2) {
      throw new Error('At least two elder witnesses are required for validation');
    }

    return new CustomaryMarriage({
      ...this._value,
      marriageValidatedByElders: true,
      validationDate,
    });
  }

  dissolveMarriage(
    dissolutionDate: Date,
    reason: string,
    ritesPerformed?: string[],
  ): CustomaryMarriage {
    if (dissolutionDate < this._value.ceremonyDate) {
      throw new Error('Dissolution date cannot be before ceremony date');
    }

    return new CustomaryMarriage({
      ...this._value,
      isDissolved: true,
      dissolutionDate,
      dissolutionReason: reason,
      dissolutionRitesPerformed: ritesPerformed,
    });
  }

  get ethnicGroup(): string {
    return this._value.ethnicGroup;
  }

  get customaryType(): string {
    return this._value.customaryType;
  }

  get ceremonyDate(): Date {
    return this._value.ceremonyDate;
  }

  get ceremonyLocation(): string {
    return this._value.ceremonyLocation;
  }

  get bridePricePaid(): boolean {
    return this._value.bridePricePaid;
  }

  get bridePriceAmount(): number | undefined {
    return this._value.bridePriceAmount;
  }

  get bridePriceCurrency(): string {
    return this._value.bridePriceCurrency;
  }

  get bridePricePaidInFull(): boolean {
    return this._value.bridePricePaidInFull;
  }

  get bridePriceInstallments() {
    return this._value.bridePriceInstallments;
  }

  get elderWitnesses() {
    return [...this._value.elderWitnesses];
  }

  get clanApproval(): boolean {
    return this._value.clanApproval;
  }

  get clanApprovalDate(): Date | undefined {
    return this._value.clanApprovalDate;
  }

  get familyConsent(): boolean {
    return this._value.familyConsent;
  }

  get familyConsentDate(): Date | undefined {
    return this._value.familyConsentDate;
  }

  get traditionalRitesPerformed(): string[] {
    return [...this._value.traditionalRitesPerformed];
  }

  get marriageValidatedByElders(): boolean {
    return this._value.marriageValidatedByElders;
  }

  get validationDate(): Date | undefined {
    return this._value.validationDate;
  }

  get dissolutionRitesPerformed(): string[] | undefined {
    return this._value.dissolutionRitesPerformed;
  }

  get isDissolved(): boolean {
    return this._value.isDissolved;
  }

  get dissolutionDate(): Date | undefined {
    return this._value.dissolutionDate;
  }

  get dissolutionReason(): string | undefined {
    return this._value.dissolutionReason;
  }

  // Get marriage duration in years
  get marriageDurationYears(): number {
    const endDate = this._value.dissolutionDate || new Date();
    const diffYears = endDate.getFullYear() - this._value.ceremonyDate.getFullYear();
    const monthDiff = endDate.getMonth() - this._value.ceremonyDate.getMonth();

    return monthDiff < 0 ? diffYears - 1 : diffYears;
  }

  // Check if marriage is valid under customary law
  get isValidCustomaryMarriage(): boolean {
    return (
      this._value.clanApproval &&
      this._value.familyConsent &&
      this._value.marriageValidatedByElders &&
      this._value.elderWitnesses.length >= 2
    );
  }

  // Check if bride price is fully paid
  get isBridePriceSettled(): boolean {
    if (!this._value.bridePricePaid) return false;
    if (this._value.bridePricePaidInFull) return true;

    // Check if all installments are paid
    const totalInstallments =
      this._value.bridePriceInstallments?.reduce(
        (sum, installment) => sum + installment.amount,
        0,
      ) || 0;

    return totalInstallments >= (this._value.bridePriceAmount || 0);
  }

  // Get remaining bride price amount
  get remainingBridePrice(): number {
    if (!this._value.bridePricePaid || !this._value.bridePriceAmount) return 0;

    if (this._value.bridePricePaidInFull) return 0;

    const totalPaid =
      this._value.bridePriceInstallments?.reduce(
        (sum, installment) => sum + installment.amount,
        0,
      ) || 0;

    return Math.max(0, this._value.bridePriceAmount - totalPaid);
  }

  // Check if marriage is recognized under Kenyan law
  get isLegallyRecognized(): boolean {
    return this.isValidCustomaryMarriage && this.marriageDurationYears >= 5;
  }

  // Get marriage status
  get marriageStatus(): string {
    if (this._value.isDissolved) return 'DISSOLVED';
    if (this.isValidCustomaryMarriage) return 'VALID';
    return 'PENDING_VALIDATION';
  }

  // Check if traditional rites are complete
  get areRitesComplete(): boolean {
    const requiredRites = this.getRequiredRitesForEthnicGroup();
    return requiredRites.every((rite) => this._value.traditionalRitesPerformed.includes(rite));
  }

  private getRequiredRitesForEthnicGroup(): string[] {
    const ethnicRites: Record<string, string[]> = {
      KIKUYU: ['NGURARIO', 'RURACIO', 'GUTHINJA'],
      LUO: ['TERO', 'AYIE', 'KEYO'],
      KALENJIN: ['KURONGOT', 'TIL', 'TUMDO'],
      LUHYA: ['KHUWINYA', 'KHUKHULAKHA', 'KHUWUKHILA'],
      KAMBA: ['KUTHINWA', 'MWAIO', 'NTHEO'],
      MERU: ['NKUUMO', 'NTHUUMO', 'RURIO'],
    };

    return ethnicRites[this._value.ethnicGroup.toUpperCase()] || [];
  }

  toJSON() {
    return {
      ethnicGroup: this._value.ethnicGroup,
      customaryType: this._value.customaryType,
      ceremonyDate: this._value.ceremonyDate.toISOString(),
      ceremonyLocation: this._value.ceremonyLocation,
      bridePricePaid: this._value.bridePricePaid,
      bridePriceAmount: this._value.bridePriceAmount,
      bridePriceCurrency: this._value.bridePriceCurrency,
      bridePricePaidInFull: this._value.bridePricePaidInFull,
      bridePriceInstallments: this._value.bridePriceInstallments,
      elderWitnesses: this._value.elderWitnesses,
      clanApproval: this._value.clanApproval,
      clanApprovalDate: this._value.clanApprovalDate?.toISOString(),
      familyConsent: this._value.familyConsent,
      familyConsentDate: this._value.familyConsentDate?.toISOString(),
      traditionalRitesPerformed: this._value.traditionalRitesPerformed,
      marriageValidatedByElders: this._value.marriageValidatedByElders,
      validationDate: this._value.validationDate?.toISOString(),
      dissolutionRitesPerformed: this._value.dissolutionRitesPerformed,
      isDissolved: this._value.isDissolved,
      dissolutionDate: this._value.dissolutionDate?.toISOString(),
      dissolutionReason: this._value.dissolutionReason,
      marriageDurationYears: this.marriageDurationYears,
      isValidCustomaryMarriage: this.isValidCustomaryMarriage,
      isBridePriceSettled: this.isBridePriceSettled,
      remainingBridePrice: this.remainingBridePrice,
      isLegallyRecognized: this.isLegallyRecognized,
      marriageStatus: this.marriageStatus,
      areRitesComplete: this.areRitesComplete,
    };
  }
}
