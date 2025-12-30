// src/estate-service/src/domain/enums/will-type.enum.ts
/**
 * Will Type Enum
 *
 * Represents different types of wills recognized in Kenya
 *
 * Legal Context:
 * - STANDARD: Single testator, standard will
 * - JOINT: Two or more persons in same document (rare in Kenya)
 * - MUTUAL: Reciprocal wills between spouses
 * - HOLOGRAPHIC: Handwritten by testator (valid if meets S.11)
 * - INTERNATIONAL: Cross-border elements
 * - TESTAMENTARY_TRUST_WILL: Creates trust upon death
 */
export enum WillType {
  STANDARD = 'STANDARD',
  JOINT = 'JOINT',
  MUTUAL = 'MUTUAL',
  HOLOGRAPHIC = 'HOLOGRAPHIC',
  INTERNATIONAL = 'INTERNATIONAL',
  TESTAMENTARY_TRUST_WILL = 'TESTAMENTARY_TRUST_WILL',
}

/**
 * Check if will type requires additional legal formalities
 */
export function getWillTypeRequirements(type: WillType): string[] {
  const requirements: Record<WillType, string[]> = {
    [WillType.STANDARD]: ['2 witnesses', 'Testator signature'],
    [WillType.JOINT]: [
      'Each testator must sign separately',
      '2 witnesses for each testator',
      'Clear indication of which parts belong to which testator',
    ],
    [WillType.MUTUAL]: [
      '2 witnesses',
      'Clear reciprocal provisions',
      'May need separate execution for each spouse',
    ],
    [WillType.HOLOGRAPHIC]: [
      "Entirely in testator's handwriting",
      'Dated and signed',
      'May require proof of handwriting',
    ],
    [WillType.INTERNATIONAL]: [
      'Conflict of laws analysis',
      'Multiple jurisdiction compliance',
      'May need notarization/apostille',
    ],
    [WillType.TESTAMENTARY_TRUST_WILL]: [
      '2 witnesses',
      'Clear trust terms',
      'Named trustees',
      'May require separate trust deed',
    ],
  };

  return requirements[type] || [];
}

/**
 * Get Kenyan legal basis for will type
 */
export function getWillTypeLegalBasis(type: WillType): string {
  const legalBasis: Record<WillType, string> = {
    [WillType.STANDARD]: 'Law of Succession Act, Section 11',
    [WillType.JOINT]: 'Law of Succession Act, Section 11 (interpreted)',
    [WillType.MUTUAL]: 'Law of Succession Act, Section 11',
    [WillType.HOLOGRAPHIC]: 'Law of Succession Act, Section 11(3)',
    [WillType.INTERNATIONAL]: 'Law of Succession Act + Conflict of Laws',
    [WillType.TESTAMENTARY_TRUST_WILL]: 'Law of Succession Act + Trustees Act',
  };

  return legalBasis[type];
}
