// src/shared/domain/value-objects/gps-coordinates.vo.ts
import { ValueObject } from '../base/value-object';
import {
  CoordinatesOutOfBoundsException,
  InvalidAltitudeException,
  InvalidCoordinatesException,
  InvalidLatitudeException,
  InvalidLongitudeException,
} from '../exceptions/coordinates.exception';
import { KenyanCounty } from './kenyan-location.vo';

export enum CoordinateSource {
  GPS_DEVICE = 'GPS_DEVICE',
  SURVEY = 'SURVEY',
  GOOGLE_MAPS = 'GOOGLE_MAPS',
  OPEN_STREET_MAP = 'OPEN_STREET_MAP',
  ESTIMATED = 'ESTIMATED',
  CADASTRAL_MAP = 'CADASTRAL_MAP',
  LAND_REGISTRY = 'LAND_REGISTRY',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
}

export enum CoordinateAccuracy {
  HIGH = 'HIGH', // < 5 meters
  MEDIUM = 'MEDIUM', // 5-20 meters
  LOW = 'LOW', // 20-100 meters
  VERY_LOW = 'VERY_LOW', // > 100 meters
}

export interface GPSCoordinatesProps {
  latitude: number; // Decimal degrees, -90 to 90
  longitude: number; // Decimal degrees, -180 to 180
  accuracy?: number; // Meters, standard deviation
  altitude?: number; // Meters above sea level
  timestamp?: Date;
  source: CoordinateSource;
  description?: string;
  parcelReference?: string; // Associated land parcel
  surveyDiagramNumber?: string; // Survey diagram reference
}

export class GPSCoordinates extends ValueObject<GPSCoordinatesProps> {
  // Kenya's geographical bounds (with buffer for coastal islands)
  private static readonly KENYA_BOUNDS = {
    minLat: -4.9,
    maxLat: 5.0,
    minLng: 33.9,
    maxLng: 42.0,
  };

  // Major cities coordinates for reference
  private static readonly KENYAN_CITIES = {
    NAIROBI: { lat: -1.286389, lng: 36.817223 },
    MOMBASA: { lat: -4.0435, lng: 39.6682 },
    KISUMU: { lat: -0.1022, lng: 34.7617 },
    NAKURU: { lat: -0.3031, lng: 36.08 },
    ELDORET: { lat: 0.5143, lng: 35.2698 },
    THIKA: { lat: -1.0395, lng: 37.0894 },
    MALINDI: { lat: -3.2175, lng: 40.1191 },
    KITALE: { lat: 1.0167, lng: 35.0 },
    KERICHO: { lat: -0.367, lng: 35.2833 },
    KAKAMEGA: { lat: 0.2827, lng: 34.7519 },
    NYERI: { lat: -0.4201, lng: 36.9476 },
    MERU: { lat: 0.05, lng: 37.65 },
    EMBU: { lat: -0.5375, lng: 37.4575 },
    MACHACKOS: { lat: -1.5175, lng: 37.2639 },
    GARISSA: { lat: -0.4569, lng: 39.6583 },
    LODWAR: { lat: 3.1167, lng: 35.6 },
  };

  constructor(props: GPSCoordinatesProps) {
    super(props);
  }

  protected validate(): void {
    this.validateLatitude();
    this.validateLongitude();
    this.validateKenyanBounds();
    this.validateAccuracy();
    this.validateAltitude();
  }

  private validateLatitude(): void {
    if (this._value.latitude < -90 || this._value.latitude > 90) {
      throw new InvalidLatitudeException(this._value.latitude, -90, 90, {
        latitude: this._value.latitude,
        source: this._value.source,
      });
    }

    if (isNaN(this._value.latitude)) {
      throw new InvalidCoordinatesException('Latitude cannot be NaN', 'latitude', {
        latitude: this._value.latitude,
      });
    }

    // Check for unrealistic precision
    const decimalPlaces = (this._value.latitude.toString().split('.')[1] || '').length;
    if (decimalPlaces > 10) {
      console.warn(`Excessive precision in latitude: ${decimalPlaces} decimal places`);
    }
  }

