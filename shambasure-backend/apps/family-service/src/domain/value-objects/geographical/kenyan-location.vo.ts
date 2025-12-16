// domain/value-objects/geographical/kenyan-location.vo.ts
import { ValueObject } from '../../base/value-object';
import { KenyanCounty, KenyanCountyValidator } from './kenyan-county.vo';

export interface KenyanLocationProps {
  county: KenyanCounty;
  placeName?: string; // Explicitly added as it's used in Mapper

  subCounty?: string;
  ward?: string;
  village?: string;
  estate?: string;
  street?: string;
  building?: string;
  plotNumber?: string;
  postalCode?: string;
  postalAddress?: string;
  landmark?: string;
  constituency?: string;

  isUrban: boolean;
  isRural: boolean;
  gpsCoordinates?: string;
  altitude?: number; // in meters
}

export class KenyanLocation extends ValueObject<KenyanLocationProps> {
  private constructor(props: KenyanLocationProps) {
    super(props);
    this.validate();
  }

  static create(county: KenyanCounty, placeName?: string): KenyanLocation {
    return new KenyanLocation({
      county,
      placeName,
      isUrban: false,
      isRural: true,
    });
  }

  static createFromProps(props: KenyanLocationProps): KenyanLocation {
    return new KenyanLocation(props);
  }

  static createFromCounty(county: string, placeName?: string): KenyanLocation {
    // Assuming string is a valid enum key, otherwise Validator handles check
    return new KenyanLocation({
      county: county as KenyanCounty,
      placeName,
      isUrban: false,
      isRural: true,
    });
  }

  validate(): void {
    if (!this._value.county) {
      throw new Error('County is required');
    }

    if (!KenyanCountyValidator.isValid(this._value.county)) {
      throw new Error(`Invalid Kenyan county: ${this._value.county}`);
    }

    if (this._value.gpsCoordinates && !this.isValidGPSCoordinates(this._value.gpsCoordinates)) {
      throw new Error('Invalid GPS coordinates format. Expected format: "latitude,longitude"');
    }

    if (this._value.isUrban && this._value.isRural) {
      throw new Error('Location cannot be both urban and rural');
    }
  }

  private isValidGPSCoordinates(coordinates: string): boolean {
    const gpsRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
    if (!gpsRegex.test(coordinates)) return false;
    return true;
  }

  // --- Actions ---

  updateSubCounty(subCounty?: string): KenyanLocation {
    return new KenyanLocation({ ...this._value, subCounty });
  }

  updateWard(ward?: string): KenyanLocation {
    return new KenyanLocation({ ...this._value, ward });
  }

  updateVillage(village?: string): KenyanLocation {
    return new KenyanLocation({ ...this._value, village });
  }

  // --- Getters ---

  get county(): KenyanCounty {
    return this._value.county;
  }
  get placeName(): string | undefined {
    return this._value.placeName;
  }
  get subCounty(): string | undefined {
    return this._value.subCounty;
  }
  get ward(): string | undefined {
    return this._value.ward;
  }
  get village(): string | undefined {
    return this._value.village;
  }
  get isUrban(): boolean {
    return this._value.isUrban;
  }
  get isRural(): boolean {
    return this._value.isRural;
  }

  // Get display name for location
  get displayName(): string {
    const parts = [
      this._value.placeName,
      this._value.village,
      this._value.ward,
      this._value.subCounty,
      KenyanCountyValidator.getDisplayName(this._value.county),
    ].filter(Boolean);
    return parts.join(', ');
  }

  toJSON() {
    return {
      county: this._value.county,
      placeName: this._value.placeName, // Included in JSON
      countyDisplayName: KenyanCountyValidator.getDisplayName(this._value.county),
      subCounty: this._value.subCounty,
      ward: this._value.ward,
      village: this._value.village,
      estate: this._value.estate,
      street: this._value.street,
      building: this._value.building,
      plotNumber: this._value.plotNumber,
      postalCode: this._value.postalCode,
      postalAddress: this._value.postalAddress,
      landmark: this._value.landmark,
      constituency: this._value.constituency,
      isUrban: this._value.isUrban,
      isRural: this._value.isRural,
      gpsCoordinates: this._value.gpsCoordinates,
      altitude: this._value.altitude,
      displayName: this.displayName,
    };
  }
}
