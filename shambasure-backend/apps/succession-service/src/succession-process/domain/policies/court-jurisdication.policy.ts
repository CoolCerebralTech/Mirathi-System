import { Injectable } from '@nestjs/common';
import { EstateValuation } from '../value-objects/estate-valuation.vo';
import { KenyanCourtJurisdiction, CourtLevel } from '../value-objects/kenyan-court-jurisdiction.vo';
import { COURT_JURISDICTION } from '../../../common/constants/court-jurisdiction.constants';

@Injectable()
export class CourtJurisdictionPolicy {
  /**
   * Determines the appropriate court jurisdiction based on Kenyan law
   */
  determineJurisdiction(
    valuation: EstateValuation,
    options: {
      isIslamic: boolean;
      county: string;
      preferredStation?: string;
      hasComplexIssues?: boolean;
      involvesMinors?: boolean;
      estateType?: 'TESTATE' | 'INTESTATE';
    },
  ): { jurisdiction: KenyanCourtJurisdiction; reason: string } {
    const { isIslamic, county, preferredStation, hasComplexIssues, involvesMinors, estateType } =
      options;

    let level: CourtLevel;
    let reason = '';

    // 1. Islamic Law Priority (Kadhis Court Act)
    if (isIslamic) {
      level = 'KADHIS_COURT';
      reason = 'Islamic estate matter falls under Kadhis Court jurisdiction';
    }
    // 2. Complex or High-Value Estates (Section 48, Law of Succession Act)
    else if (hasComplexIssues || involvesMinors || this.isHighComplexityEstate(valuation)) {
      level = 'HIGH_COURT';
      reason = 'Complex estate with minors or complex issues requires High Court supervision';
    }
    // 3. Pecuniary Jurisdiction (Based on estate value)
    else {
      const netValue = valuation.getNetAmount();

      if (netValue >= COURT_JURISDICTION.HIGH_COURT.minJurisdiction) {
        level = 'HIGH_COURT';
        reason = `Estate value (KES ${netValue.toLocaleString()}) exceeds magistrate court jurisdiction`;
      } else if (netValue >= COURT_JURISDICTION.CHIEF_MAGISTRATE.minJurisdiction) {
        level = 'CHIEF_MAGISTRATE';
        reason = `Estate value (KES ${netValue.toLocaleString()}) within chief magistrate jurisdiction`;
      } else if (netValue >= COURT_JURISDICTION.PRINCIPAL_MAGISTRATE.minJurisdiction) {
        level = 'PRINCIPAL_MAGISTRATE';
        reason = `Estate value (KES ${netValue.toLocaleString()}) within principal magistrate jurisdiction`;
      } else {
        level = 'SENIOR_MAGISTRATE';
        reason = `Estate value (KES ${netValue.toLocaleString()}) within senior magistrate jurisdiction`;
      }
    }

    const station = preferredStation || this.getDefaultStationForCounty(county);
    const jurisdiction = new KenyanCourtJurisdiction(level, station, county);

    return { jurisdiction, reason };
  }

  /**
   * Validates if filing in chosen court is appropriate
   */
  validateFiling(
    court: KenyanCourtJurisdiction,
    valuation: EstateValuation,
    options: {
      isIslamic: boolean;
      hasComplexIssues: boolean;
    },
  ): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    const netValue = valuation.getNetAmount();
    const courtLevel = court.getLevel();

    // 1. Islamic estate validation
    if (options.isIslamic && !court.isCompetentForIslamicEstate()) {
      errors.push('Islamic estates must be filed in Kadhis Court or High Court');
    }

    // 2. Pecuniary jurisdiction validation
    if (!court.canHandleEstateValue(netValue)) {
      errors.push(
        `Estate value (KES ${netValue.toLocaleString()}) exceeds ${courtLevel} jurisdiction limit of KES ${court.getPecuniaryLimit().toLocaleString()}`,
      );
    }

    // 3. Complex issues warning
    if (options.hasComplexIssues && courtLevel !== 'HIGH_COURT') {
      warnings.push(
        'Complex estates are recommended to be filed in High Court for better supervision',
      );
    }

    // 4. High Court transfer warning for small estates
    if (courtLevel === 'HIGH_COURT' && netValue < COURT_JURISDICTION.HIGH_COURT.minJurisdiction) {
      warnings.push('Small estates filed in High Court may be transferred to magistrate court');
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Determines if transfer to different court is needed
   */
  shouldTransferCourt(
    currentCourt: KenyanCourtJurisdiction,
    valuation: EstateValuation,
    caseComplexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX',
  ): { transfer: boolean; recommendedCourt?: KenyanCourtJurisdiction; reason?: string } {
    const netValue = valuation.getNetAmount();
    const currentLevel = currentCourt.getLevel();

    // High Court can handle any case, no need to transfer up
    if (currentLevel === 'HIGH_COURT') {
      return { transfer: false };
    }

    // Check if value exceeds current court jurisdiction
    if (!currentCourt.canHandleEstateValue(netValue)) {
      const recommendedLevel = this.determineJurisdiction(valuation, {
        isIslamic: false,
        county: currentCourt.getCounty(),
        hasComplexIssues: caseComplexity === 'COMPLEX',
      }).jurisdiction.getLevel();

      return {
        transfer: true,
        recommendedCourt: new KenyanCourtJurisdiction(
          recommendedLevel,
          currentCourt.getStation(),
          currentCourt.getCounty(),
        ),
        reason: `Estate value exceeds ${currentLevel} jurisdiction`,
      };
    }

    // Check complexity for transfer to High Court
    if (caseComplexity === 'COMPLEX' && currentLevel !== 'HIGH_COURT') {
      return {
        transfer: true,
        recommendedCourt: new KenyanCourtJurisdiction(
          'HIGH_COURT',
          currentCourt.getStation(),
          currentCourt.getCounty(),
        ),
        reason: 'Complex case requires High Court supervision',
      };
    }

    return { transfer: false };
  }

  private isHighComplexityEstate(valuation: EstateValuation): boolean {
    const netValue = valuation.getNetAmount();
    // Estates over 50M KES or with complex asset structures
    return netValue > 50000000 || valuation.getGrossAmount() - netValue > netValue * 0.3;
  }

  private getDefaultStationForCounty(county: string): string {
    const countyStations: Record<string, string> = {
      NAIROBI: 'Milimani',
      MOMBASA: 'Mombasa',
      KISUMU: 'Kisumu',
      NAKURU: 'Nakuru',
      ELDORET: 'Eldoret',
      NYERI: 'Nyeri',
      THIKA: 'Thika',
      MALINDI: 'Malindi',
      GARISSA: 'Garissa',
      KAKAMEGA: 'Kakamega',
      KERICHO: 'Kericho',
    };

    return countyStations[county.toUpperCase()] || county;
  }
}
