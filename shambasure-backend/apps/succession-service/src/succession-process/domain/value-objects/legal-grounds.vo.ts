import { DisputeGrounds } from '../../../common/types/kenyan-law.types';

export class LegalGrounds {
  private readonly ground: DisputeGrounds;
  private readonly description: string;
  private readonly evidenceRef?: string[];

  constructor(ground: DisputeGrounds, description: string, evidenceRef: string[] = []) {
    if (description.length < 20) {
      throw new Error('Legal grounds must contain a detailed description (min 20 chars).');
    }
    this.ground = ground;
    this.description = description;
    this.evidenceRef = evidenceRef;
  }

  isValidGroundForRevocation(): boolean {
    // Section 76: Revocation of Grant
    const valid = [
      'FRAUD',
      'CONCEALMENT_OF_FACT', // Material fact concealed
      'FALSE_STATEMENT', // Untrue allegation
      'DEFECTIVE_PROCESS', // Grant produced in ignorance of law
    ];
    // Mapping our DisputeGrounds enum to Section 76 concepts
    return valid.some(
      (v) => this.ground.includes(v) || this.ground === 'FORGERY' || this.ground === 'OMITTED_HEIR',
    );
  }

  getSummary(): string {
    return `Ground: ${this.ground} - ${this.description.substring(0, 50)}...`;
  }
}
