// src/shared/domain/exceptions/location.exception.ts
import { InvalidValueObjectException } from './base-domain.exception';

export class InvalidLocationException extends InvalidValueObjectException {
  constructor(message: string, field?: string, context?: Record<string, any>) {
    super(message, 'DOMAIN_LOCATION_001', field, context);
  }
}

export class InvalidCountyException extends InvalidLocationException {
  constructor(county: string, context?: Record<string, any>) {
    super(`Invalid Kenyan county: ${county}`, 'county', { ...context, county });
  }
}

export class InvalidSubCountyException extends InvalidLocationException {
  constructor(subCounty: string, county: string, context?: Record<string, any>) {
    super(`Invalid sub-county '${subCounty}' for county ${county}`, 'subCounty', {
      ...context,
      subCounty,
      county,
    });
  }
}

export class LocationOutOfBoundsException extends InvalidLocationException {
  constructor(
    coordinateType: 'latitude' | 'longitude',
    value: number,
    min: number,
    max: number,
    context?: Record<string, any>,
  ) {
    super(
      `${coordinateType.charAt(0).toUpperCase() + coordinateType.slice(1)} ${value}° is outside Kenya's bounds (${min}° to ${max}°)`,
      coordinateType,
      { ...context, value, min, max },
    );
  }
}

export class InvalidLatitudeException extends LocationOutOfBoundsException {
  constructor(latitude: number, context?: Record<string, any>) {
    super('latitude', latitude, -4.9, 4.9, { ...context, latitude });
  }
}

export class InvalidLongitudeException extends LocationOutOfBoundsException {
  constructor(longitude: number, context?: Record<string, any>) {
    super('longitude', longitude, 33.9, 41.9, { ...context, longitude });
  }
}

export class InvalidCoordinatesException extends InvalidLocationException {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'coordinates', context);
  }
}

export class MissingGPSDataException extends InvalidLocationException {
  constructor(context?: Record<string, any>) {
    super('GPS coordinates are required for this operation', 'gpsCoordinates', context);
  }
}
