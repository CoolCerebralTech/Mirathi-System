// =============================================================================
// 1. CONTEXT DETECTOR SERVICE
// Analyzes estate/family data to determine legal path
// =============================================================================
import { Injectable } from '@nestjs/common';

import { SuccessionContext } from '../value-objects/succession-context.vo';

@Injectable()
export class ContextDetectorService {
  /**
   * Detects the succession context from estate and family data
   */
  detectContext(data: {
    hasWill: boolean;
    religion: string;
    marriageType: string;
    estateValue: number;
    hasMinors: boolean;
    numberOfWives: number;
    numberOfChildren: number;
  }): SuccessionContext {
    // 1. Determine regime
    const regime = data.hasWill ? 'TESTATE' : 'INTESTATE';

    // 2. Determine religion
    const religion = this.mapReligion(data.religion);

    // 3. Determine marriage type
    const marriageType = this.mapMarriageType(data.marriageType);

    // 4. Determine court jurisdiction
    const targetCourt = this.determineJurisdiction(data.estateValue, religion, marriageType);

    return new SuccessionContext(
      regime as any,
      religion,
      marriageType,
      targetCourt,
      data.estateValue,
      data.hasMinors,
      data.numberOfWives > 1,
      data.numberOfWives,
      data.numberOfChildren,
    );
  }

  private mapReligion(religion: string): any {
    const map: Record<string, string> = {
      ISLAM: 'ISLAMIC',
      MUSLIM: 'ISLAMIC',
      HINDU: 'HINDU',
      CUSTOMARY: 'CUSTOMARY',
    };
    return map[religion?.toUpperCase()] || 'STATUTORY';
  }

  private mapMarriageType(type: string): any {
    const map: Record<string, string> = {
      POLYGAMOUS: 'POLYGAMOUS',
      COHABITATION: 'COHABITATION',
      SINGLE: 'SINGLE',
    };
    return map[type?.toUpperCase()] || 'MONOGAMOUS';
  }

  private determineJurisdiction(estateValue: number, religion: string, marriageType: string): any {
    // Islamic cases go to Kadhi's Court
    if (religion === 'ISLAMIC') {
      return 'KADHIS_COURT';
    }

    // Customary cases
    if (religion === 'CUSTOMARY') {
      return 'CUSTOMARY_COURT';
    }

    // High value estates go to High Court
    if (estateValue > 1000000) {
      return 'HIGH_COURT';
    }

    // Default to Magistrate
    return 'MAGISTRATE_COURT';
  }
}
