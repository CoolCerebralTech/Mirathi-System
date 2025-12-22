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
  latitude: number; // Decimal degrees
  longitude: number; // Decimal degrees
  accuracy?: number; // Meters
  altitude?: number; // Meters above sea level
  timestamp?: Date;
  source: CoordinateSource;
  description?: string;
}

export class GPSCoordinates extends ValueObject<GPSCoordinatesProps> {
  // Kenya's geographical bounds
  private static readonly KENYA_BOUNDS = {
    minLat: -4.9,
    maxLat: 5.0,
    minLng: 33.9,
    maxLng: 42.0,
  };

  private static readonly KENYAN_CITIES: Readonly<Record<string, { lat: number; lng: number }>> = {
    NAIROBI: { lat: -1.286389, lng: 36.817223 },
    MOMBASA: { lat: -4.0435, lng: 39.6682 },
    KISUMU: { lat: -0.1022, lng: 34.7617 },
    NAKURU: { lat: -0.3031, lng: 36.08 },
    ELDORET: { lat: 0.5143, lng: 35.2698 },
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
    if (this.props.latitude < -90 || this.props.latitude > 90) {
      throw new InvalidLatitudeException(this.props.latitude, -90, 90, {
        source: this.props.source,
      });
    }

    if (isNaN(this.props.latitude)) {
      throw new InvalidCoordinatesException('Latitude cannot be NaN', 'latitude');
    }
  }

  private validateLongitude(): void {
    if (this.props.longitude < -180 || this.props.longitude > 180) {
      throw new InvalidLongitudeException(this.props.longitude, -180, 180, {
        source: this.props.source,
      });
    }

    if (isNaN(this.props.longitude)) {
      throw new InvalidCoordinatesException('Longitude cannot be NaN', 'longitude');
    }
  }

  private validateKenyanBounds(): void {
    const { latitude, longitude } = this.props;
    const bounds = GPSCoordinates.KENYA_BOUNDS;

    if (latitude < bounds.minLat || latitude > bounds.maxLat) {
      throw new CoordinatesOutOfBoundsException(
        'latitude',
        latitude,
        bounds.minLat,
        bounds.maxLat,
        { country: 'Kenya', source: this.props.source },
      );
    }

    if (longitude < bounds.minLng || longitude > bounds.maxLng) {
      throw new CoordinatesOutOfBoundsException(
        'longitude',
        longitude,
        bounds.minLng,
        bounds.maxLng,
        { country: 'Kenya', source: this.props.source },
      );
    }
  }

  private validateAccuracy(): void {
    if (this.props.accuracy !== undefined) {
      if (this.props.accuracy < 0) {
        throw new InvalidCoordinatesException(
          `Accuracy cannot be negative: ${this.props.accuracy}m`,
          'accuracy',
        );
      }
    }
  }

  private validateAltitude(): void {
    if (this.props.altitude !== undefined) {
      // Kenya's altitude ranges: Sea Level (0m) to Mt Kenya (~5200m)
      // We allow a buffer for GPS errors or underground/flight
      if (this.props.altitude < -1000 || this.props.altitude > 9000) {
        throw new InvalidAltitudeException(this.props.altitude, {
          reason: 'Altitude out of realistic range for Kenya region',
          source: this.props.source,
        });
      }
    }
  }

  // --- Factory Methods ---

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

  // --- Business Logic ---

  isWithinCounty(county: KenyanCounty): boolean {
    // Note: This relies on simple bounding boxes.
    // For "No MVP", precise checking should happen in a GIS Service,
    // but this method provides a quick "fail-fast" check.
    const bounds = this.getCountyBounds(county);
    return (
      this.props.latitude >= bounds.minLat &&
      this.props.latitude <= bounds.maxLat &&
      this.props.longitude >= bounds.minLng &&
      this.props.longitude <= bounds.maxLng
    );
  }

  getAccuracyLevel(): CoordinateAccuracy {
    if (!this.props.accuracy) return CoordinateAccuracy.VERY_LOW;
    if (this.props.accuracy < 5) return CoordinateAccuracy.HIGH;
    if (this.props.accuracy < 20) return CoordinateAccuracy.MEDIUM;
    if (this.props.accuracy < 100) return CoordinateAccuracy.LOW;
    return CoordinateAccuracy.VERY_LOW;
  }

  isSurveyGrade(): boolean {
    return (
      this.props.source === CoordinateSource.SURVEY &&
      this.props.accuracy !== undefined &&
      this.props.accuracy < 1
    );
  }

  calculateDistance(other: GPSCoordinates): number {
    // Haversine formula
    const R = 6371000; // Earth's radius in meters
    const φ1 = (this.props.latitude * Math.PI) / 180;
    const φ2 = (other.latitude * Math.PI) / 180;
    const Δφ = ((other.latitude - this.props.latitude) * Math.PI) / 180;
    const Δλ = ((other.longitude - this.props.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  getGoogleMapsLink(): string {
    return `https://www.google.com/maps?q=${this.props.latitude},${this.props.longitude}`;
  }

  // Helper: Simplified county bounds
  private getCountyBounds(county: KenyanCounty): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    const defaultBounds = {
      minLat: GPSCoordinates.KENYA_BOUNDS.minLat,
      maxLat: GPSCoordinates.KENYA_BOUNDS.maxLat,
      minLng: GPSCoordinates.KENYA_BOUNDS.minLng,
      maxLng: GPSCoordinates.KENYA_BOUNDS.maxLng,
    };

    // We only implement a few key ones for fail-fast logic
    const bounds: Partial<Record<KenyanCounty, typeof defaultBounds>> = {
      [KenyanCounty.NAIROBI]: { minLat: -1.5, maxLat: -1.0, minLng: 36.6, maxLng: 37.0 },
      [KenyanCounty.MOMBASA]: { minLat: -4.2, maxLat: -3.8, minLng: 39.5, maxLng: 39.8 },
      [KenyanCounty.KISUMU]: { minLat: -0.3, maxLat: 0.1, minLng: 34.6, maxLng: 35.0 },
    };

    return bounds[county] || defaultBounds;
  }

  // --- Getters ---
  get latitude(): number {
    return this.props.latitude;
  }
  get longitude(): number {
    return this.props.longitude;
  }

  public toJSON(): Record<string, any> {
    return {
      latitude: this.props.latitude,
      longitude: this.props.longitude,
      accuracy: this.props.accuracy,
      accuracyLevel: this.getAccuracyLevel(),
      source: this.props.source,
      googleMapsLink: this.getGoogleMapsLink(),
    };
  }
}
