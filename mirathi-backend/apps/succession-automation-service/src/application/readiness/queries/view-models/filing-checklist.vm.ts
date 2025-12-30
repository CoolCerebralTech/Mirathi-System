import { DocumentGapSeverity } from '../../../../domain/value-objects/document-gap.vo';

export class ChecklistItemVM {
  documentName: string;
  description: string;
  isMandatory: boolean;
  isProvided: boolean;
  howToObtain?: string;
  severity: DocumentGapSeverity;
}

export class FilingChecklistVM {
  readyToPrint: boolean;
  mandatoryMissingCount: number;
  totalProgress: number; // 0-100%

  categories: {
    identity: ChecklistItemVM[];
    financial: ChecklistItemVM[];
    courtForms: ChecklistItemVM[];
    supporting: ChecklistItemVM[];
  };
}
