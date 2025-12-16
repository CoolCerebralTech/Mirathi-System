// domain/value-objects/identity/kenyan-identity.vo.ts
import { ValueObject } from '../../base/value-object';
import { AlternativeIdentity, IdentityType } from './alternative-identity.vo';
import { BirthCertificate } from './birth-certificate.vo';
import { DeathCertificate } from './death-certificate.vo';
import { KraPin } from './kra-pin.vo';
import { NationalId } from './national-id.vo';

export interface KenyanIdentityProps {
  citizenship: 'KENYAN' | 'DUAL' | 'FOREIGN';

  // Core Documents
  nationalId?: NationalId;
  kraPin?: KraPin;
  birthCertificate?: BirthCertificate;
  deathCertificate?: DeathCertificate;

  // Secondary / Foreign Documents
  alternativeIdentities: AlternativeIdentity[];

  // Cultural Identity
  religion?: string;
  ethnicity?: string;
  clan?: string;
  subClan?: string;

  // Computed Cache (Added to satisfy Entity access via _value)
  appliesCustomaryLaw?: boolean;
  isLegallyVerified?: boolean;
}

export class KenyanIdentity extends ValueObject<KenyanIdentityProps> {
  private constructor(props: KenyanIdentityProps) {
    super(props);
    this.validate();
  }

  // --- Factory Methods ---

  static create(citizenship: 'KENYAN' | 'DUAL' | 'FOREIGN' = 'KENYAN'): KenyanIdentity {
    return new KenyanIdentity({
      citizenship,
      alternativeIdentities: [],
      // Initialize computed defaults
      appliesCustomaryLaw: false,
      isLegallyVerified: false,
    });
  }

  static reconstruct(props: KenyanIdentityProps): KenyanIdentity {
    return new KenyanIdentity(props);
  }

  // --- Validation ---

  protected validate(): void {
    const { birthCertificate, deathCertificate } = this._value;

    if (deathCertificate && birthCertificate) {
      if (deathCertificate.dateOfDeath < birthCertificate.dateOfBirth) {
        throw new Error('Date of Death cannot be before Date of Birth');
      }
    }
  }

  // --- Actions (Fluent Interface) ---

  public withNationalId(id: NationalId): KenyanIdentity {
    const next = new KenyanIdentity({ ...this._value, nationalId: id });
    return this.refreshComputedProps(next);
  }

  public withKraPin(pin: KraPin): KenyanIdentity {
    return new KenyanIdentity({ ...this._value, kraPin: pin });
  }

  public withBirthCertificate(cert: BirthCertificate): KenyanIdentity {
    return new KenyanIdentity({ ...this._value, birthCertificate: cert });
  }

  public withDeathCertificate(cert: DeathCertificate): KenyanIdentity {
    return new KenyanIdentity({ ...this._value, deathCertificate: cert });
  }

  public addAlternativeIdentity(id: AlternativeIdentity): KenyanIdentity {
    const others = this._value.alternativeIdentities.filter(
      (existing) => existing.value.type !== id.value.type,
    );
    const next = new KenyanIdentity({
      ...this._value,
      alternativeIdentities: [...others, id],
    });
    return this.refreshComputedProps(next);
  }

  public withCulturalDetails(ethnicity: string, religion: string, clan?: string): KenyanIdentity {
    const next = new KenyanIdentity({
      ...this._value,
      ethnicity: ethnicity.toUpperCase(),
      religion: religion.toUpperCase(),
      clan,
    });
    return this.refreshComputedProps(next);
  }

  // Helper to update the cache fields in props whenever state changes
  private refreshComputedProps(identity: KenyanIdentity): KenyanIdentity {
    const props = identity._value;

    // Recalculate Verification
    const idVerified = props.nationalId?.isVerified ?? false;
    const passportVerified = props.alternativeIdentities.some(
      (id) => id.type === IdentityType.PASSPORT && id.isVerified,
    );
    props.isLegallyVerified = idVerified || passportVerified;

    // Recalculate Customary Law
    const isMuslim = ['ISLAM', 'MUSLIM'].includes((props.religion || '').toUpperCase());
    props.appliesCustomaryLaw = !isMuslim && !!props.ethnicity;

    return new KenyanIdentity(props);
  }

  // --- Business Logic ---

  /**
   * Returns the "Best Available" ID number for legal forms.
   */
  get primaryLegalId(): { type: string; number: string } | null {
    if (this._value.nationalId) {
      return { type: 'NATIONAL_ID', number: this._value.nationalId.idNumber };
    }

    const passport = this._value.alternativeIdentities.find(
      (id) => id.type === IdentityType.PASSPORT,
    );
    if (passport) return { type: IdentityType.PASSPORT, number: passport.idNumber };

    const alienId = this._value.alternativeIdentities.find(
      (id) => id.type === IdentityType.ALIEN_ID,
    );
    if (alienId) return { type: IdentityType.ALIEN_ID, number: alienId.idNumber };

    if (this._value.birthCertificate) {
      return { type: 'BIRTH_CERTIFICATE', number: this._value.birthCertificate.primaryIdentifier };
    }

    return null;
  }

  // Expose getters that calculate on the fly (for direct usage)
  // BUT also rely on the props for the Entity access pattern
  get isLegallyVerified(): boolean {
    return this._value.isLegallyVerified ?? false;
  }

  get isMuslim(): boolean {
    const religion = this._value.religion || '';
    return ['ISLAM', 'MUSLIM'].includes(religion.toUpperCase());
  }

  get appliesCustomaryLaw(): boolean {
    return this._value.appliesCustomaryLaw ?? false;
  }

  // --- Getters (Direct accessors for Mapper) ---

  get citizenship() {
    return this._value.citizenship;
  }
  get ethnicity() {
    return this._value.ethnicity;
  }
  get religion() {
    return this._value.religion;
  }
  get clan() {
    return this._value.clan;
  }

  get nationalId() {
    return this._value.nationalId;
  }
  get kraPin() {
    return this._value.kraPin;
  }
  get birthCertificate() {
    return this._value.birthCertificate;
  }
  get deathCertificate() {
    return this._value.deathCertificate;
  }
  get alternativeIdentities() {
    return [...this._value.alternativeIdentities];
  }

  // --- Serialization ---

  public toJSON() {
    return {
      citizenship: this._value.citizenship,

      // Flattened Documents
      nationalId: this._value.nationalId?.toJSON(),
      kraPin: this._value.kraPin?.toJSON(),
      birthCertificate: this._value.birthCertificate?.toJSON(),
      deathCertificate: this._value.deathCertificate?.toJSON(),
      alternativeIdentities: this._value.alternativeIdentities.map((id) => id.toJSON()),

      // Cultural
      religion: this._value.religion,
      ethnicity: this._value.ethnicity,
      clan: this._value.clan,

      // Computed
      primaryLegalId: this.primaryLegalId,
      isLegallyVerified: this.isLegallyVerified,
      isMuslim: this.isMuslim,
      appliesCustomaryLaw: this.appliesCustomaryLaw,
    };
  }
}
