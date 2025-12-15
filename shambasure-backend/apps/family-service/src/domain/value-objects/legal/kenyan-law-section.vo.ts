// domain/value-objects/legal/kenyan-law-section.vo.ts
import { ValueObject } from '../../base/value-object';

export type LawSection =
  | 'S26_DEPENDANT_PROVISION'
  | 'S29_DEPENDANTS'
  | 'S35_SPOUSAL_CHILDS_SHARE'
  | 'S40_POLY_GAMY'
  | 'S45_DEBT_PRIORITY'
  | 'S70_TESTAMENTARY_GUARDIAN'
  | 'S71_COURT_GUARDIAN'
  | 'S72_GUARDIAN_BOND'
  | 'S73_GUARDIAN_ACCOUNTS'
  | 'S83_EXECUTOR_DUTIES';

export interface KenyanLawSectionProps {
  section: LawSection;
  description: string;
  citation: string;
  effectiveDate: Date;
  amendedDate?: Date;
  isRepealed: boolean;
  repealDate?: Date;
  jurisdiction: string;
  notes?: string;
}

export class KenyanLawSection extends ValueObject<KenyanLawSectionProps> {
  private constructor(props: KenyanLawSectionProps) {
    super(props);
    this.validate();
  }

  static create(section: LawSection): KenyanLawSection {
    const sectionDetails = this.getSectionDetails(section);
    return new KenyanLawSection({
      ...sectionDetails,
      effectiveDate: new Date(1981, 6, 1), // Law of Succession Act effective date
      isRepealed: false,
      jurisdiction: 'KENYA',
    });
  }

  static createFromProps(props: KenyanLawSectionProps): KenyanLawSection {
    return new KenyanLawSection(props);
  }

  private static getSectionDetails(section: LawSection): {
    section: LawSection;
    description: string;
    citation: string;
  } {
    const sections: Record<LawSection, { description: string; citation: string }> = {
      S26_DEPENDANT_PROVISION: {
        description: 'Power of court to make provision for dependants',
        citation: 'Law of Succession Act, Section 26',
      },
      S29_DEPENDANTS: {
        description: 'Definition of dependants',
        citation: 'Law of Succession Act, Section 29',
      },
      S35_SPOUSAL_CHILDS_SHARE: {
        description: 'Distribution where intestate leaves one spouse and child or children',
        citation: 'Law of Succession Act, Section 35',
      },
      S40_POLY_GAMY: {
        description: 'Distribution where intestate was polygamous',
        citation: 'Law of Succession Act, Section 40',
      },
      S45_DEBT_PRIORITY: {
        description: 'Order of payment of debts',
        citation: 'Law of Succession Act, Section 45',
      },
      S70_TESTAMENTARY_GUARDIAN: {
        description: 'Testamentary guardian',
        citation: 'Law of Succession Act, Section 70',
      },
      S71_COURT_GUARDIAN: {
        description: 'Appointment of guardian by court',
        citation: 'Law of Succession Act, Section 71',
      },
      S72_GUARDIAN_BOND: {
        description: 'Guardian to give security',
        citation: 'Law of Succession Act, Section 72',
      },
      S73_GUARDIAN_ACCOUNTS: {
        description: 'Guardian to present accounts',
        citation: 'Law of Succession Act, Section 73',
      },
      S83_EXECUTOR_DUTIES: {
        description: 'Duties of executors and administrators',
        citation: 'Law of Succession Act, Section 83',
      },
    };

    return {
      section,
      ...sections[section],
    };
  }

  validate(): void {
    if (!this._value.section) {
      throw new Error('Law section is required');
    }

    if (!this._value.description || this._value.description.trim().length === 0) {
      throw new Error('Section description is required');
    }

    if (!this._value.citation || this._value.citation.trim().length === 0) {
      throw new Error('Legal citation is required');
    }

    if (!this._value.effectiveDate) {
      throw new Error('Effective date is required');
    }

    if (this._value.effectiveDate > new Date()) {
      throw new Error('Effective date cannot be in the future');
    }

    if (this._value.amendedDate && this._value.amendedDate < this._value.effectiveDate) {
      throw new Error('Amendment date cannot be before effective date');
    }

    if (this._value.isRepealed && !this._value.repealDate) {
      throw new Error('Repeal date is required for repealed sections');
    }

    if (this._value.repealDate && this._value.repealDate < this._value.effectiveDate) {
      throw new Error('Repeal date cannot be before effective date');
    }

    if (!this._value.jurisdiction || this._value.jurisdiction.trim().length === 0) {
      throw new Error('Jurisdiction is required');
    }
  }

