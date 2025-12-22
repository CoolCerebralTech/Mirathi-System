import { InvalidValueObjectException } from './base-domain.exception';

export class InvalidCoordinatesException extends InvalidValueObjectException {
  constructor(message: string, field: string = 'coordinates', context?: Record<string, any>) {
    super(message, field, { ...context, code: 'DOMAIN_COORDINATES_001' });
  }
}

export class InvalidLatitudeException extends InvalidCoordinatesException {
  constructor(latitude: number, min: number, max: number, context?: Record<string, any>) {
    super(
      `Latitude ${latitude}° is out of range. Must be between ${min}° and ${max}°`,
      'latitude',
      { ...context, latitude, min, max },
    );
  }
}

export class InvalidLongitudeException extends InvalidCoordinatesException {
  constructor(longitude: number, min: number, max: number, context?: Record<string, any>) {
    super(
      `Longitude ${longitude}° is out of range. Must be between ${min}° and ${max}°`,
      'longitude',
      { ...context, longitude, min, max },
    );
  }
}

export class CoordinatesOutOfBoundsException extends InvalidCoordinatesException {
  constructor(
    coordinateType: 'latitude' | 'longitude',
    value: number,
    min: number,
    max: number,
    context?: Record<string, any>,
  ) {
    super(
      `${coordinateType.charAt(0).toUpperCase() + coordinateType.slice(1)} ${value}° is outside the specified bounds (${min}° to ${max}°)`,
      coordinateType,
      { ...context, value, min, max },
    );
  }
}

export class InvalidAccuracyException extends InvalidCoordinatesException {
  constructor(accuracy: number, context?: Record<string, any>) {
    super(`Invalid accuracy value: ${accuracy}m`, 'accuracy', { ...context, accuracy });
  }
}

export class InvalidAltitudeException extends InvalidCoordinatesException {
  constructor(altitude: number, context?: Record<string, any>) {
    super(`Invalid altitude: ${altitude}m`, 'altitude', { ...context, altitude });
  }
}

export class CoordinatesTooLowAccuracyException extends InvalidCoordinatesException {
  constructor(accuracy: number, maxAccuracy: number, context?: Record<string, any>) {
    super(
      `Coordinates accuracy ${accuracy}m is too low. Maximum allowed is ${maxAccuracy}m`,
      'accuracy',
      { ...context, accuracy, maxAccuracy },
    );
  }
}
