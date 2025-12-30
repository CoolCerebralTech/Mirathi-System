// src/estate-service/src/domain/value-objects/succession-law-section.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

export interface LawSectionProps {
  section: string;
  subsection?: string;
  description: string;
}

/**
 * Succession Law Section
 *
 * Maps business logic triggers to specific sections of Cap 160.
 */
export class SuccessionLawSectionVO extends ValueObject<LawSectionProps> {
  static readonly S26_DEPENDANT = new SuccessionLawSectionVO({
    section: '26',
    description: 'Provision for Dependants - Triggers Risk Assessment',
  });

  static readonly S35_INTESTACY = new SuccessionLawSectionVO({
    section: '35',
    description: 'Distribution to Spouse and Children',
  });

  // The Hotchpot Rule - Critical for GiftInterVivos
  static readonly S35_3_HOTCHPOT = new SuccessionLawSectionVO({
    section: '35',
    subsection: '(3)',
    description: 'Hotchpot: Gifts Inter Vivos taken into account',
  });

  static readonly S45_DEBTS = new SuccessionLawSectionVO({
    section: '45',
    description: 'Order of Payment of Debts',
  });

  constructor(props: LawSectionProps) {
    super(props);
  }

  protected validate(): void {
    if (!this.props.section) throw new ValueObjectValidationError('Section required', 'section');
  }

  getFullReference(): string {
    return `S.${this.props.section}${this.props.subsection || ''}`;
  }

  /**
   * Identifies if this section requires adding "Phantom Value" (Gifts)
   * back to the estate before calculation.
   */
  isHotchpotRule(): boolean {
    return this.props.section === '35' && this.props.subsection === '(3)';
  }

  toJSON(): Record<string, any> {
    return {
      reference: this.getFullReference(),
      description: this.props.description,
    };
  }
}
