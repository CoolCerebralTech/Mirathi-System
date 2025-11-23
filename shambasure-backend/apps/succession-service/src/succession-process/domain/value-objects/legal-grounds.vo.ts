import { DisputeGrounds } from '../../../common/types/kenyan-law.types';

export class LegalGrounds {
  private readonly ground: DisputeGrounds;
  private readonly description: string;
  private readonly supportingEvidence: string[];

  constructor(ground: DisputeGrounds, description: string, supportingEvidence: string[] = []) {
    if (description.length < 20) {
      throw new Error('Legal grounds must contain a detailed description (min 20 chars).');
    }

    if (supportingEvidence.length === 0) {
      throw new Error('Legal grounds must be supported by at least one piece of evidence.');
    }

    this.ground = ground;
    this.description = description;
    this.supportingEvidence = supportingEvidence;
  }

  // Section 76: Revocation of Grant grounds
  isValidGroundForRevocation(): boolean {
    const revocationGrounds: DisputeGrounds[] = [
      'FRAUD',
      'CONCEALMENT_OF_FACT',
      'FALSE_STATEMENT',
      'DEFECTIVE_PROCESS',
      'FORGERY',
      'PROCEDURAL_IRREGULARITY',
    ];

    return revocationGrounds.includes(this.ground);
  }

  // Section 7: Testamentary capacity grounds
  isValidForWillChallenge(): boolean {
    const willChallengeGrounds: DisputeGrounds[] = [
      'LACK_CAPACITY',
      'UNDUE_INFLUENCE',
      'FRAUD',
      'FORGERY',
      'IMPROPER_EXECUTION',
    ];

    return willChallengeGrounds.includes(this.ground);
  }

  // Section 26: Dependant's provision grounds
  isValidForDependantsApplication(): boolean {
    const dependantGrounds: DisputeGrounds[] = [
      'OMITTED_HEIR',
      'INADEQUATE_PROVISION',
      'DEPENDANT_MAINTENANCE',
    ];

    return dependantGrounds.includes(this.ground);
  }

  getSupportingEvidence(): string[] {
    return [...this.supportingEvidence];
  }

  addSupportingEvidence(evidence: string): void {
    this.supportingEvidence.push(evidence);
  }

  getSummary(): string {
    return `Ground: ${this.ground} - ${this.description.substring(0, 50)}...`;
  }

  getLegalBasis(): string {
    const basisMap: Record<DisputeGrounds, string> = {
      FRAUD: 'Law of Succession Act, Section 76(a)',
      CONCEALMENT_OF_FACT: 'Law of Succession Act, Section 76(b)',
      FALSE_STATEMENT: 'Law of Succession Act, Section 76(c)',
      DEFECTIVE_PROCESS: 'Law of Succession Act, Section 76(d)',
      LACK_CAPACITY: 'Law of Succession Act, Section 7',
      UNDUE_INFLUENCE: 'Law of Succession Act, Section 7',
      FORGERY: 'Penal Code, Section 345',
      OMITTED_HEIR: 'Law of Succession Act, Section 26',
      IMPROPER_EXECUTION: 'Law of Succession Act, Section 11',
      PROCEDURAL_IRREGULARITY: 'Civil Procedure Rules',
      INADEQUATE_PROVISION: 'Law of Succession Act, Section 26',
      DEPENDANT_MAINTENANCE: 'Law of Succession Act, Section 26',
      ASSET_VALUATION: 'Law of Succession Act, Section 83',
      EXECUTOR_MISCONDUCT: 'Law of Succession Act, Section 83(h)',
      OTHER: 'Various applicable laws',
      AMBIGUOUS_TERMS: 'Applicable Kenyan Law',
      CONTRADICTORY_CLAUSES: 'Applicable Kenyan Law',
      REVOCATION_ISSUE: 'Applicable Kenyan Law',
    };

    return basisMap[this.ground] || 'Applicable Kenyan Law';
  }
}
