// domain/value-objects/identity/kenyan-identity.vo.ts
import { ValueObject } from '../../base/value-object';
import { AlternativeIdentity } from './alternative-identity.vo';
import { IdentityType } from './alternative-identity.vo';
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
  alternativeIdentities: AlternativeIdentity[]; // Passports, Alien Cards, etc.

  // Cultural Identity (Critical for Customary Law Succession)
  religion?: string; // ISLAM, CHRISTIAN, TRADITIONAL, HINDU
  ethnicity?: string; // KIKUYU, LUO, etc.
  clan?: string;
  subClan?: string;
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
    });
  }

  static reconstruct(props: KenyanIdentityProps): KenyanIdentity {
    return new KenyanIdentity(props);
  }

  // --- Validation ---

  protected validate(): void {
    const { birthCertificate, deathCertificate } = this._value;

    // 1. Kenyan Citizens MUST eventually have a Birth Cert or ID
    // We don't enforce this on creation (to allow draft profiles),
    // but the `isValid` getter will reflect this.

    // 2. Consistency Checks
    if (deathCertificate && birthCertificate) {
      if (deathCertificate.dateOfDeath < birthCertificate.dateOfBirth) {
        // This is logically impossible
        throw new Error('Date of Death cannot be before Date of Birth');
      }
    }

    // 3. Removed the "Estimated Birth Year" check from National ID
    // because National ID numbers are serials, not dates.
  }

  // --- Immutable Updates (Fluent Interface) ---

  public withNationalId(id: NationalId): KenyanIdentity {
    return new KenyanIdentity({ ...this._value, nationalId: id });
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
    // Prevent duplicates of same type
    const others = this._value.alternativeIdentities.filter(
      (existing) => existing.value.type !== id.value.type,
    );
    return new KenyanIdentity({
      ...this._value,
      alternativeIdentities: [...others, id],
    });
  }

  public withCulturalDetails(ethnicity: string, religion: string, clan?: string): KenyanIdentity {
    return new KenyanIdentity({
      ...this._value,
      ethnicity: ethnicity.toUpperCase(),
      religion: religion.toUpperCase(),
      clan,
    });
  }

  // --- Business Logic & Getters ---

  /**
   * Returns the "Best Available" ID number for legal forms.
   * Priority: National ID > Passport > Alien ID > Birth Cert Entry No.
   */
  get primaryLegalId(): { type: string; number: string } | null {
    if (this._value.nationalId) {
      return {
        type: 'NATIONAL_ID',
        number: this._value.nationalId.idNumber,
      };
    }

    const passport = this._value.alternativeIdentities.find(
      (id) => id.type === IdentityType.PASSPORT,
    );
    if (passport) {
      return {
        type: IdentityType.PASSPORT,
        number: passport.idNumber,
      };
    }

    const alienId = this._value.alternativeIdentities.find(
      (id) => id.type === IdentityType.ALIEN_ID,
    );
    if (alienId) {
      return {
        type: IdentityType.ALIEN_ID,
        number: alienId.idNumber,
      };
    }

    if (this._value.birthCertificate) {
      return {
        type: 'BIRTH_CERTIFICATE',
        number: this._value.birthCertificate.primaryIdentifier,
      };
    }

    return null;
  }

  /**
   * Is this identity fully verified for Court Probate filing?
   */
  get isLegallyVerified(): boolean {
    const idVerified = this._value.nationalId?.isVerified ?? false;

    const passportVerified = this._value.alternativeIdentities.some(
      (id) => id.type === IdentityType.PASSPORT && id.isVerified,
    );

    return idVerified || passportVerified;
  }

  get isMuslim(): boolean {
    const religion = this._value.religion || '';
    return ['ISLAM', 'MUSLIM'].includes(religion);
  }

  /**
   * Certain Kenyan tribes have specific Customary Law exemptions/rules
   * e.g. Kikuyu "Muramati", Luo "Tero Buru"
   */
  get appliesCustomaryLaw(): boolean {
    // If they are Muslim, Islamic Law (Kadhi's Court) usually supersedes Customary Law
    if (this.isMuslim) return false;

    // Otherwise, assume Customary Law applies unless they have a Statutory Will
    return !!this._value.ethnicity;
  }

  // --- Getters for Child Props ---

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

  public toJSON() {
    return {
      citizenship: this._value.citizenship,
      nationalId: this._value.nationalId?.toJSON(),
      kraPin: this._value.kraPin?.toJSON(),
      birthCertificate: this._value.birthCertificate?.toJSON(),
      deathCertificate: this._value.deathCertificate?.toJSON(),
      alternativeIdentities: this._value.alternativeIdentities.map((id) => id.toJSON()),
      cultural: {
        religion: this._value.religion,
        ethnicity: this._value.ethnicity,
        clan: this._value.clan,
      },
      computed: {
        primaryLegalId: this.primaryLegalId,
        isLegallyVerified: this.isLegallyVerified,
        isMuslim: this.isMuslim,
      },
    };
  }
}
