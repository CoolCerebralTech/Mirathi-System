import { KENYAN_COUNTIES_LIST } from '../../../common/constants/kenyan-law.constants';

export type CourtLevel =
  | 'HIGH_COURT'
  | 'CHIEF_MAGISTRATE'
  | 'PRINCIPAL_MAGISTRATE'
  | 'SENIOR_MAGISTRATE'
  | 'KADHIS_COURT';

export class KenyanCourtJurisdiction {
  private readonly level: CourtLevel;
  private readonly station: string;
  private readonly county: string;
  private readonly pecuniaryLimit: number;

  constructor(level: CourtLevel, station: string, county: string) {
    this.validateCounty(county);

    this.level = level;
    this.station = station;
    this.county = county.toUpperCase();
    this.pecuniaryLimit = this.calculatePecuniaryLimit();
  }

  private validateCounty(county: string): void {
    if (!(KENYAN_COUNTIES_LIST as readonly string[]).includes(county.toUpperCase())) {
      throw new Error(
        `Invalid Kenyan County: ${county}. Must be one of: ${KENYAN_COUNTIES_LIST.join(', ')}`,
      );
    }
  }

  private calculatePecuniaryLimit(): number {
    const limits: Record<CourtLevel, number> = {
      HIGH_COURT: Infinity, // Unlimited jurisdiction
      CHIEF_MAGISTRATE: 20000000, // 20 million KES
      PRINCIPAL_MAGISTRATE: 10000000, // 10 million KES
      SENIOR_MAGISTRATE: 7000000, // 7 million KES
      KADHIS_COURT: 0, // Subject to specific rules for Muslim estates
    };

    return limits[this.level] || 0;
  }

  /**
   * Determines if this court can handle an estate of given value
   */
  canHandleEstateValue(estateValue: number): boolean {
    if (this.level === 'KADHIS_COURT') {
      // Kadhis Court jurisdiction is based on Muslim law application, not value
      return this.isCompetentForIslamicEstate();
    }

    return estateValue <= this.pecuniaryLimit;
  }

  /**
   * Checks if this court is valid for Muslim Succession
   */
  isCompetentForIslamicEstate(): boolean {
    return this.level === 'KADHIS_COURT' || this.level === 'HIGH_COURT';
  }

  /**
   * Returns the correct registry code for file generation
   */
  getRegistryCode(): string {
    const registryMap: Record<string, string> = {
      NAIROBI: 'NBI',
      MOMBASA: 'MSA',
      KISUMU: 'KSM',
      NAKURU: 'NKR',
      ELDORET: 'ELD',
      NYERI: 'NYR',
      THIKA: 'THK',
      MALINDI: 'MLD',
      GARISSA: 'GAR',
      KAKAMEGA: 'KKG',
      KERICHO: 'KCH',
    };

    return registryMap[this.station.toUpperCase()] || 'GEN';
  }

  /**
   * Gets the full court name for legal documents
   */
  getFormalCourtName(): string {
    const levelNames: Record<CourtLevel, string> = {
      HIGH_COURT: 'High Court of Kenya',
      CHIEF_MAGISTRATE: 'Chief Magistrate Court',
      PRINCIPAL_MAGISTRATE: 'Principal Magistrate Court',
      SENIOR_MAGISTRATE: 'Senior Magistrate Court',
      KADHIS_COURT: 'Kadhis Court',
    };

    return `${levelNames[this.level]} at ${this.station}`;
  }

  getLevel(): CourtLevel {
    return this.level;
  }

  getStation(): string {
    return this.station;
  }

  getCounty(): string {
    return this.county;
  }

  getPecuniaryLimit(): number {
    return this.pecuniaryLimit;
  }
}
