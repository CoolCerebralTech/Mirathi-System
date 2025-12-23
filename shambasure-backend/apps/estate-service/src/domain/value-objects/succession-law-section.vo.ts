// domain/value-objects/succession-law-section.vo.ts
import { SimpleValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Succession Law Section Value Object
 *
 * References to Law of Succession Act (Cap 160) sections
 *
 * Critical Sections for Estate Distribution:
 * - S.26: Dependants' provision (court can override will)
 * - S.29: Who qualifies as dependant
 * - S.35: Intestate succession (spouse/children shares)
 * - S.40: Polygamous marriage distribution
 * - S.45: Debt priority order
 * - S.70-73: Guardian provisions
 * - S.83: Executor duties and liabilities
 *
 * Business Value:
 * - Ensures legal traceability
 * - Links business rules to law
 * - Enables compliance reporting
 * - Helps executors understand obligations
 */

export enum KenyanLawSection {
  S26_DEPENDANT_PROVISION = 'S26_DEPENDANT_PROVISION',
  S29_DEPENDANTS = 'S29_DEPENDANTS',
  S35_SPOUSAL_CHILDS_SHARE = 'S35_SPOUSAL_CHILDS_SHARE',
  S40_POLYGAMY = 'S40_POLYGAMY',
  S45_DEBT_PRIORITY = 'S45_DEBT_PRIORITY',
  S70_TESTAMENTARY_GUARDIAN = 'S70_TESTAMENTARY_GUARDIAN',
  S71_COURT_GUARDIAN = 'S71_COURT_GUARDIAN',
  S72_GUARDIAN_BOND = 'S72_GUARDIAN_BOND',
  S73_GUARDIAN_ACCOUNTS = 'S73_GUARDIAN_ACCOUNTS',
  S83_EXECUTOR_DUTIES = 'S83_EXECUTOR_DUTIES',
}

export class SuccessionLawSection extends SimpleValueObject<KenyanLawSection> {
  private constructor(value: KenyanLawSection) {
    super(value);
  }

  public static create(value: string): SuccessionLawSection {
    const normalized = value.toUpperCase().replace(/\s+/g, '_');

    if (!Object.values(KenyanLawSection).includes(normalized as KenyanLawSection)) {
      throw new ValueObjectValidationError(`Invalid law section: ${value}`, 'lawSection');
    }

    return new SuccessionLawSection(normalized as KenyanLawSection);
  }

  // Factory methods for type safety
  public static s26DependantProvision(): SuccessionLawSection {
    return new SuccessionLawSection(KenyanLawSection.S26_DEPENDANT_PROVISION);
  }

  public static s29Dependants(): SuccessionLawSection {
    return new SuccessionLawSection(KenyanLawSection.S29_DEPENDANTS);
  }

  public static s35SpousalChildShare(): SuccessionLawSection {
    return new SuccessionLawSection(KenyanLawSection.S35_SPOUSAL_CHILDS_SHARE);
  }

  public static s40Polygamy(): SuccessionLawSection {
    return new SuccessionLawSection(KenyanLawSection.S40_POLYGAMY);
  }

  public static s45DebtPriority(): SuccessionLawSection {
    return new SuccessionLawSection(KenyanLawSection.S45_DEBT_PRIORITY);
  }

  public static s70TestamentaryGuardian(): SuccessionLawSection {
    return new SuccessionLawSection(KenyanLawSection.S70_TESTAMENTARY_GUARDIAN);
  }

  public static s83ExecutorDuties(): SuccessionLawSection {
    return new SuccessionLawSection(KenyanLawSection.S83_EXECUTOR_DUTIES);
  }

  protected validate(): void {
    if (!this.props.value) {
      throw new ValueObjectValidationError('Law section cannot be empty');
    }

    if (!Object.values(KenyanLawSection).includes(this.props.value)) {
      throw new ValueObjectValidationError(`Invalid law section: ${this.props.value}`);
    }
  }

  /**
   * Get full legal citation
   */
  public getFullCitation(): string {
    const sectionNumber = this.getSectionNumber();
    return `Section ${sectionNumber}, Law of Succession Act (Cap 160), Laws of Kenya`;
  }

  /**
   * Get section number (e.g., "26")
   */
  public getSectionNumber(): string {
    return this.value.split('_')[0].substring(1); // S26_... -> "26"
  }

  /**
   * Get description
   */
  public getDescription(): string {
    switch (this.value) {
      case KenyanLawSection.S26_DEPENDANT_PROVISION:
        return 'Court power to order provision for dependants (can override will)';
      case KenyanLawSection.S29_DEPENDANTS:
        return 'Definition of dependants (spouse, children, parents who were dependent)';
      case KenyanLawSection.S35_SPOUSAL_CHILDS_SHARE:
        return 'Intestate succession shares for spouse and children';
      case KenyanLawSection.S40_POLYGAMY:
        return 'Distribution in polygamous marriages (house-by-house allocation)';
      case KenyanLawSection.S45_DEBT_PRIORITY:
        return 'Order of payment for debts and liabilities';
      case KenyanLawSection.S70_TESTAMENTARY_GUARDIAN:
        return 'Appointment of guardians by will';
      case KenyanLawSection.S71_COURT_GUARDIAN:
        return 'Court appointment of guardians';
      case KenyanLawSection.S72_GUARDIAN_BOND:
        return 'Guardian bond requirements for property management';
      case KenyanLawSection.S73_GUARDIAN_ACCOUNTS:
        return 'Guardian duty to file annual accounts';
      case KenyanLawSection.S83_EXECUTOR_DUTIES:
        return 'Executor/Administrator duties and liabilities';
    }
  }

  /**
   * Check if section relates to distribution
   */
  public isDistributionSection(): boolean {
    return [KenyanLawSection.S35_SPOUSAL_CHILDS_SHARE, KenyanLawSection.S40_POLYGAMY].includes(
      this.value,
    );
  }

  /**
   * Check if section relates to dependants
   */
  public isDependantSection(): boolean {
    return [KenyanLawSection.S26_DEPENDANT_PROVISION, KenyanLawSection.S29_DEPENDANTS].includes(
      this.value,
    );
  }

  /**
   * Check if section relates to guardianship
   */
  public isGuardianshipSection(): boolean {
    return [
      KenyanLawSection.S70_TESTAMENTARY_GUARDIAN,
      KenyanLawSection.S71_COURT_GUARDIAN,
      KenyanLawSection.S72_GUARDIAN_BOND,
      KenyanLawSection.S73_GUARDIAN_ACCOUNTS,
    ].includes(this.value);
  }

  /**
   * Get related sections
   */
  public getRelatedSections(): KenyanLawSection[] {
    switch (this.value) {
      case KenyanLawSection.S26_DEPENDANT_PROVISION:
        return [KenyanLawSection.S29_DEPENDANTS];
      case KenyanLawSection.S29_DEPENDANTS:
        return [KenyanLawSection.S26_DEPENDANT_PROVISION];
      case KenyanLawSection.S35_SPOUSAL_CHILDS_SHARE:
        return [KenyanLawSection.S40_POLYGAMY, KenyanLawSection.S45_DEBT_PRIORITY];
      case KenyanLawSection.S40_POLYGAMY:
        return [KenyanLawSection.S35_SPOUSAL_CHILDS_SHARE];
      case KenyanLawSection.S70_TESTAMENTARY_GUARDIAN:
        return [
          KenyanLawSection.S71_COURT_GUARDIAN,
          KenyanLawSection.S72_GUARDIAN_BOND,
          KenyanLawSection.S73_GUARDIAN_ACCOUNTS,
        ];
      default:
        return [];
    }
  }

  /**
   * Get URL to Kenya Law Reports (if available)
   */
  public getKenyaLawURL(): string {
    const section = this.getSectionNumber();
    return `http://www.kenyalaw.org/kl/index.php?id=4139#${section}`;
  }

  public getDisplayName(): string {
    return `Section ${this.getSectionNumber()} (${this.value.split('_').slice(1).join(' ')})`;
  }
}
