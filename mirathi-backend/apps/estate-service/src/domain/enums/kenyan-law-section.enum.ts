// src/estate-service/src/domain/enums/kenyan-law-section.enum.ts

/**
 * Kenyan Law Section Enum
 *
 * References specific sections of Law of Succession Act (Cap 160)
 */
export enum KenyanLawSection {
  // Dependant Provisions
  S26_DEPENDANTS = 'S26_DEPENDANTS', // Court may make provision for dependants
  S29_DEPENDANTS = 'S29_DEPENDANTS', // Who is a dependant

  // Intestate Succession
  S35_INTESTATE = 'S35_INTESTATE', // Spouse and children shares
  S35_3_HOTCHPOT = 'S35_3_HOTCHPOT', // Hotchpot rule for gifts

  // Polygamy
  S40_POLYGAMOUS = 'S40_POLYGAMOUS', // Polygamous succession

  // Debts
  S45_DEBTS = 'S45_DEBTS', // Order of payment of debts

  // Executors & Administrators
  S83_EXECUTOR_DUTIES = 'S83_EXECUTOR_DUTIES', // Duties of personal representatives
}

/**
 * Kenyan Law Section Helper
 */
export class KenyanLawSectionHelper {
  /**
   * Get section description
   */
  static getDescription(section: KenyanLawSection): string {
    const descriptions: Record<KenyanLawSection, string> = {
      [KenyanLawSection.S26_DEPENDANTS]: 'S.26: Court may make provision for dependants',
      [KenyanLawSection.S29_DEPENDANTS]: 'S.29: Who is a dependant',
      [KenyanLawSection.S35_INTESTATE]: 'S.35: Distribution on intestacy',
      [KenyanLawSection.S35_3_HOTCHPOT]: 'S.35(3): Hotchpot rule for gifts',
      [KenyanLawSection.S40_POLYGAMOUS]: 'S.40: Succession in polygamous unions',
      [KenyanLawSection.S45_DEBTS]: 'S.45: Order of payment of debts',
      [KenyanLawSection.S83_EXECUTOR_DUTIES]: 'S.83: Duties of personal representatives',
    };
    return descriptions[section] || 'Unknown section';
  }

  /**
   * Check if section relates to dependants
   */
  static isDependantSection(section: KenyanLawSection): boolean {
    return [KenyanLawSection.S26_DEPENDANTS, KenyanLawSection.S29_DEPENDANTS].includes(section);
  }

  /**
   * Check if section relates to intestate succession
   */
  static isIntestateSection(section: KenyanLawSection): boolean {
    return [
      KenyanLawSection.S35_INTESTATE,
      KenyanLawSection.S35_3_HOTCHPOT,
      KenyanLawSection.S40_POLYGAMOUS,
    ].includes(section);
  }
}
