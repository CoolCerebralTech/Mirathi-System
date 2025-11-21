import { GrantType } from '@prisma/client';

export interface RequiredForm {
  code: string; // e.g. "P&A 1"
  name: string; // e.g. "Petition for Grant of Probate"
  mandatory: boolean;
}

export class GrantApplicationType {
  private readonly type: GrantType;
  private readonly hasWill: boolean;

  constructor(type: GrantType) {
    this.type = type;
    this.hasWill = this.determineIfWillRequired();
  }

  private determineIfWillRequired(): boolean {
    return ['PROBATE', 'LETTERS_OF_ADMINISTRATION_WITH_WILL'].includes(this.type);
  }

  /**
   * Returns the list of Judiciary Forms required to file this case.
   * Based on the Probate & Administration Rules.
   */
  getRequiredForms(): RequiredForm[] {
    const commonForms = [
      { code: 'P&A 5', name: 'Affidavit of Means', mandatory: true },
      { code: 'P&A 11', name: 'Affidavit of Justification (Sureties)', mandatory: !this.hasWill }, // Sureties usually needed for Intestacy
    ];

    switch (this.type) {
      case 'PROBATE':
        return [
          { code: 'P&A 1', name: 'Petition for Probate', mandatory: true },
          { code: 'P&A 3', name: 'Affidavit in Support', mandatory: true },
          ...commonForms,
        ];
      case 'LETTERS_OF_ADMINISTRATION':
        return [
          {
            code: 'P&A 80',
            name: 'Petition for Letters of Administration (Intestate)',
            mandatory: true,
          },
          { code: 'P&A 12', name: 'Guarantee of Personal Sureties', mandatory: true },
          ...commonForms,
        ];
      case 'LIMITED_GRANT':
        return [
          { code: 'P&A 80A', name: 'Petition for Limited Grant', mandatory: true },
          ...commonForms,
        ];
      default:
        return commonForms;
    }
  }

  requiresOriginalWill(): boolean {
    return this.hasWill;
  }

  requiresChiefLetter(): boolean {
    // Usually required for Intestacy to prove next-of-kin hierarchy
    return this.type === 'LETTERS_OF_ADMINISTRATION';
  }

  getValue(): GrantType {
    return this.type;
  }
}