  private validateLongitude(): void {
    if (this._value.longitude < -180 || this._value.longitude > 180) {
      throw new InvalidLongitudeException(this._value.longitude, -180, 180, {
        longitude: this._value.longitude,
        source: this._value.source,
      });
    }

    if (isNaN(this._value.longitude)) {
      throw new InvalidCoordinatesException('Longitude cannot be NaN', 'longitude', {
        longitude: this._value.longitude,
      });
    }

    // Check for unrealistic precision
    const decimalPlaces = (this._value.longitude.toString().split('.')[1] || '').length;
    if (decimalPlaces > 10) {
      console.warn(`Excessive precision in longitude: ${decimalPlaces} decimal places`);
    }
  }

  private validateKenyanBounds(): void {
    const { latitude, longitude } = this._value;
    const bounds = GPSCoordinates.KENYA_BOUNDS;

    if (latitude < bounds.minLat || latitude > bounds.maxLat) {
      throw new CoordinatesOutOfBoundsException(
        'latitude',
        latitude,
        bounds.minLat,
        bounds.maxLat,
        {
          latitude,
          country: 'Kenya',
          source: this._value.source,
        },
      );
    }

    if (longitude < bounds.minLng || longitude > bounds.maxLng) {
      throw new CoordinatesOutOfBoundsException(
        'longitude',
        longitude,
        bounds.minLng,
        bounds.maxLng,
        {
          longitude,
          country: 'Kenya',
          source: this._value.source,
        },
      );
    }

    // Additional validation for specific Kenyan regions
    if (this.isInIndianOcean()) {
      console.warn('Coordinates appear to be in the Indian Ocean');
    }

    if (this.isInLakeVictoria()) {
      console.warn('Coordinates appear to be in Lake Victoria');
    }
  }

  private validateAccuracy(): void {
    if (this._value.accuracy !== undefined) {
      if (this._value.accuracy < 0) {
        throw new InvalidCoordinatesException(
          `Accuracy cannot be negative: ${this._value.accuracy}m`,
          'accuracy',
          {
            accuracy: this._value.accuracy,
            source: this._value.source,
          },
        );
      }

      if (this._value.accuracy > 100000) {
        // 100km
        console.warn(`Very low accuracy: ${this._value.accuracy}m`);
      }

      // For land title purposes, accuracy should ideally be < 10m
      if (this._value.source === CoordinateSource.SURVEY && this._value.accuracy > 10) {
        console.warn(`Survey coordinates with low accuracy: ${this._value.accuracy}m`);
      }
    }
  }

  private validateAltitude(): void {
    if (this._value.altitude !== undefined) {
      // Kenya's altitude ranges from sea level to 5199m (Mt. Kenya)
      if (this._value.altitude < -1000 || this._value.altitude > 6000) {
        throw new InvalidAltitudeException(this._value.altitude, -1000, 6000, {
          altitude: this._value.altitude,
          source: this._value.source,
        });
      }

      // Check for unrealistic altitudes in certain locations
      if (this._value.altitude < 0 && !this.isCoastalRegion()) {
        console.warn(`Negative altitude in non-coastal region: ${this._value.altitude}m`);
      }

      if (this._value.altitude > 5000 && !this.isMountKenyaRegion()) {
        console.warn(`Extremely high altitude for location: ${this._value.altitude}m`);
      }
    }
  }

  // Factory methods
  static fromDecimalDegrees(
    latitude: number,
    longitude: number,
    source: CoordinateSource = CoordinateSource.GPS_DEVICE,
    accuracy?: number,
    altitude?: number,
  ): GPSCoordinates {
    return new GPSCoordinates({
      latitude,
      longitude,
      accuracy,
      altitude,
      timestamp: new Date(),
      source,
    });
  }

