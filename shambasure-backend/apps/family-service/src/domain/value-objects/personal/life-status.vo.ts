// domain/value-objects/personal/life-status.vo.ts
import { ValueObject } from '../../base/value-object';

export type LifeStatusType =
  | 'ALIVE'
  | 'DECEASED'
  | 'MISSING'
  | 'PRESUMED_DEAD'
  | 'PRESUMED_ALIVE'
  | 'UNKNOWN';

export interface LifeStatusProps {
  status: LifeStatusType;
  dateOfDeath?: Date;
  placeOfDeath?: string;
  causeOfDeath?: string;
  missingSince?: Date;
  lastSeenLocation?: string;
  presumedDeadDate?: Date;
  presumedDeadCourtOrder?: string;
  funeralArranged: boolean;
  burialLocation?: string;
  cremation: boolean;
}

export class LifeStatus extends ValueObject<LifeStatusProps> {
  private constructor(props: LifeStatusProps) {
    super(props);
    this.validate();
  }

  static createAlive(): LifeStatus {
    return new LifeStatus({
      status: 'ALIVE',
      funeralArranged: false,
      cremation: false,
    });
  }

  static createDeceased(dateOfDeath: Date): LifeStatus {
    return new LifeStatus({
      status: 'DECEASED',
      dateOfDeath,
      funeralArranged: false,
      cremation: false,
    });
  }

  static createMissing(missingSince: Date, lastSeenLocation?: string): LifeStatus {
    return new LifeStatus({
      status: 'MISSING',
      missingSince,
      lastSeenLocation,
      funeralArranged: false,
      cremation: false,
    });
  }

  static createFromProps(props: LifeStatusProps): LifeStatus {
    return new LifeStatus(props);
  }

  validate(): void {
    // Date of death validation
    if (this._value.dateOfDeath) {
      if (this._value.dateOfDeath > new Date()) {
        throw new Error('Date of death cannot be in the future');
      }

      if (this._value.status !== 'DECEASED' && this._value.dateOfDeath) {
        throw new Error('Date of death can only be set for DECEASED status');
      }
    }

    // Missing since validation
    if (this._value.missingSince) {
      if (this._value.missingSince > new Date()) {
        throw new Error('Missing since date cannot be in the future');
      }

      if (this._value.status !== 'MISSING' && this._value.missingSince) {
        throw new Error('Missing since date can only be set for MISSING status');
      }
    }

    // Presumed dead validation
    if (this._value.presumedDeadDate) {
      if (this._value.presumedDeadDate > new Date()) {
        throw new Error('Presumed dead date cannot be in the future');
      }

      if (!['PRESUMED_DEAD', 'MISSING'].includes(this._value.status)) {
        throw new Error('Presumed dead date can only be set for MISSING or PRESUMED_DEAD status');
      }
    }

    // Funeral validation
    if (this._value.funeralArranged && this._value.status !== 'DECEASED') {
      throw new Error('Funeral can only be arranged for DECEASED status');
    }

    // Cremation validation
    if (this._value.cremation && this._value.status !== 'DECEASED') {
      throw new Error('Cremation can only be set for DECEASED status');
    }

    // Burial location validation
    if (this._value.burialLocation && this._value.status !== 'DECEASED') {
      throw new Error('Burial location can only be set for DECEASED status');
    }

    // Cause of death validation
    if (this._value.causeOfDeath && this._value.status !== 'DECEASED') {
      throw new Error('Cause of death can only be set for DECEASED status');
    }

    // Place of death validation
    if (this._value.placeOfDeath && this._value.status !== 'DECEASED') {
      throw new Error('Place of death can only be set for DECEASED status');
    }
  }

  markDeceased(dateOfDeath: Date, placeOfDeath?: string, causeOfDeath?: string): LifeStatus {
    return new LifeStatus({
      ...this._value,
      status: 'DECEASED',
      dateOfDeath,
      placeOfDeath,
      causeOfDeath,
    });
  }

  markMissing(missingSince: Date, lastSeenLocation?: string): LifeStatus {
    return new LifeStatus({
      ...this._value,
      status: 'MISSING',
      missingSince,
      lastSeenLocation,
    });
  }

