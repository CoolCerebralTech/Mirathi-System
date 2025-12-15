// domain/value-objects/geographical/kenyan-location.vo.ts
import { ValueObject } from '../../base/value-object';
import { KenyanCounty, KenyanCountyValidator } from './kenyan-county.vo';

export interface KenyanLocationProps {
  county: KenyanCounty;
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
  placeName?: string; // ADD THIS LINE
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
    // Validate the county string
    // You might need to import or access your KenyanCountyValidator
    // Assuming you have a way to validate county strings
    return new KenyanLocation({
      county: county as any, // Cast to your domain KenyanCounty type
      placeName,
      isUrban: false,
      isRural: true,
    });
  }
  validate(): void {
    // County validation
    if (!this._value.county) {
      throw new Error('County is required');
    }

    if (!KenyanCountyValidator.isValid(this._value.county)) {
      throw new Error('Invalid Kenyan county');
    }

    // Sub-county validation (optional but must be valid if provided)
    if (this._value.subCounty && this._value.subCounty.trim().length === 0) {
      throw new Error('Sub-county cannot be empty if provided');
    }

    // Ward validation (optional)
    if (this._value.ward && this._value.ward.trim().length === 0) {
      throw new Error('Ward cannot be empty if provided');
    }

    // Village validation (optional)
    if (this._value.village && this._value.village.trim().length === 0) {
      throw new Error('Village cannot be empty if provided');
    }

    // GPS coordinates validation (optional)
    if (this._value.gpsCoordinates) {
      if (!this.isValidGPSCoordinates(this._value.gpsCoordinates)) {
        throw new Error('Invalid GPS coordinates format. Expected format: "latitude,longitude"');
      }
    }

    // Altitude validation (optional)
    if (this._value.altitude !== undefined) {
      if (this._value.altitude < -100 || this._value.altitude > 6000) {
        throw new Error('Altitude must be between -100 and 6000 meters');
      }
    }

    // Urban/Rural validation
    if (this._value.isUrban && this._value.isRural) {
      throw new Error('Location cannot be both urban and rural');
    }

    // Postal code validation for urban areas
    if (this._value.isUrban && !this._value.postalCode) {
      console.warn('Urban locations should have a postal code');
    }

    // Plot number validation for rural agricultural land
    if (this._value.isRural && this._value.plotNumber) {
      if (!/^[A-Z]?\d+\/[A-Z]?\d+$/.test(this._value.plotNumber)) {
        console.warn('Rural plot number format may be incorrect');
      }
    }
  }

  private isValidGPSCoordinates(coordinates: string): boolean {
    // Validates format: "latitude,longitude" with decimal degrees
    const gpsRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
    if (!gpsRegex.test(coordinates)) return false;

    const [lat, lon] = coordinates.split(',').map((coord) => parseFloat(coord.trim()));

    // Kenya is between latitudes -4° and 5°, longitudes 34° and 42°
    const isLatValid = lat >= -4.0 && lat <= 5.0;
    const isLonValid = lon >= 34.0 && lon <= 42.0;

    return isLatValid && isLonValid;
  }

  updateSubCounty(subCounty?: string): KenyanLocation {
    return new KenyanLocation({
      ...this._value,
      subCounty,
    });
  }

  updateWard(ward?: string): KenyanLocation {
    return new KenyanLocation({
      ...this._value,
      ward,
    });
  }

  updateVillage(village?: string): KenyanLocation {
    return new KenyanLocation({
      ...this._value,
      village,
    });
  }

  updateAddressDetails(
    estate?: string,
    street?: string,
    building?: string,
    plotNumber?: string,
  ): KenyanLocation {
    return new KenyanLocation({
      ...this._value,
      estate,
      street,
      building,
      plotNumber,
    });
  }

  updatePostalDetails(postalCode?: string, postalAddress?: string): KenyanLocation {
    return new KenyanLocation({
      ...this._value,
      postalCode,
      postalAddress,
    });
  }

  updateLandmark(landmark?: string): KenyanLocation {
    return new KenyanLocation({
      ...this._value,
      landmark,
    });
  }

  updateConstituency(constituency?: string): KenyanLocation {
    return new KenyanLocation({
      ...this._value,
      constituency,
    });
  }

  updateAreaType(isUrban: boolean, isRural: boolean): KenyanLocation {
    return new KenyanLocation({
      ...this._value,
      isUrban,
      isRural,
    });
  }

  updateGeographicData(gpsCoordinates?: string, altitude?: number): KenyanLocation {
    return new KenyanLocation({
      ...this._value,
      gpsCoordinates,
      altitude,
    });
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

  get village(): string | undefined {
    return this._value.village;
  }

  get estate(): string | undefined {
    return this._value.estate;
  }

  get street(): string | undefined {
    return this._value.street;
  }

  get building(): string | undefined {
    return this._value.building;
  }

  get plotNumber(): string | undefined {
    return this._value.plotNumber;
  }

  get postalCode(): string | undefined {
    return this._value.postalCode;
  }

  get postalAddress(): string | undefined {
    return this._value.postalAddress;
  }

  get landmark(): string | undefined {
    return this._value.landmark;
  }

  get constituency(): string | undefined {
    return this._value.constituency;
  }

  get isUrban(): boolean {
    return this._value.isUrban;
  }

  get isRural(): boolean {
    return this._value.isRural;
  }

  get gpsCoordinates(): string | undefined {
    return this._value.gpsCoordinates;
  }

  get altitude(): number | undefined {
    return this._value.altitude;
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

  // Get administrative hierarchy
  get administrativeHierarchy(): string[] {
    return [
      KenyanCountyValidator.getDisplayName(this._value.county),
      this._value.subCounty,
      this._value.ward,
      this._value.village,
    ].filter((part): part is string => Boolean(part));
  }

  // Get region of the county
  get region(): string {
    return KenyanCountyValidator.getRegion(this._value.county);
  }

  // Get county code
  get countyCode(): string {
    return KenyanCountyValidator.getCountyCode(this._value.county);
  }

  // Get neighboring counties
  get neighboringCounties(): KenyanCounty[] {
    return KenyanCountyValidator.getNeighboringCounties(this._value.county);
  }

  // Check if location has complete address
  get hasCompleteAddress(): boolean {
    return (
      !!(this._value.street || this._value.estate || this._value.village) && !!this._value.county
    );
  }

  // Check if location has geographic coordinates
  get hasGeographicData(): boolean {
    return !!this._value.gpsCoordinates;
  }

  // Parse GPS coordinates
  get parsedCoordinates(): { latitude: number; longitude: number } | null {
    if (!this._value.gpsCoordinates) return null;

    const [lat, lon] = this._value.gpsCoordinates
      .split(',')
      .map((coord) => parseFloat(coord.trim()));
    return { latitude: lat, longitude: lon };
  }

  // Calculate approximate distance to another location (in kilometers)
  distanceTo(otherLocation: KenyanLocation): number | null {
    if (!this._value.gpsCoordinates || !otherLocation.gpsCoordinates) {
      return null;
    }

    const coords1 = this.parsedCoordinates;
    const coords2 = otherLocation.parsedCoordinates;

    if (!coords1 || !coords2) return null;

    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(coords2.latitude - coords1.latitude);
    const dLon = this.degreesToRadians(coords2.longitude - coords1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(coords1.latitude)) *
        Math.cos(this.degreesToRadians(coords2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Check if location is in same county
  isSameCounty(otherLocation: KenyanLocation): boolean {
    return this._value.county === otherLocation.county;
  }

  // Check if location is in same sub-county
  isSameSubCounty(otherLocation: KenyanLocation): boolean {
    return (
      this._value.county === otherLocation.county &&
      this._value.subCounty === otherLocation.subCounty
    );
  }

  // Check if location is coastal (for inheritance customs)
  get isCoastalRegion(): boolean {
    const coastalCounties: KenyanCounty[] = [
      KenyanCounty.KILIFI,
      KenyanCounty.KWALE,
      KenyanCounty.LAMU,
      KenyanCounty.MOMBASA,
      KenyanCounty.TAITA_TAVETA,
      KenyanCounty.TANA_RIVER,
    ];
    return coastalCounties.includes(this._value.county);
  }

  // Check if location is in pastoralist region
  get isPastoralistRegion(): boolean {
    const pastoralistCounties: KenyanCounty[] = [
      KenyanCounty.BARINGO,
      KenyanCounty.GARISSA,
      KenyanCounty.ISIOLO,
      KenyanCounty.MANDERA,
      KenyanCounty.MARSABIT,
      KenyanCounty.SAMBURU,
      KenyanCounty.TURKANA,
      KenyanCounty.WAJIR,
    ];
    return pastoralistCounties.includes(this._value.county);
  }

  // Check if location is in agricultural highlands
  get isAgriculturalHighlands(): boolean {
    const agriculturalCounties: KenyanCounty[] = [
      KenyanCounty.KIAMBU,
      KenyanCounty.MURANGA,
      KenyanCounty.NYANDARUA,
      KenyanCounty.NYERI,
      KenyanCounty.KIRINYAGA,
      KenyanCounty.MERU,
      KenyanCounty.EMBU,
      KenyanCounty.NAKURU,
      KenyanCounty.UASIN_GISHU,
      KenyanCounty.TRANS_NZOIA,
      KenyanCounty.NANDI,
    ];
    return agriculturalCounties.includes(this._value.county);
  }

  toJSON() {
    return {
      county: this._value.county,
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
      administrativeHierarchy: this.administrativeHierarchy,
      region: this.region,
      countyCode: this.countyCode,
      neighboringCounties: this.neighboringCounties,
      hasCompleteAddress: this.hasCompleteAddress,
      hasGeographicData: this.hasGeographicData,
      parsedCoordinates: this.parsedCoordinates,
      isCoastalRegion: this.isCoastalRegion,
      isPastoralistRegion: this.isPastoralistRegion,
      isAgriculturalHighlands: this.isAgriculturalHighlands,
    };
  }
}