  static fromDegreesMinutesSeconds(
    latDeg: number,
    latMin: number,
    latSec: number,
    latDir: 'N' | 'S',
    lngDeg: number,
    lngMin: number,
    lngSec: number,
    lngDir: 'E' | 'W',
    source: CoordinateSource = CoordinateSource.SURVEY,
  ): GPSCoordinates {
    const latitude = this.dmsToDecimal(latDeg, latMin, latSec, latDir);
    const longitude = this.dmsToDecimal(lngDeg, lngMin, lngSec, lngDir);

    return new GPSCoordinates({
      latitude,
      longitude,
      timestamp: new Date(),
      source,
    });
  }

  static fromKenyanCity(city: keyof typeof GPSCoordinates.KENYAN_CITIES): GPSCoordinates {
    const cityCoords = GPSCoordinates.KENYAN_CITIES[city];
    return new GPSCoordinates({
      latitude: cityCoords.lat,
      longitude: cityCoords.lng,
      timestamp: new Date(),
      source: CoordinateSource.ESTIMATED,
      description: `Approximate coordinates for ${city}`,
    });
  }

  // Conversion methods
  toDegreesMinutesSeconds(): {
    latitude: { degrees: number; minutes: number; seconds: number; direction: 'N' | 'S' };
    longitude: { degrees: number; minutes: number; seconds: number; direction: 'E' | 'W' };
  } {
    return {
      latitude: this.decimalToDMS(this._value.latitude, true),
      longitude: this.decimalToDMS(this._value.longitude, false),
    };
  }

  toUTM(): { zone: number; easting: number; northing: number; hemisphere: 'N' | 'S' } {
    // Simplified UTM conversion for Kenya (mostly Zone 37N)
    // In production, use a proper geodetic library like proj4

    const { latitude, longitude } = this._value;

    // Kenya spans UTM zones 36N, 37N, and 38N, but mostly 37N
    let zone = 37;
    if (longitude < 36) zone = 36;
    if (longitude > 42) zone = 38;

    // Simplified conversion (approximate)
    const earthRadius = 6378137; // WGS84 equatorial radius
    const k0 = 0.9996; // UTM scale factor

    // Convert to radians
    const latRad = (latitude * Math.PI) / 180;
    const lonRad = ((longitude - (zone * 6 - 183)) * Math.PI) / 180;

    // Simplified calculations (proper implementation would be more complex)
    const easting = 500000 + earthRadius * k0 * lonRad;
    const northing =
      latitude >= 0
        ? earthRadius * k0 * Math.log(Math.tan(Math.PI / 4 + latRad / 2))
        : 10000000 + earthRadius * k0 * Math.log(Math.tan(Math.PI / 4 + latRad / 2));

    return {
      zone,
      easting: Math.round(easting),
      northing: Math.round(northing),
      hemisphere: latitude >= 0 ? 'N' : 'S',
    };
  }

  // Business logic methods
  isWithinKenya(): boolean {
    const { latitude, longitude } = this._value;
    const bounds = GPSCoordinates.KENYA_BOUNDS;

    return (
      latitude >= bounds.minLat &&
      latitude <= bounds.maxLat &&
      longitude >= bounds.minLng &&
      longitude <= bounds.maxLng
    );
  }

  isWithinCounty(county: KenyanCounty): boolean {
    // Simplified county boundary check
    // In production, use GIS boundary data
    const countyBounds = this.getCountyBounds(county);

    return (
      this._value.latitude >= countyBounds.minLat &&
      this._value.latitude <= countyBounds.maxLat &&
      this._value.longitude >= countyBounds.minLng &&
      this._value.longitude <= countyBounds.maxLng
    );
  }

