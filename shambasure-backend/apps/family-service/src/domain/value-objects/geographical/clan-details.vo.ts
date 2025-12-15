// domain/value-objects/geographical/clan-details.vo.ts
import { ValueObject } from '../../base/value-object';
import { KenyanCounty, KenyanCountyValidator } from './kenyan-county.vo';

export type ClanStructure = 'PATRILINEAL' | 'MATRILINEAL' | 'BILINEAL' | 'UNKNOWN';
export type ClanAuthority =
  | 'COUNCIL_OF_ELDERS'
  | 'CLAN_HEAD'
  | 'FAMILY_HEAD'
  | 'NO_FORMAL_AUTHORITY';

export interface ClanDetailsProps {
  clanName: string;
  subClan?: string;
  totem?: string;
  clanSymbol?: string;
  clanStructure: ClanStructure;
  originalCounty?: KenyanCounty;
  migrationHistory?: string;
  knownSinceYear?: number;
  clanAuthority: ClanAuthority;
  clanHeadName?: string;
  clanHeadContact?: string;
  councilOfEldersCount?: number;
  majorFamilies: string[];
  clanLandLocation?: string;
  clanCemeteryLocation?: string;
  traditionalCeremonies: string[];
  taboos: string[];
  disputeResolutionMethod?: string;
  clanRegisterNumber?: string;
  isOfficiallyRecognized: boolean;
}

export class ClanDetails extends ValueObject<ClanDetailsProps> {
  private constructor(props: ClanDetailsProps) {
    super(props);
    this.validate();
  }

  static create(clanName: string): ClanDetails {
    return new ClanDetails({
      clanName,
      clanStructure: 'UNKNOWN',
      clanAuthority: 'NO_FORMAL_AUTHORITY',
      majorFamilies: [],
      traditionalCeremonies: [],
      taboos: [],
      isOfficiallyRecognized: false,
    });
  }

  static createFromProps(props: ClanDetailsProps): ClanDetails {
    return new ClanDetails(props);
  }

  validate(): void {
    // Clan name validation
    if (!this._value.clanName || this._value.clanName.trim().length < 2) {
      throw new Error('Clan name must be at least 2 characters');
    }

    // Sub-clan validation
    if (this._value.subClan && this._value.subClan.trim().length === 0) {
      throw new Error('Sub-clan cannot be empty if provided');
    }

    // Totem validation
    if (this._value.totem && this._value.totem.trim().length === 0) {
      throw new Error('Totem cannot be empty if provided');
    }

    // Original county validation
    if (this._value.originalCounty && !KenyanCountyValidator.isValid(this._value.originalCounty)) {
      throw new Error('Invalid original county');
    }

    // Known since year validation
    if (this._value.knownSinceYear) {
      const currentYear = new Date().getFullYear();
      if (this._value.knownSinceYear < 1000 || this._value.knownSinceYear > currentYear) {
        throw new Error('Invalid known since year');
      }
    }

    // Council of elders count validation
    if (this._value.councilOfEldersCount !== undefined) {
      if (this._value.councilOfEldersCount < 1) {
        throw new Error('Council of elders count must be at least 1');
      }
      if (this._value.councilOfEldersCount > 100) {
        throw new Error('Council of elders count is unrealistically high');
      }
    }

    // Major families validation
    for (const family of this._value.majorFamilies) {
      if (!family || family.trim().length === 0) {
        throw new Error('Major family name cannot be empty');
      }
    }

    // Traditional ceremonies validation
    for (const ceremony of this._value.traditionalCeremonies) {
      if (!ceremony || ceremony.trim().length === 0) {
        throw new Error('Traditional ceremony cannot be empty');
      }
    }

    // Taboos validation
    for (const taboo of this._value.taboos) {
      if (!taboo || taboo.trim().length === 0) {
        throw new Error('Taboo cannot be empty');
      }
    }

    // Clan head contact validation
    if (this._value.clanHeadContact) {
      if (!this.isValidKenyanPhone(this._value.clanHeadContact)) {
        throw new Error('Clan head contact must be a valid Kenyan phone number');
      }
    }
  }

  private isValidKenyanPhone(phone: string): boolean {
    const cleaned = phone.replace(/\s+/g, '').replace(/\+/g, '');
    return /^(0|254)?7[0-9]{8}$/.test(cleaned);
  }

  updateSubClan(subClan?: string): ClanDetails {
    return new ClanDetails({
      ...this._value,
      subClan,
    });
  }

  updateTotem(totem?: string, clanSymbol?: string): ClanDetails {
    return new ClanDetails({
      ...this._value,
      totem,
      clanSymbol: clanSymbol || this._value.clanSymbol,
    });
  }

