// domain/value-objects/personal/demographic-info.vo.ts
import { ValueObject } from '../../base/value-object';

export type GenderType = 'MALE' | 'FEMALE' | 'INTERSEX' | 'OTHER';

export type ReligionType =
  | 'CHRISTIAN'
  | 'CATHOLIC'
  | 'PROTESTANT'
  | 'PENTECOSTAL'
  | 'SEVENTH_DAY_ADVENTIST'
  | 'ISLAM'
  | 'HINDU'
  | 'BUDDHIST'
  | 'TRADITIONAL'
  | 'ATHEIST'
  | 'AGNOSTIC'
  | 'OTHER';

export type MaritalStatusType =
  | 'SINGLE'
  | 'MARRIED'
  | 'DIVORCED'
  | 'WIDOWED'
  | 'SEPARATED'
  | 'COHABITING';

export type EducationLevel =
  | 'NONE'
  | 'PRIMARY'
  | 'SECONDARY'
  | 'DIPLOMA'
  | 'BACHELORS'
  | 'MASTERS'
  | 'DOCTORATE'
  | 'OTHER';

export interface DemographicInfoProps {
  gender?: string; // Validate as GenderType internally
  religion?: ReligionType;
  maritalStatus?: MaritalStatusType;
  occupation?: string;
  educationLevel?: EducationLevel;
  institutionName?: string;
  yearOfGraduation?: number;
  employmentStatus?: 'EMPLOYED' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'RETIRED' | 'STUDENT';
  employerName?: string;
  monthlyIncome?: number;
  incomeCurrency?: string;
  numberOfDependants?: number;
  languages: string[];
  ethnicGroup?: string;
  subEthnicGroup?: string; // Mapped from 'subClan' in entity
  isUrbanDweller: boolean;
  hasRuralHome: boolean;
  ruralHomeLocation?: string;
}

export class DemographicInfo extends ValueObject<DemographicInfoProps> {
  private constructor(props: DemographicInfoProps) {
    super(props);
    this.validate();
  }

  static create(props?: Partial<DemographicInfoProps>): DemographicInfo {
    return new DemographicInfo({
      languages: [],
      isUrbanDweller: true,
      hasRuralHome: false,
      ...props,
    });
  }

  static createFromProps(props: DemographicInfoProps): DemographicInfo {
    return new DemographicInfo(props);
  }

  validate(): void {
    // Gender validation
    if (this._value.gender && !this.isValidGender(this._value.gender)) {
      throw new Error(`Invalid gender: ${this._value.gender}`);
    }

    // Religion validation
    if (this._value.religion && !this.isValidReligion(this._value.religion)) {
      throw new Error('Invalid religion type');
    }

    // Marital status validation
    if (this._value.maritalStatus && !this.isValidMaritalStatus(this._value.maritalStatus)) {
      throw new Error('Invalid marital status');
    }

    // Education level validation
    if (this._value.educationLevel && !this.isValidEducationLevel(this._value.educationLevel)) {
      throw new Error('Invalid education level');
    }

    // Year of graduation validation
    if (this._value.yearOfGraduation) {
      const currentYear = new Date().getFullYear();
      if (this._value.yearOfGraduation < 1900 || this._value.yearOfGraduation > currentYear) {
        throw new Error('Invalid year of graduation');
      }
    }

    // Monthly income validation
    if (this._value.monthlyIncome !== undefined) {
      if (this._value.monthlyIncome < 0) {
        throw new Error('Monthly income cannot be negative');
      }
      if (!this._value.incomeCurrency) {
        throw new Error('Income currency is required when monthly income is specified');
      }
    }

    // Number of dependants validation
    if (this._value.numberOfDependants !== undefined && this._value.numberOfDependants < 0) {
      throw new Error('Number of dependants cannot be negative');
    }

    // Languages validation
    if (this._value.languages) {
      for (const language of this._value.languages) {
        if (!language || language.trim().length === 0) {
          throw new Error('Language cannot be empty');
        }
      }
    }

    // Kenyan ethnic group validation
    if (this._value.ethnicGroup && this._value.ethnicGroup.trim().length > 0) {
      const commonEthnicGroups = [
        'KIKUYU',
        'LUHYA',
        'LUO',
        'KALENJIN',
        'KAMBA',
        'KISII',
        'MERU',
        'MASAI',
        'TURKANA',
        'SOMALI',
        'MIJIKENDA',
        'TAITA',
        'EMBU',
        'THARAKA',
      ];

      const normalizedEthnicGroup = this._value.ethnicGroup.toUpperCase();
      // Only warn, don't throw, as there are 40+ tribes
      if (!commonEthnicGroups.includes(normalizedEthnicGroup)) {
        // console.warn(`Uncommon ethnic group specified: ${this._value.ethnicGroup}`);
      }
    }
  }

