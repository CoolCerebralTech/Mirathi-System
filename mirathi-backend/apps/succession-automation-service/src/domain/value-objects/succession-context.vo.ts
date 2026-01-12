import {
  CourtJurisdiction,
  KenyanFormType,
  MarriageType,
  SuccessionRegime,
  SuccessionReligion,
} from '@prisma/client';

// Assuming types are generated here

export class SuccessionContext {
  private static readonly SUMMARY_ADMIN_THRESHOLD = 500_000; // KES 500k (Section 49 LSA)

  constructor(
    public readonly regime: SuccessionRegime,
    public readonly religion: SuccessionReligion,
    public readonly marriageType: MarriageType,
    public readonly estateValue: number, // In KES
    public readonly hasMinors: boolean,
    public readonly isPolygamous: boolean,
    public readonly numberOfWives: number,
    public readonly numberOfChildren: number,
    public readonly hasDisputes: boolean = false,
  ) {}

  /**
   * Determines the correct court based on Religion and Pecuniary Jurisdiction.
   * - Islamic Law -> Kadhi's Court (Article 170 Constitution)
   * - Estate < 500k -> Magistrate Court (Summary Admin)
   * - Estate > 500k -> High Court (Standard Practice for Grants)
   */
  get targetCourt(): CourtJurisdiction {
    if (this.religion === SuccessionReligion.ISLAMIC) {
      return CourtJurisdiction.KADHIS_COURT;
    }

    if (this.religion === SuccessionReligion.CUSTOMARY && this.estateValue < 100_000) {
      // Very small estates in remote areas might use Customary/Elders, but formally:
      return CourtJurisdiction.MAGISTRATE_COURT;
    }

    // Section 49 - Summary Administration
    if (this.estateValue <= SuccessionContext.SUMMARY_ADMIN_THRESHOLD) {
      return CourtJurisdiction.MAGISTRATE_COURT;
    }

    return CourtJurisdiction.HIGH_COURT;
  }

  /**
   * Checks if the case is "Complex" requiring extra legal oversight.
   */
  isComplexCase(): boolean {
    return (
      this.hasDisputes ||
      this.isPolygamous || // Section 40 Application
      this.hasMinors || // Section 35(3) Life Interest / Guardianship
      this.estateValue > 20_000_000 || // High value risk
      this.religion === SuccessionReligion.ISLAMIC // Specific Quranic shares
    );
  }

  requiresGuardianship(): boolean {
    return this.hasMinors;
  }

  /**
   * Determines the strict list of forms required by the Judiciary.
   */
  getRequiredForms(): KenyanFormType[] {
    const forms: KenyanFormType[] = [];

    // 1. Primary Petition
    if (this.religion === SuccessionReligion.ISLAMIC) {
      forms.push(KenyanFormType.ISLAMIC_PETITION);
    } else if (this.regime === SuccessionRegime.TESTATE) {
      forms.push(KenyanFormType.PA1_PROBATE); // Petition for Probate
    } else {
      // Intestate
      if (this.estateValue <= SuccessionContext.SUMMARY_ADMIN_THRESHOLD) {
        forms.push(KenyanFormType.PA5_SUMMARY); // Section 49
      } else {
        forms.push(KenyanFormType.PA80_INTESTATE); // Full Grant
      }
    }

    // 2. Asset Disclosure
    forms.push(KenyanFormType.PA12_AFFIDAVIT_MEANS);

    // 3. Family Consents (Crucial for Intestate)
    // If there are other beneficiaries, they must consent to the administrator
    if (
      this.regime === SuccessionRegime.INTESTATE &&
      (this.numberOfChildren > 0 || this.numberOfWives > 0 || this.isPolygamous)
    ) {
      forms.push(KenyanFormType.PA38_FAMILY_CONSENT);
    }

    // 4. Administrative Requirements
    if (this.regime === SuccessionRegime.INTESTATE) {
      forms.push(KenyanFormType.CHIEFS_LETTER); // Proof of kinship
    }

    return forms;
  }

  /**
   * Returns a description of the legal regime application (Educational)
   */
  getLegalNarrative(): string {
    if (this.isPolygamous) {
      return 'Applied Law: Section 40 of Law of Succession Act (Distribution by Houses).';
    }
    if (this.regime === SuccessionRegime.INTESTATE && !this.isPolygamous) {
      return this.hasMinors
        ? 'Applied Law: Section 35 (Spouse with Children) - Life Interest to Spouse.'
        : 'Applied Law: Section 36 (Spouse without Children) - Absolute Interest to Spouse.';
    }
    return 'Applied Law: Testamentary Disposition (The Will rules).';
  }
}
