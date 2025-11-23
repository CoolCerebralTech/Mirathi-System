import { GrantType } from '@prisma/client';

export interface RequiredForm {
  code: string;
  name: string;
  mandatory: boolean;
  description?: string;
  statutoryBasis?: string;
}

export class GrantApplicationType {
  private readonly type: GrantType;
  private readonly hasWill: boolean;
  private readonly isIntestate: boolean;

  constructor(type: GrantType) {
    this.type = type;
    this.hasWill = this.determineIfWillRequired();
    this.isIntestate = type === 'LETTERS_OF_ADMINISTRATION';
  }

  private determineIfWillRequired(): boolean {
    return ['PROBATE', 'LETTERS_OF_ADMINISTRATION_WITH_WILL'].includes(this.type);
  }

  /**
   * Returns detailed form requirements based on Probate & Administration Rules
   */
  getRequiredForms(): RequiredForm[] {
    const commonForms: RequiredForm[] = [
      {
        code: 'P&A 5',
        name: 'Affidavit of Means',
        mandatory: true,
        description: 'Sworn statement of estate assets and liabilities',
        statutoryBasis: 'Probate and Administration Rules, Rule 7(2)',
      },
      {
        code: 'P&A 12',
        name: 'Affidavit of Justification by Sureties',
        mandatory: !this.hasWill,
        description: 'Sureties justify their ability to cover estate value',
        statutoryBasis: 'Probate and Administration Rules, Rule 25',
      },
    ];

    const specificForms: Record<GrantType, RequiredForm[]> = {
      PROBATE: [
        {
          code: 'P&A 1',
          name: 'Petition for Grant of Probate',
          mandatory: true,
          statutoryBasis: 'Probate and Administration Rules, Rule 4',
        },
        {
          code: 'P&A 3',
          name: 'Affidavit in Support of Probate',
          mandatory: true,
          description: 'Supporting affidavit for probate application',
        },
      ],
      LETTERS_OF_ADMINISTRATION: [
        {
          code: 'P&A 80',
          name: 'Petition for Letters of Administration (Intestate)',
          mandatory: true,
          statutoryBasis: 'Probate and Administration Rules, Rule 22',
        },
        {
          code: 'P&A 85',
          name: 'Consent of Heirs',
          mandatory: true,
          description: 'Consent from all persons equally entitled to administration',
        },
      ],
      LETTERS_OF_ADMINISTRATION_WITH_WILL: [
        {
          code: 'P&A 79',
          name: 'Petition for Grant with Will Annexed',
          mandatory: true,
          statutoryBasis: 'Probate and Administration Rules, Rule 20',
        },
      ],
      LIMITED_GRANT: [
        {
          code: 'P&A 80A',
          name: 'Petition for Limited Grant',
          mandatory: true,
          description: 'For collection, preservation, or specific purpose',
        },
      ],
      SPECIAL_GRANT: [
        {
          code: 'P&A 81',
          name: 'Petition for Special Grant',
          mandatory: true,
          description: 'For temporary administration or preservation',
        },
      ],
    };

    return [...(specificForms[this.type] || []), ...commonForms];
  }

  /**
   * Gets required supporting documents
   */
  getRequiredDocuments(): string[] {
    const baseDocs = ['Death Certificate', 'Applicant National ID', 'Passport Photos of Applicant'];

    if (this.requiresOriginalWill()) {
      baseDocs.push('Original Will and Testament');
    }

    if (this.requiresChiefLetter()) {
      baseDocs.push("Chief's Letter confirming next-of-kin");
    }

    if (this.requiresConsents()) {
      baseDocs.push('Consents from all persons equally entitled');
    }

    if (this.requiresInventory()) {
      baseDocs.push('Schedule of Assets and Liabilities');
    }

    return baseDocs;
  }

  requiresOriginalWill(): boolean {
    return this.hasWill;
  }

  requiresChiefLetter(): boolean {
    return this.isIntestate;
  }

  requiresConsents(): boolean {
    return this.isIntestate || this.type === 'LETTERS_OF_ADMINISTRATION_WITH_WILL';
  }

  requiresInventory(): boolean {
    return true; // Always required for proper administration
  }

  requiresSureties(): boolean {
    return !this.hasWill; // Sureties required for intestate succession
  }

  getApplicationFee(): number {
    // Based on Kenyan Court Fees (simplified - actual fees vary by court)
    const fees: Record<GrantType, number> = {
      PROBATE: 1050,
      LETTERS_OF_ADMINISTRATION: 1050,
      LETTERS_OF_ADMINISTRATION_WITH_WILL: 1050,
      LIMITED_GRANT: 500,
      SPECIAL_GRANT: 500,
    };

    return fees[this.type] || 1050;
  }

  getValue(): GrantType {
    return this.type;
  }

  getDescription(): string {
    const descriptions: Record<GrantType, string> = {
      PROBATE: 'Grant where deceased left a valid Will and executor is willing to act',
      LETTERS_OF_ADMINISTRATION: 'Grant where deceased died intestate (without a Will)',
      LETTERS_OF_ADMINISTRATION_WITH_WILL:
        'Grant where Will exists but no executor appointed or willing to act',
      LIMITED_GRANT: 'Grant for specific purpose like collecting debts or filing suit',
      SPECIAL_GRANT: 'Grant for temporary administration or preservation of estate',
    };

    return descriptions[this.type];
  }
}