  private isValidGender(gender: string): boolean {
    const validGenders = ['MALE', 'FEMALE', 'INTERSEX', 'OTHER'];
    return validGenders.includes(gender.toUpperCase());
  }

  private isValidReligion(religion: string): religion is ReligionType {
    const validReligions: ReligionType[] = [
      'CHRISTIAN',
      'CATHOLIC',
      'PROTESTANT',
      'PENTECOSTAL',
      'SEVENTH_DAY_ADVENTIST',
      'ISLAM',
      'HINDU',
      'BUDDHIST',
      'TRADITIONAL',
      'ATHEIST',
      'AGNOSTIC',
      'OTHER',
    ];
    return validReligions.includes(religion as ReligionType);
  }

  private isValidMaritalStatus(status: string): status is MaritalStatusType {
    const validStatuses: MaritalStatusType[] = [
      'SINGLE',
      'MARRIED',
      'DIVORCED',
      'WIDOWED',
      'SEPARATED',
      'COHABITING',
    ];
    return validStatuses.includes(status as MaritalStatusType);
  }

  private isValidEducationLevel(level: string): level is EducationLevel {
    const validLevels: EducationLevel[] = [
      'NONE',
      'PRIMARY',
      'SECONDARY',
      'DIPLOMA',
      'BACHELORS',
      'MASTERS',
      'DOCTORATE',
      'OTHER',
    ];
    return validLevels.includes(level as EducationLevel);
  }

  // --- Update Methods ---

  updateGender(gender: string): DemographicInfo {
    return new DemographicInfo({
      ...this._value,
      gender: gender.toUpperCase(),
    });
  }

  updateReligion(religion?: ReligionType): DemographicInfo {
    return new DemographicInfo({
      ...this._value,
      religion,
    });
  }

  updateMaritalStatus(status?: MaritalStatusType): DemographicInfo {
    return new DemographicInfo({
      ...this._value,
      maritalStatus: status,
    });
  }

  updateOccupation(occupation?: string): DemographicInfo {
    return new DemographicInfo({
      ...this._value,
      occupation,
    });
  }

  updateEducation(
    level?: EducationLevel,
    institutionName?: string,
    yearOfGraduation?: number,
  ): DemographicInfo {
    return new DemographicInfo({
      ...this._value,
      educationLevel: level,
      institutionName,
      yearOfGraduation,
    });
  }

  updateEmployment(
    status?: 'EMPLOYED' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'RETIRED' | 'STUDENT',
    employerName?: string,
    monthlyIncome?: number,
    incomeCurrency: string = 'KES',
  ): DemographicInfo {
    return new DemographicInfo({
      ...this._value,
      employmentStatus: status,
      employerName,
      monthlyIncome,
      incomeCurrency,
    });
  }

  updateDependants(count: number): DemographicInfo {
    if (count < 0) {
      throw new Error('Number of dependants cannot be negative');
    }
    return new DemographicInfo({
      ...this._value,
      numberOfDependants: count,
    });
  }

  addLanguage(language: string): DemographicInfo {
    const languages = [...(this._value.languages || [])];
    if (!languages.includes(language)) {
      languages.push(language);
    }
    return new DemographicInfo({
      ...this._value,
      languages,
    });
  }

  removeLanguage(language: string): DemographicInfo {
    const languages = (this._value.languages || []).filter((l) => l !== language);
    return new DemographicInfo({
      ...this._value,
      languages,
    });
  }

  updateEthnicity(ethnicGroup?: string, subEthnicGroup?: string): DemographicInfo {
    return new DemographicInfo({
      ...this._value,
      ethnicGroup,
      subEthnicGroup,
    });
  }

  updateResidentialStatus(
    isUrbanDweller: boolean,
    hasRuralHome: boolean,
    ruralHomeLocation?: string,
  ): DemographicInfo {
    return new DemographicInfo({
      ...this._value,
      isUrbanDweller,
      hasRuralHome,
      ruralHomeLocation,
    });
  }

  // --- Getters ---

  get gender(): string | undefined {
    return this._value.gender;
  }

  get religion(): ReligionType | undefined {
    return this._value.religion;
  }

  get maritalStatus(): MaritalStatusType | undefined {
    return this._value.maritalStatus;
  }

  get occupation(): string | undefined {
    return this._value.occupation;
  }

  get educationLevel(): EducationLevel | undefined {
    return this._value.educationLevel;
  }

  get institutionName(): string | undefined {
    return this._value.institutionName;
  }

  get yearOfGraduation(): number | undefined {
    return this._value.yearOfGraduation;
  }

  get employmentStatus(): string | undefined {
    return this._value.employmentStatus;
  }

  get employerName(): string | undefined {
    return this._value.employerName;
  }

  get monthlyIncome(): number | undefined {
    return this._value.monthlyIncome;
  }