  estimateCounty(): KenyanCounty {
    // More sophisticated county estimation based on coordinates
    const { latitude, longitude } = this._value;

    // Nairobi County
    if (latitude > -1.5 && latitude < -1.0 && longitude > 36.6 && longitude < 37.0) {
      return KenyanCounty.NAIROBI;
    }

    // Mombasa County
    if (latitude > -4.2 && latitude < -3.8 && longitude > 39.5 && longitude < 39.8) {
      return KenyanCounty.MOMBASA;
    }

    // Kisumu County
    if (latitude > -0.3 && latitude < 0.1 && longitude > 34.6 && longitude < 35.0) {
      return KenyanCounty.KISUMU;
    }

    // Nakuru County
    if (latitude > -0.6 && latitude < 0.0 && longitude > 35.8 && longitude < 36.3) {
      return KenyanCounty.NAKURU;
    }

    // Kiambu County (around Nairobi)
    if (latitude > -1.3 && latitude < -0.8 && longitude > 36.5 && longitude < 37.2) {
      return KenyanCounty.KIAMBU;
    }

    // Machakos County
    if (latitude > -1.8 && latitude < -1.0 && longitude > 37.0 && longitude < 37.5) {
      return KenyanCounty.MACHAKOS;
    }

    // Uasin Gishu County (Eldoret)
    if (latitude > 0.3 && latitude < 0.8 && longitude > 35.0 && longitude < 35.5) {
      return KenyanCounty.UASIN_GISHU;
    }

    // Meru County
    if (latitude > 0.0 && latitude < 0.5 && longitude > 37.5 && longitude < 38.0) {
      return KenyanCounty.MERU;
    }

    // Default to Nairobi if unknown
    return KenyanCounty.NAIROBI;
  }

  getAccuracyLevel(): CoordinateAccuracy {
    if (!this._value.accuracy) return CoordinateAccuracy.VERY_LOW;

    if (this._value.accuracy < 5) return CoordinateAccuracy.HIGH;
    if (this._value.accuracy < 20) return CoordinateAccuracy.MEDIUM;
    if (this._value.accuracy < 100) return CoordinateAccuracy.LOW;
    return CoordinateAccuracy.VERY_LOW;
  }

  isSurveyGrade(): boolean {
    return (
      this._value.source === CoordinateSource.SURVEY &&
      this._value.accuracy !== undefined &&
      this._value.accuracy < 1
    ); // Sub-meter accuracy
  }

  isSuitableForLandTitle(): boolean {
    // For land title registration, coordinates should be accurate
    return (
      this.getAccuracyLevel() <= CoordinateAccuracy.MEDIUM &&
      this._value.source !== CoordinateSource.ESTIMATED
    );
  }

