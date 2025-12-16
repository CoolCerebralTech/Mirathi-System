// domain/value-objects/personal/life-status.vo.ts
import { ValueObject } from '../../base/value-object';

export type LifeStatusType = 'ALIVE' | 'DECEASED' | 'MISSING';

export interface LifeStatusProps {
  status: LifeStatusType;
  dateOfDeath?: Date;
  placeOfDeath?: string;
  causeOfDeath?: string;
  missingSince?: Date;
  lastSeenLocation?: string;
}

export class LifeStatus extends ValueObject<LifeStatusProps> {
  private constructor(props: LifeStatusProps) {
    super(props);
    this.validate();
  }

  // Factory method for creating a new alive status
  static createAlive(): LifeStatus {
    return new LifeStatus({
      status: 'ALIVE',
    });
  }

  // Factory method for creating a deceased status
  static createDeceased(
    dateOfDeath: Date,
    placeOfDeath?: string,
    causeOfDeath?: string,
  ): LifeStatus {
    return new LifeStatus({
      status: 'DECEASED',
      dateOfDeath,
      placeOfDeath,
      causeOfDeath,
    });
  }

  // Factory method for creating a missing status
  static createMissing(missingSince: Date, lastSeenLocation?: string): LifeStatus {
    return new LifeStatus({
      status: 'MISSING',
      missingSince,
      lastSeenLocation,
    });
  }

  // Factory method for creating from existing data
  static createFromProps(props: LifeStatusProps): LifeStatus {
    return new LifeStatus(props);
  }

  // Factory method for creating from JSON (for mappers)
  static createFromJSON(data: any): LifeStatus {
    if (!data) {
      return LifeStatus.createAlive();
    }

    const props: LifeStatusProps = {
      status: data.status || 'ALIVE',
      dateOfDeath: data.dateOfDeath ? new Date(data.dateOfDeath) : undefined,
      placeOfDeath: data.placeOfDeath,
      causeOfDeath: data.causeOfDeath,
      missingSince: data.missingSince ? new Date(data.missingSince) : undefined,
      lastSeenLocation: data.lastSeenLocation,
    };

    return new LifeStatus(props);
  }

  protected validate(): void {
    const { status, dateOfDeath, missingSince } = this._value;

    // Validate date of death for deceased status
    if (status === 'DECEASED' && !dateOfDeath) {
      throw new Error('Date of death is required for deceased status');
    }

    // Validate missing since for missing status
    if (status === 'MISSING' && !missingSince) {
      throw new Error('Missing since date is required for missing status');
    }

    // Validate date of death is not in the future
    if (dateOfDeath && dateOfDeath > new Date()) {
      throw new Error('Date of death cannot be in the future');
    }

    // Validate missing since is not in the future
    if (missingSince && missingSince > new Date()) {
      throw new Error('Missing since date cannot be in the future');
    }

    // Validate consistency - can't have both date of death and missing since
    if (dateOfDeath && missingSince) {
      throw new Error('Cannot have both date of death and missing since date');
    }

    // Validate place of death only for deceased
    if (this._value.placeOfDeath && status !== 'DECEASED') {
      throw new Error('Place of death can only be set for deceased status');
    }

    // Validate cause of death only for deceased
    if (this._value.causeOfDeath && status !== 'DECEASED') {
      throw new Error('Cause of death can only be set for deceased status');
    }

    // Validate last seen location only for missing
    if (this._value.lastSeenLocation && status !== 'MISSING') {
      throw new Error('Last seen location can only be set for missing status');
    }
  }

  // Domain methods

  markDeceased(dateOfDeath: Date, placeOfDeath?: string, causeOfDeath?: string): LifeStatus {
    return new LifeStatus({
      status: 'DECEASED',
      dateOfDeath,
      placeOfDeath,
      causeOfDeath,
    });
  }

  markMissing(missingSince: Date, lastSeenLocation?: string): LifeStatus {
    return new LifeStatus({
      status: 'MISSING',
      missingSince,
      lastSeenLocation,
    });
  }

  markAlive(): LifeStatus {
    return new LifeStatus({
      status: 'ALIVE',
    });
  }

  // Getters

  get status(): LifeStatusType {
    return this._value.status;
  }

  get dateOfDeath(): Date | undefined {
    return this._value.dateOfDeath;
  }

  get placeOfDeath(): string | undefined {
    return this._value.placeOfDeath;
  }

  get causeOfDeath(): string | undefined {
    return this._value.causeOfDeath;
  }

  get missingSince(): Date | undefined {
    return this._value.missingSince;
  }

  get lastSeenLocation(): string | undefined {
    return this._value.lastSeenLocation;
  }

  // Computed properties that match entity requirements

  get isAlive(): boolean {
    return this._value.status === 'ALIVE';
  }

  get isDeceased(): boolean {
    return this._value.status === 'DECEASED';
  }

  get isMissing(): boolean {
    return this._value.status === 'MISSING';
  }

  get deathCertificateIssued(): boolean {
    // In your entity, this is determined by the presence of a death certificate in KenyanIdentity
    // This is just a placeholder - the actual check is in the FamilyMember entity
    return this.isDeceased;
  }

  // Helper methods for business logic

  // Check if person can be declared legally dead (7 years missing in Kenya)
  get canBeDeclaredLegallyDead(): boolean {
    if (!this.isMissing || !this._value.missingSince) {
      return false;
    }

    const now = new Date();
    const yearsMissing =
      (now.getTime() - this._value.missingSince.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return yearsMissing >= 7; // Kenyan law: 7 years missing for presumption of death
  }

  // Get duration missing in years (for Kenyan presumption of death)
  get yearsMissing(): number | null {
    if (!this.isMissing || !this._value.missingSince) {
      return null;
    }

    const now = new Date();
    return (now.getTime() - this._value.missingSince.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  }

  // Check if this is a sudden death (within 24 hours)
  get isSuddenDeath(): boolean {
    if (!this.isDeceased || !this._value.dateOfDeath) {
      return false;
    }

    // This would require additional medical information
    // Placeholder logic
    return false;
  }

  // For inheritance eligibility
  get isEligibleForInheritance(): boolean {
    return this.isAlive || (this.isDeceased && !!this._value.dateOfDeath);
  }

  toJSON() {
    return {
      status: this._value.status,
      dateOfDeath: this._value.dateOfDeath?.toISOString(),
      placeOfDeath: this._value.placeOfDeath,
      causeOfDeath: this._value.causeOfDeath,
      missingSince: this._value.missingSince?.toISOString(),
      lastSeenLocation: this._value.lastSeenLocation,
      isAlive: this.isAlive,
      isDeceased: this.isDeceased,
      isMissing: this.isMissing,
      deathCertificateIssued: this.deathCertificateIssued,
      canBeDeclaredLegallyDead: this.canBeDeclaredLegallyDead,
      yearsMissing: this.yearsMissing,
      isSuddenDeath: this.isSuddenDeath,
      isEligibleForInheritance: this.isEligibleForInheritance,
    };
  }

  // For debugging
  toString(): string {
    switch (this._value.status) {
      case 'ALIVE':
        return 'Alive';
      case 'DECEASED':
        return `Deceased on ${this._value.dateOfDeath?.toLocaleDateString()}`;
      case 'MISSING':
        return `Missing since ${this._value.missingSince?.toLocaleDateString()}`;
      default:
        return 'Unknown';
    }
  }
}
