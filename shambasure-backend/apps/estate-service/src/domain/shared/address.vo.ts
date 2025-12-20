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
  subCounty?: string;
  ward?: string;
  village?: string;
  postalCode?: string;
  postalAddress?: string;
  buildingName?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  gpsCoordinates?: string; // "lat,long" format
  estateName?: string; // Many Kenyan addresses are in estates
}

export class Address extends ValueObject<AddressProps> {
  private static readonly MIN_STREET_LENGTH = 3;
  private static readonly MAX_STREET_LENGTH = 255;

  constructor(props: AddressProps) {
    super(props);
  }

  protected validate(): void {
    this.validateStreetAddress();
    this.validatePostalCode();
    this.validateCounty();
    this.validateGpsCoordinates();
  }

  private validateStreetAddress(): void {
    const street = this._value.streetAddress.trim();

    if (!street || street.length === 0) {
      throw new EmptyAddressException('streetAddress');
    }

    if (street.length < Address.MIN_STREET_LENGTH) {
      throw new InvalidStreetAddressException(
        street,
        Address.MIN_STREET_LENGTH,
        Address.MAX_STREET_LENGTH,
        { field: 'streetAddress' },
      );
    }

    if (street.length > Address.MAX_STREET_LENGTH) {
      throw new InvalidStreetAddressException(
        street,
        Address.MIN_STREET_LENGTH,
        Address.MAX_STREET_LENGTH,
        { field: 'streetAddress' },
      );
    }

    // Validate Kenyan address patterns (more flexible)
    if (!this.isValidKenyanAddress(street)) {
      throw new InvalidStreetAddressException(street, 5, 200, {
        field: 'streetAddress',
        reason: 'Invalid Kenyan address format',
      });
    }
  }

  private validatePostalCode(): void {
    if (!this._value.postalCode) return;

    const postalCode = this._value.postalCode.trim();

    // Kenyan postal codes are 5 digits
    // Range roughly 00100 to 99999
    const postalCodeRegex = /^\d{5}$/;

    if (!postalCodeRegex.test(postalCode)) {
      throw new InvalidPostalCodeException(postalCode, {
        field: 'postalCode',
        reason: 'Invalid Kenyan postal code format (must be 5 digits, e.g., 00100)',
      });
    }

    // Validate postal code matches county if both provided
    if (this._value.county) {
      const expectedPrefix = this.getCountyPostalCodePrefix(this._value.county);
      // We only warn if there is a prefix and it doesn't match, as boundaries can be fuzzy
      if (expectedPrefix && !postalCode.startsWith(expectedPrefix)) {
        console.warn(
          `Postal code ${postalCode} doesn't match typical prefix for ${this._value.county} (expected start: ${expectedPrefix})`,
        );
      }
    }
  }

  private validateCounty(): void {
    if (!Object.values(KenyanCounty).includes(this._value.county)) {
      throw new InvalidAddressException(`Invalid county: ${this._value.county}`, 'county', {
        county: this._value.county,
        validCounties: Object.values(KenyanCounty),
      });
    }
  }

  private validateGpsCoordinates(): void {
    if (!this._value.gpsCoordinates) return;

    const coords = this._value.gpsCoordinates.trim();
    // Simple validation for "lat,long" format
    const coordRegex = /^-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+$/;

    if (!coordRegex.test(coords)) {
      throw new InvalidAddressException(
        `Invalid GPS coordinates format. Expected "latitude,longitude"`,
        'gpsCoordinates',
        { coordinates: coords },
      );
    }

    // Check if coordinates are within Kenya roughly
    const [lat, long] = coords.split(',').map(parseFloat);
    if (lat < -4.9 || lat > 5.0 || long < 33.9 || long > 42.0) {
      console.warn(`GPS coordinates (${lat}, ${long}) appear to be outside Kenya`);
    }
  }