  calculateDistance(other: GPSCoordinates): number {
    // Haversine formula for great-circle distance
    const R = 6371000; // Earth's radius in meters

    const φ1 = (this._value.latitude * Math.PI) / 180;
    const φ2 = (other._value.latitude * Math.PI) / 180;
    const Δφ = ((other._value.latitude - this._value.latitude) * Math.PI) / 180;
    const Δλ = ((other._value.longitude - this._value.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  calculateBearing(other: GPSCoordinates): number {
    // Calculate bearing from this point to other point
    const φ1 = (this._value.latitude * Math.PI) / 180;
    const φ2 = (other._value.latitude * Math.PI) / 180;
    const λ1 = (this._value.longitude * Math.PI) / 180;
    const λ2 = (other._value.longitude * Math.PI) / 180;

    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);

    const θ = Math.atan2(y, x);
    const bearing = ((θ * 180) / Math.PI + 360) % 360; // in degrees

    return bearing;
  }

  // Formatting methods
  getDecimalDegrees(precision: number = 6): string {
    return `${this._value.latitude.toFixed(precision)}°, ${this._value.longitude.toFixed(precision)}°`;
  }

  getDMS(): string {
    const latDMS = this.decimalToDMS(this._value.latitude, true);
    const lngDMS = this.decimalToDMS(this._value.longitude, false);

    return (
      `${latDMS.degrees}°${latDMS.minutes}'${latDMS.seconds.toFixed(2)}"${latDMS.direction} ` +
      `${lngDMS.degrees}°${lngDMS.minutes}'${lngDMS.seconds.toFixed(2)}"${lngDMS.direction}`
    );
  }

  getGoogleMapsLink(): string {
    return `https://www.google.com/maps?q=${this._value.latitude},${this._value.longitude}`;
  }

  getGoogleMapsEmbedCode(width: string = '100%', height: string = '300px'): string {
    return `<iframe 
      width="${width}" 
      height="${height}" 
      frameborder="0" 
      style="border:0" 
      src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${this._value.latitude},${this._value.longitude}" 
      allowfullscreen>
    </iframe>`;
  }

  getOpenStreetMapLink(): string {
    return `https://www.openstreetmap.org/?mlat=${this._value.latitude}&mlon=${this._value.longitude}#map=15/${this._value.latitude}/${this._value.longitude}`;
  }

  // Helper methods
  private static dmsToDecimal(
    degrees: number,
    minutes: number,
    seconds: number,
    direction: 'N' | 'S' | 'E' | 'W',
  ): number {
    let decimal = degrees + minutes / 60 + seconds / 3600;

    if (direction === 'S' || direction === 'W') {
      decimal = -decimal;
    }

    return decimal;
  }

  private decimalToDMS(
    decimal: number,
    isLatitude: boolean,
  ): { degrees: number; minutes: number; seconds: number; direction: string } {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = (minutesNotTruncated - minutes) * 60;

    let direction = '';
    if (isLatitude) {
      direction = decimal >= 0 ? 'N' : 'S';
    } else {
      direction = decimal >= 0 ? 'E' : 'W';
    }

    return { degrees, minutes, seconds, direction };
  }

  private getCountyBounds(county: KenyanCounty): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    // Simplified county bounds (approximate)
    const bounds: Record<
      KenyanCounty,
      { minLat: number; maxLat: number; minLng: number; maxLng: number }
    > = {
      [KenyanCounty.NAIROBI]: { minLat: -1.5, maxLat: -1.0, minLng: 36.6, maxLng: 37.0 },
      [KenyanCounty.MOMBASA]: { minLat: -4.2, maxLat: -3.8, minLng: 39.5, maxLng: 39.8 },
      [KenyanCounty.KISUMU]: { minLat: -0.3, maxLat: 0.1, minLng: 34.6, maxLng: 35.0 },
      [KenyanCounty.NAKURU]: { minLat: -0.6, maxLat: 0.0, minLng: 35.8, maxLng: 36.3 },
      [KenyanCounty.KIAMBU]: { minLat: -1.3, maxLat: -0.8, minLng: 36.5, maxLng: 37.2 },
      [KenyanCounty.MACHAKOS]: { minLat: -1.8, maxLat: -1.0, minLng: 37.0, maxLng: 37.5 },
      [KenyanCounty.UASIN_GISHU]: { minLat: 0.3, maxLat: 0.8, minLng: 35.0, maxLng: 35.5 },
      [KenyanCounty.MERU]: { minLat: 0.0, maxLat: 0.5, minLng: 37.5, maxLng: 38.0 },
      // Add more counties as needed...
    };

    return (
      bounds[county] || {
        minLat: GPSCoordinates.KENYA_BOUNDS.minLat,
        maxLat: GPSCoordinates.KENYA_BOUNDS.maxLat,
        minLng: GPSCoordinates.KENYA_BOUNDS.minLng,
        maxLng: GPSCoordinates.KENYA_BOUNDS.maxLng,
      }
    );
  }

  private isInIndianOcean(): boolean {
    // Check if coordinates are in Indian Ocean (east of Kenya)
    return this._value.longitude > 41.5 && this._value.latitude < 0;
  }

  private isInLakeVictoria(): boolean {
    // Check if coordinates are in Lake Victoria
    return (
      this._value.latitude > -1.0 &&
      this._value.latitude < 1.0 &&
      this._value.longitude > 33.0 &&
      this._value.longitude < 35.0
    );
  }

  private isCoastalRegion(): boolean {
    return this._value.latitude < -2.0 && this._value.longitude > 39.0;
  }

  private isMountKenyaRegion(): boolean {
    return (
      this._value.latitude > -0.5 &&
      this._value.latitude < 0.5 &&
      this._value.longitude > 36.5 &&
      this._value.longitude < 38.0
    );
  }

  // Getters
  get latitude(): number {
    return this._value.latitude;
  }

  get longitude(): number {
    return this._value.longitude;
  }

  get accuracy(): number | undefined {
    return this._value.accuracy;
  }

  get altitude(): number | undefined {
    return this._value.altitude;
  }

  get timestamp(): Date | undefined {
    return this._value.timestamp;
  }

  get source(): CoordinateSource {
    return this._value.source;
  }

  get description(): string | undefined {
    return this._value.description;
  }

  get parcelReference(): string | undefined {
    return this._value.parcelReference;
  }

  get surveyDiagramNumber(): string | undefined {
    return this._value.surveyDiagramNumber;
  }

  // For API responses
  toJSON() {
    return {
      latitude: this._value.latitude,
      longitude: this._value.longitude,
      decimalDegrees: this.getDecimalDegrees(),
      dms: this.getDMS(),
      utm: this.toUTM(),
      accuracy: this._value.accuracy,
      accuracyLevel: this.getAccuracyLevel(),
      altitude: this._value.altitude,
      timestamp: this._value.timestamp,
      source: this._value.source,
      description: this._value.description,
      estimatedCounty: this.estimateCounty(),
      isWithinKenya: this.isWithinKenya(),
      isSurveyGrade: this.isSurveyGrade(),
      isSuitableForLandTitle: this.isSuitableForLandTitle(),
      googleMapsLink: this.getGoogleMapsLink(),
      openStreetMapLink: this.getOpenStreetMapLink(),
      parcelReference: this._value.parcelReference,
      surveyDiagramNumber: this._value.surveyDiagramNumber,
    };
  }
}

// Utility class for GPS coordinate operations in Kenyan context
export class KenyanGPSOperations {
  static calculateArea(coordinates: GPSCoordinates[]): number {
    // Calculate area of polygon defined by coordinates (in square meters)
    if (coordinates.length < 3) return 0;

    let area = 0;
    const n = coordinates.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const xi = coordinates[i].longitude * (Math.PI / 180);
      const yi = coordinates[i].latitude * (Math.PI / 180);
      const xj = coordinates[j].longitude * (Math.PI / 180);
      const yj = coordinates[j].latitude * (Math.PI / 180);

      area += xi * yj - xj * yi;
    }

