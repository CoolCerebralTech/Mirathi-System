import { ValueObject } from '../base/value-object';
import {
  EmptyAddressException,
  InvalidAddressException,
  InvalidCountyAddressException,
  InvalidPostalCodeException,
  InvalidStreetAddressException,
} from '../exceptions/address.exception';
import { KenyanCounty } from './kenyan-location.vo';

export interface AddressProps {
  streetAddress: string;
  town?: string;
  county: KenyanCounty;
  subCounty?: string; // e.g., Westlands
  ward?: string;
  postalCode?: string; // 00100
  postalAddress?: string; // P.O. Box 12345
  buildingName?: string;
  floor?: string;
  gpsCoordinates?: string; // "lat,long"
  estateName?: string; // e.g., Nyayo Estate
  landReferenceNumber?: string; // LR No. 123/45 (Important for Estate Service)
}

export class Address extends ValueObject<AddressProps> {
  private static readonly MIN_STREET_LENGTH = 3;
  private static readonly MAX_STREET_LENGTH = 150;

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
    const street = this.props.streetAddress?.trim();

    if (!street || street.length === 0) {
      throw new EmptyAddressException('streetAddress');
    }

    if (street.length < Address.MIN_STREET_LENGTH) {
      throw new InvalidStreetAddressException(
        street,
        Address.MIN_STREET_LENGTH,
        Address.MAX_STREET_LENGTH,
        { field: 'streetAddress', reason: 'Too short' },
      );
    }

    if (street.length > Address.MAX_STREET_LENGTH) {
      throw new InvalidStreetAddressException(
        street,
        Address.MIN_STREET_LENGTH,
        Address.MAX_STREET_LENGTH,
        { field: 'streetAddress', reason: 'Too long' },
      );
    }

    // Kenyan Legal Address Pattern Check
    // e.g., "Plot 5", "LR 209/123", "House 10", "Main Street"
    const kenyanPattern =
      /^(Plot|LR|Hse|House|P\.O\.|Box|Road|St|Ave|Lane|Close|Way|Off|Near|Along|[A-Za-z0-9])/i;
    if (!kenyanPattern.test(street)) {
      // We warn but allow, or throw strict if required. For "No MVP", we assume valid data entry but strict formatting.
    }
  }

  private validatePostalCode(): void {
    if (!this.props.postalCode) return;

    const code = this.props.postalCode.trim();
    // Kenyan postal codes are strictly 5 digits (e.g., 00100)
    const postalRegex = /^\d{5}$/;

    if (!postalRegex.test(code)) {
      throw new InvalidPostalCodeException(code, {
        provided: code,
        expectedFormat: '5 Digits (e.g., 00100)',
      });
    }
  }

  private validateCounty(): void {
    if (!Object.values(KenyanCounty).includes(this.props.county)) {
      throw new InvalidCountyAddressException(this.props.county, {
        field: 'county',
        value: this.props.county,
      });
    }
  }

  private validateGpsCoordinates(): void {
    if (!this.props.gpsCoordinates) return;

    const [lat, lng] = this.props.gpsCoordinates.split(',').map((s) => parseFloat(s.trim()));

    if (isNaN(lat) || isNaN(lng)) {
      throw new InvalidAddressException('Invalid GPS format. Use "lat,long"', 'gpsCoordinates');
    }

    // Rough Kenyan Bounds
    if (lat < -5 || lat > 5 || lng < 33 || lng > 42) {
      throw new InvalidAddressException('Coordinates outside Kenya', 'gpsCoordinates', {
        lat,
        lng,
      });
    }
  }

  // --- Business Logic ---

  public isPOBox(): boolean {
    return !!this.props.postalAddress || this.props.streetAddress.toLowerCase().includes('box');
  }

  public getHighCourtRegistry(): string {
    // Maps Address County to the specific High Court station
    // This is vital for the SuccessionService to determine filing location
    return `High Court at ${this.formatCountyName()}`;
  }

  private formatCountyName(): string {
    return this.props.county
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }

  public toJSON(): Record<string, any> {
    return {
      street: this.props.streetAddress,
      town: this.props.town,
      county: this.props.county,
      postalCode: this.props.postalCode,
      formatted: `${this.props.streetAddress}, ${this.props.town || ''}, ${this.formatCountyName()}`,
    };
  }
}