  private isValidKenyanAddress(street: string): boolean {
    // More comprehensive Kenyan address patterns
    const patterns = [
      /^\d+\s+[A-Za-z\s\-']+$/, // "123 Main Street"
      /^[A-Za-z\s\-']+,\s*\d+$/, // "Main Street, 123"
      /^[A-Za-z\s\-']+ Estate$/i, // "Karen Estate"
      /^[A-Za-z\s\-']+ (Estate|Gardens|View|Heights|Court|Place|Square|Plaza)$/i,
      /^(Off|Along|Near|Adjacent to)\s+[A-Za-z\s\-']+$/i,
      /^[A-Za-z\s\-']+ (Road|Avenue|Drive|Lane|Close|Way|Street|Boulevard)$/i,
      /^Plot\s*\d+[A-Z]?(\s*[A-Za-z\s\-']+)?$/i, // "Plot 123", "Plot 123A"
      /^House\s*No\.?\s*\d+[A-Z]?(\s*[A-Za-z\s\-']+)?$/i, // "House No. 123"
      /^[A-Za-z\s\-']+ Flats$/i, // "Muthaiga Flats"
      /^[A-Za-z\s\-']+ Shopping (Centre|Center|Mall|Complex)$/i,
      /^P\.?O\.?\s*Box\s*\d+/i, // P.O. Box addresses
      /^[A-Za-z\s\-']+ Village$/i, // "Kibera Village"
      /^Stage\s*\d+\s*[A-Za-z\s\-']*$/i, // "Stage 5 Kibera"
    ];

    return patterns.some((pattern) => pattern.test(street));
  }

  private getCountyPostalCodePrefix(county: KenyanCounty): string | null {
    // Mapping counties to their primary postal code prefixes (usually first 2 or 3 digits)
    const countyPostalCodes: Partial<Record<KenyanCounty, string>> = {
      [KenyanCounty.NAIROBI]: '00', // 00100 - 006xx
      [KenyanCounty.MOMBASA]: '801',
      [KenyanCounty.KISUMU]: '401',
      [KenyanCounty.NAKURU]: '201',
      [KenyanCounty.UASIN_GISHU]: '301', // Eldoret
      [KenyanCounty.TRANS_NZOIA]: '302', // Kitale
      [KenyanCounty.KERICHO]: '202',
      [KenyanCounty.KAKAMEGA]: '501',
      [KenyanCounty.EMBU]: '601',
      [KenyanCounty.MERU]: '602',
      [KenyanCounty.NYERI]: '101',
      [KenyanCounty.MURANGA]: '102',
      [KenyanCounty.KIRINYAGA]: '103',
      [KenyanCounty.KIAMBU]: '009', // Thika is 010, so this is just one prefix
      [KenyanCounty.MACHAKOS]: '901',
      [KenyanCounty.MAKUENI]: '903',
      [KenyanCounty.KILIFI]: '80', // 801xx, 802xx (Malindi)
      [KenyanCounty.TAITA_TAVETA]: '803',
      [KenyanCounty.LAMU]: '805',
      [KenyanCounty.TANA_RIVER]: '804',
      [KenyanCounty.GARISSA]: '701',
      [KenyanCounty.WAJIR]: '702',
      [KenyanCounty.MANDERA]: '703',
      [KenyanCounty.MARSABIT]: '605',
      [KenyanCounty.ISIOLO]: '603',
      [KenyanCounty.LAIKIPIA]: '104',
      [KenyanCounty.NYANDARUA]: '203',
      [KenyanCounty.NANDI]: '303',
      [KenyanCounty.BARINGO]: '304',
      [KenyanCounty.SAMBURU]: '206',
      [KenyanCounty.TURKANA]: '305',
      [KenyanCounty.WEST_POKOT]: '306',
      [KenyanCounty.BUNGOMA]: '502',
      [KenyanCounty.BUSIA]: '504',
      [KenyanCounty.SIAYA]: '406',
      [KenyanCounty.HOMA_BAY]: '403',
      [KenyanCounty.MIGORI]: '404',
      [KenyanCounty.KISII]: '402',
      [KenyanCounty.NYAMIRA]: '405',
      [KenyanCounty.VIHIGA]: '503',
      [KenyanCounty.ELGEYO_MARAKWET]: '307',
      [KenyanCounty.NAROK]: '205',
      [KenyanCounty.KAJIADO]: '011',
      [KenyanCounty.BOMET]: '204',
    };

    return countyPostalCodes[county] || null;
  }

  // Factory methods
  static createResidentialAddress(
    street: string,
    county: KenyanCounty,
    town?: string,
    postalCode?: string,
    estateName?: string,
  ): Address {
    return new Address({
      streetAddress: street,
      county,
      town,
      postalCode,
      estateName,
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

  static createEstateAddress(
    estateName: string,
    houseNumber: string,
    county: KenyanCounty,
    town: string,
  ): Address {
    return new Address({
      streetAddress: `${houseNumber} ${estateName}`,
      county,
      town,
      estateName,
    });
  }

  // Business logic methods
  isUrbanAddress(): boolean {
    const urbanCounties = [
      KenyanCounty.NAIROBI,
      KenyanCounty.MOMBASA,
      KenyanCounty.KISUMU,
      KenyanCounty.NAKURU,
      KenyanCounty.UASIN_GISHU,
      KenyanCounty.KIAMBU, // Highly urbanized (Thika, Kiambu, Ruiru)
      KenyanCounty.MACHAKOS, // Machakos Town/Mlolongo
      KenyanCounty.KAJIADO, // Kitengela/Ngong
    ];

    return urbanCounties.includes(this._value.county);
  }

  isAgriculturalArea(): boolean {
    const agriculturalCounties = [
      KenyanCounty.TRANS_NZOIA,
      KenyanCounty.UASIN_GISHU,
      KenyanCounty.NANDI,
      KenyanCounty.KERICHO,
      KenyanCounty.BOMET,
      KenyanCounty.NAROK,
      KenyanCounty.LAIKIPIA,
      KenyanCounty.NYANDARUA,
      KenyanCounty.NYERI,
      KenyanCounty.MURANGA,
      KenyanCounty.KIRINYAGA,
      KenyanCounty.EMBU,
      KenyanCounty.MERU,
      KenyanCounty.TAITA_TAVETA,
      KenyanCounty.HOMA_BAY,
    ];

    return agriculturalCounties.includes(this._value.county);
  }

  isSameCounty(other: Address): boolean {
    return this._value.county === other._value.county;
  }

  isSameTown(other: Address): boolean {
    return this._value.town?.toLowerCase() === other._value.town?.toLowerCase();
  }

  // For court jurisdiction determination
  getCourtJurisdiction(): string {
    const county = this._value.county;
    // In Kenya, succession matters are handled by the High Court in the county
    // We convert the enum to a readable string
    const countyName = county
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `High Court of Kenya at ${countyName}`;
  }

  // Formatting methods
  getSingleLineAddress(): string {
    const parts = [
      this._value.buildingName,
      this._value.streetAddress,
      this._value.estateName ? `Estate: ${this._value.estateName}` : undefined,
      this._value.town,
      this._value.county,
      this._value.postalCode ? `Postal Code: ${this._value.postalCode}` : undefined,
      'Kenya',
    ].filter(Boolean);

    return parts.join(', ');
  }

  getFormalAddress(): string {
    // For legal documents
    const parts = [
      this._value.buildingName ? `Building: ${this._value.buildingName}` : undefined,
      this._value.floor ? `Floor: ${this._value.floor}` : undefined,
      this._value.apartment ? `Apartment: ${this._value.apartment}` : undefined,
      this._value.streetAddress,
      this._value.ward ? `Ward: ${this._value.ward}` : undefined,
      this._value.subCounty ? `Sub-County: ${this._value.subCounty}` : undefined,
      this._value.town ? `Town: ${this._value.town}` : undefined,
      `${this._value.county} County`,
      this._value.postalCode ? `Postal Code: ${this._value.postalCode}` : undefined,
      'Republic of Kenya',
    ].filter(Boolean);

    return parts.join(', ');
  }

  getPostalAddress(): string {
    if (this._value.postalAddress) {
      return `P.O. Box ${this._value.postalAddress}`;
    }

    const parts = [
      'P.O. Box',
      this._value.postalCode || 'XXXXX',
      this._value.town || this._value.county,
      'Kenya',
    ].filter(Boolean);

    return parts.join(' ');
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

  get subCounty(): string | undefined {
    return this._value.subCounty;
  }

  get ward(): string | undefined {
    return this._value.ward;
  }

  get postalCode(): string | undefined {
    return this._value.postalCode;
  }

  get postalAddress(): string | undefined {
    return this._value.postalAddress;
  }

  get estateName(): string | undefined {
    return this._value.estateName;
  }

  get gpsCoordinates(): string | undefined {
    return this._value.gpsCoordinates;
  }

  // For geocoding and mapping
  getGeocodingQuery(): string {
    const queryParts = [
      this._value.streetAddress,
      this._value.estateName,
      this._value.town,
      this._value.county,
      'Kenya',
    ].filter(Boolean);

    return queryParts.join(', ');
  }

  // Check if address is complete enough for legal purposes
  isLegallySufficient(): boolean {
    return Boolean(
      this._value.streetAddress &&
      this._value.streetAddress.length >= 5 &&
      this._value.county &&
      (this._value.town || this._value.postalCode),
    );
  }
}
