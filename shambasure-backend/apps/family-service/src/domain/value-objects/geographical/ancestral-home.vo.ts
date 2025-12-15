// domain/value-objects/geographical/ancestral-home.vo.ts
import { ValueObject } from '../../base/value-object';
import { KenyanCounty, KenyanCountyValidator } from './kenyan-county.vo';

export interface AncestralHomeProps {
  county: KenyanCounty;
  subCounty?: string;
  village: string;
  clanLand: boolean;
  landOwnershipType: 'FAMILY' | 'CLAN' | 'COMMUNAL' | 'PRIVATE';
  approximateSizeAcres?: number;
  generationsKnown: number;
  hasFamilyBurialSite: boolean;
  burialSiteLocation?: string;
  familyShrine?: string;
  traditionalMeetingPlace?: string;
  currentOccupants?: string[];
  isStillOccupied: boolean;
  distanceFromCurrentHomeKm?: number;
  culturalSignificance?: string;
  accessRoadType?: 'PAVED' | 'GRAVEL' | 'EARTH' | 'FOOTPATH';
  waterSource?: 'RIVER' | 'WELL' | 'BOREHOLE' | 'TAP' | 'RAINWATER';
  coordinates?: string;
}

export class AncestralHome extends ValueObject<AncestralHomeProps> {
  private constructor(props: AncestralHomeProps) {
    super(props);
    this.validate();
  }

  static create(county: KenyanCounty, village: string, clanLand: boolean = true): AncestralHome {
    return new AncestralHome({
      county,
      village,
      clanLand,
      landOwnershipType: clanLand ? 'CLAN' : 'PRIVATE',
      generationsKnown: 1,
      hasFamilyBurialSite: false,
      isStillOccupied: false,
    });
  }

  static createFromProps(props: AncestralHomeProps): AncestralHome {
    return new AncestralHome(props);
  }

  validate(): void {
    // County validation
    if (!this._value.county) {
      throw new Error('County is required for ancestral home');
    }

    if (!KenyanCountyValidator.isValid(this._value.county)) {
      throw new Error('Invalid Kenyan county for ancestral home');
    }

    // Village validation
    if (!this._value.village || this._value.village.trim().length < 2) {
      throw new Error('Village name must be at least 2 characters');
    }

    // Generations known validation
    if (this._value.generationsKnown < 1) {
      throw new Error('Generations known must be at least 1');
    }

    if (this._value.generationsKnown > 20) {
      throw new Error('Generations known cannot exceed 20');
    }

    // Land size validation
    if (this._value.approximateSizeAcres !== undefined) {
      if (this._value.approximateSizeAcres < 0) {
        throw new Error('Land size cannot be negative');
      }
      if (this._value.approximateSizeAcres > 10000) {
        throw new Error('Land size is unrealistically large');
      }
    }

    // Distance validation
    if (this._value.distanceFromCurrentHomeKm !== undefined) {
      if (this._value.distanceFromCurrentHomeKm < 0) {
        throw new Error('Distance cannot be negative');
      }
      if (this._value.distanceFromCurrentHomeKm > 1000) {
        throw new Error('Distance is unrealistically large');
      }
    }

    // Burial site validation
    if (this._value.hasFamilyBurialSite && !this._value.burialSiteLocation) {
      console.warn('Family burial site exists but location not specified');
    }

    // Coordinates validation
    if (this._value.coordinates && !this.isValidCoordinates(this._value.coordinates)) {
      throw new Error('Invalid coordinates format');
    }
  }

  private isValidCoordinates(coordinates: string): boolean {
    const gpsRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
    return gpsRegex.test(coordinates);
  }

  updateLocation(subCounty?: string, village?: string): AncestralHome {
    return new AncestralHome({
      ...this._value,
      subCounty: subCounty || this._value.subCounty,
      village: village || this._value.village,
    });
  }

  updateLandDetails(
    clanLand: boolean,
    landOwnershipType: 'FAMILY' | 'CLAN' | 'COMMUNAL' | 'PRIVATE',
    approximateSizeAcres?: number,
  ): AncestralHome {
    return new AncestralHome({
      ...this._value,
      clanLand,
      landOwnershipType,
      approximateSizeAcres,
    });
  }

  updateGenerationsKnown(generations: number): AncestralHome {
    if (generations < 1) {
      throw new Error('Generations known must be at least 1');
    }
    return new AncestralHome({
      ...this._value,
      generationsKnown: generations,
    });
  }

  updateBurialSite(hasBurialSite: boolean, location?: string): AncestralHome {
    return new AncestralHome({
      ...this._value,
      hasFamilyBurialSite: hasBurialSite,
      burialSiteLocation: location || this._value.burialSiteLocation,
    });
  }

  updateCulturalFeatures(
    familyShrine?: string,
    traditionalMeetingPlace?: string,
    culturalSignificance?: string,
  ): AncestralHome {
    return new AncestralHome({
      ...this._value,
      familyShrine,
      traditionalMeetingPlace,
      culturalSignificance,
    });
  }

  updateOccupancy(isOccupied: boolean, currentOccupants?: string[]): AncestralHome {
    return new AncestralHome({
      ...this._value,
      isStillOccupied: isOccupied,
      currentOccupants: currentOccupants || this._value.currentOccupants,
    });
  }

  updateInfrastructure(
    accessRoadType?: 'PAVED' | 'GRAVEL' | 'EARTH' | 'FOOTPATH',
    waterSource?: 'RIVER' | 'WELL' | 'BOREHOLE' | 'TAP' | 'RAINWATER',
  ): AncestralHome {
    return new AncestralHome({
      ...this._value,
      accessRoadType,
      waterSource,
    });
  }

