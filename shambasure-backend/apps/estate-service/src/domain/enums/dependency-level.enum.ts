// src/estate-service/src/domain/enums/dependency-level.enum.ts

/**
 * Dependency Level Enum
 *
 * Legal Context (Law of Succession Act):
 * - FULL: Complete dependency (minors, incapacitated, spouse)
 * - PARTIAL: Partial dependency (adult children in school, elderly parents)
 * - NONE: No financial dependency but may have moral claim
 */
export enum DependencyLevel {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  NONE = 'NONE',
}

/**
 * Dependency Level Helper Methods
 */
export class DependencyLevelHelper {
  /**
   * Get human-readable description
   */
  static getDescription(level: DependencyLevel): string {
    const descriptions: Record<DependencyLevel, string> = {
      [DependencyLevel.FULL]: 'Completely dependent on deceased for financial support',
      [DependencyLevel.PARTIAL]: 'Partially dependent on deceased for financial support',
      [DependencyLevel.NONE]: 'Not financially dependent',
    };
    return descriptions[level] || 'Unknown dependency level';
  }

  /**
   * Determine dependency level based on relationship and circumstances
   */
  static determineLevel(
    relationship: string,
    isMinor: boolean,
    isIncapacitated: boolean,
    wasMaintained: boolean,
  ): DependencyLevel {
    // Minors and incapacitated are always fully dependent
    if (isMinor || isIncapacitated) {
      return DependencyLevel.FULL;
    }

    // Spouses are considered fully dependent
    if (relationship === 'SPOUSE' || relationship === 'CHILD') {
      return DependencyLevel.FULL;
    }

    // Others who were being maintained
    if (wasMaintained) {
      return DependencyLevel.PARTIAL;
    }

    return DependencyLevel.NONE;
  }

  /**
   * Get weighting factor for distribution calculations
   */
  static getWeightingFactor(level: DependencyLevel): number {
    const weights: Record<DependencyLevel, number> = {
      [DependencyLevel.FULL]: 1.0,
      [DependencyLevel.PARTIAL]: 0.5,
      [DependencyLevel.NONE]: 0.25,
    };
    return weights[level] || 0.25;
  }

  /**
   * Check if level qualifies for special consideration
   */
  static qualifiesForSpecialConsideration(level: DependencyLevel): boolean {
    return level === DependencyLevel.FULL;
  }

  /**
   * Get all valid dependency levels
   */
  static getAllLevels(): DependencyLevel[] {
    return Object.values(DependencyLevel);
  }

  /**
   * Validate if a string is a valid DependencyLevel
   */
  static isValid(level: string): level is DependencyLevel {
    return Object.values(DependencyLevel).includes(level as DependencyLevel);
  }
}
