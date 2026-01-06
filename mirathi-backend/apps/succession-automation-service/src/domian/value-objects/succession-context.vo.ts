export class SuccessionContext {
  constructor(
    public readonly regime: 'TESTATE' | 'INTESTATE' | 'PARTIALLY_INTESTATE',
    public readonly religion: 'STATUTORY' | 'ISLAMIC' | 'HINDU' | 'CUSTOMARY',
    public readonly marriageType: 'MONOGAMOUS' | 'POLYGAMOUS' | 'COHABITATION' | 'SINGLE',
    public readonly targetCourt:
      | 'HIGH_COURT'
      | 'MAGISTRATE_COURT'
      | 'KADHIS_COURT'
      | 'CUSTOMARY_COURT',
    public readonly estateValue: number,
    public readonly hasMinors: boolean,
    public readonly isPolygamous: boolean,
    public readonly numberOfWives: number,
    public readonly numberOfChildren: number,
  ) {}

  isComplexCase(): boolean {
    return (
      this.estateValue > 1000000 ||
      this.isPolygamous ||
      this.hasMinors ||
      this.religion === 'ISLAMIC'
    );
  }

  requiresGuardianship(): boolean {
    return this.hasMinors;
  }

  getRequiredForms(): string[] {
    const forms: string[] = [];

    if (this.regime === 'TESTATE') {
      forms.push('PA1_PROBATE');
    } else {
      if (this.estateValue < 500000) {
        forms.push('PA5_SUMMARY');
      } else {
        forms.push('PA80_INTESTATE');
      }
    }

    forms.push('PA12_AFFIDAVIT_MEANS');

    if (this.numberOfChildren > 0 || this.marriageType === 'POLYGAMOUS') {
      forms.push('PA38_FAMILY_CONSENT');
    }

    if (this.regime === 'INTESTATE') {
      forms.push('CHIEFS_LETTER');
    }

    if (this.religion === 'ISLAMIC') {
      forms.push('ISLAMIC_PETITION');
    }

    return forms;
  }
}
