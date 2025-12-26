// src/estate-service/src/domain/value-objects/succession-law-section.vo.ts
import { ValueObject } from '../base/value-object';

/**
 * Succession Law Section Value Object
 *
 * Encapsulates sections from the Law of Succession Act (Cap 160)
 * Critical for:
 * - Determining which legal provision applies
 * - Calculating inheritance shares
 * - Validating distribution rules
 */
export interface LawSectionProps {
  section: string; // e.g., "35", "40", "45"
  subsection?: string; // e.g., "(3)", "(a)"
  description: string;
}

export class SuccessionLawSectionVO extends ValueObject<LawSectionProps> {
  // Major sections from Law of Succession Act
  static readonly S26 = new SuccessionLawSectionVO({
    section: '26',
    description: 'Provision for Dependants - Court may award reasonable provision',
  });

  static readonly S29 = new SuccessionLawSectionVO({
    section: '29',
    description: 'Dependants entitled to reasonable provision',
  });

  static readonly S35 = new SuccessionLawSectionVO({
    section: '35',
    description: 'Distribution on intestacy - Spouse and children',
  });

  static readonly S40 = new SuccessionLawSectionVO({
    section: '40',
    description: 'Polygamous marriages - Distribution per house',
  });

  static readonly S45 = new SuccessionLawSectionVO({
    section: '45',
    description: 'Order of payment of debts - Funeral expenses first',
  });

  static readonly S70 = new SuccessionLawSectionVO({
    section: '70',
    description: 'Testamentary guardian - Appointment by will',
  });

  static readonly S83 = new SuccessionLawSectionVO({
    section: '83',
    description: 'Duties of executor - Collect assets, pay debts, distribute',
  });

  constructor(props: LawSectionProps) {
    super(props);
  }

  protected validate(): void {
    const sectionNum = parseInt(this.props.section);

    if (isNaN(sectionNum) || sectionNum < 1 || sectionNum > 100) {
      throw new ValueObjectValidationError(
        `Invalid law section number: ${this.props.section}`,
        'section',
      );
    }

    if (!this.props.description || this.props.description.trim().length === 0) {
      throw new ValueObjectValidationError('Law section must have a description', 'description');
    }
  }

  /**
   * Get full section reference (e.g., "S.35(3)")
   */
  getFullReference(): string {
    const base = `S.${this.props.section}`;
    return this.props.subsection ? `${base}${this.props.subsection}` : base;
  }

  /**
   * Check if this section relates to intestate succession
   */
  isIntestateSection(): boolean {
    return ['35', '40'].includes(this.props.section);
  }

  /**
   * Check if this section relates to dependants' provision
   */
  isDependantSection(): boolean {
    return ['26', '29'].includes(this.props.section);
  }

  /**
   * Check if this section relates to debt priority
   */
  isDebtSection(): boolean {
    return this.props.section === '45';
  }

  /**
   * Check if this section applies to polygamous marriages
   */
  isPolygamySection(): boolean {
    return this.props.section === '40';
  }

  /**
   * Get subsection for specific clauses
   */
  withSubsection(subsection: string): SuccessionLawSectionVO {
    return new SuccessionLawSectionVO({
      ...this.props,
      subsection: subsection.startsWith('(') ? subsection : `(${subsection})`,
    });
  }

  /**
   * Parse from string (e.g., "S.35(3)" or "Section 40")
   */
  static fromString(input: string): SuccessionLawSectionVO {
    const match = input.match(/S?\.?\s*(\d+)(?:\(([a-zA-Z0-9]+)\))?/i);

    if (!match) {
      throw new ValueObjectValidationError(`Invalid law section format: ${input}`, 'section');
    }

    const section = match[1];
    const subsection = match[2] ? `(${match[2]})` : undefined;

    // Find matching section from predefined ones
    const predefined = [
      SuccessionLawSectionVO.S26,
      SuccessionLawSectionVO.S29,
      SuccessionLawSectionVO.S35,
      SuccessionLawSectionVO.S40,
      SuccessionLawSectionVO.S45,
      SuccessionLawSectionVO.S70,
      SuccessionLawSectionVO.S83,
    ];

    const baseSection = predefined.find((s) => s.props.section === section);

    if (!baseSection) {
      throw new ValueObjectValidationError(`Unknown law section: ${section}`, 'section');
    }

    return subsection ? baseSection.withSubsection(subsection) : baseSection;
  }

  equals(other: SuccessionLawSectionVO): boolean {
    return (
      this.props.section === other.props.section && this.props.subsection === other.props.subsection
    );
  }

  toJSON(): Record<string, any> {
    return {
      fullReference: this.getFullReference(),
      section: this.props.section,
      subsection: this.props.subsection,
      description: this.props.description,
      category: this.getCategory(),
    };
  }

  private getCategory(): string {
    if (this.isIntestateSection()) return 'INTESTATE_DISTRIBUTION';
    if (this.isDependantSection()) return 'DEPENDANT_PROVISION';
    if (this.isDebtSection()) return 'DEBT_PRIORITY';
    if (this.isPolygamySection()) return 'POLYGAMY';
    return 'GENERAL';
  }
}
