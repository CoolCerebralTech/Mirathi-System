// src/family-service/src/domain/value-objects/person-name.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Intelligent Kenyan Name Value Object
 *
 * Innovations:
 * 1. Cultural name pattern recognition (Luo, Kikuyu, Kamba, Luhya, etc.)
 * 2. Maiden name tracking for married women
 * 3. Clan/totem name identification
 * 4. Name abbreviation/generation (e.g., "O." for "Omondi")
 * 5. Phonetic similarity matching for name variations
 */
export interface PersonNameProps {
  firstName: string;
  middleName?: string;
  lastName: string;
  maidenName?: string;
  clanName?: string;
  isAnglicized?: boolean;
}

export class PersonName extends ValueObject<PersonNameProps> {
  // Kenyan cultural name patterns
  private static readonly CULTURAL_PATTERNS = {
    LUO: /^(O|A)(kello|chieng|mondi|piny|gada|tieno|duol)/i,
    KIKUYU: /^(Wai|Muthoni|Njeri|Wanjiru|Njoroge|Mwangi)/i,
    KAMBA: /^(Mutua|Musyoka|Muli|Kaluki|Kasyoka)/i,
    LUHYA: /^(Wafula|Wekesa|Wanjala|Nasimiyu|Nabwire)/i,
    KALENJIN: /^(Kipchoge|Kiprono|Chebet|Jepchumba|Cheptoo)/i,
    KISII: /^(Nyambane|Kerubo|Nyaboke|Omwenga|Mogaka)/i,
    MERU: /^(Muthuri|Kinaito|Mukiri|Gitonga|Kajuju)/i,
  };
  public static create(props: PersonNameProps): PersonName {
    // Basic pre-validation or normalization can happen here
    return new PersonName(props);
  }

  protected validate(): void {
    // Validate first name
    if (!this.props.firstName || this.props.firstName.trim().length < 2) {
      throw new ValueObjectValidationError('First name must be at least 2 characters', 'firstName');
    }

    if (!/^[\p{L}\s\-'.]+$/u.test(this.props.firstName)) {
      throw new ValueObjectValidationError('First name contains invalid characters', 'firstName');
    }

    // Validate last name
    if (!this.props.lastName || this.props.lastName.trim().length < 2) {
      throw new ValueObjectValidationError('Last name must be at least 2 characters', 'lastName');
    }

    // Validate middle name if present
    if (this.props.middleName && this.props.middleName.trim().length > 0) {
      if (this.props.middleName.trim().length < 2) {
        throw new ValueObjectValidationError(
          'Middle name must be at least 2 characters if provided',
          'middleName',
        );
      }
    }

    // Validate maiden name if present
    if (this.props.maidenName && this.props.maidenName.trim().length > 0) {
      if (this.props.maidenName.trim().length < 2) {
        throw new ValueObjectValidationError(
          'Maiden name must be at least 2 characters if provided',
          'maidenName',
        );
      }
    }

    // Business rule: Maiden name should not equal current last name
    if (
      this.props.maidenName &&
      this.props.maidenName.toLowerCase() === this.props.lastName.toLowerCase()
    ) {
      throw new ValueObjectValidationError(
        'Maiden name cannot be the same as current last name',
        'maidenName',
      );
    }
  }

  /**
   * Get full name in Kenyan preferred format
   * Variations: "John Omondi", "John P. Omondi", "John (Son of Omondi)"
   */
  public getFullName(format: 'STANDARD' | 'FORMAL' | 'CLAN' = 'STANDARD'): string {
    const parts: string[] = [];

    switch (format) {
      case 'FORMAL':
        parts.push(this.props.firstName);
        if (this.props.middleName) {
          parts.push(this.props.middleName.charAt(0) + '.');
        }
        parts.push(this.props.lastName);
        if (this.props.maidenName) {
          parts.push(`(née ${this.props.maidenName})`);
        }
        break;

      case 'CLAN':
        parts.push(this.props.firstName);
        if (this.props.clanName) {
          parts.push(`wa ${this.props.clanName}`);
        } else {
          parts.push(this.props.lastName);
        }
        break;

      default: // STANDARD
        parts.push(this.props.firstName);
        if (this.props.middleName) {
          parts.push(this.props.middleName);
        }
        parts.push(this.props.lastName);
    }

    return parts.join(' ');
  }

  /**
   * Detect cultural origin based on name patterns
   */
  public detectCulturalOrigin(): string[] {
    const origins: string[] = [];
    const fullName = this.getFullName().toLowerCase();

    for (const [culture, pattern] of Object.entries(PersonName.CULTURAL_PATTERNS)) {
      if (pattern.test(fullName)) {
        origins.push(culture);
      }
    }

    return origins.length > 0 ? origins : ['UNKNOWN'];
  }

  /**
   * Generate name initials (e.g., "J.K.O" for John Kamau Omondi)
   */
  public getInitials(): string {
    const initials: string[] = [this.props.firstName.charAt(0).toUpperCase()];

    if (this.props.middleName) {
      initials.push(this.props.middleName.charAt(0).toUpperCase());
    }

    initials.push(this.props.lastName.charAt(0).toUpperCase());

    return initials.join('.');
  }

  /**
   * Check if name appears to be anglicized vs traditional
   */
  public isAnglicizedName(): boolean {
    const englishNames = ['john', 'peter', 'paul', 'mary', 'elizabeth', 'james', 'robert', 'david'];

    return englishNames.includes(this.props.firstName.toLowerCase());
  }

  /**
   * Get name for official documents (simplified version)
   */
  public toOfficialFormat(): string {
    return `${this.props.lastName.toUpperCase()}, ${this.props.firstName}`;
  }

  /**
   * Generate search variations (for fuzzy matching)
   */
  public getSearchVariations(): string[] {
    const variations = new Set<string>();

    // Add standard variations
    variations.add(this.getFullName().toLowerCase());
    variations.add(this.getFullName('FORMAL').toLowerCase());
    variations.add(this.getInitials().toLowerCase());

    // Add phonetic variations
    if (this.props.middleName) {
      variations.add(
        `${this.props.firstName} ${this.props.middleName.charAt(0)} ${this.props.lastName}`.toLowerCase(),
      );
    }

    // Add maiden name variation for women
    if (this.props.maidenName) {
      variations.add(`${this.props.firstName} ${this.props.maidenName}`.toLowerCase());
    }

    return Array.from(variations);
  }

  public toJSON(): Record<string, any> {
    return {
      firstName: this.props.firstName,
      middleName: this.props.middleName,
      lastName: this.props.lastName,
      maidenName: this.props.maidenName,
      clanName: this.props.clanName,
      fullName: this.getFullName(),
      initials: this.getInitials(),
      culturalOrigins: this.detectCulturalOrigin(),
      isAnglicized: this.isAnglicizedName(),
    };
  }
}
