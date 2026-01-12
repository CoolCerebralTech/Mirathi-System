import { KenyanFormType } from '@prisma/client';

import { SuccessionContext } from '../value-objects/succession-context.vo';

export interface FormMetadata {
  type: KenyanFormType;
  title: string;
  code: string;
  purpose: string;
  instructions: string[];
}

export class ProbateFormFactoryService {
  public getRequiredForms(context: SuccessionContext): FormMetadata[] {
    const requiredTypes = context.getRequiredForms();
    return requiredTypes.map((type) => this.getMetadata(type));
  }

  private getMetadata(type: KenyanFormType): FormMetadata {
    switch (type) {
      case KenyanFormType.PA1_PROBATE:
        return {
          type,
          title: 'Petition for Probate',
          code: 'P&A 1',
          purpose: 'Petition by executor named in a will.',
          instructions: ['Attach original Will', 'Attach Death Cert'],
        };
      case KenyanFormType.PA80_INTESTATE:
        return {
          type,
          title: 'Petition for Letters of Administration',
          code: 'P&A 80',
          purpose: 'Petition for intestate estate (no will).',
          instructions: ['Attach Chief Letter', 'Attach Death Cert', 'List all survivors'],
        };
      case KenyanFormType.PA5_SUMMARY:
        return {
          type,
          title: 'Summary Administration',
          code: 'P&A 5',
          purpose: 'Simplified process for small estates.',
          instructions: ['List assets < 500k', 'Attach Death Cert'],
        };
      case KenyanFormType.PA12_AFFIDAVIT_MEANS:
        return {
          type,
          title: 'Affidavit of Means',
          code: 'P&A 12',
          purpose: ' sworn statement of assets and liabilities.',
          instructions: ['List every asset value', 'List debts'],
        };
      default:
        return {
          type,
          title: 'Legal Form',
          code: 'GEN',
          purpose: 'Required court document',
          instructions: [],
        };
    }
  }
}
