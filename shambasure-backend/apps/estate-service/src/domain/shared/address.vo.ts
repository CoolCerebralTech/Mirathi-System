// src/shared/domain/value-objects/address.vo.ts
import { ValueObject } from '../base/value-object';
import {
  EmptyAddressException,
  InvalidAddressException,
  InvalidPostalCodeException,
  InvalidStreetAddressException,
} from '../exceptions/address.exception';
import { KenyanCounty } from './kenyan-location.vo';

export interface AddressProps {
  streetAddress: string;
  town?: string;
  county: KenyanCounty;
  postalCode?: string;
  postalAddress?: string;
  buildingName?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
}

export class Address extends ValueObject<AddressProps> {
  constructor(props: AddressProps) {
    super(props);
  }

  protected validate(): void {
    this.validateStreetAddress();
    this.validatePostalCode();
    this.validateCounty();
  }

  private validateStreetAddress(): void {
    const street = this._value.streetAddress.trim();

    if (!street || street.length === 0) {
      throw new EmptyAddressException('streetAddress');
    }

    if (street.length < 5) {
      throw new InvalidStreetAddressException(street, 5, 200, { field: 'streetAddress' });
    }

    if (street.length > 200) {
      throw new InvalidStreetAddressException(street, 5, 200, { field: 'streetAddress' });
    }

    // Validate Kenyan address patterns
    if (!this.isValidKenyanStreetAddress(street)) {
      throw new InvalidStreetAddressException(street, 5, 200, {
        field: 'streetAddress',
        reason: 'Invalid format',
      });
    }
  }

  private validatePostalCode(): void {
    if (!this._value.postalCode) return;

    const postalCode = this._value.postalCode.trim();

    // Kenyan postal codes: 00100 to 90200 (Nairobi to other counties)
    const postalCodeRegex = /^(00[1-9]|0[1-8][0-9]|09[0-2])[0-9]{2}$/;

    if (!postalCodeRegex.test(postalCode)) {
      throw new InvalidPostalCodeException(postalCode, { field: 'postalCode' });
    }

    // Validate postal code matches county (simplified)
    if (this._value.county) {
      const expectedPrefix = this.getCountyPostalCodePrefix(this._value.county);
      if (expectedPrefix && !postalCode.startsWith(expectedPrefix)) {
        throw new InvalidPostalCodeException(postalCode, {
          field: 'postalCode',
          reason: `Postal code ${postalCode} doesn't match county ${this._value.county} prefix ${expectedPrefix}`,
        });
      }
    }
  }

  private validateCounty(): void {
    if (!Object.values(KenyanCounty).includes(this._value.county)) {
      throw new InvalidAddressException(`Invalid county: ${this._value.county}`, 'county', {
        county: this._value.county,
      });
    }
  }

  private isValidKenyanStreetAddress(street: string): boolean {
    // Kenyan street address patterns
    const patterns = [
      /^\d+\s+[A-Za-z\s]+$/, // "123 Main Street"
      /^[A-Za-z\s]+,\s*\d+$/, // "Main Street, 123"
      /^[A-Za-z\s]+ Estate$/, // "Karen Estate"
      /^Off\s+[A-Za-z\s]+ Road$/, // "Off Thika Road"
      /^[A-Za-z\s]+ Road$/, // "Mombasa Road"
      /^[A-Za-z\s]+ Avenue$/, // "Uhuru Avenue"
      /^[A-Za-z\s]+ Lane$/, // "Koinange Lane"
      /^[A-Za-z\s]+ Close$/, // "Muthangari Close"
      /^[A-Za-z\s]+ Drive$/, // "Limuru Drive"
    ];

    return patterns.some((pattern) => pattern.test(street));
  }

  private getCountyPostalCodePrefix(county: KenyanCounty): string | null {
    const countyPostalCodes: Record<KenyanCounty, string> = {
      [KenyanCounty.NAIROBI]: '001',
      [KenyanCounty.MOMBASA]: '801',
      [KenyanCounty.KISUMU]: '401',
      [KenyanCounty.NAKURU]: '201',
      [KenyanCounty.ELDORET]: '301', // Uasin Gishu
      [KenyanCounty.THIKA]: '010', // Kiambu
      [KenyanCounty.MALINDI]: '802', // Kilifi
      [KenyanCounty.KITALE]: '302', // Trans Nzoia
      [KenyanCounty.KERICHO]: '202',
      [KenyanCounty.KAKAMEGA]: '501',
      // ... other counties
    };

    return countyPostalCodes[county] || null;
  }

  // Factory methods
  static createResidentialAddress(
    street: string,
    county: KenyanCounty,
    town?: string,
    postalCode?: string,
  ): Address {
    return new Address({
      streetAddress: street,
      county,
      town,
      postalCode,
    });
  }

  static createPostalAddress(
    postalAddress: string,
    postalCode: string,
    town: string,
    county: KenyanCounty,
  ): Address {
    return new Address({
      streetAddress: postalAddress,
      county,
      town,
      postalCode,
      postalAddress,
    });
  }

  // Business logic methods
  isUrbanAddress(): boolean {
    const urbanCounties = [
      KenyanCounty.NAIROBI,
      KenyanCounty.MOMBASA,
      KenyanCounty.KISUMU,
      KenyanCounty.NAKURU,
      KenyanCounty.UASIN_GISHU, // Eldoret
    ];

    return urbanCounties.includes(this._value.county);
  }

  isSameCounty(other: Address): boolean {
    return this._value.county === other._value.county;
  }

  isSameTown(other: Address): boolean {
    return this._value.town?.toLowerCase() === other._value.town?.toLowerCase();
  }

  // Formatting methods
  getSingleLineAddress(): string {
    const parts = [
      this._value.streetAddress,
      this._value.town,
      this._value.county,
      this._value.postalCode ? `P.O. Box ${this._value.postalCode}` : undefined,
      'Kenya',
    ].filter(Boolean);

    return parts.join(', ');
  }

  getMultilineAddress(): string[] {
    const lines: string[] = [];

    if (this._value.buildingName) {
      lines.push(this._value.buildingName);
    }

    lines.push(this._value.streetAddress);

    if (this._value.floor || this._value.apartment) {
      const unitInfo = [this._value.floor, this._value.apartment].filter(Boolean).join(', ');
      lines.push(unitInfo);
    }

    if (this._value.town) {
      lines.push(this._value.town);
    }

    lines.push(`${this._value.county} County`);

    if (this._value.postalCode || this._value.postalAddress) {
      const postalInfo = [
        this._value.postalAddress ? `P.O. Box ${this._value.postalAddress}` : undefined,
        this._value.postalCode ? `Code ${this._value.postalCode}` : undefined,
      ]
        .filter(Boolean)
        .join(' ');
      lines.push(postalInfo);
    }

    lines.push('Kenya');

    return lines;
  }

  getLegalAddress(): string {
    // For legal documents, use formal address format
    return `of ${this.getSingleLineAddress()}`;
  }

  // Getters
  get streetAddress(): string {
    return this._value.streetAddress;
  }

  get town(): string | undefined {
    return this._value.town;
  }

  get county(): KenyanCounty {
    return this._value.county;
  }

  get postalCode(): string | undefined {
    return this._value.postalCode;
  }

  get postalAddress(): string | undefined {
    return this._value.postalAddress;
  }

  // For geocoding
  getGeocodingQuery(): string {
    return [this._value.streetAddress, this._value.town, this._value.county, 'Kenya']
      .filter(Boolean)
      .join(', ');
  }
}