    area = Math.abs(area / 2);

    // Convert from square radians to square meters (approximate)
    const earthRadius = 6371000; // meters
    return area * earthRadius * earthRadius;
  }

  static convertAreaToAcres(areaSquareMeters: number): number {
    return areaSquareMeters / 4046.86;
  }

  static convertAreaToHectares(areaSquareMeters: number): number {
    return areaSquareMeters / 10000;
  }

  static isPolygonClockwise(coordinates: GPSCoordinates[]): boolean {
    // Determine if polygon vertices are ordered clockwise
    if (coordinates.length < 3) return false;

    let sum = 0;
    const n = coordinates.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      sum +=
        (coordinates[j].longitude - coordinates[i].longitude) *
        (coordinates[j].latitude + coordinates[i].latitude);
    }

    return sum > 0;
  }

  static findCentroid(coordinates: GPSCoordinates[]): GPSCoordinates {
    // Find centroid of polygon
    if (coordinates.length === 0) {
      throw new Error('Cannot find centroid of empty coordinate array');
    }

    if (coordinates.length === 1) {
      return coordinates[0];
    }

    let centroidLat = 0;
    let centroidLng = 0;
    const n = coordinates.length;

    for (const coord of coordinates) {
      centroidLat += coord.latitude;
      centroidLng += coord.longitude;
    }

    centroidLat /= n;
    centroidLng /= n;

    return GPSCoordinates.fromDecimalDegrees(
      centroidLat,
      centroidLng,
      CoordinateSource.ESTIMATED,
      undefined,
      undefined,
    );
  }

  static calculatePerimeter(coordinates: GPSCoordinates[]): number {
    // Calculate perimeter of polygon in meters
    if (coordinates.length < 2) return 0;

    let perimeter = 0;
    const n = coordinates.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      perimeter += coordinates[i].calculateDistance(coordinates[j]);
    }

    return perimeter;
  }
}
