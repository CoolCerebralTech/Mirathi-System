import { RiskCategory, RiskSeverity, SuccessionRegime } from '@prisma/client';

export class LegalRequirement {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly legalBasis: string, // e.g., "Section 45 LSA"
    public readonly category: RiskCategory,
    public readonly severity: RiskSeverity,
    public readonly isMandatoryForFiling: boolean, // If true, blocks 'FILING' phase
    public readonly appliesToRegimes: SuccessionRegime[],
  ) {}

  appliesTo(regime: SuccessionRegime): boolean {
    return this.appliesToRegimes.includes(regime);
  }

  /**
   * Returns true if this requirement is missing and would cause a rejection at the court registry.
   */
  isRegistryBlocker(): boolean {
    return this.severity === RiskSeverity.CRITICAL || this.isMandatoryForFiling;
  }

  static createStandardRequirements(): LegalRequirement[] {
    return [
      new LegalRequirement(
        'Death Certificate',
        'Original Death Certificate required to prove jurisdiction.',
        'Cap 160 Rule 7',
        RiskCategory.MISSING_DOCUMENT, // Corrected from VALID Enum
        RiskSeverity.CRITICAL,
        true,
        [
          SuccessionRegime.TESTATE,
          SuccessionRegime.INTESTATE,
          SuccessionRegime.PARTIALLY_INTESTATE,
        ],
      ),
      new LegalRequirement(
        'Letter from Area Chief',
        'Required to prove next of kin for intestate cases.',
        'Practice Direction',
        RiskCategory.MISSING_DOCUMENT, // Corrected from VALID Enum
        RiskSeverity.CRITICAL,
        true,
        [SuccessionRegime.INTESTATE, SuccessionRegime.PARTIALLY_INTESTATE],
      ),
      new LegalRequirement(
        'Search of Will',
        'Proof that no will exists or the will presented is the last one.',
        'Section 24 LSA',
        RiskCategory.MISSING_DOCUMENT, // Changed: It's a missing "Letter of Search"
        RiskSeverity.HIGH,
        false,
        [SuccessionRegime.INTESTATE],
      ),
      new LegalRequirement(
        'Consent of Household',
        'Signatures of all adults in the household (P&A 38).',
        'Rule 26(1)',
        RiskCategory.MISSING_DOCUMENT, // Changed: It's a missing "Form P&A 38"
        RiskSeverity.HIGH,
        true,
        [SuccessionRegime.INTESTATE],
      ),
      new LegalRequirement(
        'Tax Clearance Certificate',
        'KRA Tax compliance status for the deceased.',
        'Tax Procedures Act',
        RiskCategory.TAX_CLEARANCE, // Corrected to valid Enum
        RiskSeverity.MEDIUM,
        false,
        [SuccessionRegime.TESTATE, SuccessionRegime.INTESTATE],
      ),
    ];
  }
}