  updateClanStructure(structure: ClanStructure): ClanDetails {
    return new ClanDetails({
      ...this._value,
      clanStructure: structure,
    });
  }

  updateOrigin(
    originalCounty?: KenyanCounty,
    migrationHistory?: string,
    knownSinceYear?: number,
  ): ClanDetails {
    return new ClanDetails({
      ...this._value,
      originalCounty,
      migrationHistory,
      knownSinceYear,
    });
  }

  updateClanAuthority(
    authority: ClanAuthority,
    clanHeadName?: string,
    clanHeadContact?: string,
    councilOfEldersCount?: number,
  ): ClanDetails {
    return new ClanDetails({
      ...this._value,
      clanAuthority: authority,
      clanHeadName,
      clanHeadContact,
      councilOfEldersCount,
    });
  }

  addMajorFamily(familyName: string): ClanDetails {
    const majorFamilies = [...this._value.majorFamilies];
    if (!majorFamilies.includes(familyName)) {
      majorFamilies.push(familyName);
    }
    return new ClanDetails({
      ...this._value,
      majorFamilies,
    });
  }

  removeMajorFamily(familyName: string): ClanDetails {
    const majorFamilies = this._value.majorFamilies.filter((family) => family !== familyName);
    return new ClanDetails({
      ...this._value,
      majorFamilies,
    });
  }

  updateClanLocations(clanLandLocation?: string, clanCemeteryLocation?: string): ClanDetails {
    return new ClanDetails({
      ...this._value,
      clanLandLocation,
      clanCemeteryLocation,
    });
  }

  addTraditionalCeremony(ceremony: string): ClanDetails {
    const traditionalCeremonies = [...this._value.traditionalCeremonies];
    if (!traditionalCeremonies.includes(ceremony)) {
      traditionalCeremonies.push(ceremony);
    }
    return new ClanDetails({
      ...this._value,
      traditionalCeremonies,
    });
  }

  removeTraditionalCeremony(ceremony: string): ClanDetails {
    const traditionalCeremonies = this._value.traditionalCeremonies.filter((c) => c !== ceremony);
    return new ClanDetails({
      ...this._value,
      traditionalCeremonies,
    });
  }

  addTaboo(taboo: string): ClanDetails {
    const taboos = [...this._value.taboos];
    if (!taboos.includes(taboo)) {
      taboos.push(taboo);
    }
    return new ClanDetails({
      ...this._value,
      taboos,
    });
  }

  removeTaboo(taboo: string): ClanDetails {
    const taboos = this._value.taboos.filter((t) => t !== taboo);
    return new ClanDetails({
      ...this._value,
      taboos,
    });
  }

  updateDisputeResolution(method?: string): ClanDetails {
    return new ClanDetails({
      ...this._value,
      disputeResolutionMethod: method,
    });
  }

  updateRegistration(
    registerNumber?: string,
    isOfficiallyRecognized: boolean = false,
  ): ClanDetails {
    return new ClanDetails({
      ...this._value,
      clanRegisterNumber: registerNumber,
      isOfficiallyRecognized,
    });
  }

  get clanName(): string {
    return this._value.clanName;
  }

  get subClan(): string | undefined {
    return this._value.subClan;
  }

  get totem(): string | undefined {
    return this._value.totem;
  }

  get clanSymbol(): string | undefined {
    return this._value.clanSymbol;
  }

  get clanStructure(): ClanStructure {
    return this._value.clanStructure;
  }

  get originalCounty(): KenyanCounty | undefined {
    return this._value.originalCounty;
  }

  get migrationHistory(): string | undefined {
    return this._value.migrationHistory;
  }

  get knownSinceYear(): number | undefined {
    return this._value.knownSinceYear;
  }

  get clanAuthority(): ClanAuthority {
    return this._value.clanAuthority;
  }

  get clanHeadName(): string | undefined {
    return this._value.clanHeadName;
  }

  get clanHeadContact(): string | undefined {
    return this._value.clanHeadContact;
  }

  get councilOfEldersCount(): number | undefined {
    return this._value.councilOfEldersCount;
  }

  get majorFamilies(): string[] {
    return [...this._value.majorFamilies];
  }

  get clanLandLocation(): string | undefined {
    return this._value.clanLandLocation;
  }

  get clanCemeteryLocation(): string | undefined {
    return this._value.clanCemeteryLocation;
  }

  get traditionalCeremonies(): string[] {
    return [...this._value.traditionalCeremonies];
  }

  get taboos(): string[] {
    return [...this._value.taboos];
  }

  get disputeResolutionMethod(): string | undefined {
    return this._value.disputeResolutionMethod;
  }

  get clanRegisterNumber(): string | undefined {
    return this._value.clanRegisterNumber;
  }

