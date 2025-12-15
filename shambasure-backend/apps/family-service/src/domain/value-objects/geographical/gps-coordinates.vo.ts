// domain/value-objects/geographical/gps-coordinates.vo.ts
import { ValueObject } from '../../base/value-object';

export interface GPSCoordinatesProps {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  source: 'GPS_DEVICE' | 'GOOGLE_MAPS' | 'MANUAL_ENTRY' | 'SURVEY' | 'UNKNOWN';
  timestamp: Date;
  isApproximate: boolean;
  notes?: string;
}

export class GPSCoordinates extends ValueObject<GPSCoordinatesProps> {
  private constructor(props: GPSCoordinatesProps) {
    super(props);
    this.validate();
  }

  static create(
    latitude: number,
    longitude: number,
    source: 'GPS_DEVICE' | 'GOOGLE_MAPS' | 'MANUAL_ENTRY' | 'SURVEY' | 'UNKNOWN' = 'UNKNOWN',
  ): GPSCoordinates {
    return new GPSCoordinates({
      latitude,
      longitude,
      source,
      timestamp: new Date(),
      isApproximate: false,
    });
  }

  static createFromProps(props: GPSCoordinatesProps): GPSCoordinates {
    return new GPSCoordinates(props);
  }

  static fromString(
    coordinates: string,
    source?: 'GPS_DEVICE' | 'GOOGLE_MAPS' | 'MANUAL_ENTRY' | 'SURVEY' | 'UNKNOWN',
  ): GPSCoordinates {
    const [lat, lon] = coordinates.split(',').map((coord) => parseFloat(coord.trim()));
    return new GPSCoordinates({
      latitude: lat,
      longitude: lon,
      source: source || 'MANUAL_ENTRY',
      timestamp: new Date(),
      isApproximate: false,
    });
  }

  validate(): void {
    // Latitude validation (-90 to 90)
    if (this._value.latitude < -90 || this._value.latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }

    // Longitude validation (-180 to 180)
    if (this._value.longitude < -180 || this._value.longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }

    // Kenyan coordinates validation (approximately)
    const isInKenya =
      this._value.latitude >= -4.0 &&
      this._value.latitude <= 5.0 &&
      this._value.longitude >= 34.0 &&
      this._value.longitude <= 42.0;

    if (!isInKenya) {
      console.warn('Coordinates are outside Kenya boundaries');
    }

    // Altitude validation (optional)
    if (this._value.altitude !== undefined) {
      if (this._value.altitude < -100 || this._value.altitude > 6000) {
        throw new Error('Altitude must be between -100 and 6000 meters');
      }
    }

    // Accuracy validation (optional)
    if (this._value.accuracy !== undefined) {
      if (this._value.accuracy < 0) {
        throw new Error('Accuracy cannot be negative');
      }
      if (this._value.accuracy > 10000) {
        throw new Error('Accuracy is unrealistically large');
      }
    }

    // Timestamp validation
    if (this._value.timestamp > new Date()) {
      throw new Error('Timestamp cannot be in the future');
    }
  }

  updateAltitude(altitude?: number): GPSCoordinates {
    return new GPSCoordinates({
      ...this._value,
      altitude,
    });
  }

  updateAccuracy(accuracy?: number): GPSCoordinates {
    return new GPSCoordinates({
      ...this._value,
      accuracy,
    });
  }

  updateSource(
    source: 'GPS_DEVICE' | 'GOOGLE_MAPS' | 'MANUAL_ENTRY' | 'SURVEY' | 'UNKNOWN',
  ): GPSCoordinates {
    return new GPSCoordinates({
      ...this._value,
      source,
    });
  }

  markAsApproximate(isApproximate: boolean = true): GPSCoordinates {
    return new GPSCoordinates({
      ...this._value,
      isApproximate,
    });
  }

  updateNotes(notes?: string): GPSCoordinates {
    return new GPSCoordinates({
      ...this._value,
      notes,
    });
  }

  updateTimestamp(timestamp: Date): GPSCoordinates {
    return new GPSCoordinates({
      ...this._value,
      timestamp,
    });
  }

  get latitude(): number {
    return this._value.latitude;
  }

  get longitude(): number {
    return this._value.longitude;
  }

  get altitude(): number | undefined {
    return this._value.altitude;
  }

  get accuracy(): number | undefined {
    return this._value.accuracy;
  }

  get source(): string {
    return this._value.source;
  }

  get timestamp(): Date {
    return this._value.timestamp;
  }

  get isApproximate(): boolean {
    return this._value.isApproximate;
  }

  get notes(): string | undefined {
    return this._value.notes;
  }

  // Get coordinates as string
  get asString(): string {
    return `${this._value.latitude},${this._value.longitude}`;
  }

  // Get coordinates in DMS format (Degrees, Minutes, Seconds)
  get asDMS(): { latitude: string; longitude: string } {
    const latDMS = this.decimalToDMS(this._value.latitude, true);
    const lonDMS = this.decimalToDMS(this._value.longitude, false);
    return { latitude: latDMS, longitude: lonDMS };
  }