  amend(amendmentDate: Date, notes?: string): KenyanLawSection {
    if (amendmentDate < this._value.effectiveDate) {
      throw new Error('Amendment date cannot be before effective date');
    }

    return new KenyanLawSection({
      ...this._value,
      amendedDate: amendmentDate,
      notes: notes || this._value.notes,
    });
  }

  repeal(repealDate: Date): KenyanLawSection {
    if (repealDate < this._value.effectiveDate) {
      throw new Error('Repeal date cannot be before effective date');
    }

    return new KenyanLawSection({
      ...this._value,
      isRepealed: true,
      repealDate,
    });
  }

  updateNotes(notes: string): KenyanLawSection {
    return new KenyanLawSection({
      ...this._value,
      notes,
    });
  }

  get section(): LawSection {
    return this._value.section;
  }

  get description(): string {
    return this._value.description;
  }

  get citation(): string {
    return this._value.citation;
  }

  get effectiveDate(): Date {
    return this._value.effectiveDate;
  }

  get amendedDate(): Date | undefined {
    return this._value.amendedDate;
  }

  get isRepealed(): boolean {
    return this._value.isRepealed;
  }

  get repealDate(): Date | undefined {
    return this._value.repealDate;
  }

  get jurisdiction(): string {
    return this._value.jurisdiction;
  }

  get notes(): string | undefined {
    return this._value.notes;
  }

  // Check if section applies to polygamous families
  get isPolygamyRelated(): boolean {
    return this._value.section === 'S40_POLY_GAMY';
  }

  // Check if section is about dependants
  get isDependantRelated(): boolean {
    return (
      this._value.section === 'S26_DEPENDANT_PROVISION' || this._value.section === 'S29_DEPENDANTS'
    );
  }

  // Check if section is about guardianship
  get isGuardianshipRelated(): boolean {
    return this._value.section.startsWith('S7');
  }

  // Check if section is about debt priority
  get isDebtPriorityRelated(): boolean {
    return this._value.section === 'S45_DEBT_PRIORITY';
  }

  // Get section number (extract from enum)
  get sectionNumber(): string {
    return this._value.section.split('_')[0].replace('S', '');
  }

  // Get full legal reference
  get fullReference(): string {
    const base = `Law of Succession Act, Section ${this.sectionNumber}`;
    if (this._value.amendedDate) {
      return `${base} (as amended on ${this._value.amendedDate.toLocaleDateString()})`;
    }
    return base;
  }

  // Check if section is currently in force
  get isInForce(): boolean {
    if (this._value.isRepealed) return false;
    return true;
  }

  // Get years since effective
  get yearsInForce(): number {
    const now = new Date();
    const years = now.getFullYear() - this._value.effectiveDate.getFullYear();
    return years;
  }

  toJSON() {
    return {
      section: this._value.section,
      description: this._value.description,
      citation: this._value.citation,
      effectiveDate: this._value.effectiveDate.toISOString(),
      amendedDate: this._value.amendedDate?.toISOString(),
      isRepealed: this._value.isRepealed,
      repealDate: this._value.repealDate?.toISOString(),
      jurisdiction: this._value.jurisdiction,
      notes: this._value.notes,
      isPolygamyRelated: this.isPolygamyRelated,
      isDependantRelated: this.isDependantRelated,
      isGuardianshipRelated: this.isGuardianshipRelated,
      isDebtPriorityRelated: this.isDebtPriorityRelated,
      sectionNumber: this.sectionNumber,
      fullReference: this.fullReference,
      isInForce: this.isInForce,
      yearsInForce: this.yearsInForce,
    };
  }
}
