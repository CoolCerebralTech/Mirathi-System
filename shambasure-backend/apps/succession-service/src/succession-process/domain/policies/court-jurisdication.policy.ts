import { Injectable } from '@nestjs/common';
import { EstateValuation } from '../value-objects/estate-valuation.vo';
import { KenyanCourtJurisdiction, CourtLevel } from '../value-objects/kenyan-court-jurisdiction.vo';
import { COURT_JURISDICTION } from '../../../common/constants/court-jurisdiction.constants';

@Injectable()
export class CourtJurisdictionPolicy {
  determineJurisdiction(
    valuation: EstateValuation,
    isIslamic: boolean,
    county: string,
    preferredStation: string,
  ): KenyanCourtJurisdiction {
    let level: CourtLevel;

    // 1. Islamic Law Priority
    if (isIslamic) {
      // Check if there is a Kadhis court in that station, otherwise High Court
      // For MVP logic, we default to Kadhis if flagged
      level = 'KADHIS_COURT';
    } else {
      // 2. Pecuniary Jurisdiction (Section 48)
      const netValue = valuation.getNetAmount();
      const limit = COURT_JURISDICTION.HIGH_COURT.minJurisdiction;

      if (netValue >= limit) {
        level = 'HIGH_COURT';
      } else {
        // Logic to choose specific Magistrate grade could go here
        // For now, we route to the Chief Magistrate as the generic lower court head
        level = 'CHIEF_MAGISTRATE';
      }
    }

    return new KenyanCourtJurisdiction(level, preferredStation, county);
  }

  validateFiling(court: KenyanCourtJurisdiction, valuation: EstateValuation): boolean {
    const netValue = valuation.getNetAmount();
    const limit = COURT_JURISDICTION.HIGH_COURT.minJurisdiction;

    if (court.getLevel() === 'HIGH_COURT' && netValue < limit) {
      // You CAN file small estates in High Court, but they might transfer it down.
      // We allow it but maybe warn.
      return true;
    }

    if (
      court.getLevel() !== 'HIGH_COURT' &&
      court.getLevel() !== 'KADHIS_COURT' &&
      netValue >= limit
    ) {
      // Magistrate cannot handle > 5M
      return false;
    }

    return true;
  }
}