  markPresumedDead(presumedDeadDate: Date, courtOrder?: string): LifeStatus {
    return new LifeStatus({
      ...this._value,
      status: 'PRESUMED_DEAD',
      presumedDeadDate,
      presumedDeadCourtOrder: courtOrder,
    });
  }

  markAlive(): LifeStatus {
    return new LifeStatus({
      ...this._value,
      status: 'ALIVE',
      dateOfDeath: undefined,
      missingSince: undefined,
      presumedDeadDate: undefined,
      presumedDeadCourtOrder: undefined,
      causeOfDeath: undefined,
      placeOfDeath: undefined,
    });
  }

  arrangeFuneral(burialLocation?: string, cremation: boolean = false): LifeStatus {
    if (this._value.status !== 'DECEASED') {
      throw new Error('Cannot arrange funeral for non-deceased person');
    }

    return new LifeStatus({
      ...this._value,
      funeralArranged: true,
      burialLocation,
      cremation,
    });
  }

  updateCauseOfDeath(cause: string): LifeStatus {
    if (this._value.status !== 'DECEASED') {
      throw new Error('Cannot update cause of death for non-deceased person');
    }

    return new LifeStatus({
      ...this._value,
      causeOfDeath: cause,
    });
  }

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

  get presumedDeadDate(): Date | undefined {
    return this._value.presumedDeadDate;
  }

  get presumedDeadCourtOrder(): string | undefined {
    return this._value.presumedDeadCourtOrder;
  }

  get funeralArranged(): boolean {
    return this._value.funeralArranged;
  }

  get burialLocation(): string | undefined {
    return this._value.burialLocation;
  }

  get cremation(): boolean {
    return this._value.cremation;
  }

  // Check if person is alive
  get isAlive(): boolean {
    return this._value.status === 'ALIVE' || this._value.status === 'PRESUMED_ALIVE';
  }

  // Check if person is deceased
  get isDeceased(): boolean {
    return this._value.status === 'DECEASED' || this._value.status === 'PRESUMED_DEAD';
  }

  // Check if person is missing
  get isMissing(): boolean {
    return this._value.status === 'MISSING';
  }

  // Check if death is officially registered
  get isOfficiallyDeceased(): boolean {
    return this._value.status === 'DECEASED' && !!this._value.dateOfDeath;
  }

  // Get duration missing (in days)
  get missingDurationDays(): number | null {
    if (!this._value.missingSince) return null;

    const now = new Date();
    const diffTime = now.getTime() - this._value.missingSince.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Check if person can be declared legally dead (7 years missing in Kenya)
  get canBeDeclaredLegallyDead(): boolean {
    if (this._value.status !== 'MISSING') return false;

    const missingDuration = this.missingDurationDays;
    if (!missingDuration) return false;

    // Kenyan law: 7 years missing for presumption of death
    return missingDuration >= 2555; // 7 years in days (approx)
  }

  // Check if funeral has been arranged
  get hasFuneralArranged(): boolean {
    return this._value.funeralArranged;
  }

  // Get burial type
  get burialType(): string {
    if (this._value.cremation) return 'CREMATION';
    if (this._value.burialLocation) return 'BURIAL';
    return 'UNKNOWN';
  }

  toJSON() {
    return {
      status: this._value.status,
      dateOfDeath: this._value.dateOfDeath?.toISOString(),
      placeOfDeath: this._value.placeOfDeath,
      causeOfDeath: this._value.causeOfDeath,
      missingSince: this._value.missingSince?.toISOString(),
      lastSeenLocation: this._value.lastSeenLocation,
      presumedDeadDate: this._value.presumedDeadDate?.toISOString(),
      presumedDeadCourtOrder: this._value.presumedDeadCourtOrder,
      funeralArranged: this._value.funeralArranged,
      burialLocation: this._value.burialLocation,
      cremation: this._value.cremation,
      isAlive: this.isAlive,
      isDeceased: this.isDeceased,
      isMissing: this.isMissing,
      isOfficiallyDeceased: this.isOfficiallyDeceased,
      missingDurationDays: this.missingDurationDays,
      canBeDeclaredLegallyDead: this.canBeDeclaredLegallyDead,
      hasFuneralArranged: this.hasFuneralArranged,
      burialType: this.burialType,
    };
  }
}
