// domain/value-objects/personal/kenyan-name.vo.ts
import { ValueObject } from '../base/value-object';

export interface KenyanNameProps {
  firstName: string;
  lastName: string;
  middleName?: string;
  maidenName?: string;
  nicknames?: string[];
  clanName?: string;
  totemName?: string;
  suffix?: string; // e.g., "Jr.", "Sr.", "III"
}

export class KenyanName extends ValueObject<KenyanNameProps> {
  private constructor(props: KenyanNameProps) {
    super(props);
    this.validate();
  }

  static create(firstName: string, lastName: string, middleName?: string): KenyanName {
    return new KenyanName({
      firstName,
      lastName,
      middleName,
      nicknames: [],
    });
  }

  static createFromProps(props: KenyanNameProps): KenyanName {
    return new KenyanName(props);
  }

  validate(): void {
    // First name validation
    if (!this._value.firstName || this._value.firstName.trim().length < 2) {
      throw new Error('First name must be at least 2 characters');
    }

    if (!/^[A-Za-zÀ-ÿ\s\-']+$/.test(this._value.firstName)) {
      throw new Error('First name contains invalid characters');
    }

    // Last name validation
    if (!this._value.lastName || this._value.lastName.trim().length < 2) {
      throw new Error('Last name must be at least 2 characters');
    }

    if (!/^[A-Za-zÀ-ÿ\s\-']+$/.test(this._value.lastName)) {
      throw new Error('Last name contains invalid characters');
    }

    // Middle name validation (optional)
    if (this._value.middleName && this._value.middleName.trim().length > 0) {
      if (!/^[A-Za-zÀ-ÿ\s\-']+$/.test(this._value.middleName)) {
        throw new Error('Middle name contains invalid characters');
      }
    }

    // Maiden name validation (optional)
    if (this._value.maidenName && this._value.maidenName.trim().length > 0) {
      if (!/^[A-Za-zÀ-ÿ\s\-']+$/.test(this._value.maidenName)) {
        throw new Error('Maiden name contains invalid characters');
      }
    }

    // Validate nicknames
    if (this._value.nicknames && this._value.nicknames.length > 0) {
      for (const nickname of this._value.nicknames) {
        if (nickname.trim().length === 0) {
          throw new Error('Nickname cannot be empty');
        }
      }
    }

    // Kenyan cultural validation
    if (this._value.clanName && this._value.clanName.trim().length > 0) {
      if (!/^[A-Za-zÀ-ÿ\s\-']+$/.test(this._value.clanName)) {
        throw new Error('Clan name contains invalid characters');
      }
    }

    if (this._value.totemName && this._value.totemName.trim().length > 0) {
      if (!/^[A-Za-zÀ-ÿ\s\-']+$/.test(this._value.totemName)) {
        throw new Error('Totem name contains invalid characters');
      }
    }
  }

  withMiddleName(middleName: string): KenyanName {
    return new KenyanName({
      ...this._value,
      middleName,
    });
  }

  withMaidenName(maidenName: string): KenyanName {
    return new KenyanName({
      ...this._value,
      maidenName,
    });
  }

  addNickname(nickname: string): KenyanName {
    const nicknames = [...(this._value.nicknames || [])];
    if (!nicknames.includes(nickname)) {
      nicknames.push(nickname);
    }
    return new KenyanName({
      ...this._value,
      nicknames,
    });
  }

  removeNickname(nickname: string): KenyanName {
    const nicknames = (this._value.nicknames || []).filter((n) => n !== nickname);
    return new KenyanName({
      ...this._value,
      nicknames,
    });
  }

  withClanDetails(clanName: string, totemName?: string): KenyanName {
    return new KenyanName({
      ...this._value,
      clanName,
      totemName: totemName || this._value.totemName,
    });
  }

  withSuffix(suffix: string): KenyanName {
    return new KenyanName({
      ...this._value,
      suffix,
    });
  }

  get firstName(): string {
    return this._value.firstName;
  }

  get lastName(): string {
    return this._value.lastName;
  }

  get middleName(): string | undefined {
    return this._value.middleName;
  }

  get maidenName(): string | undefined {
    return this._value.maidenName;
  }

  get nicknames(): string[] {
    return [...(this._value.nicknames || [])];
  }

  get clanName(): string | undefined {
    return this._value.clanName;
  }

  get totemName(): string | undefined {
    return this._value.totemName;
  }

  get suffix(): string | undefined {
    return this._value.suffix;
  }

  // Full name for formal use
  get fullName(): string {
    const parts = [
      this._value.firstName,
      this._value.middleName,
      this._value.lastName,
      this._value.maidenName ? `née ${this._value.maidenName}` : undefined,
      this._value.suffix,
    ].filter(Boolean);
    return parts.join(' ');
  }

  // Legal name (for documents)
  get legalName(): string {
    const parts = [
      this._value.firstName,
      this._value.middleName,
      this._value.lastName,
      this._value.suffix,
    ].filter(Boolean);
    return parts.join(' ');
  }

  // Traditional name (with clan/totem)
  get traditionalName(): string {
    const parts = [
      this._value.firstName,
      this._value.middleName,
      this._value.lastName,
      this._value.clanName ? `wa ${this._value.clanName}` : undefined,
      this._value.totemName ? `(Totem: ${this._value.totemName})` : undefined,
    ].filter(Boolean);
    return parts.join(' ');
  }

  // Check if name includes maiden name
  get includesMaidenName(): boolean {
    return !!this._value.maidenName;
  }

  // Get initials
  get initials(): string {
    const first = this._value.firstName.charAt(0).toUpperCase();
    const last = this._value.lastName.charAt(0).toUpperCase();
    return `${first}${last}`;
  }

  // Check if name matches Kenyan naming patterns
  get isTraditionalName(): boolean {
    const traditionalPatterns = [
      /^[A-Za-z]+ (wa |of )/i, // Clan reference
      / (son|daughter) /i, // Patronymic/matronymic
      /^(O|A)/i, // Luo naming (Omondi, Akinyi)
      /^(M|N)/i, // Bantu naming (Muthoni, Njeri)
    ];

    const fullName = this.fullName.toLowerCase();
    return traditionalPatterns.some((pattern) => pattern.test(fullName));
  }

  toJSON() {
    return {
      firstName: this._value.firstName,
      lastName: this._value.lastName,
      middleName: this._value.middleName,
      maidenName: this._value.maidenName,
      nicknames: this._value.nicknames,
      clanName: this._value.clanName,
      totemName: this._value.totemName,
      suffix: this._value.suffix,
      fullName: this.fullName,
      legalName: this.legalName,
      traditionalName: this.traditionalName,
      includesMaidenName: this.includesMaidenName,
      initials: this.initials,
      isTraditionalName: this.isTraditionalName,
    };
  }
}
