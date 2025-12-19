// src/shared/domain/value-objects/gps-coordinates.vo.ts
import { ValueObject } from '../base/value-object';
import {
  CoordinatesOutOfBoundsException,
  InvalidCoordinatesException,
  InvalidLatitudeException,
  InvalidLongitudeException,
} from '../exceptions/coordinates.exception';
import { KenyanCounty } from './kenyan-location.vo';

export interface GPSCoordinatesProps {
  latitude: number; // Decimal degrees, -90 to 90
  longitude: number; // Decimal degrees, -180 to 180
  accuracy?: number; // Meters
  altitude?: number; // Meters above sea level
  timestamp?: Date;
  source?: 'GPS' | 'MANUAL' | 'ESTIMATED';
}

export class GPSCoordinates extends ValueObject<GPSCoordinatesProps> {
  private static readonly KENYA_BOUNDS = {
    minLat: -4.9,
    maxLat: 4.9,
    minLng: 33.9,
    maxLng: 41.9,
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
      });
    }

    // Check for NaN
    if (isNaN(this._value.latitude)) {
      throw new InvalidCoordinatesException('Latitude cannot be NaN', 'latitude', {
        latitude: this._value.latitude,
      });
    }
  }

  private validateLongitude(): void {
    if (this._value.longitude < -180 || this._value.longitude > 180) {
      throw new InvalidLongitudeException(this._value.longitude, -180, 180, {
        longitude: this._value.longitude,
      });
    }

    // Check for NaN
    if (isNaN(this._value.longitude)) {
      throw new InvalidCoordinatesException('Longitude cannot be NaN', 'longitude', {
        longitude: this._value.longitude,
      });
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
        { latitude, country: 'Kenya' },
      );
    }

    if (longitude < bounds.minLng || longitude > bounds.maxLng) {
      throw new CoordinatesOutOfBoundsException(
        'longitude',
        longitude,
        bounds.minLng,
        bounds.maxLng,
        { longitude, country: 'Kenya' },
      );
    }
  }

  private validateAccuracy(): void {
    if (this._value.accuracy !== undefined) {
      if (this._value.accuracy < 0) {
        throw new InvalidCoordinatesException(
          `Accuracy cannot be negative: ${this._value.accuracy}m`,
          'accuracy',
          { accuracy: this._value.accuracy },
        );
      }

      if (this._value.accuracy > 100000) {
        // 100km
        throw new InvalidCoordinatesException(
          `Accuracy too low: ${this._value.accuracy}m`,
          'accuracy',
          { accuracy: this._value.accuracy },
        );
      }
    }
  }

  private validateAltitude(): void {
    if (this._value.altitude !== undefined) {
      if (this._value.altitude < -1000 || this._value.altitude > 10000) {
        throw new InvalidCoordinatesException(
          `Invalid altitude: ${this._value.altitude}m`,
          'altitude',
          { altitude: this._value.altitude },
        );
      }
    }
  }

  // Factory methods
  static fromDecimalDegrees(
    latitude: number,
    longitude: number,
    accuracy?: number,
    altitude?: number,
  ): GPSCoordinates {
    return new GPSCoordinates({
      latitude,
      longitude,
      accuracy,
      altitude,
      timestamp: new Date(),
      source: 'GPS',
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
  ): GPSCoordinates {
    const latitude = this.dmsToDecimal(latDeg, latMin, latSec, latDir);
    const longitude = this.dmsToDecimal(lngDeg, lngMin, lngSec, lngDir);

    return new GPSCoordinates({
      latitude,
      longitude,
      timestamp: new Date(),
      source: 'MANUAL',
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

  toUTM(): { zone: number; easting: number; northing: number } {
    // Simplified UTM conversion for Kenya (Zone 37)
    // In production, use a proper geodetic library
    const zone = 37;
    const easting = (this._value.longitude + 180) * 100000;
    const northing = (this._value.latitude + 90) * 100000;

    return { zone, easting, northing };
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

  isNear(other: GPSCoordinates, maxDistanceMeters: number = 100): boolean {
    const distance = this.calculateDistance(other);
    return distance <= maxDistanceMeters;
  }

  calculateDistance(other: GPSCoordinates): number {
    // Haversine formula for distance calculation
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

  estimateCounty(): KenyanCounty {
    // Simplified county estimation based on coordinates
    // In production, use a proper geocoding service
    const { latitude, longitude } = this._value;

    // Nairobi area
    if (latitude > -1.4 && latitude < -1.2 && longitude > 36.7 && longitude < 36.9) {
      return KenyanCounty.NAIROBI;
    }

    // Mombasa area
    if (latitude > -4.1 && latitude < -3.9 && longitude > 39.5 && longitude < 39.7) {
      return KenyanCounty.MOMBASA;
    }

    // Kisumu area
    if (latitude > -0.2 && latitude < 0.1 && longitude > 34.7 && longitude < 34.9) {
      return KenyanCounty.KISUMU;
    }

    // Nakuru area
    if (latitude > -0.4 && latitude < -0.2 && longitude > 36.0 && longitude < 36.2) {
      return KenyanCounty.NAKURU;
    }

    // Default to Nairobi if unknown
    return KenyanCounty.NAIROBI;
  }

  // Formatting methods
  getDecimalDegrees(): string {
    return `${this._value.latitude.toFixed(6)}°, ${this._value.longitude.toFixed(6)}°`;
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

  get source(): 'GPS' | 'MANUAL' | 'ESTIMATED' | undefined {
    return this._value.source;
  }
}