  get isOfficiallyRecognized(): boolean {
    return this._value.isOfficiallyRecognized;
  }

  // Get full clan name (with sub-clan if exists)
  get fullClanName(): string {
    if (this._value.subClan) {
      return `${this._value.clanName} (${this._value.subClan})`;
    }
    return this._value.clanName;
  }

  // Get years known
  get yearsKnown(): number | null {
    if (!this._value.knownSinceYear) return null;
    const currentYear = new Date().getFullYear();
    return currentYear - this._value.knownSinceYear;
  }

  // Check if clan is patrilineal (important for inheritance)
  get isPatrilineal(): boolean {
    return this._value.clanStructure === 'PATRILINEAL';
  }

  // Check if clan is matrilineal (important for inheritance)
  get isMatrilineal(): boolean {
    return this._value.clanStructure === 'MATRILINEAL';
  }

  // Check if clan has formal authority structure
  get hasFormalAuthority(): boolean {
    return this._value.clanAuthority !== 'NO_FORMAL_AUTHORITY';
  }

  // Check if clan has council of elders
  get hasCouncilOfElders(): boolean {
    return !!this._value.councilOfEldersCount && this._value.councilOfEldersCount > 0;
  }

  // Check if clan has documented history
  get hasDocumentedHistory(): boolean {
    return !!(this._value.migrationHistory || this._value.knownSinceYear);
  }

  // Check if clan has traditional dispute resolution
  get hasTraditionalDisputeResolution(): boolean {
    return !!this._value.disputeResolutionMethod;
  }

  // Check if clan ceremonies include initiation rites
  get hasInitiationRites(): boolean {
    return this._value.traditionalCeremonies.some(
      (ceremony) =>
        ceremony.toLowerCase().includes('initiation') ||
        ceremony.toLowerCase().includes('circumcision') ||
        ceremony.toLowerCase().includes('rites of passage'),
    );
  }

  // Check if clan has burial ceremonies
  get hasBurialCeremonies(): boolean {
    return this._value.traditionalCeremonies.some(
      (ceremony) =>
        ceremony.toLowerCase().includes('burial') ||
        ceremony.toLowerCase().includes('funeral') ||
        ceremony.toLowerCase().includes('mourning'),
    );
  }

  // Get original region if county is known
  get originalRegion(): string | null {
    if (!this._value.originalCounty) return null;
    return KenyanCountyValidator.getRegion(this._value.originalCounty);
  }

  // Get display name
  get displayName(): string {
    const parts = [this.fullClanName];
    if (this._value.totem) {
      parts.push(`Totem: ${this._value.totem}`);
    }
    if (this._value.originalCounty) {
      parts.push(`Origin: ${KenyanCountyValidator.getDisplayName(this._value.originalCounty)}`);
    }
    return parts.join(' - ');
  }

  toJSON() {
    return {
      clanName: this._value.clanName,
      subClan: this._value.subClan,
      totem: this._value.totem,
      clanSymbol: this._value.clanSymbol,
      clanStructure: this._value.clanStructure,
      originalCounty: this._value.originalCounty,
      originalCountyDisplayName: this._value.originalCounty
        ? KenyanCountyValidator.getDisplayName(this._value.originalCounty)
        : undefined,
      migrationHistory: this._value.migrationHistory,
      knownSinceYear: this._value.knownSinceYear,
      clanAuthority: this._value.clanAuthority,
      clanHeadName: this._value.clanHeadName,
      clanHeadContact: this._value.clanHeadContact,
      councilOfEldersCount: this._value.councilOfEldersCount,
      majorFamilies: this._value.majorFamilies,
      clanLandLocation: this._value.clanLandLocation,
      clanCemeteryLocation: this._value.clanCemeteryLocation,
      traditionalCeremonies: this._value.traditionalCeremonies,
      taboos: this._value.taboos,
      disputeResolutionMethod: this._value.disputeResolutionMethod,
      clanRegisterNumber: this._value.clanRegisterNumber,
      isOfficiallyRecognized: this._value.isOfficiallyRecognized,
      fullClanName: this.fullClanName,
      yearsKnown: this.yearsKnown,
      isPatrilineal: this.isPatrilineal,
      isMatrilineal: this.isMatrilineal,
      hasFormalAuthority: this.hasFormalAuthority,
      hasCouncilOfElders: this.hasCouncilOfElders,
      hasDocumentedHistory: this.hasDocumentedHistory,
      hasTraditionalDisputeResolution: this.hasTraditionalDisputeResolution,
      hasInitiationRites: this.hasInitiationRites,
      hasBurialCeremonies: this.hasBurialCeremonies,
      originalRegion: this.originalRegion,
      displayName: this.displayName,
    };
  }
}
