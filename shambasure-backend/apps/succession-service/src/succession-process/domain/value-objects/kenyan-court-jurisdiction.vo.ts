import { KENYAN_COUNTIES_LIST } from '../../common/constants/kenyan-law.constants';
import { COURT_LOCATIONS, COURT_JURISDICTION } from '../../common/constants/court-jurisdiction.constants';

export type CourtLevel = 'HIGH_COURT' | 'CHIEF_MAGISTRATE' | 'PRINCIPAL_MAGISTRATE' | 'KADHIS_COURT';

export class KenyanCourtJurisdiction {
  private readonly level: CourtLevel;
  private readonly station: string; // e.g., "Milimani", "Mombasa"
  private readonly county: string;

  constructor(level: CourtLevel, station: string, county: string) {
    this.validateCounty(county);
    this.level = level;
    this.station = station;
    this.county = county;
  }

  private validateCounty(county: string): void {
    if (!(KENYAN_COUNTIES_LIST as readonly string[]).includes(county.toUpperCase())) {
      throw new Error(`Invalid Kenyan County: ${county}`);
    }
  }

  /**
   * Checks if this court is valid for Muslim Succession.
   */
  isCompetentForIslamicEstate(): boolean {
    return this.level === 'KADHIS_COURT' || this.level === 'HIGH_COURT';
  }

  /**
   * Returns the correct registry code for file generation (e.g., "NBI" for Nairobi).
   */
  getRegistryCode(): string {
    // Simplistic mapping for major stations
    const map: Record<string, string> = {
      'NAIROBI': 'NBI',
      'MOMBASA': 'MSA',
      'KISUMU': 'KSM',
      'NAKURU': 'NKR',
      'ELDORET': 'ELD'
    };
    return map[this.station.toUpperCase()] || 'GEN';
  }

  getLevel(): CourtLevel { return this.level; }
  getStation(): string { return this.station; }
}