  private decimalToDMS(decimal: number, isLatitude: boolean): string {
    const absDecimal = Math.abs(decimal);
    const degrees = Math.floor(absDecimal);
    const minutesDecimal = (absDecimal - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = Math.round((minutesDecimal - minutes) * 600) / 10;

    const direction = isLatitude ? (decimal >= 0 ? 'N' : 'S') : decimal >= 0 ? 'E' : 'W';

    return `${degrees}°${minutes}'${seconds}"${direction}`;
  }

  // Check if coordinates are in Kenya
  get isInKenya(): boolean {
    return (
      this._value.latitude >= -4.0 &&
      this._value.latitude <= 5.0 &&
      this._value.longitude >= 34.0 &&
      this._value.longitude <= 42.0
    );
  }

  // Get approximate county based on coordinates
  get estimatedCounty(): string | null {
    if (!this.isInKenya) return null;

    // Simple county estimation based on coordinates
    const lat = this._value.latitude;
    const lon = this._value.longitude;

    if (lat >= -1.0 && lat <= 1.0 && lon >= 34.5 && lon <= 35.5) return 'KISUMU';
    if (lat >= -1.5 && lat <= -0.5 && lon >= 35.0 && lon <= 36.0) return 'NAKURU';
    if (lat >= -1.0 && lat <= 0.0 && lon >= 36.5 && lon <= 37.5) return 'NAIROBI';
    if (lat >= 0.0 && lat <= 1.0 && lon >= 37.0 && lon <= 38.0) return 'KIAMBU';
    if (lat >= -4.0 && lat <= -2.0 && lon >= 39.0 && lon <= 40.0) return 'MOMBASA';

    return 'UNKNOWN';
  }

  // Calculate distance to other coordinates (in kilometers)
  distanceTo(other: GPSCoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(other.latitude - this._value.latitude);
    const dLon = this.degreesToRadians(other.longitude - this._value.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(this._value.latitude)) *
        Math.cos(this.degreesToRadians(other.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Calculate bearing to other coordinates
  bearingTo(other: GPSCoordinates): number {
    const lat1 = this.degreesToRadians(this._value.latitude);
    const lat2 = this.degreesToRadians(other.latitude);
    const dLon = this.degreesToRadians(other.longitude - this._value.longitude);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const bearing = Math.atan2(y, x);
    return (this.radiansToDegrees(bearing) + 360) % 360;
  }

  private radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  // Check if coordinates are near water (approximate)
  get isNearWater(): boolean {
    // Approximate check for major water bodies in Kenya
    const distanceToLakeVictoria = this.distanceTo(GPSCoordinates.create(-0.75, 33.98));
    const distanceToIndianOcean = this.distanceTo(GPSCoordinates.create(-4.05, 39.67));

    return distanceToLakeVictoria < 100 || distanceToIndianOcean < 50;
  }

  // Check if coordinates are in urban area (approximate)
  get isUrbanArea(): boolean {
    if (!this.isInKenya) return false;

    // Major urban centers in Kenya
    const urbanCenters = [
      GPSCoordinates.create(-1.2921, 36.8219), // Nairobi
      GPSCoordinates.create(-0.1022, 34.7617), // Kisumu
      GPSCoordinates.create(-4.0435, 39.6682), // Mombasa
      GPSCoordinates.create(-0.3031, 36.08), // Nakuru
      GPSCoordinates.create(-1.0161, 37.0725), // Thika
      GPSCoordinates.create(-0.4167, 36.95), // Eldoret
    ];

    return urbanCenters.some((center) => this.distanceTo(center) < 50);
  }

  // Get accuracy rating
  get accuracyRating(): 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' {
    if (this._value.accuracy === undefined) return 'UNKNOWN';
    if (this._value.accuracy < 10) return 'HIGH';
    if (this._value.accuracy < 100) return 'MEDIUM';
    return 'LOW';
  }

  // Get source reliability rating
  get sourceReliability(): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (this._value.source === 'SURVEY' || this._value.source === 'GPS_DEVICE') return 'HIGH';
    if (this._value.source === 'GOOGLE_MAPS') return 'MEDIUM';
    if (this._value.source === 'MANUAL_ENTRY') return 'LOW';
    return 'LOW';
  }

  toJSON() {
    return {
      latitude: this._value.latitude,
      longitude: this._value.longitude,
      altitude: this._value.altitude,
      accuracy: this._value.accuracy,
      source: this._value.source,
      timestamp: this._value.timestamp.toISOString(),
      isApproximate: this._value.isApproximate,
      notes: this._value.notes,
      asString: this.asString,
      asDMS: this.asDMS,
      isInKenya: this.isInKenya,
      estimatedCounty: this.estimatedCounty,
      isNearWater: this.isNearWater,
      isUrbanArea: this.isUrbanArea,
      accuracyRating: this.accuracyRating,
      sourceReliability: this.sourceReliability,
    };
  }
}