  get incomeCurrency(): string | undefined {
    return this._value.incomeCurrency;
  }

  get numberOfDependants(): number | undefined {
    return this._value.numberOfDependants;
  }

  get languages(): string[] {
    return [...(this._value.languages || [])];
  }

  get ethnicGroup(): string | undefined {
    return this._value.ethnicGroup;
  }

  get subEthnicGroup(): string | undefined {
    return this._value.subEthnicGroup;
  }

  // Alias subClan to subEthnicGroup for compatibility with FamilyMember
  get subClan(): string | undefined {
    return this._value.subEthnicGroup;
  }

  get isUrbanDweller(): boolean {
    return this._value.isUrbanDweller;
  }

  get hasRuralHome(): boolean {
    return this._value.hasRuralHome;
  }

  get ruralHomeLocation(): string | undefined {
    return this._value.ruralHomeLocation;
  }

  // --- Computed Domain Logic ---

  // Check if person is Muslim (for inheritance rules)
  get isMuslim(): boolean {
    return this._value.religion === 'ISLAM';
  }

  // Check if person is Christian (for marriage rules)
  get isChristian(): boolean {
    return ['CHRISTIAN', 'CATHOLIC', 'PROTESTANT', 'PENTECOSTAL', 'SEVENTH_DAY_ADVENTIST'].includes(
      this._value.religion || '',
    );
  }

  // Check if person follows traditional religion
  get isTraditionalReligion(): boolean {
    return this._value.religion === 'TRADITIONAL';
  }

  // Check if person is employed
  get isEmployed(): boolean {
    return (
      this._value.employmentStatus === 'EMPLOYED' ||
      this._value.employmentStatus === 'SELF_EMPLOYED'
    );
  }

  // Check if person is a student
  get isStudent(): boolean {
    return this._value.employmentStatus === 'STUDENT';
  }

  // Check if person is retired
  get isRetired(): boolean {
    return this._value.employmentStatus === 'RETIRED';
  }

  // Check if person has dependants
  get hasDependants(): boolean {
    return (this._value.numberOfDependants || 0) > 0;
  }

  // Get primary language (first in list)
  get primaryLanguage(): string | undefined {
    return this._value.languages && this._value.languages.length > 0
      ? this._value.languages[0]
      : undefined;
  }

  // Check if person speaks English
  get speaksEnglish(): boolean {
    return (this._value.languages || []).some((lang) => lang.toLowerCase().includes('english'));
  }

  // Check if person speaks Swahili
  get speaksSwahili(): boolean {
    return (this._value.languages || []).some(
      (lang) => lang.toLowerCase().includes('swahili') || lang.toLowerCase().includes('kiswahili'),
    );
  }

  // Check if person has higher education
  get hasHigherEducation(): boolean {
    return ['DIPLOMA', 'BACHELORS', 'MASTERS', 'DOCTORATE'].includes(
      this._value.educationLevel || '',
    );
  }

  // Get formatted income
  get formattedIncome(): string | undefined {
    if (this._value.monthlyIncome === undefined) return undefined;

    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: this._value.incomeCurrency || 'KES',
      minimumFractionDigits: 0,
    });

    return formatter.format(this._value.monthlyIncome);
  }

  // Get years since graduation
  get yearsSinceGraduation(): number | null {
    if (!this._value.yearOfGraduation) return null;

    const currentYear = new Date().getFullYear();
    return currentYear - this._value.yearOfGraduation;
  }

  toJSON() {
    return {
      gender: this.gender,
      religion: this.religion,
      maritalStatus: this.maritalStatus,
      occupation: this.occupation,
      educationLevel: this.educationLevel,
      institutionName: this.institutionName,
      yearOfGraduation: this.yearOfGraduation,
      employmentStatus: this.employmentStatus,
      employerName: this.employerName,
      monthlyIncome: this.monthlyIncome,
      incomeCurrency: this.incomeCurrency,
      numberOfDependants: this.numberOfDependants,
      languages: this.languages,
      ethnicGroup: this.ethnicGroup,
      subEthnicGroup: this.subEthnicGroup,
      isUrbanDweller: this.isUrbanDweller,
      hasRuralHome: this.hasRuralHome,
      ruralHomeLocation: this.ruralHomeLocation,
      isMuslim: this.isMuslim,
      isChristian: this.isChristian,
      isTraditionalReligion: this.isTraditionalReligion,
      isEmployed: this.isEmployed,
      isStudent: this.isStudent,
      isRetired: this.isRetired,
      hasDependants: this.hasDependants,
      primaryLanguage: this.primaryLanguage,
      speaksEnglish: this.speaksEnglish,
      speaksSwahili: this.speaksSwahili,
      hasHigherEducation: this.hasHigherEducation,
      formattedIncome: this.formattedIncome,
      yearsSinceGraduation: this.yearsSinceGraduation,
    };
  }
}