  updateDistance(distanceKm?: number): AncestralHome {
    return new AncestralHome({
      ...this._value,
      distanceFromCurrentHomeKm: distanceKm,
    });
  }

  updateCoordinates(coordinates?: string): AncestralHome {
    return new AncestralHome({
      ...this._value,
      coordinates,
    });
  }

  get county(): KenyanCounty {
    return this._value.county;
  }

  get subCounty(): string | undefined {
    return this._value.subCounty;
  }

  get village(): string {
    return this._value.village;
  }

  get clanLand(): boolean {
    return this._value.clanLand;
  }

  get landOwnershipType(): string {
    return this._value.landOwnershipType;
  }

  get approximateSizeAcres(): number | undefined {
    return this._value.approximateSizeAcres;
  }

  get generationsKnown(): number {
    return this._value.generationsKnown;
  }

  get hasFamilyBurialSite(): boolean {
    return this._value.hasFamilyBurialSite;
  }

  get burialSiteLocation(): string | undefined {
    return this._value.burialSiteLocation;
  }

  get familyShrine(): string | undefined {
    return this._value.familyShrine;
  }

  get traditionalMeetingPlace(): string | undefined {
    return this._value.traditionalMeetingPlace;
  }

  get currentOccupants(): string[] | undefined {
    return this._value.currentOccupants ? [...this._value.currentOccupants] : undefined;
  }

  get isStillOccupied(): boolean {
    return this._value.isStillOccupied;
  }

  get distanceFromCurrentHomeKm(): number | undefined {
    return this._value.distanceFromCurrentHomeKm;
  }

  get culturalSignificance(): string | undefined {
    return this._value.culturalSignificance;
  }

  get accessRoadType(): string | undefined {
    return this._value.accessRoadType;
  }

  get waterSource(): string | undefined {
    return this._value.waterSource;
  }

  get coordinates(): string | undefined {
    return this._value.coordinates;
  }

  // Get estimated years of occupation
  get estimatedYearsOccupied(): number {
    // Assuming 25 years per generation
    return this._value.generationsKnown * 25;
  }

  // Check if ancestral home is in same county as current location
  isInSameCounty(county: KenyanCounty): boolean {
    return this._value.county === county;
  }

  // Check if land is communally owned (for succession customs)
  get isCommunalLand(): boolean {
    return this._value.landOwnershipType === 'CLAN' || this._value.landOwnershipType === 'COMMUNAL';
  }

  // Check if ancestral home has cultural significance
  get hasCulturalSignificance(): boolean {
    return !!(
      this._value.familyShrine ||
      this._value.traditionalMeetingPlace ||
      this._value.culturalSignificance
    );
  }

  // Get accessibility rating
  get accessibilityRating(): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (this._value.accessRoadType === 'PAVED') return 'HIGH';
    if (this._value.accessRoadType === 'GRAVEL') return 'MEDIUM';
    if (this._value.accessRoadType === 'EARTH') return 'MEDIUM';
    if (this._value.accessRoadType === 'FOOTPATH') return 'LOW';
    return 'LOW';
  }

  // Get water availability rating
  get waterAvailabilityRating(): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (this._value.waterSource === 'TAP' || this._value.waterSource === 'BOREHOLE') return 'HIGH';
    if (this._value.waterSource === 'WELL' || this._value.waterSource === 'RAINWATER')
      return 'MEDIUM';
    if (this._value.waterSource === 'RIVER') return 'LOW';
    return 'LOW';
  }

  // Check if ancestral home is suitable for inheritance division
  get isSuitableForInheritance(): boolean {
    return (
      this._value.clanLand ||
      this._value.landOwnershipType === 'FAMILY' ||
      this._value.landOwnershipType === 'PRIVATE'
    );
  }

  // Get display name
  get displayName(): string {
    const parts = [
      this._value.village,
      this._value.subCounty,
      KenyanCountyValidator.getDisplayName(this._value.county),
    ].filter(Boolean);
    return parts.join(', ');
  }

  // Get region
  get region(): string {
    return KenyanCountyValidator.getRegion(this._value.county);
  }

  toJSON() {
    return {
      county: this._value.county,
      countyDisplayName: KenyanCountyValidator.getDisplayName(this._value.county),
      subCounty: this._value.subCounty,
      village: this._value.village,
      clanLand: this._value.clanLand,
      landOwnershipType: this._value.landOwnershipType,
      approximateSizeAcres: this._value.approximateSizeAcres,
      generationsKnown: this._value.generationsKnown,
      hasFamilyBurialSite: this._value.hasFamilyBurialSite,
      burialSiteLocation: this._value.burialSiteLocation,
      familyShrine: this._value.familyShrine,
      traditionalMeetingPlace: this._value.traditionalMeetingPlace,
      currentOccupants: this._value.currentOccupants,
      isStillOccupied: this._value.isStillOccupied,
      distanceFromCurrentHomeKm: this._value.distanceFromCurrentHomeKm,
      culturalSignificance: this._value.culturalSignificance,
      accessRoadType: this._value.accessRoadType,
      waterSource: this._value.waterSource,
      coordinates: this._value.coordinates,
      estimatedYearsOccupied: this.estimatedYearsOccupied,
      isCommunalLand: this.isCommunalLand,
      hasCulturalSignificance: this.hasCulturalSignificance,
      accessibilityRating: this.accessibilityRating,
      waterAvailabilityRating: this.waterAvailabilityRating,
      isSuitableForInheritance: this.isSuitableForInheritance,
      displayName: this.displayName,
      region: this.region,
    };
  }
}
