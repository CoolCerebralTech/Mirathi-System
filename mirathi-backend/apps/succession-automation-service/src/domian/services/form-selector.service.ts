// =============================================================================
// 5. FORM SELECTOR SERVICE
// Determines which court forms are needed
// =============================================================================
import { Injectable } from '@nestjs/common';

import { SuccessionContext } from '../value-objects/succession-context.vo';

@Injectable()
export class FormSelectorService {
  /**
   * Selects appropriate court forms based on context
   */
  selectForms(context: SuccessionContext): Array<{
    formType: string;
    formTitle: string;
    formCode: string;
    purpose: string;
    legalBasis: string;
    instructions: string[];
  }> {
    const forms: any[] = [];

    // PRIMARY PETITION FORM
    if (context.regime === 'TESTATE') {
      forms.push({
        formType: 'PA1_PROBATE',
        formTitle: 'Petition for Grant of Probate',
        formCode: 'P&A 1',
        purpose: 'To apply for grant of probate when there is a valid will',
        legalBasis: 'S.56 Law of Succession Act',
        instructions: [
          'Fill in deceased details',
          'Attach original will',
          'List all beneficiaries',
          'Sign before Commissioner for Oaths',
        ],
      });
    } else {
      if (context.estateValue < 500000) {
        forms.push({
          formType: 'PA5_SUMMARY',
          formTitle: 'Summary Administration Application',
          formCode: 'P&A 5',
          purpose: 'Simplified process for small estates under KES 500,000',
          legalBasis: 'Summary administration provisions',
          instructions: [
            'Complete estate inventory',
            'Attach death certificate',
            'Get family consents',
          ],
        });
      } else {
        forms.push({
          formType: 'PA80_INTESTATE',
          formTitle: 'Petition for Letters of Administration',
          formCode: 'P&A 80',
          purpose: 'To apply for letters of administration (no will)',
          legalBasis: 'S.64 Law of Succession Act',
          instructions: [
            'Fill in deceased details',
            'List all next of kin',
            "Attach Chief's letter",
            'Sign before Commissioner for Oaths',
          ],
        });
      }
    }

    // AFFIDAVIT OF MEANS (Always required)
    forms.push({
      formType: 'PA12_AFFIDAVIT_MEANS',
      formTitle: 'Affidavit of Means and Assets',
      formCode: 'P&A 12',
      purpose: 'To declare the value and details of estate assets',
      legalBasis: 'Court requirement for all applications',
      instructions: [
        'List all assets with values',
        'List all debts',
        'Attach valuation reports',
        'Swear before Commissioner for Oaths',
      ],
    });

    // FAMILY CONSENT
    if (context.numberOfChildren > 0 || context.isPolygamous) {
      forms.push({
        formType: 'PA38_FAMILY_CONSENT',
        formTitle: 'Consent of Family Members',
        formCode: 'P&A 38',
        purpose: 'To show family agrees with application',
        legalBasis: 'Family consent requirement',
        instructions: [
          'Spouse must sign',
          'Adult children must sign',
          'Each signature must be witnessed',
        ],
      });
    }

    return forms;
  }
}
